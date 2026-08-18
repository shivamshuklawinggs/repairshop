import { fullurl } from "config";
import { Role } from "microservices/auth-service/types";
import InvoiceModal, { IInvoice } from "models/Invoice.model";
import User from "models/user.model";
import { Types } from "mongoose";
import path from "path";
import ejs from 'ejs';
import sendEmail from "libs/sendEmail";
import { isEqual } from "lodash";
import { addPaymentMetaFields } from "services/paymentQueryBuilder";
interface UpdatedByData {
  name: string;
  email: string;
}

function getStatusColor(status: string): { color: string; bgColor: string } {
  const statusColors: Record<string, { color: string; bgColor: string }> = {
    'Pending': { color: '#f59e0b', bgColor: '#fef3c7' },
    'Partial': { color: '#3b82f6', bgColor: '#dbeafe' },
    'Paid': { color: '#10b981', bgColor: '#d1fae5' },
    'Overdue': { color: '#ef4444', bgColor: '#fee2e2' },
  };
  return statusColors[status] || { color: '#6b7280', bgColor: '#f3f4f6' };
}

async function getAdminAndManagerUsers(companyId: Types.ObjectId,ownerAdminId:Types.ObjectId,updatedById:Types.ObjectId): Promise<{
      email:string;
    name:string;
    role:Role
}[]> {
  try {
    const filter={
      _id: { $ne: updatedById },

      $or: [
        // Owner admin
        {
          _id: ownerAdminId,
          role: Role.ADMIN
        },

        // Managers assigned to company
        {
          role: Role.MANAGER,
          ownerAdminId,
          visibleCompany: companyId
        }
      ]
    }
   const users = await User.find(filter)
      .select("name email role")
      .lean();
    
    return users;
  } catch (error) {
    console.error('Error fetching admin/manager users:', error);
    return [];
  }
}

async function getUpdatedByUser(updatedById: Types.ObjectId): Promise<UpdatedByData | null> {
  try {
    const user = await User.findById(updatedById).select('name email');
    if (!user) return null;
    return {
      name: user.name,
      email: user.email,
    };
  } catch (error) {
    console.error('Error fetching updated by user:', error);
    return null;
  }
}

async function sendInvoiceUpdateEmail(
  invoice: IInvoice,
  updatedBy: UpdatedByData | null,
  recipient: {
    email:string;
    name:string;
    role:Role
  },
  actualChanges: Record<string, { before: any; after: any }>
): Promise<void> {
  try {
    const templatePath = path.join(
      __dirname,
      '../invoice-update-notification.ejs'
    );

    const statusColors = getStatusColor(invoice.status || 'Pending');
    const logoUrl = (invoice.companyId as any)?.logo?.filename 
      ? `${fullurl}uploads/company-logo/${(invoice.companyId as any).logo.filename}`
      : 'https://via.placeholder.com/150?text=FreightBooks';

    const html = await ejs.renderFile(templatePath, {
      invoice,
      updatedBy: updatedBy || { name: 'Unknown', email: 'unknown' },
      recipientName: recipient.name,
      statusColor: statusColors.color,
      statusBgColor: statusColors.bgColor,
      logoUrl,
      actualChanges,
    });

    const subject = `Invoice #${invoice.invoiceNumber} Updated`;

    await sendEmail({
      to: recipient.email,
      subject,
      html,
    });

  } catch (error) {
    console.error(`❌ Error sending invoice update email to ${recipient.email}:`, error);
  }
}
export async function handleInvoiceUpdateNotification(data: {
  invoiceId: string;
  updatedById: string;
  invoiceBeforeUpdate: IInvoice;
  invoiceAfterUpdate: IInvoice;
}) {
  try {
  
    // Compare before and after documents to detect actual changes
    const actualChanges: Record<string, any> = {};

    if (data.invoiceBeforeUpdate && data.invoiceAfterUpdate) {
      const before = data.invoiceBeforeUpdate;
      const after = data.invoiceAfterUpdate;

      // Compare each field
      Object.keys(after).forEach(key => {
        // Skip system fields
        if (key === '_id' || key === '__v' || key === 'createdAt' || key === 'updatedAt') {
          return;
        }
        // Skip reference fields (ObjectId comparisons can be tricky)
        if (key === 'customerId' || key === 'companyId' || key === 'updatedBy') {
          return;
        }
        // Check if value changed using deep comparison
        const beforeValue = before[key as keyof IInvoice];
        const afterValue = after[key as keyof IInvoice];

        // Convert ObjectIds to strings for comparison
        const normalizedBefore = beforeValue && typeof beforeValue === 'object' && beforeValue.toString ? beforeValue.toString() : beforeValue;
        const normalizedAfter = afterValue && typeof afterValue === 'object' && afterValue.toString ? afterValue.toString() : afterValue;

        if (!isEqual(normalizedBefore, normalizedAfter)) {
          actualChanges[key] = {
            before: beforeValue,
            after: afterValue,
          };
        }
      });
    }

    // If no actual changes detected, skip email notification
    if (Object.keys(actualChanges).length === 0) {
      return;
    }


    // Populate the invoice with related data for email
    const [invoice] = await InvoiceModal.aggregate([
      { $match: { _id: new Types.ObjectId(data.invoiceId) } },
      addPaymentMetaFields(),
      {
        $lookup: {
          from: 'customers',
          localField: 'customerId',
          foreignField: '_id',
          as: 'customer'
        }
      },
      {
        $lookup: {
          from: 'companies',
          localField: 'companyId',
          foreignField: '_id',
          as: 'company'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'updatedBy',
          foreignField: '_id',
          as: 'updatedByUser'
        }
      },
      {
        $addFields: {
          customer: { $arrayElemAt: ['$customer', 0] },
          company: { $arrayElemAt: ['$company', 0] },
          updatedByUser: { $arrayElemAt: ['$updatedByUser', 0] }
        }
      }
    ]).limit(1)

    if (!invoice) {
      console.warn('Invoice not found for update notification');
      return;
    }
    const updatedById = new Types.ObjectId(data.invoiceAfterUpdate.updatedBy);
    const ownerAdminId=invoice.updatedByUser.role===Role.ADMIN?invoice.updatedByUser._id:invoice.updatedByUser.ownerAdminId
    const adminManagerUsers = await getAdminAndManagerUsers(invoice.companyId as Types.ObjectId,ownerAdminId,updatedById);

    if (adminManagerUsers.length === 0) {
      return;
    }

    const updatedBy = await getUpdatedByUser(updatedById);

    const recipients = adminManagerUsers

    if (recipients.length === 0) {
      return;
    }
    const emailPromises = recipients.map(recipient =>
      sendInvoiceUpdateEmail(invoice, updatedBy, recipient, actualChanges)
    );
    await Promise.allSettled([emailPromises]);
  } catch (error) {
    console.error('❌ Error processing invoice update notification:', error);
    throw error;
  }
}