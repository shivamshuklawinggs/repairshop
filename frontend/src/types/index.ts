
import { Control, FieldErrors, UseFormSetValue, UseFormWatch } from "react-hook-form";
import { invoiceStatus, PaymentMethods } from "./enum";
import { CategoryType, } from "@/data/ProductServiceData";
// =============================================================================
// 1. TYPE DEFINITIONS (Mirrors backend for consistency)
// =============================================================================
// ✅ For invoices/bills
export type PaymentStatus =
  | "paid_late"
  | "paid"
  | "partial_late"
  | "overdue"
  | "partial"
  | "upcoming"
  | "due";
export type NormalBalanceSide = "debit" | "credit";
// ✅ For payments
export type CreditStatus =
  | "settled"
  | "unsettled";
  export interface FormatCurrencyOptions {
  locale?: string;
  currency?: string;
  compact?: boolean;
  fractionDigits?: number;
}
// const allowedreportTypes = ["profit-and-loss", "profit-and-loss-month", "balance-sheet", "AccountsReceiveable", "AccountsPayable", "AccountsPayableDetail", "AccountsRecieveableDetail", "TrialBalanceReport", "GeneralLedgerReport", "CreditNotesReport", "DebitNotesReport"] as const
const allowedreportTypes = ["profit-and-loss", "profit-and-loss-month", "balance-sheet", "AccountsReceiveable", "AccountsPayable", "AccountsPayableDetail", "AccountsRecieveableDetail", "TrialBalanceReport", "GeneralLedgerReport"] as const
export type ActionType = 'create' | 'view' | 'update' | 'delete' | 'import' | 'export';
export enum PaymentType {
  bill = "bill",
  invoice = "invoice",
}
export type ResourceType =  'customers' | 'carriers' | 'documents' | 'expense_service' | 'accounting' | 'users' | 'dashboard' | 'super-dashboard'|'company' | 'layout' | 'public' | 'superadmin' | 'profile' | 'advancedSearch' | 'InvoiceReminderTemplatesList'
export type allowedreports = typeof allowedreportTypes[number]
export interface PermissionCheck {
  action: ActionType;
  resource: ResourceType[]
}
export enum TransactionType {
  INVOICE = "INVOICE",
  PAYMENT = "PAYMENT",
  BILL = "BILL",
  JOURNAL = "JOURNAL",
  TAX = "TAX",
  DISCOUNT = "DISCOUNT",
  CREDIT_NOTE = "CREDIT_NOTE",
  DEBIT_NOTE = "DEBIT_NOTE"
}
export enum ReferenceType {
  INVOICE = "Invoice",
  BILL = "Bill",
  INVOICE_PAYMENT = "Invoice-Payment",
  BILL_PAYMENT = "Bill-Payment",
  JOURNAL_ENTRY = "Journal-Entry",
  SALES_TAX = "Sales-Tax",
  SALES_DISCOUNT = "Sales-Discount",
  PURCHASE_DISCOUNT = "Purchase-Discount",
  PURCHASE_TAX = "Purchase-Tax",
  CREDIT_NOTE = "Credit-Note",
  DEBIT_NOTE = "Debit-Note"
}

export type CreditDebitNoteStatus = 'Open' | 'Applied' | 'Closed' | 'Void';

export interface SystemStats {
  counts: {
    users: number;
    invoices: number;
    bills: number;
    payments: number;
    carriers: number;
    customers: number;
    drivers: number;
    expenses: number;
    journalEntries: number;
  };
  "invoicesSummary": {
    "_id": string,
    "totalInvoiceAmount": number,
    "totalPaidAmount": number,
    "totalDueAmount": number,
    "invoicePaidAmt": number
},
"billsSummary": {
    "_id": string,
    "totalInvoiceAmount": number,
    "totalPaidAmount": number,
    "totalDueAmount": number,
    "billPaidAmt": number
},
  paymentsSummary: {
    totalAmount: number;
    totalPayments: number;
  };
  
  companyId: string;
  timestamp: string;
  totalRevenue: number;
}
export interface ICreditNoteLineItem {
  _id?: string;
  description: string;
  qty: number;
  rate: number;
  amount: number;
}

export interface ICreditNoteSummary {
  subTotal: number;
  finalAmount: number;
  appliedAmount: number;
  remainingAmount: number;
}

