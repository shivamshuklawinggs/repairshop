import React, { useState, useCallback } from 'react';
import { DataTable, type ColumnDef } from '@/components/ui';
import {
  TableCell,
  TableRow,
  Box,
  CircularProgress,
  Modal,
  Typography,
  Button,
  DialogActions,
  Chip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/redux/store';
import apiService from '@/service/apiService';
import { toast } from 'react-toastify';
import {
  IVendorBill,
  TransactionType,
  VendorInvoiceResponse,
  ICarrier,
  ICustomer,
  IAccountsCustomerView,
  IPayment,
  PaymentType,
  IInvoice
} from '@/types';
import { withPermission } from '@/hooks/authUtils';
import { getEmailStatus, getInvoiceStatus, getPaymentStatus } from '@/utils';
import { formatDate } from '@/utils/dateUtils';
import { formatCurrency, capitalizeFirstLetter } from '@/utils';
import { paths } from '@/utils/paths';
import { hasAccess } from '@/hooks/authUtils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTransactionMenuActions } from '@/shared/useTransactionMenuActions';
import {
  AccountsCustomerColumns,
  VendorsColumns
} from '@/data/customer';
import renderCell from '@/pages/carrier-service/VendorForm/components/renderCell';
import renderCustomerCell from '@/pages/customer-service/components/renderCell';
import VerticalMenu from '@/components/VerticalMenu';
import VerticalMenuInvoice from '@/components/VerticalMenuInvoice';
import UniversalEntityForm from '@/components/common/UniversalEntityForm';
import InvoiseForm from '@/pages/invoice-service/CustomerInvoiseForm';
import BillForm from '@/pages/carrier-service/VendorBills/CustomerInvoiseForm';
import { initialInvoiseData } from '@/pages/carrier-service/VendorBills/genearateInvoiceSchema';
import { getIcon } from '@/components/common/icons/getIcon';
import AppModalDialog from '@/components/ui/AppModalDialog';

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: {xs:'95%', md:'80%'},
  maxHeight: '85vh',
  bgcolor: 'background.paper',
  boxShadow: 24,
  pt: {xs:2, md:2.5},
  pr: {xs:2, md:3.5},
  pb: {xs:2, md:3.5},
  pl: {xs:2, md:3.5},
  overflow: 'auto',
  borderRadius:'16px',
};

interface MutationResponse {
  message: string;
  data: any;
}

interface InvoiceData {
  _id?: string;
  [key: string]: any;
}

// Entity type configurations
const ENTITY_CONFIG = {
  invoices: {
    columns: [
      { key: 'invoiceNumber', label: 'Invoice #' },
      { key: 'customer', label: 'Customer' },
      { key: 'invoiceDate', label: 'Invoice Date' },
      { key: 'dueDate', label: 'Due Date' },
      { key: 'totalAmount', label: 'Total Amount' },
      { key: 'receivedAmount', label: 'Received Amount' },
      { key: 'balanceDue', label: 'Due Amount' },
      { key: 'status', label: 'Payment Status' },
      { key: 'emailStatus', label: 'Status' },
      { key: 'actions', label: 'Actions', align: 'center' as const },
    ] as ColumnDef[],
    defaultPageSize: 10,
  },
  bills: {
    columns: [
      { key: 'billNumber', label: 'Bill #' },
      { key: 'vendor', label: 'Vendor' },
      { key: 'billDate', label: 'Bill Date' },
      { key: 'dueDate', label: 'Due Date' },
      { key: 'totalAmount', label: 'Total Amount' },
      { key: 'receivedAmount', label: 'Received Amount' },
      { key: 'balanceDue', label: 'Due Amount' },
      { key: 'status', label: 'Payment Status' },
      { key: 'emailStatus', label: 'Status' },
      { key: 'actions', label: 'Actions', align: 'center' as const },
    ] as ColumnDef[],
    defaultPageSize: 10,
  },
  payments: {
    columns: [
      { key: 'date', label: 'Date' },
      { key: 'referenceNo', label: 'Reference No' },
      { key: 'customer', label: 'Customer' },
      { key: 'type', label: 'Type' },
      { key: 'paymentMethod', label: 'Payment Method' },
      { key: 'status', label: 'Status' },
      { key: 'credits', label: 'Credits Left' },
      { key: 'settledAmount', label: 'Settled Amount' },
      { key: 'amount', label: 'Amount' },
      { key: 'action', label: 'Action', align:'center' as const },
    ] as ColumnDef[],
    defaultPageSize: 15,
  },
  customers: {
    columns: [...AccountsCustomerColumns,{ key: 'actions', label: 'Actions', align: 'center' as const },] as ColumnDef[],
    defaultPageSize: 10,
  },
  carriers: {
    columns: [...VendorsColumns, { key: 'actions', label: 'Actions', align: 'center' as const }] as ColumnDef[],
    defaultPageSize: 10,
  },
};

