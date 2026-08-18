
import { Colors } from "@/data/theme";
import { CreditStatus, emailStatus, FormatCurrencyOptions, ICarrier, ICommonUsdotData, ICustomerInvoicesPaymentDetails, IDocument, IFile, IInvoice, invoiceexpense, IVendorBill, PaymentStatus, Role, TransactionType } from "@/types";
import axios from "axios";
import moment from "moment";
import api from "./axiosInterceptor";
import { toast } from "react-toastify";
import apiService from "@/service/apiService";
import { MatchUSDotDataCarrier } from "@/hooks/useGetUsDotData";
import { TIME_FORMAT } from "@/config/constant";


/**
 * @description check expiry of  insurance
 * @param expiryDate expiry date
 */
const checkInsuranceExpiryDate = (
  commercialexpiryDate: string,
  automobileexpiryDate: string,
  cargoexpiryDate: string
): boolean => {
  const sevenDaysFromNow = moment().add(7, 'days'); // today + 7 days
  let isExpire = false;

  if (!commercialexpiryDate || !automobileexpiryDate || !cargoexpiryDate) {

    return true;
  }

  const expiryDates = [
    moment(commercialexpiryDate),
    moment(automobileexpiryDate),
    moment(cargoexpiryDate)
  ];

  expiryDates.forEach((expiry, index) => {
    console.info(`expiry${index + 1}:`, expiry.format(TIME_FORMAT));
  });

  console.info("Checking against date:", sevenDaysFromNow.format(TIME_FORMAT));

  // Check if any expiry is before or equal to 7 days from now
  isExpire = expiryDates.some(expiry => expiry.isSameOrBefore(sevenDaysFromNow));

  console.info("isExpire", isExpire);
  return isExpire;
};

const getSubDocumentName = (document: IDocument, subtype: string) => {
  switch (subtype) {
    case 'carrier':
      return document?.company || 'N/A';
    case 'customer':
      return document?.company || 'N/A';
    case 'invoice':
      return document?.invoiceNumber || 'N/A'
    default:
      return 'N/A';
  }
}
const getDocumentCell = (activeTab: string) => {
  switch (activeTab) {
    case 'customer':
      return "Customer Name";
    case 'carrier':
      return "Carrier Name";
    case 'invoice':
      return "Invoice Number";
    case 'driver':
      return "Driver Name";
    case 'deliverycheckout':
      return "Delivery Checkout";
    case 'pickupcheckout':
      return "Load Number";
    case 'expense':
      return "Expense";
    default:
      return '';
  }
}
const getGreeting = (role = "") => {
  const hour = moment().hour();

  let greeting = "";

  if (hour < 12) {
    greeting = "Good Morning";
  } else if (hour < 17) {
    greeting = "Good Afternoon";
  } else if (hour < 21) {
    greeting = "Good Evening";
  } else {
    greeting = "Good Night";
  }

  return role ? `${greeting}, ${capitalizeFirstLetter(role)}!` : `${greeting} !`;
};
// Function to get color based on rating value
export const getRatingColor = (value: number | null | undefined): string => {
  if (!value) return '#9e9e9e';
  if (value >= 4.5) return '#4caf50'; // Excellent - green
  if (value >= 3.5) return '#8bc34a'; // Good - light green
  if (value >= 2.5) return '#ff9800'; // Average - orange
  if (value >= 1.5) return '#ff5722'; // Poor - deep orange
  return '#f44336'; // Very Poor - red
};
export const getRatingLabel = (value: number): string => {
  if (value >= 4.5) return 'Excellent';
  if (value >= 3.5) return 'Good';
  if (value >= 2.5) return 'Average';
  if (value >= 1.5) return 'Poor';
  if (value >= 0.001) return 'Very Poor';
  return 'Excellent';
};
const invoiceStatusColor = (status: string) => {
  switch (status) {
    case 'Pending':
      return Colors.Pending;
    case 'Partially':
      return Colors.PartiallyPaid;
    case 'Paid':
      return Colors.Paid;
    case 'Overdue':
      return Colors.Overdue;
    default:
      return Colors.unknown;
  }
};
const getInvoiceStatusIcon = (status: string) => {
  switch (status) {
    case 'Pending':
      return Colors.Pending;
    case 'Partially':
      return Colors.PartiallyPaid;
    case 'Paid':
      return Colors.Paid;
    case 'Overdue':
      return Colors.Overdue;
    default:
      return Colors.unknown;
  }
}