export interface ICreditNote {
  _id?: string;
  creditNoteNumber: string;
  creditNoteDate: Date | string;
  postingDate: Date | string;
  customerId: string;
  customer?: { _id: string; company: string; email?: string };
  invoiceId?: string;
  chartOfAccount?: string;
  companyId?: string;
  createdBy?: string;
  updatedBy?: string;
  reason: string;
  lineItems: ICreditNoteLineItem[];
  summary: ICreditNoteSummary;
  status: CreditDebitNoteStatus;
  files?: any[];
  customerNotes?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface IDebitNoteLineItem {
  _id?: string;
  description: string;
  qty: number;
  rate: number;
  amount: number;
}

export interface IDebitNoteSummary {
  subTotal: number;
  finalAmount: number;
  appliedAmount: number;
  remainingAmount: number;
}

export interface IDebitNote {
  _id?: string;
  debitNoteNumber: string;
  debitNoteDate: Date | string;
  postingDate: Date | string;
  vendorId: string;
  vendor?: { _id: string; company: string; email?: string };
  billId?: string;
  chartOfAccount?: string;
  companyId?: string;
  createdBy?: string;
  updatedBy?: string;
  reason: string;
  lineItems: IDebitNoteLineItem[];
  summary: IDebitNoteSummary;
  status: CreditDebitNoteStatus;
  files?: any[];
  vendorNotes?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
export enum paidtype {
  customer = "customer",
  vendor = "vendor"
}
// Render public routes
// export interface RoteExtended extends Route {
//   action: ActionType;
//   resource: ResourceType[];
// }
export type  emailStatus= 'Save' | 'Save & Send' | 'Failed To Send'
export interface Advance {
  _id: string
  credits: number
  referenceNo: string
  settledAmount: number,
  amount:number
}
export interface GetLoadsParams {
 page: number;
  limit: number;
  status: string;
  search?: string;
  startAmt?: string;
  endAmt?: string;
  StartPickupDate?: any;
  EndPickupDate?: any;
  StartDeliveryDate?: any;
  EndDeliveryDate?: any;
  isFollowUp?: string;
  sortBy?: string;
  sortOrder?: string;
  sortFields?:string;
  isBilled?:boolean
}
export interface ISessionDoc {
  _id: string;
  expires: Date;
  session: { userId?: string; createdAt?: Date };
};
export interface IPaymentTerm {
  _id?: string;
  name: string;
  description?: string;
  dueDays?: number;
  discountPercent?: number;
  discountDays?: number;
  isActive?: boolean;
  companyId?: string;
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IPayment {
  _id: string;
  postingDate: Date;
  customerId: string;
  createdAt?: Date;
  status: "Settled" | "Unsettled";
  updatedAt?: Date;
  invoiceIds: string[];
  billids: string[];
  createdBy: string;
  updatedBy: string;
  companyId: string;
  paymentDate: Date;
  paymentMethod: string;
  referenceNo: string;
  depositTo: string;
  amount: number;
  PaymentType: PaymentType;
  credits: number;
  settledAmount: number
  customer?: {
    _id: string;
    displayName: string;
    email?: string;
    phone?: string;
    name?: string;
  };
}

export interface IPlan {
  _id?: string;
  name: string;
  description: string;
  price: number;
  noOfUsers: number;
  isActive: boolean;
  noOfDays: number;
  noOfCompanies: number;
  isUnlimited: boolean;
};
export interface SidebarMenuItem {
  path: string;
  title: string;
  icon?: string;
  icontype?: string;
  action: ActionType;
  resource: ResourceType[];
  currentCompany?: boolean;
  children?: SidebarMenuItem[];
  roles: Role[];
}

export interface SideDrawerProps {
  drawerWidth: number;
}
export enum Role {
  ADMIN = 'admin',
  SUPERADMIN = 'superadmin',
  ACCOUNTANT = 'accountant'
}
export const ADMIN_ASSIGNABLE_ROLES = [Role.ACCOUNTANT];
export const SUPERADMIN_ASSIGNABLE_ROLES = [Role.ADMIN];
export type StatusConfig = { color: string; bg: string; border: string };
export const STATUS_MAP: Record<ICustomerInvoicesPaymentDetails["status"], StatusConfig> = {
  "paid_late": { color: '#92400e', bg: '#fffbeb', border: '#fde68a' },
  "paid": { color: '#166534', bg: '#f0fdf4', border: '#bbf7d0' },
  "partial_late": { color: '#9f1239', bg: '#fff1f2', border: '#fecdd3' },
  "overdue": { color: '#9f1239', bg: '#fff1f2', border: '#fecdd3' },
  "partial": { color: '#92400e', bg: '#fffbeb', border: '#fde68a' },
  "upcoming": { color: '#1e40af', bg: '#eff6ff', border: '#bfdbfe' },
  "due": { color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb' },
  "settled": { color: '#166534', bg: '#f0fdf4', border: '#bbf7d0' },
  "unsettled": { color: '#9f1239', bg: '#fff1f2', border: '#fecdd3' },
};
export const ROLES = Object.values(Role);
export const VisibleCompanyAssignedRoles = [Role.ACCOUNTANT];
export interface IExpenseItem {
  value: number | any
  service: string | any
  desc: string;
  positive: boolean;
}
export type AccountCategoryType =
  | "income"
  | "expense"
  | "asset"
  | "liability"
  | "equity";
export interface IParentAccountType {
  _id: string;
  name: string;
  type: IParentAccountTypeEnum;
  masterType: masterType;
  desc: string,
  subLevel: number,
  typeId: string,
  typeMnemonic: string,
  typeEnumName: string,
  detailTypeId: string,
  detailType: string,
  detailTypeMnemonic: string,
  detailTypeEnumName: string,
  journalCodeTypeId?: string
}
export interface IAccountDetailType {
  _id: string;
  desc: string;
  name: string;
  subLevel: number;
  typeId: string;
  type: IParentAccountTypeEnum;
  masterType: masterType;
  typeMnemonic: string;
  typeEnumName: string;
  detailTypeId: string;
  detailType: string;
  detailTypeMnemonic: string;
  detailTypeEnumName: string;
  journalCodeTypeId?: string;
  parentAccountTypeId: string;
}
export interface IActivityLog {
  _id?: string;
  userName: string;
  collectionName: string;
  action: string;
  changes: string;
  timestamp: string;
}
export interface IContactPerson {
  _id: string;
  id?: string;
  name: string;
  email: string;
  phone: string;
  extentionNo?: string
}
export interface IPaymentRecived {
  customer: string;
  paymentDate: Date;
  postingDate: Date;
  paymentMethod: string;
  referenceNo: string;
  searchInvoice: string,
  fromDate: Date | null,
  toDate: Date | null,
  overdueOnly: string,
  invoicePayments: Array<{
    invoiceId: string;
    amount: number;
    totalAmountWithTax?: number
  }>;
  recievedPayments?: Array<{
    invoiceId: string;
    amount: number;
    totalAmountWithTax?: number
  }>;
  nonRecievedPayments?: Array<{
    invoiceId: string;
    amount: number;
    totalAmountWithTax?: number
  }>;
  amount: number;
  depositTo: string
  credits?: number;
  deletedPayments?: any
  customerInvoices?: ICustomerInvoicesPaymentDetails[];
}
export interface IPaymentRecivedData {
  paymentDate: Date;
  postingDate: Date;
  paymentMethod: string;
  referenceNo: string;
  invoicePayments: Array<{
    invoiceId: string;
    amount: number;
    totalAmountWithTax?: number
  }>;
  amount: number;
  depositTo: string;
  customer: {
    _id: string,
    email: string,
    phone: string,
    billingAddress: {
      address: string,
      city: string,
      state: string,
      zipCode: string,
      country: string
    },
    paymentMethod: PaymentMethods,
    company: string,
    account: boolean
  },
}
export interface IPaymentRecivedUpdate {
  paymentDate: Date;
  postingDate: Date;
  paymentMethod: string;
  referenceNo: string;
  amount: number;
  depositTo: string;
}

export interface ICustomerInvoicesPaymentDetails {
  "_id": string,
  "referenceId": string,
  "transactionType":TransactionType,
  "amount": number,
  "balanceDue": number,
  "balanceDuenumeric": number,
  "createdAt": Date,
  "credit": number,
  "credits": number,
  "customerId":string,
  "debit": number,
  "dueDate": Date,
  "postingDate": Date,
  "type":ReferenceType,
  description:string;
  summary: {
    subTotal?: number;
  taxTotal?: number;
  discount?: number;
  finalAmount?: number;
  totalRecieved?:number;
  balanceDue?:number
  settledAmount?:number;
  credits?:number;
  appliedAmount?: number;
  remainingAmount?: number;
  },
  invoiceNumber: number,
  "BillNumber": number,
  "totalAmount": number,
  "totalAmountWithTax": number,
  "recievedAmount": number,
  "paymentDate": Date,
  "transaction": TransactionType,
  "party": string,
  "paymentStatus": PaymentStatus,
  "daysLate": number,
  "status": PaymentStatus | CreditStatus,
  "signedAmount": number,
  "runningChange": number;
  refrenceNo:string;
}
export interface OutStandingInvoiceResponse {
  success: boolean
  data: {
    _id: string
    expense: {
      productservice: string
      description: string
      qty: number
      rate: number
      summary: {
        amount: number
        taxAmount: number
        total: number
      }
      readonly: boolean
      _id: string
    }[]
    invoiceNumber: string
    status: string
    invoiceDate: string
    dueDate: string
    recievedPaymentAmount: any[]
    totalAmountWithTax: number
    totalTaxAmount: number
    totalAmount: number
    recievedAmount: number
    balanceDue: number
  }[]
  totalBalance: number
  totalRecievedAmount: number
  totalDueAmount: number
  pagination: {
    page: number
    limit: number
    total: {
      _id: any
      totalBalance: number
      totalRecievedAmount: number
      totalDueAmount: number
      count: number
    }
    totalPages: any
    hasmore: boolean
  }
}
export interface OutStandingBillResponse {
  success: boolean
  data: {
    _id: string
    expense: {
      productservice: string
      description: string
      qty: number
      rate: number
      summary: {
        amount: number
        taxAmount: number
        total: number
      }
      readonly: boolean
      _id: string
    }[]
    BillNumber: string
    status: string
    invoiceDate: string
    dueDate: string
    recievedPaymentAmount: any[]
    totalAmountWithTax: number
    totalTaxAmount: number
    totalAmount: number
    recievedAmount: number
    balanceDue: number
  }[]
  totalBalance: number
  totalRecievedAmount: number
  totalDueAmount: number
  pagination: {
    page: number
    limit: number
    total: {
      _id: any
      totalBalance: number
      totalRecievedAmount: number
      totalDueAmount: number
      count: number
    }
    totalPages: any
    hasmore: boolean
  }
}
export interface ITotalTransactionCount {
  years: Array<
    {
      _id: number
      total: number
    }
  >
}


export interface IEntityDetails {
  entity_type?: string;
  dba_name?: string;
  legal_name?: string;
  operating_status?: OpraStatus;
  physical_address?: string;
  mailing_address?: string;
  carrier_operation?: string[];
  out_of_service_date?: string;
}

export interface ICustomerTransactionDetails {
  _id: string;
  totalRecievedAmount?: number;
  totalDueAmount?: number;
  totalOverDueAmt?: number;
  // Identification & company info
  customerId?: string;
  company?: string;
  dba_name?: string;
  legal_name?: string;
  entity_type?: string;
  operating_status?: OpraStatus;
  mcNumber?: string;
  usdot?: string;
  vatNumber?: string;
  utrNumber?: string;
  rating?: string;
  status?: string;

  // Contact info
  title?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  nameToPrintOnCheck?: string;
  displayCustomerName?: string;
  email: string;
  phone?: string;
  mobileNo?: string;
  alternatphone?: string;
  extentionNo?: string;
  fax?: string;
  other?: string;
  website?: string;

  // Addresses
  address?: string;
  state?: string;
  zipCode?: string;
  physical_address?: string;
  mailing_address?: string;
  billingAddress?: {
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  shippingAddress?: {
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };

  // Payment
  paymentMethod?: string;
  paymentTerms?: string;

  // Documents
  documents?: Array<{
    fieldname?: string;
    originalname?: string;
    encoding?: string;
    mimetype?: string;
    destination?: string;
    filename?: string;
    path?: string;
    size?: number;
    _id?: string;
  }>;
  // Carrier operations
  carrier_operation?: string[];
  out_of_service_date?: string;

  // Notes / metadata
  notes?: string;

  // Timestamps
  createdBy?: string;
  updatedBy?: string;
  companyId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IStatementCreate {
  data: [
    {
      _id: string,
      type: string,
      invoiceNumber: string,
      status: invoiceStatus,
      invoiceDate: Date,
      dueDate: Date,
      recievedAmount: number,
      overbalanceDue: number,
      totalAmount: number,
      balanceDue: number
    }
  ],
  totalBalance: number,
  totalRecievedAmount: number,
  totalBalanceDue: number,
  customerId: string,
  account: boolean,

}
export interface IStatements {
  data: [
    {
      _id: string,
      type: string,
      invoiceNumber: string,
      status: invoiceStatus,
      invoiceDate: Date,
      dueDate: Date,
      recievedAmount: number,
      overbalanceDue: number,
      totalAmount: number,
      balanceDue: number
    }
  ],
  customer: {
    _id: string,
    totalBalance: number,
    totalRecievedAmount: number,
    totalBalanceDue: number,
    email: string,
    phone: string,
    paymentMethod: string,
    company: string,
    billingAddress: {
      address: string,
      city: string,
      state: string,
      zipCode: string,
      country: string
    },
    account: boolean,
    customer: {
      _id: string,
      email: string,
      phone: string,
      billingAddress: {
        address: string,
        city: string,
        state: string,
        zipCode: string,
        country: string
      },
      paymentMethod: string,
      company: string,
      account: boolean
    }
  }
}
export interface IStatementsReponse {
  _id: string,
  data: [
    {
      _id: string,
      type: string,
      invoiceNumber: string,
      status: invoiceStatus,
      invoiceDate: string,
      dueDate: string,
      recievedAmount: number,
      overbalanceDue: number,
      totalAmount: number,
      balanceDue: number
    }
  ],
  customer: {
    _id: string,
    totalBalance: number,
    totalRecievedAmount: number,
    totalBalanceDue: number,
    email: string,
    phone: string,
    paymentMethod: string,
    company: string,
    billingAddress: {
      address: string,
      city: string,
      state: string,
      zipCode: string,
      country: string
    },
    account: boolean,
  },
  totalBalance: number,
  totalRecievedAmount: number,
  totalBalanceDue: number;
  createdAt: Date
}

export interface IFile {
  fieldname: string;
  file?: File;
  id?: string;
  preview?: string;
  isNew?: boolean;
  originalname: string;
  encoding: string;
  mimetype: string;
  destination: string;
  filename: string;
  path: string;
  size: number;
  url?: string
  createdAt?: Date;
  updatedAt?: Date;

}

export interface Attachment {
  file?: File;
  preview?: string;
  [key: string]: any;
}

export interface ITaxOption {
  _id: string;
  value: number;
  label: string;
  ChartOfAccountId: string;
}
// TypeScript interface for form data
export interface IProductService {
  name: string;
  category: CategoryType;
  isUpdate: boolean;
  description: string;
  incomeAccount: string;
  inventoryAccount: string;
  expenseAccount: string;
  incomeAccountData: Omit<IChartAccount, "accountTypeData"> & {
    name: string
  };
  inventoryAccountData: Omit<IChartAccount, "accountTypeData"> & {
    name: string
  };
  expenseAccountData: Omit<IChartAccount, "accountTypeData"> & {
    name: string
  };
  OpeningStock: number;
  reorderStock: number;
  currentLevel: number;
  ProductRate: number
  _id: string;
}


export interface InvoiceCrrier {
  invoiceNumber: string;
  location: string;
  customerEmail: string;
  company: string;
  customerAddress: string;
  carrierId: string;
  carrierPay: number;
  discountPercent: number;
  tax: string;
  deposit: number;
  subTotal: number;
  totalDiscount: number;
  taxAmount: number;
  totalAmount: number;
  total: number;
  balanceDue: number;
  deletedfiles?: string[];
  attachments?: Attachment[];
  files?: Attachment[];
  [key: string]: any;
}
export interface invoiceexpense {
  productservice: string,
  description: string,
  qty: number,
  rate: number,
  tax: string,
  amount: number
  readonly: boolean
  isloadExpenses?: boolean;
  label?: string;
}
export interface IInvoice {
  deletedfiles?: string[];
  postingDate: Date;
  taxArray: ITaxOption[];
  productServiceArray: IProductService[];
  customer?: ICustomer;
  totalAmount?: number;
  _id?: string;
  email?: string;
  expense: invoiceexpense[]
  address: string;
  tax?: string;
  files: IFile[];
  invoiceNumber: string;
  vin?: string;
  status: invoiceStatus
  invoiceDate: Date;
  dueDate: Date;
  terms: string;
  customerNotes: string;
  terms_conditions: string;
  discountPercent: number;
  deposit: number;
  paymentOptions: PaymentMethods;
  customerId: string;
  type: 'customer' | 'carrier'
  subTotal: number;
  totalDiscount: number;
  taxAmount: number;
  total: number;
  balanceDue: number;
  recievedPaymentAmount?: {
    paymentDate: Date;
    recievedPaymentId: string;
    _id: string;
    paymentMethod: string;
    referenceNo: string;
    depositTo: string;
    amount: number;
  }[]
}
export interface IVendorBill {
  deletedfiles?: string[];
  taxArray: ITaxOption[];
  productServiceArray: IProductService[];
  customer?: ICustomer;
  postingDate: Date;
  totalAmount?: number;
  _id?: string;
  email?: string;
  expense: invoiceexpense[]
  address: string;
  tax?: string;
  files: IFile[];
  BillNumber: string;
  status: invoiceStatus;
  invoiceDate: Date;
  dueDate: Date;
  terms: string;
  customerNotes: string;
  terms_conditions: string;
  discountPercent: number;
  deposit: number;
  paymentOptions: PaymentMethods;
  vendorId: string;
  type: 'other';
  subTotal: number;
  totalDiscount: number;
  taxAmount: number;
  total: number;
  balanceDue: number;
  recievedPaymentAmount?: {
    paymentDate: Date;
    recievedPaymentId: string;
    _id: string;
    paymentMethod: string;
    referenceNo: string;
    depositTo: string;
    amount: number;
  }[]
}
export interface IDocument {
  _id: string;
  company: string;
  insurerCompany: string;
  agentName: string;
  agentAddress: string;
  agentEmail: string;
  agentPhoneNumber: string;

  amount: number;
  createdAt: Date;
  updatedAt: Date;
  files: IFile
  documents: IFile;
  customerDocs: IFile[];
  insuranceDocuments: IFile;
  file: IFile;
  service: IitemService;
  type: string;
  invoiceNumber: string;
  carrierName: string;
  usdot: string;
  mcNumber: string;
  driverName: string;
  pickupLocationId: {
    files: IFile;
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    _id: string;
  };
  deliveryLocationId: {
    files: IFile;
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    _id: string;
  };
}

export interface LoginFormData {
  email: string;
  password: string;
}
export interface IMenuPermission {
  menuName: string;
  permissions: {
    create: boolean;
    delete: boolean;
    update: boolean;
    view: boolean;
    import: boolean;
    export: boolean;
  };
}

export interface IUser {
  _id?: string;
  name: string;
  phone: string;
  extentionNo?: string;
  email: string;
  password: string;
  visibleCompany?: string[];
  repeatPassword?: string;
  role: Role
  isActive?: boolean;
  isBlocked?: boolean;
  manager?: string | null;
  createdBy?: string,
  isUpdate?: boolean,
  updatedBy?: string;
 
}

export interface INotification {
  _id:string;
  referenceId:string;
  message: string;
  title:string;
  isRead: boolean;
  UserId: string;
  referenceNumber:string
  type:"Follow-up Load Expense"| "Follow-up Load" | "Pickup Ready" | "ProductServiceReminer" | "Delivery Ready"
}
export interface INotificationUpdate {
  _id?: string;
  title?: string;
  message?: string;
  isRead: boolean;
  UserId?: string;
}

export interface IMenuItem {
  path: string;
  title: string;
  icon?: string;
  icontype?: any
  children?: IMenuItem[];
  allowedRoles: string[];
  hideInMenu?: boolean;
}

export interface SidebarState {
  isOpen: boolean;
  activeMenu: string;
  openMenus: string[];
}

export interface IPaymentTerm {
  _id?: string;
  name: string;
  description?: string;
  days: number;
}
export type CustomerStatus = 'active' | 'inactive' | 'suspended'
export const CustomerStatusList = [
  { label: "All", value: "" },
  { label: "Active", value: "active" },
  { label: "In Active", value: "inactive" },
  { label: "Suspended", value: "suspended" },
]
export type CustomerRating = 'A' | 'B' | 'C' | 'D' | 'F'
export type IParentAccountTypeEnum = "asset" | "liability" | "equity" | "income" | "expense" | "createdBy"
export type masterType ="customer"|"other"|"vendor"|"retainedearnings"
export interface IAccountType {
  name: string;
  type: IParentAccountTypeEnum;
  masterType: masterType;
}
export interface IAccountDetailType {
  desc: string;
  subLevel: number;
  typeId: string;
  type: IParentAccountTypeEnum;
  masterType: masterType;
  typeMnemonic: string;
  typeEnumName: string;
  detailTypeId: string;
  detailType: string;
  detailTypeMnemonic: string;
  detailTypeEnumName: string;
  journalCodeTypeId?: string;
  parentAccountTypeId: string;
  createdBy?: string;
  updatedBy?: string;
}
export interface IChartAccount {
  _id?: string;
  id?: string;
  name: string;
  accountType: string;
  detailType: string;
  isSubAccount: boolean;
  parentAccountId?: string;
  description?: string;
  isActive: boolean;
  createdAt?: Date;
  accountTypeData?: IAccountType
  detailTypeData?: IAccountDetailType
  updatedAt?: Date;
  endingBalanceNumeric?: number
  readonly?:boolean

}
export interface ICustomer {
  truckDetails?: {
    vinNumber: string;
    licenseNumber: string
  };
  email: string;
  autoScore: number;   // 0–100
  stars: number;       // 0–5  (autoScore / 20)
  paymentScore?: number;
  id?: string;
  phone: string;
  usdot?: string;
  _id?: string;
  company?: string;
  nickName?: string;
  alternatphone?: string;
  extentionNo?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  mcNumber?: string;
  entityDetails?: IEntityDetails;
  withoutUsdot?: boolean;
  status?: CustomerStatus;
  paymentMethod: PaymentMethods
  paymentTerms: string
  vatNumber?: string;
  utrNumber?: string;
  documents: IFile[]
  deleteFiles?: string[],
  paymentTermsData?: IPaymentTerm[]
  balanceDue?: number
  billingAddress?: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  }
  shippingAddress?: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  }
  // below data is not  necessary for customer
  displayCustomerName?: string;
  mobileNo?: string;
  fax?: string;
  other?: string;
  website?: string;
  nameToPrintOnCheck?: string;
  isSubCustomer?: boolean;
  parentCustomer?: string;
  notes?: string;
  // below data is not  necessary for customer
  sameAsBillingAddress?: boolean

}

export interface IAccountsCustomerView {
  _id?: string;
  id?: string;
  autoScore: number;   // 0–100
  stars: number;       // 0–5  (autoScore / 20)
  paymentScore?: number;
  company: string;
  displayCustomerName: string;
  email: string;
  phone: string;
  mobileNo: string;
  fax: string;
  other: string;
  website: string;
  nameToPrintOnCheck: string;
  isSubCustomer: boolean;
  parentCustomer?: ICustomer;
  sameAsBillingAddress: boolean
  billingAddress: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  }
  shippingAddress: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  }
  notes: string;
  status?: CustomerStatus;
  rating?: CustomerRating;
  paymentMethod: PaymentMethods
  paymentTerms: string
  documents: IFile[];
  totalBalance?: number;
  totalRecievedAmount?: number;
  totalDueAmount?: number;
  balanceDue?: number
  // below data is not  necessary for customer
  deleteFiles?: string[],
}
export interface CustomerData {
  _id: string;
  customer: ICustomer;
  loadCount: number;
  id?: string;
}
export interface CarrierData {
  _id: string;
  carrier: ICarrier;
  loadCount: number;
  id?: string;
}
export interface CustomerResponse {
  data: CustomerData[],
  pagination: {
    total: number,
    limit: number,
    page: number,
    totalPages: number
  }
}
export interface CarrierResponse {
  data: CarrierData[],
  pagination: {
    total: number,
    limit: number,
    page: number,
    totalPages: number
  }
}

export interface StatusColors {
  [key: string]: string;
  active: string;
  inactive: string;
  pending: string;
}

export interface RatingColors {
  A: string;
  B: string;
  C: string;
  D: string;
  F: string;
  [key: string]: string;
}

export interface Contact {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  extentionNo?: string
  phone: string;
}
export interface IDriver {
  _id?: string;
  driverName: string;
  driverPhone: string;
  driverCDL: string;
  driverCDLExpiration: Date;
  isActive: boolean;
  file?: IFile
  previewUrl?: string;
}


export type DocumentFormValues = {
  document: IFile[];
};
export type OpraStatus = "NOT AUTHORIZED" | "OUT-OF-SERVICE"
export interface ICommonUsdotData {
   billingAddress?: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  }
  shippingAddress?: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  }
  mcNumber: string;
  usdot: string;
  phone: string;
  company?: string;
  entity_type?: string
  dba_name?: string
  legal_name?: string
  operating_status?: OpraStatus
  physical_address?: string
  mailing_address?: string
  carrier_operation?: string[]
  out_of_service_date?: string
}
export interface ICarrier {
  truckDetails?: {
    vinNumber: string;
    licenseNumber: string
  };
  _id?: string | null;
  id?: string;
  autoScore: number;   // 0–100
  stars: number;       // 0–5  (autoScore / 20)
  balanceDue?: number;
  company?: string;
  paymenttermsdata?: IPaymentTerm,
  status?: CustomerStatus
  displayCustomerName?: string
  sameAsBillingAddress?: boolean
  isSubCustomer?: boolean;
  parentCustomer?: string;
  isSubVendor?: boolean;
  parentVendor?: string;
  nameToPrintOnCheck?: string
  email?: string
  mobileNo?: string
  fax?: string
  other?: string
  website?: string
  notes?: string
  paymentMethod?: PaymentMethods
  billingAddress?: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  }
  shippingAddress?: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  }

  extentionNo: string
  mcNumber: string;
  usdot: string;
  alternatphone: string;
  address: string;
  phone: string;
  zipCode?: string;
  state?: string;
  documents: IFile[]
  paymentTerms: string
  entityDetails?: IEntityDetails;
  withoutUsdot?: boolean;
  deleteFiles?: string[],
  rating?: string;
}
// load types

