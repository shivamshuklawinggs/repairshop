
import { formatCurrency, formatDate } from "utils";
import { ReferenceType, TransactionType } from "models/Ledger.model";
import { PaymentStatus } from "services/paymentQueryBuilder";
import moment from "moment";
type CreditStatus = "Settled" | "Unsettled"
export type StatusConfig = { color: string; bg: string; border: string };
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
  Settled: "Settled",
  Unsettled: "Unsettled",
};
export interface ICustomerInvoicesPaymentDetails {
  _id: string
  referenceId: string
  transactionType: TransactionType
  amount: number
  balanceDue: number;
  createdAt: string
  customerId: string
  postingDate: Date
  type: ReferenceType;
  invoiceNumber: string
  BillNumber: string
  totalAmount: number
  totalAmountWithTax: number
  recievedAmount: number
  paymentDate: Date
  transaction: string;
  dueDate: Date;
  party: string
  settledAmount: number
  lastPayment: string
  credits: number
  creditStatus: CreditStatus
  paymentStatus: PaymentStatus
  daysLate: number
  status: PaymentStatus | CreditStatus
}


const formatDays = (days: number) =>
  `${days} day${days > 1 ? "s" : ""}`;

export const getTransactionStatus = (
  {balanceDue,
  dueDate,
  type,
  paymentStatus,
  credits = 0}
:{  balanceDue: number,
  dueDate: Date,
  type: TransactionType,
  paymentStatus: ICustomerInvoicesPaymentDetails["status"],
  credits: number}
): { label: string; color: "success" | "error" | "info", subtext: string } => {
  // ✅ PAYMENT (early return)
  if (type === TransactionType.PAYMENT) {
    if (paymentStatus === "Settled") {
      return { label: paymentStatus, color: "success", subtext: "" };
    }

    if (paymentStatus === "Unsettled") {
      return {
        subtext: `Unsettled${credits > 0 ? ` (${formatCurrency(credits)} credit left)` : ""
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
  let subtext = STATUS_LABEL_MAP[paymentStatus] || "Unknown";
  let color: "success" | "error" | "info" = "info";

  // ✅ Main switch (clean + minimal duplication)
  switch (paymentStatus) {
    case "overdue":
    case "partial_late": {
      const days = Math.abs(diffDays);
      subtext =
        paymentStatus === "partial_late"
          ? `Partial (Late - ${formatDays(days)})`
          : `Overdue (${formatDays(days)})`;
      color = "error";
      break;
    }

    case "due":
    case "partial": {
      if (diffDays < 0) {
        subtext = `Overdue (${formatDays(Math.abs(diffDays))})`;
        color = "error";
      } else if (diffDays === 0) {
        subtext = paymentStatus === "partial" ? "Partial (Due Today)" : "Due Today";
      } else if (diffDays <= 3) {
        subtext =
          paymentStatus === "partial"
            ? `Partial (Due Soon - ${formatDays(diffDays)})`
            : `Due Soon (${formatDays(diffDays)})`;
      } else {
        subtext =
          paymentStatus === "partial"
            ? `Partial (Due in ${formatDays(diffDays)})`
            : `Due in ${formatDays(diffDays)}`;
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

const transormTransaction = (invoice: ICustomerInvoicesPaymentDetails,) => {
  return {
    date: formatDate(invoice.postingDate || new Date()),
    customer: invoice.party || "N/A",
    amount: formatCurrency(invoice.amount),
    status: getTransactionStatus({ credits: invoice?.credits, balanceDue: invoice?.balanceDue, dueDate: invoice?.dueDate, type: invoice.transactionType, paymentStatus: invoice.status }).label, // return array of status strings
  };
};

export { transormTransaction }