/**
 * @description is valid object id
 * @param id id
 * @returns
 */
const isValidObjectId = (id: string): boolean => {
  return /^[a-f\d]{24}$/i.test(id);
};

/**
 * @description get location by name
 * @param newLocation location name
 * @returns
 */
const getLocationByName = async (newLocation: string) => {
  try {
    const API_URL = 'https://nationalusa.net/api/';
    const response = await axios.get(`${API_URL}getlocationlistbyname?apikey=a1nm2o55l5&name=${newLocation}`);
    if (!response.data) {
      throw new Error('Failed to fetch location data');
    }
    const data = response.data;
    return data.response?.map((item: any) => {
      // let location = item.location;
      let city = item?.city?.name;
      let state = item?.state?.name;
      let zipcode = item?.zipcode;
      let country = item?.country?.name;
      return `${city || ''}, ${state || ''} ${zipcode || ''},${country || ''}`;
    }) || [];
  } catch (error: any) {
    console.warn('Error fetching location data:', error);
    return [];
  }
};
/**
 * @description auto cimplete location
 * @param newLocation location name
 * @returns
 */
const AutoCimpleteLocation = async (newLocation: string) => {
  try {
    const API_URL = 'https://nationalusa.net/api/';
    const response = await axios.get(`${API_URL}getlocationlistbyname?apikey=a1nm2o55l5&name=${newLocation}`);
    if (!response.data) {
      throw new Error('Failed to fetch location data');
    }
    const data = response.data;
    return data.response?.map((item: any) => {
      // let location = item.location;
      let city = item?.city?.name;
      let state = item?.state?.name;
      let zipcode = item?.zipcode;
      let country = item?.country?.name;
      return {
        city,
        state,
        zipcode,
        country
      }
    }) || [];
  } catch (error: any) {
    console.warn('Error fetching location data:', error);
    return [];
  }
};
// capitalize first letter and after space first letter also
const capitalizeFirstLetter = (str: string) => {
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
}
const parseJSON = (value: string | undefined) => {
  if (!value) return undefined;
  try {
    return JSON.parse(value);
  } catch (error) {
    console.warn('Error parsing JSON:', error);
    return undefined;
  }
}
const handleFileDownload = async (file: IFile, dest: string) => {


  const fileUrl = `${dest}${file.filename}`;

  try {
    // Fetch the file from the server
    const response = await api.get(fileUrl, { responseType: 'blob' });
    if (!response) throw new Error(`Failed to fetch file`);

    // Get the file as a Blob
    const blob = response.data

    // Create a temporary URL for the Blob
    const blobUrl = URL.createObjectURL(blob);

    // Create and trigger an invisible download link
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = file.originalname; // Force download with filename
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();

    // Cleanup
    URL.revokeObjectURL(blobUrl);
    document.body.removeChild(link);
  } catch (error) {
    console.warn('Download error:', error);
    toast.error('Failed to download file');
  }
};
/**
 * 🔽 Download Base64 File Utility
 * -------------------------------------
 * Converts a base64 string into a Blob and triggers a file download.
 * Supports any file type (default: PDF).
 *
 * @param base64Data - The base64 encoded file data (without the data URI prefix)
 * @param fileName - The desired download filename (default: "document.pdf")
 * @param mimeType - The MIME type (default: "application/pdf")
 * @returns The object URL (for optional preview)
 */