// Define types for item services
export interface IitemService {
  _id?: string;
  label: string;
  // value: string;
  productservice?: string;
  productservices?: {
    _id: string;
    name: string;
  };
}

export interface IContactDetails {
  phone?: string;
  email?: string;
  address?: string;
}
export interface ICarrierWIthId extends ICarrier {
  _id: string;
}

export interface ICompany {
  _id?: string;
  label: string;
  signature?: string;
  mcNumber: string;
  usdot: string;
  prefix: string;
  description?: string;
  color: string;
  logo: IFile | null;
  termsandconditions: string;
  phone: string;
  email: string;
  address: string;
  physicalDetails?: IContactDetails;
  billingDetails?: IContactDetails;
  test?:boolean

}
export interface IAccounttype {
  desc: string,
  subLevel: number,
  typeId: string,
  type: string,
  typeMnemonic: string,
  typeEnumName: string,
  detailTypeId: string,
  detailType: string,
  detailTypeMnemonic: string,
  detailTypeEnumName: string,
  journalCodeTypeId?: string
}

export interface InvoiceResponse {
  _id: string;
  customerId: string;
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  receivedAmount: number;
  balanceDue: number;
  customer: ICustomer
  Advance: Advance[],
  emailStatus: emailStatus
}
export interface CustomerInvoiceResponse {
  _id: string;
  companyId: string;
  customerId: string;
  id?: string;
  type: 'other';
  email: string;
  files: any[]; // update this to a specific file type if needed
  tax: number | null;
  invoiceNumber: string;
  loadId: string;
  status: invoiceStatus;
  invoiceDate: string; // ISO string format
  dueDate: string;
  terms: string;
  customerNotes: string;
  terms_conditions: string;
  discountPercent: number;
  deposit: number;
  paymentOptions: string;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
  carrier: ICarrier;
  createdUser?: IUser
  totalAmount?: number;
  totalAmountWithTax?: number;
  recievedAmount?: number;
  balanceDue?: number;
  customer?: ICustomer
}
export interface VendorInvoiceResponse {
  vendorId: string;
  _id: string;
  customerId: string;
  BillNumber: string;
  invoiceDate: Date;
  dueDate: Date;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  receivedAmount: number;
  balanceDue: number;
  carrier: ICarrier
  Advance: Advance[]
  emailStatus: emailStatus
}
export interface AllCustomerDataProps {
  customer: ICustomer
}
export interface AllVendorDataProps {
  customer: ICarrier
}

