import Invoice, { IInvoice } from 'models/Invoice.model';
import sendEmail from 'libs/sendEmail';
import  { Types } from 'mongoose';
import { createInvoiceReminder, IInvoiceReminder, InvoiceReminder } from 'models/IInvoiceReminder.model';
import moment from "moment";
import ejs from 'ejs';
import path from 'path';
import { ICustomer } from 'models/Customer.model';
import { ICompany } from 'models/company.model';
import { fullurl } from 'config';
import { producers } from 'config/bullmq';
import InvoiceReminderTemplate from 'models/InvoiceReminderTemplate.model';

/* -------------------- TYPES -------------------- */

// ✅ Clean populated type
type Populated<T> = T & { _id: Types.ObjectId };

interface InvoiceDetails extends Omit<IInvoice, "customerId" | "companyId"> {
  _id: Types.ObjectId;
  customerId: Populated<ICustomer>;
  companyId: Populated<ICompany>;
}

/* -------------------- UI CONFIG -------------------- */

type ReminderUI = {
  label: string;
  color: string;
  bgColor: string;
  message: (data: {
    dueDate: Date;
    balance: number;
    days?: number;
  }) => string;
};

export const REMINDER_UI_MAP: Record<IInvoiceReminder["type"], ReminderUI> = {
  "Paid": {
    label: "Paid",
    color: "#16a34a",
    bgColor: "#dcfce7",
    message: () => "This invoice has been successfully paid."
  },
  "Paid Late": {
    label: "Paid Late",
    color: "#ca8a04",
    bgColor: "#fef9c3",
    message: ({ days }) => `Paid ${days || 0} day(s) late.`
  },
  "Partial": {
    label: "Partial",
    color: "#2563eb",
    bgColor: "#dbeafe",
    message: ({ balance }) => `Remaining ₹${balance}.`
  },
  "Partial (Late)": {
    label: "Partial & Overdue",
    color: "#ea580c",
    bgColor: "#ffedd5",
    message: ({ balance, days }) =>
      `Overdue ${days} day(s). Balance ₹${balance}.`
  },
  "Overdue": {
    label: "Overdue",
    color: "#dc2626",
    bgColor: "#fee2e2",
    message: ({ days, balance }) =>
      `Overdue ${days} day(s). ₹${balance} pending.`
  },
  "Due Today": {
    label: "Due Today",
    color: "#7c3aed",
    bgColor: "#ede9fe",
    message: () => "Invoice is due today."
  },
  "Upcoming": {
    label: "Upcoming",
    color: "#0891b2",
    bgColor: "#cffafe",
    message: ({ days }) => `Due in ${days} day(s).`
  }
};

/* -------------------- HELPERS -------------------- */

function getDaysDiff(dueDate: Date) {
  return Math.abs(moment(dueDate).startOf("day").diff(moment().startOf("day"), "days"));
}

function getReminderType(
  invoice: Pick<IInvoice, "summary" | "updatedAt" | "dueDate">
): IInvoiceReminder["type"] {
  const today = moment().startOf("day");
  const due = moment(invoice.dueDate).startOf("day");

  const balance = invoice.summary?.balanceDue || 0;
  const received = invoice.summary?.totalRecieved || 0;

  if (balance === 0) {
    return moment(invoice.updatedAt).isAfter(due) ? "Paid Late" : "Paid";
  }

  if (received > 0) {
    return due.isBefore(today) ? "Partial (Late)" : "Partial";
  }

  if (due.isBefore(today)) return "Overdue";
  if (due.isSame(today)) return "Due Today";

  return "Upcoming";
}

/* -------------------- TEMPLATE -------------------- */

function getTemplateType(reminderType: IInvoiceReminder["type"]): 'before' | 'after' | 'on_due' {
  // Determine template type based on reminder type
  if (reminderType === "Due Today") return "on_due";
  if (reminderType === "Overdue" || reminderType === "Paid Late" || reminderType === "Partial (Late)") return "after";
  return "before";
}