export const downloadBase64File = (
  base64Data: string,
  fileName = "document.pdf",
  mimeType = "application/pdf"
): string => {
  try {
    // Decode base64 string to binary
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    // Convert binary to Blob
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });

    // Create Object URL
    const fileURL = URL.createObjectURL(blob);

    // Trigger browser download
    const link = document.createElement("a");
    link.href = fileURL;
    link.download = fileName;
    link.click();

    // Optional: cleanup after short delay
    setTimeout(() => URL.revokeObjectURL(fileURL), 5000);

    return fileURL;
  } catch (error) {
    console.error("Error downloading base64 file:", error);
    throw new Error("Failed to process base64 file.");
  }
};

 function formatDebitCredit(
  value: number,
  options?: {
    compact?: boolean;
    locale?: string;
    currency?: string;
    fractionDigits?: number;
  }
): string {
  const {
    compact = true,
    locale = "en-US",
    currency = "USD",
    fractionDigits = 2,
  } = options || {};

  const amount = Math.abs(value);

  const formatted = compact
    ? new Intl.NumberFormat(locale, {
       style: "currency",
    currency,
        notation: "compact",
        compactDisplay: "short",
        maximumFractionDigits: fractionDigits,
        minimumFractionDigits: 0,
      }).format(amount)
    : amount.toLocaleString(locale);

  return `${formatted} ${value < 0 ? "Cr" : "Dr"}`;
}
 const formatCurrency = (
  amount: number,
  options: FormatCurrencyOptions = {}
): string => {
  const {
    locale = "en-US",
    currency = "USD",
    compact = false,
    fractionDigits = 2,
  } = options;

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    notation: compact ? "compact" : "standard",
    compactDisplay: "short",
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: compact ? 0 : fractionDigits,
  }).format(amount || 0);
};