export interface recievedPaymentparmaSearchProps {
  invoiceNumber: string, fromDate: string, toDate: string, overdueOnly: string, customerId: string
}


export interface recievedPaymentFilterState {
  fromDate: Date | null;
  toDate: Date | null;
  overdueOnly: string;
  amount: number;
  searchInvoice: string;
  isLoading: boolean
  customerInvoices: ICustomerInvoicesPaymentDetails[];
  selectedInvoices: Array<{ invoiceId: string; amount: number; totalBalanceDue: number }>;

  recievedAmount: number;
  customerBalance: number;
  totalSelectedAmount: number;
  recievedPayments: {
    _id: string,
    invoiceNumber: string,
    invoiceId: string,
    amount: number,
    amountWithTax: number,
    totalAmountWithTax: number,
    totalTaxAmount: number,
    totalAmount: number,
    recievedAmount: number,
    balanceDue: number,
    recievedPaymentId: string
  }[];
  nonRecievedPayments: {
    _id: string,
    invoiceNumber: string,
    invoiceId: string,
    amount: number,
    amountWithTax: number,
    totalAmountWithTax: number,
    totalTaxAmount: number,
    totalAmount: number,
    recievedAmount: number,
    balanceDue: number,
    recievedPaymentId: string
  }[];
  deletedPayments: {
    _id: string,
    invoiceNumber: string,
    invoiceId: string,
    amount: number,
    amountWithTax: number,
    totalAmountWithTax: number,
    totalTaxAmount: number,
    totalAmount: number,
    recievedAmount: number,
    balanceDue: number,
    recievedPaymentId: string
  }[];
}
export interface CustomerDashboardData {
  data: {
    overdueInvoices: {
      count: number;
      totalAmount: number;
      percentage: number
    };
    paidInvoices: {
      count: number;
      totalAmount: number;
      percentage: number
    };
    totalInvoices: {
      count: number;
      totalAmount: number;
      percentage: number
    };
    recentPaidInvoices: {
      count: number;
      totalAmount: number;
      percentage: number
    };
    partialInvoices: {
      count: number;
      totalAmount: number;
      percentage: number
    };
    open: {
      count: number;
      totalAmount: number;
      percentage: number
    };
  }

}