type EntityType = keyof typeof ENTITY_CONFIG;

interface UnifiedTableProps {
  entityType: EntityType;
  data: any[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
  rowsPerPage: number;
  totalCount: number;
}

const UnifiedTable: React.FC<UnifiedTableProps> = ({
  entityType,
  data,
  currentPage,
  totalPages,
  onPageChange,
  onRowsPerPageChange,
  rowsPerPage,
  totalCount,
}) => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const queryClient = useQueryClient();
  const currentUser = useSelector((state: RootState) => state.user);
  const config = ENTITY_CONFIG[entityType];

  // Modal states
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showBillModal, setShowBillModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<any>(null);
  const [editingBill, setEditingBill] = useState<any>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<ICustomer | ICarrier | null>(null);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [modalState, setModalState] = useState<{
    open: boolean;
    type: 'carrier' | 'pickup' | 'delivery' | 'driver' | 'pickupdates' | 'deliverydates' | null;
    title: string;
    data: any[];
  }>({
    open: false,
    type: null,
    title: '',
    data: []
  });


  // Mutations
  const createInvoiceMutation = useMutation<MutationResponse, Error, InvoiceData>({
    mutationFn: async (data) => {
      if (editingInvoice?._id) {
        return await apiService.updateAccountBill(editingInvoice._id, data);
      }
      return await apiService.generateAccountBill(data);
    },
    onSuccess: (response) => {
      toast.success(response?.message || `Invoice ${editingInvoice?._id ? 'updated' : 'created'} successfully`);
      setShowInvoiceModal(false);
      setEditingInvoice(initialInvoiseData);
    },
    onError: (error) => {
      toast.error(error.message || `Failed to ${editingInvoice?._id ? 'update' : 'create'} invoice`);
    }
  });

  const createBillMutation = useMutation<MutationResponse, Error, InvoiceData>({
    mutationFn: async (data) => {
      if (editingBill?._id) {
        return await apiService.updateAccountBill(editingBill._id, data);
      }
      return await apiService.generateAccountBill(data);
    },
    onSuccess: (response) => {
      toast.success(response?.message || `Bill ${editingBill?._id ? 'updated' : 'created'} successfully`);
      setShowBillModal(false);
      setEditingBill(initialInvoiseData);
    },
    onError: (error) => {
      toast.error(error.message || `Failed to ${editingBill?._id ? 'update' : 'create'} bill`);
    }
  });



  const deleteVendorMutation = useMutation({
    mutationFn: (vendorId: string) => apiService.deleteVendor(vendorId),
    onSuccess: () => {
      toast.success('Vendor deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete vendor');
    },
  });

