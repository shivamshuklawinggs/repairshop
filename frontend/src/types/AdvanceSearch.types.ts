import { InvoiceResponse, VendorInvoiceResponse } from "."

export interface PaginationInfo {
  currentPage: number
  totalPages: number
  limit: number
  hasNext: boolean
  hasPrev: boolean
}

export  interface AdvanceSearchType {
  invoices: Invoices
  bills: Bills
  payments: Payments
  customers: Customers
  carriers: Carriers
  summary: Summary
}

 interface Invoices {
  data: InvoiceResponse[]
  count: number
  totalAmount: number
  pagination: PaginationInfo
}

 interface Bills {
  data: VendorInvoiceResponse[]
  count: number
  totalAmount: number
  pagination: PaginationInfo
}
 interface Payments {
  data: Daum3[]
  count: number
  totalAmount: number
  pagination: PaginationInfo
}

 interface Daum3 {
  _id: string
  invoiceIds: string[]
  billids: any[]
  amount: number
  settledAmount: number
  credits: number
  status: string
  paymentDate: string
  paymentMethod: string
  referenceNo: string
  depositTo: string
  companyId: string
  postingDate: string
  customerId: string
  createdBy: string
  updatedBy: string
  manager: string
  ownerAdminId: string
  PaymentType: string
  createdAt: string
  updatedAt: string
  customer: Customer2
  DespositeAccount: DespositeAccount
  type: string
}

 interface Customer2 {
  _id: string
  name: string
}

 interface DespositeAccount {
  _id: string
  name: string
}

 interface Customers {
  data: Daum4[]
  count: number
  pagination: PaginationInfo
}

 interface Daum4 {
  _id: string
  autoScore: number
  stars: number
  testing: boolean
  company: string
  nickName: string
  email: string
  phone: string
  address: string
  state: string
  paymentMethod: string
  documents: any[]
  createdBy: string
  updatedBy: string
  companyId: string
  status: string
  id: string
  withoutUsdot: boolean
  manager: string
  ownerAdminId: string
  createdAt: string
  updatedAt: string
  accountinvoices: any[]
  totalAmountWithTax: number
  totalTaxAmount: number
  balanceDue: number
}

 interface Carriers {
  data: Daum6[]
  count: number
  pagination: PaginationInfo
}

 interface Daum6 {
  _id: string
  autoScore: number
  stars: number
  company: string
  email: string
  usdot: string
  manager: string
  ownerAdminId: string
  phone: string
  status: string
  alternatphone: string
  address: string
  mcNumber: string
  entityDetails: EntityDetails2
  rate: number
  companyId: string
  createdBy: string
  updatedBy: string
  powerunit: string[]
  trailer: string[]
  documents: Document2[]
  id: string
  withoutUsdot: boolean
  createdAt: string
  updatedAt: string
  state: string
  zipCode: string
  accountinvoices: Accountinvoice[]
  totalAmountWithTax: number
  totalTaxAmount: number
  balanceDue: number
  billingAddress: BillingAddress3
  shippingAddress: ShippingAddress3
  paymenttermsdata: string
}

 interface EntityDetails2 {
  carrier_operation: any[]
}

 interface Document2 {
  fieldname: string
  originalname: string
  encoding: string
  mimetype: string
  destination: string
  filename: string
  path: string
  size: number
}

 interface InsuranceDocument2 {
  fieldname: string
  originalname: string
  encoding: string
  mimetype: string
  destination: string
  filename: string
  path: string
  size: number
}

 interface CommercialGeneralLiability2 {
  issueDate: string
  expiryDate: string
  amount: number
}

 interface AutomobileLiability2 {
  issueDate: string
  expiryDate: string
  amount: number
}

 interface CargoLiability2 {
  issueDate: string
  expiryDate: string
  amount: number
}

 interface Accountinvoice {
  _id: any
  totalAmountWithTax: number
  totalTaxAmount: number
  balanceDue: number
}

 interface BillingAddress3 {
  address: string
  state: string
  zipCode: string
}

 interface ShippingAddress3 {
  address: string
  state: string
  zipCode: string
}

 interface Summary {
  totalRecords: number
  totalFinancialAmount: number
  limit: number
  filters: Filters
  sortBy: string
  sortOrder: string
}

 interface Filters {
  sortOrder: string
}