export enum transactiontypes {
  INVOICE = "Invoice",
  BILL = "Bill",
  INVOICE_PAYMENT = "Invoice-Payment",
  BILL_PAYMENT = "Bill-Payment",
  JOURNAL_ENTRY = "Journal-Entry",
  SALES_TAX = "Sales-Tax",
  SALES_DISCOUNT = "Sales-Discount",
  PURCHASE_DISCOUNT = "Purchase-Discount",
  PURCHASE_TAX = "Purchase-Tax"
}
export interface Transaction {
  _id: string;
  customer: string;
  amount: number;
  debit: number;
  credit: number;
  postingDate: Date;
  balanceDue: string;
  balanceDuenumeric:number;
  transactionType: TransactionType;
  referenceId: string;
  type: ReferenceType
  description: string;
  refrenceNo: string
}

export type AccountRegisterResponse = {
  data: Transaction[];
  total: number;
};



interface monthlyTotalsProps {
  month: number,
  year: number,
  totalAmount: number,
  endingBalance?: number,
  totalCredits?: number,
  totalDebits?: number
}
export interface ReportRowData {
  _id: string;
  name: string;
  monthlyTotals?: monthlyTotalsProps[]
  total?: number;
  totalAmount: number;
  endingBalance: number;
  totalCredits: number;
  totalDebits: number;
}