  // Handlers
  const handleInvoiceClick = async (invoice: VendorInvoiceResponse) => {
    try {
      if (invoice._id) {
        const response = await apiService.getAccountInvoiceById(invoice._id);
        if (response.data) {
          setEditingInvoice(response.data);
          setShowInvoiceModal(true);
          return;
        }
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed To get Invoice");
    }
  };

  const handleBillClick = async (bill: VendorInvoiceResponse) => {
    try {
      if (bill._id) {
        const response = await apiService.getAccountBillById(bill._id);
        if (response.data) {
          setEditingBill(response.data);
          setShowBillModal(true);
          return;
        }
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed To get Bill");
    }
  };


  const handleDeleteVendor = useCallback(
    (customerId: string) => {
      if (!window.confirm('Are you sure you want to delete this customer?')) return;
      deleteVendorMutation.mutate(customerId);
    },
    [deleteVendorMutation]
  );

  const handleEditCustomer = (customer: IAccountsCustomerView) => {
    setSelectedCustomer({ ...customer ,type:"customer"} as ICustomer);
  };

  const handleEditCarrier = (customer: ICarrier) => {
    setSelectedCustomer({ ...customer ,type:"carrier"} as ICarrier);
  };

  const handleDeleteCustomer = async (customerId: string) => {
    try {
      if (!window.confirm('Are you sure you want to delete this customer?'))
        return;
      await apiService.deleteAccountsCustomer(customerId);
      toast.success('Customer deleted successfully');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete customer');
    }
  };
  const closeModal = (): void => {
    setModalState(prev => ({
      ...prev,
      open: false
    }));
  };

  // Render functions for different entity types
  const renderInvoiceRow = (invoice: any) => (
    <TableRow key={invoice._id} sx={{ '&:last-child td': { border: 0 } }}>
      <TableCell sx={{ whiteSpace: 'nowrap' }}>{invoice.invoiceNumber}</TableCell>
      <TableCell title={invoice.customer?.name} className='tellipsis'>{invoice.customer?.name || 'N/A'}</TableCell>
      <TableCell>{formatDate(invoice.invoiceDate)}</TableCell>
      <TableCell>{formatDate(invoice.dueDate)}</TableCell>
      <TableCell>{invoice?.totalAmount?.toFixed(2) || '0.00'}</TableCell>
      <TableCell>{invoice?.receivedAmount?.toFixed(2) || '0.00'}</TableCell>
      <TableCell>{invoice?.balanceDue?.toFixed(2) || '0.00'}</TableCell>
      <TableCell>
        <Chip {...getInvoiceStatus(invoice.balanceDue || 0, invoice.dueDate, TransactionType.INVOICE, invoice.paymentStatus)}
          variant='outlined'
          sx={{
            fontWeight: 600,
            py: 0,
            fontSize: '12px',
            height: 'auto',
            px: 0,
            ml: 1,
            borderRadius: 0.4,
            '& .MuiChip-label': {
              px: 1,
            }
          }}
        />
      </TableCell>
      <TableCell>
        <Chip {...getEmailStatus(invoice.emailStatus)}
          variant='outlined'
          sx={{
            fontWeight: 600,
            py: 0,
            fontSize: '12px',
            height: 'auto',
            px: 0,
            ml: 1,
            borderRadius: 0.4,
            '& .MuiChip-label': {
              px: 1,
            }
          }}
        />
      </TableCell>
      <TableCell align="center">
        <VerticalMenuInvoice
          actions={useTransactionMenuActions({
            type: TransactionType.INVOICE,
            item: invoice,
            user: currentUser,
            navigate,
            showViewDetails: false,
            showDownload: false,
            showReminder: false,
            onEdit: handleInvoiceClick,
          })}
        />
      </TableCell>
    </TableRow>
  );

  const renderBillRow = (invoice: VendorInvoiceResponse) => (
    <TableRow key={invoice._id} sx={{ '&:last-child td': { border: 0 } }}>
      <TableCell sx={{ whiteSpace: 'nowrap' }}>{invoice.BillNumber}</TableCell>
      <TableCell title={invoice.carrier?.company} className='tellipsis'>{invoice.carrier?.company || 'N/A'}</TableCell>
      <TableCell>{formatDate(invoice.invoiceDate)}</TableCell>
      <TableCell>{formatDate(invoice.dueDate)}</TableCell>
      <TableCell>{invoice?.totalAmount?.toFixed(2) || '0.00'}</TableCell>
      <TableCell>{invoice?.receivedAmount?.toFixed(2) || '0.00'}</TableCell>
      <TableCell>{invoice?.balanceDue?.toFixed(2) || '0.00'}</TableCell>
      <TableCell>
        <Chip {...getInvoiceStatus(invoice.balanceDue || 0, invoice.dueDate, TransactionType.BILL, invoice.paymentStatus)}
          variant='outlined'
          sx={{
            fontWeight: 600,
            py: 0,
            fontSize: '12px',
            height: 'auto',
            px: 0,
            ml: 1,
            borderRadius: 0.4,
            '& .MuiChip-label': {
              px: 1,
            }
          }}
        />
      </TableCell>
      <TableCell>
        <Chip {...getEmailStatus(invoice.emailStatus)}
          variant='outlined'
          sx={{
            fontWeight: 600,
            py: 0,
            fontSize: '12px',
            height: 'auto',
            px: 0,
            ml: 1,
            borderRadius: 0.4,
            '& .MuiChip-label': {
              px: 1,
            }
          }}
        />
      </TableCell>
      <TableCell align="center">
        <VerticalMenuInvoice
          actions={useTransactionMenuActions({
            type: TransactionType.BILL,
            item: invoice,
            user: currentUser,
            navigate,
            showViewDetails: false,
            showDownload: false,
            showReminder: false,
            onEdit: handleBillClick,
            onDelete: (id: string) => {
              const confirmDelete = window.confirm("Are you sure you want to delete this?");
              if (confirmDelete) {
                // Handle delete
              }
            },
          })}
        />
      </TableCell>
    </TableRow>
  );

  const renderPaymentRow = (payment: IPayment) => {
    const getTypeColor = (type: PaymentType) => {
      switch (type) {
        case PaymentType.invoice:
          return 'primary';
        case PaymentType.bill:
          return 'primary';
        default:
          return 'default';
      }
    };

    const handleView = (payment: IPayment) => {
      if (payment.PaymentType === PaymentType.invoice) {
        navigate(`${paths.recievedpayment}/${payment._id}`);
      }
      if (payment.PaymentType === PaymentType.bill) {
        navigate(`${paths.recievedbill}/${payment._id}`);
      }
    };

    const handleDelete = async (payment: string) => {
      try {
        const IsDelete = confirm("Are you sure you want to delete this payment?")
        if (IsDelete) {
          await apiService.deleteRecivedPayment(payment);
          toast.success("Payment deleted successfully");
        }
      } catch (error: any) {
        toast.error(error.message || "Something went wrong");
      }
    };

    return (
      <TableRow key={payment._id} hover>
        <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(payment.paymentDate)}</TableCell>
        <TableCell>{payment.referenceNo}</TableCell>
        <TableCell title={payment.customer?.name} className='tellipsis'>{payment.customer?.name || 'N/A'}</TableCell>
        <TableCell>
          <Chip label={payment.PaymentType || 'N/A'} color={getTypeColor(payment.PaymentType || '')}
            variant='outlined'
            size="small"
            sx={{
              height: 'auto',
              fontSize: '12px',
              borderRadius: 0.4,
              fontWeight: '600',
              '& .MuiChip-label': {
                px: 1,
              }
            }}
          />
        </TableCell>
        <TableCell sx={{ whiteSpace: 'nowrap' }}>{capitalizeFirstLetter(payment.paymentMethod)}</TableCell>
        <TableCell>
          <Chip {...getPaymentStatus(payment.status)}
            variant='outlined'
            sx={{
              fontWeight: 600,
              py: 0,
              fontSize: '12px',
              height: 'auto',
              px: 0,
              ml: 1,
              borderRadius: 0.4,
              '& .MuiChip-label': {
                px: 1,
              }
            }}
          />
        </TableCell>
        <TableCell>{formatCurrency(payment.credits)}</TableCell>
        <TableCell>{formatCurrency(payment.settledAmount)}</TableCell>
        <TableCell>{formatCurrency(payment.amount)}</TableCell>
        <TableCell align="center">
          <VerticalMenu
            actions={useTransactionMenuActions({
              type: TransactionType.PAYMENT,
              item: payment,
              user: currentUser,
              navigate,
              showDownload: false,
              showPayment: false,
              showReminder: false,
              showEdit: false,
              onViewDetails: handleView,
              onDelete: handleDelete,
            })}
          />
        </TableCell>
      </TableRow>
    );
  };

  const renderCustomerRow = (customer: any) => (
    <TableRow key={customer._id} sx={{ '&:last-child td': { border: 0 } }}>
      {AccountsCustomerColumns
        .map((col) => (
          <TableCell
            key={col.key}
            onClick={() => hasAccess(["accounting"], "view", currentUser) && col.key !== 'rating' && navigate(paths.customertransactionlist + '/' + customer._id)}
            sx={{ cursor: col.key !== 'rating' ? 'pointer' : 'default', whiteSpace: 'nowrap' }}
          >
            {renderCustomerCell({ column: col.key, customer, navigate })}
          </TableCell>
        ))}
      <TableCell align="center">
        <VerticalMenu
          actions={[
            hasAccess(["accounting"], "update", currentUser) ? { label: 'Edit', icon: "edit", onClick: () => handleEditCustomer(customer as any) } : null,
            hasAccess(["accounting"], "delete", currentUser) ? { label: 'Delete', icon: "delete", onClick: () => handleDeleteCustomer(customer._id || '') } : null,
            hasAccess(["accounting"], "create", currentUser) ? { label: 'Make Payment', icon: "payment", onClick: () => navigate(`/accounting/sales/accounts/recievedpayment/${customer._id}`) } : null,
            hasAccess(['accounting'], "create", currentUser) ? { label: 'Report', icon: "reports", onClick: () => navigate(`${paths.customers}/report/${customer._id}`) } : null,
          ]}
        />
      </TableCell>
    </TableRow>
  );



  const renderCarrierRow = (vendor: ICarrier) => (
    <TableRow key={vendor._id} sx={{ '&:last-child td': { border: 0 } }}>
      {VendorsColumns
        .map((col) => (
          <TableCell
            key={col.key}
            onClick={() => hasAccess(["accounting"], "view", currentUser) && navigate(paths.vendortransactionlist + '/' + vendor._id)}
            sx={{ cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            {renderCell({ column: col.key, vendor, navigate })}
          </TableCell>
        ))}

      <TableCell align="center">
        <VerticalMenu
          actions={[
            hasAccess(["accounting"], "update", currentUser) ? { label: 'Edit', icon: "edit", onClick: () => handleEditCarrier(vendor) } : null,
            hasAccess(["accounting"], "delete", currentUser) ? { label: 'Delete', icon: "delete", onClick: () => handleDeleteVendor(vendor._id || '') } : null,
            hasAccess(["accounting"], "create", currentUser) ? { label: 'Make Payment', icon: "payment", onClick: () => navigate('/accounting/purchase/accounts/recievedbill/' + vendor._id) } : null,
            hasAccess(['accounting'], "create", currentUser) ? { label: 'Report', icon: "reports", onClick: () => navigate(`${paths.carriers}/report/${vendor._id}`) } : null,
          ]}
        />
      </TableCell>
    </TableRow>
  );

  const renderRow = (item: any, index: number) => {
    switch (entityType) {
      case 'invoices':
        return renderInvoiceRow(item);
      case 'bills':
        return renderBillRow(item);
      case 'payments':
        return renderPaymentRow(item);
      case 'customers':
        return renderCustomerRow(item);
      case 'carriers':
        return renderCarrierRow(item);
      default:
        return null;
    }
  };

  return (
    <>
      <DataTable
        key={entityType}
        columns={config.columns}
        data={data}
        page={currentPage - 1}
        rowsPerPage={rowsPerPage}
        onPageChange={(newPage) => onPageChange(newPage + 1)}
        onRowsPerPageChange={onRowsPerPageChange}
        total={totalCount}
        renderRow={renderRow}
        rowsPerPageOptions={[5, 10, 25, 50]}
      />

      {/* Invoice Modal */}
      <AppModalDialog style={{backdropFilter:'blur(3px)'}}
        open={showInvoiceModal}
        onClose={() => {
          setShowInvoiceModal(false);
          setEditingInvoice(initialInvoiseData);
        }}
        aria-labelledby="invoice-modal-title"
        aria-describedby="invoice-modal-description"
      >
        <Box sx={modalStyle}>
          <DialogActions className='dialog-close'>
            <Button onClick={() => setShowInvoiceModal(false)}>
              {getIcon('CloseIcon')}
            </Button>
          </DialogActions>
          <Typography id="invoice-modal-title" variant="h6" component="h2" sx={{ mb:0}}>
            {editingInvoice?._id ? 'Edit Invoice' : 'Create Invoice'}
          </Typography>
          <InvoiseForm
            initialData={editingInvoice as IInvoice}
            onSubmit={createInvoiceMutation as any}
            loading={createInvoiceMutation.isPending}
          />
        </Box>
      </AppModalDialog>

      {/* Bill Modal */}
      <AppModalDialog style={{backdropFilter:'blur(3px)'}}
        open={showBillModal}
        onClose={() => {
          setShowBillModal(false);
          setEditingBill(initialInvoiseData);
        }}
        aria-labelledby="bill-modal-title"
        aria-describedby="bill-modal-description"
      >
        <Box sx={modalStyle}>
          <DialogActions className='dialog-close'>
            <Button onClick={() => setShowBillModal(false)}>
              {getIcon('CloseIcon')}
            </Button>
          </DialogActions>
          <Typography id="bill-modal-title" variant="h6" component="h2" sx={{ mb:0}}>
            {editingBill?._id ? 'Edit Bill' : 'Create Bill'}
          </Typography>
          <BillForm
            initialData={editingBill as IVendorBill}
            onSubmit={createBillMutation as any}
            loading={createBillMutation.isPending}
          />
        </Box>
      </AppModalDialog>

      {/* Customer/Carrier Modal */}
      {
        selectedCustomer && selectedCustomer._id  &&   <UniversalEntityForm
        open={Boolean(selectedCustomer)}
        onClose={() => {
          queryClient.invalidateQueries({ queryKey: ['vendors'] });
          setSelectedCustomer(null);
        }}
        id={selectedCustomer && selectedCustomer._id ? selectedCustomer._id : ""}
        entityType={(selectedCustomer as any)?.type=="carrier"? "vendor": "account-customer"}
      />
      }
    </>
  );
};

export default withPermission("view", ["advancedSearch"])(UnifiedTable);