async function buildReminderTemplate({
  invoice,
  email
}: {
  invoice: InvoiceDetails;
  email: string;
}) {
  const reminderType = getReminderType(invoice);

  // Determine template type based on reminder type
  const templateType = getTemplateType(reminderType);

  // Get custom template from database
  const customTemplate = await InvoiceReminderTemplate.findOne({
    companyId: invoice.companyId._id,
    templateType,
    isActive: true
  });

  // Calculate reminder count for this invoice and template type
  const previousReminders = await InvoiceReminder.countDocuments({
    invoiceId: invoice._id,
    companyId: invoice.companyId._id,
    type: reminderType
  }) || 0;
  const reminderCount = previousReminders + 1;

  // Check if we should send this reminder based on template configuration
  if (customTemplate) {
    const maxReminders = customTemplate.maxReminders || 5;
    if (reminderCount > maxReminders) {
      return { success: false, message: "Maximum reminders reached for this template" } as const;
    }
  }

  // ✅ prevent duplicate
  const reminder = await createInvoiceReminder({
    invoiceId: invoice._id,
    companyId: invoice.companyId._id,
    customerId: invoice.customerId._id,
    type: reminderType,
    status: "sent",
    email,
    ownerAdminId: invoice.ownerAdminId,
    templateId: customTemplate?._id,
    reminderCount
  });

  if (!reminder) {
    return { success: false, message: "Already sent today" } as const;
  }

  const ui = REMINDER_UI_MAP[reminderType];
  const days = getDaysDiff(invoice.dueDate);

  const message = ui.message({
    dueDate: invoice.dueDate,
    balance: invoice.summary?.balanceDue || 0,
    days
  });

  let html: string;
  let subject: string;

  if (customTemplate) {
    // Use custom template with variable substitution
    subject = customTemplate.subject;
    html = customTemplate.htmlContent;
    
    // Replace template variables
    const variables = {
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: moment(invoice.invoiceDate).format('MMMM DD, YYYY'),
      dueDate: moment(invoice.dueDate).format('MMMM DD, YYYY'),
      amount: invoice.summary?.finalAmount?.toFixed(2) || '0.00',
      balance: invoice.summary?.balanceDue?.toFixed(2) || '0.00',
      days: days.toString(),
      reminderCount: reminderCount.toString(),
      customerName: invoice.customerId?.company || 'Customer',
      companyName: invoice.companyId?.label || 'Our Company',
      companyAddress: invoice.companyId?.physicalDetails?.address || invoice.companyId?.billingDetails?.address || '',
      companyEmail: invoice.companyId?.physicalDetails?.email || invoice.companyId?.billingDetails?.email || '',
      companyPhone: invoice.companyId?.physicalDetails?.phone || invoice.companyId?.billingDetails?.phone || '',
      paymentLink: `${fullurl}invoice/${invoice._id}`,
      logoUrl: `${fullurl}uploads/company-logo/${invoice.companyId.logo?.filename}`,
    };

    // Replace all variables in subject and HTML
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      subject = subject.replace(regex, value);
      html = html.replace(regex, value);
    });
  } else {
    // Fallback to default EJS template
    const templatePath = path.join(
      process.cwd(),
      "src",
      "microservices",
      "accounts-services",
      "invoice",
      "invoice-reminder.ejs"
    );

    html = await ejs.renderFile(templatePath, {
      invoice,
      label: ui.label,
      color: ui.color,
      bgColor: ui.bgColor,
      message,
      logoUrl: `${fullurl}uploads/company-logo/${invoice.companyId.logo?.filename}`,
    });

    subject = `Invoice ${invoice.invoiceNumber} - ${ui.label}`;
  }

  return { success: true, html, subject } as const;
}

/* -------------------- MAIN -------------------- */

export async function sendReminder(invoiceId: Types.ObjectId) {
  try {
    const invoice = await Invoice.findById(invoiceId)
      .populate("customerId")
      .populate("companyId")
      .lean<InvoiceDetails>();

    if (!invoice) {
      return { success: false, message: "Invoice not found" };
    }
    await producers.rating.customerRated({ customerId: invoice.customerId._id });
    const email = invoice.email || invoice.customerId?.email;

    if (!email) {
      return { success: false, message: "No email found" };
    }

    const template = await buildReminderTemplate({ invoice, email });
    if (!template.success) {
      return template;
    }

    await sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
    });

    await Invoice.findByIdAndUpdate(invoice._id, {
      emailStatus: "Save & Send",
      reminderSentDate: new Date()
    });

    return { success: true };

  } catch (error: any) {
    return {
      success: false,
      message: error?.message || "Failed to send reminder"
    };
  }
}
export async function sendManualReminder({ ccList, bccList, toEmail ,invoiceId}:{ ccList:string[], bccList:string[], toEmail:string ,invoiceId: Types.ObjectId}) {
  try {
    const invoice = await Invoice.findById(invoiceId)
      .populate("customerId")
      .populate("companyId")
      .lean<InvoiceDetails>();

    if (!invoice) {
      return { success: false, message: "Invoice not found" };
    }
    await producers.rating.customerRated({ customerId: invoice.customerId._id })
    if (!toEmail) {
      return { success: false, message: "No email found" };
    }
    
    const template = await buildReminderTemplate({ invoice, email: toEmail });
    
    if (!template.success) {
      return template;
    }
    await sendEmail({
      to: toEmail,
      cc: ccList.length > 0 ? ccList : undefined,
      bcc: bccList.length > 0 ? bccList : undefined,
      subject: template.subject,
      html: template.html,
    })
    await Invoice.findByIdAndUpdate(invoice._id, {
      emailStatus: "Save & Send",
      reminderSentDate: new Date()
    });

    return { success: true };

  } catch (error: any) {
    return {
      success: false,
      message: error?.message || "Failed to send reminder"
    };
  }
}