export interface ReportSection {
  _id: string;
  typeId?: string;
  data: ReportRowData[];
  total?: number;
  totalAmount: number;
  monthlyTotals?: monthlyTotalsProps[];
  totalCredits?: number;
  totalDebits?: number;
  endingBalance?: number;
}

export interface ReportData {
  data: Array<{
    _id: string;
    typeId: string;
    data: ReportRowData[];
    total?: number;
    totalAmount: number;
    monthlyTotals?: monthlyTotalsProps[];
    totalCredits?: number;
    totalDebits?: number;
    endingBalance?: number;
  }>;
  totals: {
    _id: string,
    Income: number,
    COGS: number,
    Expenses: number,
    OtherIncome: number,
    OtherExpense: number,
    grossProfit: number,
    netOperatingIncome: number,
    netOtherIncome: number,
    netProfit: number
  };
  monthlyTotals?: Array<{
    month: number,
    year: number,
    Income: number,
    COGS: number,
    Expenses: number,
    OtherIncome: number,
    OtherExpense: number,
    grossProfit: number,
    netOperatingIncome: number,
    netOtherIncome: number,
    netProfit: number
  }>;
}
export interface IAccountsReceiveableReportData {
  data: [
    {
      _id: string,
      totalDueAmount: number,
      customer: {
        _id: string,
        name: string,

      },
      totalAmount: number,
      currentDueAmount: number,
      due_0_30: number,
      due_31_60: number,
      due_61_90: number,
      due_90_plus: number,
      daysPastDue: number
    }
  ],
  totalData: {
    totalDueAmount: number,
    currentDueAmount: number,
    due_0_30: number,
    due_31_60: number,
    due_61_90: number,
    due_90_plus: number
  },
}
export interface IAccountsPayableReportData {
  data: [
    {
      _id: string,
      totalDueAmount: number,
      customer: {
        _id: string,
        name: string,
      },
      totalAmount: number,
      currentDueAmount: number,
      due_0_30: number,
      due_31_60: number,
      due_61_90: number,
      due_90_plus: number,
      daysPastDue: number
    }
  ],
  totalData: {
    totalDueAmount: number,
    currentDueAmount: number,
    due_0_30: number,
    due_31_60: number,
    due_61_90: number,
    due_90_plus: number
  },
}
interface GroupedInvoices {
  bucket: string
  bucketOrder: number
  invoices: {
    _id: string,
    date: Date,
    vendorDisplayName: string,
    num: string,
    transactionType: "Bill" | "Invoice",
    dueDate: Date,
    daysPastDue: number,
    amount: number,
    openBalance: number,
    bucket: string,
    bucketOrder: number
  }[],
  totalAmount: number
  totalOpenBalance: number
}
export interface IAccountsPayableDetail {