const isRole = {
  isSuperAdmin: (role: string) => {
    return role === Role.SUPERADMIN;
  },
  isAdmin: (role: string) => {
    return role === Role.ADMIN;
  },
  
  isManager: (role: string) => {
    return role === Role.MANAGER;
  },
  isAccountant: (role: string) => {
    return role === Role.ACCOUNTANT;
  }
}
const getRateInvoice = (invoiceType: "customer" | "carrier" | "other") => {
  let rate = "Customer Rate"
  switch (invoiceType) {
    case "customer":
      rate = "Customer Rate";
      break;
    case "carrier":
      rate = "Dispatch Rate";
      break;
    case "other":
      rate = "Rate";
      break;
    default:
      break;
  }
  return rate
}
const truncateText = (text: string = "", maxLength: number = 15): string => {
  return !text?"N/A": text?.length > maxLength ? `${text?.substring(0, maxLength)}...` : text;
};
const getFullName = (data: Record<string, any>) => {
  let text = ''
  if (data) {


    if (data?.title) {
      text += capitalizeFirstLetter(data.title) + ' '
    }
    if (data?.firstName) {
      text += capitalizeFirstLetter(data.firstName) + ' '
    }
    if (data?.lastName) {
      text += capitalizeFirstLetter(data.lastName)
    }
    if (data?.company) {
      return capitalizeFirstLetter(data?.company)
    }
  }

  return text
}
const calculateSubTotal = (expenses: invoiceexpense[]) =>
  expenses.reduce((total, exp) => total + Number(exp.amount), 0);

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();
};
const downloadCSV = async ({ filename = "", mimeType = "", base64 = "" }) => {

  const blob = new Blob([Uint8Array.from(atob(base64), c => c.charCodeAt(0))], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
};
const downloadExcel = async ({ filename = "", base64 = "" }) => {
  const mimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  const blob = new Blob([Uint8Array.from(atob(base64), c => c.charCodeAt(0))], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  a.click();

  URL.revokeObjectURL(url);
};
const handlePrint = (printRef: React.RefObject<HTMLDivElement>, title: string = "") => {
  if (!printRef.current) return;

  // Clone the node so we don't mutate the live DOM
  const clone = printRef.current.cloneNode(true) as HTMLElement;

  // Remove all elements with class "no-print"
  clone.querySelectorAll('.no-print').forEach(el => el.remove());

  const printContents = clone.innerHTML;

  const printWindow = window.open('', '', 'width=1024,height=768');
  if (printWindow) {
    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th, td {
              border: 1px solid #ccc;
              padding: 8px;
              font-size: 12px;
            }
            th {
              background: #f5f5f5;
              text-align: left;
            }
          </style>
        </head>
        <body>
          ${printContents}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  }
};
const addressformat = ({
  billingAddress
}: {
  billingAddress: {
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
}) => {
  let text = '';
  if (billingAddress?.address) {
    text += billingAddress?.address;
  }
  if (billingAddress?.city) {
    text += ', ' + billingAddress?.city;
  }
  if (billingAddress?.state) {
    text += ', ' + billingAddress?.state;
  }
  if (billingAddress?.zipCode) {
    text += ', ' + billingAddress?.zipCode;
  }
  if (billingAddress?.country) {
    text += ', ' + billingAddress?.country;
  }
  return text?text:"N/A"
};

/**
 * @description Calculate total received amount for a specific invoice
 * @param recievedPayments Array of received payments
 * @param invoiceId Invoice ID to filter by
 * @returns Total received amount for the invoice
 */
const calculateTotalRecievedAmount = (
  recievedPayments: Array<{ invoiceId: string; amount: number | string }> = [],
  invoiceId: string,
  nonRecievedPayments: Array<{ invoiceId: string; amount: number | string }> = [],
): number => {
  if (!recievedPayments || !invoiceId || !nonRecievedPayments) return 0;
  const totalAmount = [...recievedPayments, ...nonRecievedPayments]
    .filter(payment => payment.invoiceId === invoiceId)
    .reduce((acc, payment) => acc + Number(payment.amount || 0), 0);
  return totalAmount
};

/**
 * @description Get total amount for a specific invoice from customer invoices
 * @param customerInvoices Array of customer invoices
 * @param invoiceId Invoice ID to find
 * @returns Total amount with tax for the invoice
 */
const getInvoiceTotalAmount = (
  customerInvoices: Array<{ _id: string; totalAmountWithTax: number }>,
  invoiceId: string
): number => {
  if (!customerInvoices || !invoiceId) return 0;

  const invoice = customerInvoices.find(inv => inv._id === invoiceId);
  return invoice?.totalAmountWithTax || 0;
};

/**
 * @description Calculate real-time due amount for a specific invoice
 * @param customerInvoices Array of customer invoices
 * @param recievedPayments Array of received payments
 * @param invoiceId Invoice ID to calculate for
 * @returns Due amount remaining for the invoice
 */
const calculateInvoiceDueAmount = (
  customerInvoices: Array<{ _id: string; totalAmountWithTax: number }>,
  recievedPayments: Array<{ invoiceId: string; amount: number | string }>,
  invoiceId: string,
  nonRecievedPayments: Array<{ invoiceId: string; amount: number | string }>,
): number => {
  if (!invoiceId) return 0;

  const totalAmount = getInvoiceTotalAmount(customerInvoices, invoiceId);
  const totalReceived = calculateTotalRecievedAmount(recievedPayments, invoiceId, nonRecievedPayments);

  return Math.max(0, totalAmount - totalReceived);
};

/**
 * @description Validate payment amount against available due amount
 * @param customerInvoices Array of customer invoices
 * @param recievedPayments Array of received payments
 * @param invoiceId Invoice ID to validate against
 * @param amount Amount to validate
 * @param currentPaymentAmount Current payment amount to exclude from calculation
 * @returns Validation result with error message and limits
 */
const validatePaymentAmount = (
  customerInvoices: Array<{ _id: string; totalAmountWithTax: number; balanceDue: number }>,
  recievedPayments: Array<{ invoiceId: string; amount: number | string }>,
  invoiceId: string,
  currentPaymentAmount: number = 0,
  nonRecievedPayments: Array<{ invoiceId: string; amount: number | string }>,
): {
  isValid: boolean;
  maxAllowed: number;
  errorMessage: string;
} => {
  if (!invoiceId) {
    return {
      isValid: false,
      maxAllowed: 0,
      errorMessage: 'Invalid invoice'
    };
  }
  const invoice = customerInvoices?.filter(inv => inv._id === invoiceId);
  const originalDueAmount = invoice.reduce((acc, inv) => acc + inv.balanceDue, 0);
  const currentReceivedAmount = calculateTotalRecievedAmount(recievedPayments, invoiceId, nonRecievedPayments) - currentPaymentAmount;
  const maxAllowedPayment = Math.max(0, (originalDueAmount - currentReceivedAmount) - currentPaymentAmount);

  return {
    isValid: maxAllowedPayment > 0,
    maxAllowed: maxAllowedPayment,
    errorMessage: maxAllowedPayment <= 0
      ? 'No remaining balance to pay'
      : `Max allowed: ${formatCurrency(maxAllowedPayment)}`
  };
};


const STATUS_LABEL_MAP: Record<
  PaymentStatus |CreditStatus,
  string
> = {
  paid_late: "Paid Late",
  paid: "Paid",
  partial_late: "Partial (Late)",
  overdue: "Overdue",
  partial: "Partial",
  upcoming: "Upcoming",
  due: "Due",
  settled: "Settled",
  unsettled: "Unsettled",
};

const formatDays = (days: number) =>
  `${days} day${days > 1 ? "s" : ""}`;

const getInvoiceStatus = (
  balanceDue: number,
  dueDate: Date,
  type: TransactionType.BILL | TransactionType.INVOICE | TransactionType.PAYMENT,
  paymentStatus: PaymentStatus | CreditStatus,
  credits: number = 0
): { label: string; color: "success" | "error" | "info" } => {
  console.log("type>>>", type)
  console.log("paymentStatus>>>", paymentStatus)
  // ✅ PAYMENT (early return)
  if (type === TransactionType.PAYMENT) {
    if (paymentStatus === "settled") {
      return { label: "Settled", color: "success" };
    }

    if (paymentStatus === "unsettled") {
      return {
        label: `Unsettled${credits > 0 ? ` (${formatCurrency(credits)} credit left)` : ""
          }`,
        color: "error",
      };
    }
    console.log("unknonkn paymentStatus", paymentStatus)
    return {
      label: "Unknown",
      color: "info",
    };
  }

  // ✅ Paid override
  if (balanceDue === 0) {
    return {
      label: type === TransactionType.INVOICE ? "Received" : "Paid",
      color: "success",
    };
  }

  // ✅ Date calculation (single place)
  const today = moment().startOf("day");
  const due = moment(dueDate).startOf("day");
  const diffDays = due.diff(today, "days");

  let label = STATUS_LABEL_MAP[paymentStatus] || "Unknown";
  let color: "success" | "error" | "info" = "info";

  // ✅ Main switch (clean + minimal duplication)
  switch (paymentStatus) {
    case "overdue":
    case "partial_late": {
      const days = Math.abs(diffDays);
      label =
        paymentStatus === "partial_late"
          ? `Partial (Late - ${formatDays(days)})`
          : `Overdue (${formatDays(days)})`;
      color = "error";
      break;
    }

    case "due":
    case "partial": {
      if (diffDays < 0) {
        label = `Overdue (${formatDays(Math.abs(diffDays))})`;
        color = "error";
      } else if (diffDays === 0) {
        label = paymentStatus === "partial" ? "Partial (Due Today)" : "Due Today";
      } else if (diffDays <= 3) {
        label =
          paymentStatus === "partial"
            ? `Partial (Due Soon - ${formatDays(diffDays)})`
            : `Due Soon (${formatDays(diffDays)})`;
      } else {
        label =
          paymentStatus === "partial"
            ? `Partial (Due in ${formatDays(diffDays)})`
            : `Due in ${formatDays(diffDays)}`;
      }
      break;
    }

    case "upcoming": {
      label = `Due in ${formatDays(diffDays)}`;
      break;
    }

    case "paid":
    case "paid_late":
    default: {
      label = STATUS_LABEL_MAP[paymentStatus] || "Unknown";
    }
  }

  return { label, color };
};
const getPaymentStatus = (
  paymentStatus: PaymentStatus | "Settled" | "Unsettled",
): { label: string; color: "success" | "error" | "info" } => {

  // ✅ PAYMENT (early return)

  if (paymentStatus === "Settled") {
    return { label: "Settled", color: "success" };
  }

  if (paymentStatus === "Unsettled") {
    return {
      label: `Unsettled`,
      color: "error",
    };
  }
  return {
    label: "Unknown",
    color: "info",
  };
};

const getEmailStatus = (
  emailStatus: emailStatus,
): { label: string; color: 'success' | 'error' | 'info' } => {

  if (emailStatus === "Save") {
    return {
      label: 'Save',
      color: 'success',
    };
  }

  if (emailStatus === "Failed To Send") {
    return {
      label: 'Failed To Send',
      color: 'error',
    };
  }

  if (emailStatus === "Save & Send") {
    return {
      label: 'Save & Send',
      color: 'info',
    };
  }

  return {
    label: 'Unknown',
    color: 'info',
  };
};
const getTransactionStatus = (
  balanceDue: number,
  dueDate: Date,
  type: TransactionType,
  paymentStatus: ICustomerInvoicesPaymentDetails["status"],
  credits: number = 0
): { label: string; color: "success" | "error" | "info", subtext: string } => {
  // ✅ PAYMENT (early return)
  if (type === TransactionType.PAYMENT) {
    if (paymentStatus === "settled") {
      return { label: paymentStatus, color: "success", subtext: "" };
    }

    if (paymentStatus === "unsettled") {
      return {
        subtext: `${credits > 0 ? ` (${formatCurrency(credits)} credit left)` : ""
          }`,
        label: paymentStatus,
        color: "error",
      };
    }
    return {
      label: paymentStatus,
      color: "info",
      subtext: ""
    };
  }

  // ✅ Paid override
  if (balanceDue === 0) {
    return {
      label: type === TransactionType.INVOICE ? "Received" : "Paid",
      color: "success",
      subtext: ""
    };
  }

  // ✅ Date calculation (single place)
  const today = moment().startOf("day");
  const due = moment(dueDate).startOf("day");
  const diffDays = due.diff(today, "days");

  let label = STATUS_LABEL_MAP[paymentStatus] || "Unknown";
  let subtext = ""
  let color: "success" | "error" | "info" = "info";

  // ✅ Main switch (clean + minimal duplication)
  switch (paymentStatus) {
    case "overdue":
    case "partial_late": {
      const days = Math.abs(diffDays);
      subtext =
        paymentStatus === "partial_late"
          ? `(Late - ${formatDays(days)})`
          : `(${formatDays(days)})`;
      color = "error";
      break;
    }

    case "due":
    case "partial": {
      if (diffDays < 0) {
        subtext = `(${formatDays(Math.abs(diffDays))})`;
        color = "error";
      } else if (diffDays === 0) {
        subtext = paymentStatus === "partial" ? "(Due Today)" : "Due Today";
      } else if (diffDays <= 3) {
        subtext =
          paymentStatus === "partial"
            ? `(Due Soon - ${formatDays(diffDays)})`
            : `Due Soon (${formatDays(diffDays)})`;
      } else {
        subtext =
          paymentStatus === "partial"
            ? `Partial (Due in ${formatDays(diffDays)})`
            : `in ${formatDays(diffDays)}`;
      }
      break;
    }

    case "upcoming": {
      subtext = `Due in ${formatDays(diffDays)}`;
      break;
    }

    case "paid":
    case "paid_late":


    default: {
      label = STATUS_LABEL_MAP[paymentStatus] || "Unknown";
    }
  }

  return { label, color, subtext };
};
const getGridColumns = (count: number) => {
    const possibleCols = [6, 4, 3, 2, 1]; // 12/2,12/3,12/4,12/6,12/12

    return (
        possibleCols.find((col) => count <= 12 / col) || 2
    );
};
export {getGreeting,downloadExcel,formatDebitCredit, getGridColumns,getInvoiceStatus, getTransactionStatus, downloadCSV, getSubDocumentName, getDocumentCell, formatCurrency, capitalizeFirstLetter, isValidObjectId, getLocationByName, AutoCimpleteLocation, parseJSON, handleFileDownload, checkInsuranceExpiryDate, isRole, calculateSubTotal, getRateInvoice, truncateText, getFullName, getInitials, invoiceStatusColor, getInvoiceStatusIcon, handlePrint, addressformat, calculateTotalRecievedAmount, getInvoiceTotalAmount, calculateInvoiceDueAmount, validatePaymentAmount, getPaymentStatus,getEmailStatus };