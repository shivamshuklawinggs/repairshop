import { MenuAction } from "@/components/VerticalMenu";
import { TransactionType } from "@/types";
import { NavigateFunction } from "react-router-dom";
import { getAdvanceSubMenu } from "./getAdvanceSubMenu";
import { hasAccess } from "@/hooks/authUtils";


interface UseTransactionMenuActionsProps<T = any> {
  type: TransactionType;
  item: T;
  user: any;
  navigate: NavigateFunction;
  pdfLoading?: boolean;
  onViewDetails?: (item: T) => void;
  onEdit?: (item: T) => void;
  onDelete?: (id: string) => void;
  onDownload?: (item: T) => void;
  onSendReminder?: (item: T) => void;
  showViewDetails?: boolean;
  showDownload?: boolean;
  showEdit?: boolean;
  showDelete?: boolean;
  showPayment?: boolean;
  showReminder?: boolean;
}

export const useTransactionMenuActions = ({
  type,
  item,
  user,
  navigate,
  pdfLoading = false,
  onViewDetails,
  onEdit,
  onDelete,
  onDownload,
  onSendReminder,
  showViewDetails = true,
  showDownload = true,
  showEdit = true,
  showDelete = true,
  showPayment = true,
  showReminder = true,
}: UseTransactionMenuActionsProps): MenuAction[] => {
  const actions: MenuAction[] = [];
console.log("showReminder item",item)
  // View Details
  if (showViewDetails && hasAccess(["accounting"], "view", user) && onViewDetails) {
    actions.push({
      label: 'View Details',
      icon: "visibility",
      onClick: () => onViewDetails(item),
    });
  }

  // Download (only for invoices)
  if (showDownload && type === TransactionType.INVOICE && hasAccess(["accounting"], "view", user) && onDownload) {
    actions.push({
      label: pdfLoading ? "Downloading..." : "Download",
      icon: "fileDownload",
      loading: pdfLoading,
      onClick: () => onDownload(item),
    });
  }

  // Edit
  if (showEdit && hasAccess(["accounting"], "update", user) && onEdit) {
    actions.push({
      label: 'Edit',
      icon: "edit",
      onClick: () => onEdit(item),
    });
  }

  // Delete
  if (showDelete && hasAccess(["accounting"], "delete", user) && onDelete) {
    actions.push({
      label: 'Delete',
      icon: "delete",
      onClick: () => onDelete(item._id),
    });
  }

  // Payment/Advance submenu
  if (showPayment && hasAccess(["accounting"], "create", user) && item.balanceDue) {
    const paymentAction = getAdvanceSubMenu({
      advances: item.Advance || [],
      type,
      navigate,
      onAdvanceClick: () => {
        if (type === TransactionType.INVOICE) {
          navigate(
            `/accounting/sales/accounts/recievedpayment/${item.customerId}?invoiceNumber=${item.invoiceNumber}`
          );
        } else if (type === TransactionType.BILL) {
          navigate(
            `/accounting/purchase/accounts/recievedbill/${item.vendorId}?BillNumber=${item.BillNumber}`
          );
        }
      },
    });
    actions.push(paymentAction);
  }

  // Send Reminder (only for invoices)
  if (showReminder && type === TransactionType.INVOICE && hasAccess(["accounting"], "create", user) && item.balanceDue && item.balanceDue > 0 && onSendReminder) {
    actions.push({
      label: 'Send Reminder',
      icon: "email",
      onClick: () => onSendReminder(item),
    });
  }

  return actions.filter(Boolean);
};