  data: GroupedInvoices[],
  totalDueAmount: number,
  totalAmountWithTax: number,
  total: number
  pagination: {
    page: number,
    limit: number,
    total: number,
    totalPages: number
  },
}
export interface IAccountsRecieveableDetail {

  data: GroupedInvoices[],
  totalDueAmount: number,
  totalAmountWithTax: number,
  total: number
  pagination: {
    page: number,
    limit: number,
    total: number,
    totalPages: number
  },
}
export type ReminderTemplateType = 'before' | 'after' | 'on_due';
export type ReminderFrequency = 'once' | 'daily' | 'weekly' | 'custom';

export interface IInvoiceReminderTemplate {
  _id?: string;
  templateType: ReminderTemplateType;
  name: string;
  subject: string;
  htmlContent: string;
  isActive: boolean;
  // Scheduling configuration
  daysBeforeDue?: number;
  daysAfterDue?: number;
  frequency: ReminderFrequency;
  customIntervalDays?: number;
  maxReminders?: number;
  sendTime?: string;
  companyId: string;
  ownerAdminId: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ITrialBalanceReport {

  result: [
    {
      _id: string,
      name: string,
      totalCredits: number,
      totalDebits: number,
      endingBalance: number,
      totalAmount: number
    }

  ],
  totals: {
    _id: string,
    totalCredits: number,
    totalDebits: number,
    endingBalance: number,
    totalAmount: number
  }
}

interface Account {
  _id: string;
  name: string;
  payments: {
    "date": Date,
    "id": string,
    "type": ReferenceType,
    "debit": number,
    "credit": number,
    "amount": number
  }[];
  totalCredits: number;
  totalDebits: number;
  endingBalance: string;
}

export interface IGeneralLedgerReport {
  result: Account[];
  totals: {
    totalCredits: number;
    totalDebits: number;
    endingBalance: string;
  };
}

// ======================================================
// CHILD ACCOUNT DATA
// ======================================================

export interface IBalanceSheetData {
  _id: string;
  name: string;
  masterType: masterType;
  typeId?: string;
  type: AccountCategoryType;
  normalBalanceSide: NormalBalanceSide;
  endingBalance: number;
  totalCredits: number;
  totalDebits: number;
}

// ======================================================
// GROUPED ACCOUNT TYPE DATA
// ======================================================

export interface IBalanceSheetGroup {
  _id: string;
  name: string;
  type: AccountCategoryType;
  typeId?: string;
  masterType: masterType;
  normalBalanceSide: NormalBalanceSide;
  data: IBalanceSheetData[];
  totalCredits: number;
  totalDebits: number;
  endingBalance: number;
}

// ======================================================
// TOTALS
// ======================================================

export interface IBalanceSheetTotals {
  TotalAssets: number;
  TotalLiabilities: number;
  TotalEquity: number;
  TotalLiabilitiesAndEquity: number;
}

// ======================================================
// FINAL REPORT
// ======================================================

export interface BalanceSheetData {
  Assets: IBalanceSheetGroup[];
  Liabilities: IBalanceSheetGroup[];
  Equity: IBalanceSheetGroup[];
  totals: IBalanceSheetTotals;
}


export interface FilterResponseData {
  data: {
    carrier_operation_list: string[];
    operating_status_list: string[],
  };
  success: boolean
}