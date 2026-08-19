import { ModelName } from "models";

const FIELD_LABELS: Record<string, string> = {
  // Common Fields (Audit & Timestamps)
  createdAt: "Created At",
  updatedAt: "Updated At",
  createdBy: "Created By",
  updatedBy: "Updated By",
  companyId: "Company ID",
  "truckDetails.vinNumber":"Vin Number",
  "truckDetails.licenseNumber":"license Number",
  // Common Contact Fields
  name: "Name",
  email: "Email",
  phone: "Phone",
  extentionNo: "Extension Number",

  // Carrier Model
  company: "Company",
  contactPerson: "Contact Person",
  alternatphone: "Alternate Phone",
  address: "Address",
  rate: "Rate",
  zipCode: "Zip Code",

  // Customer Model
  testing: "Testing",
  vendorId: "Vendor",
  state: "State",
  mcNumber: "MC Number",
  usdot: "USDOT",
  entity_type: "Entity Type",
  dba_name: "DBA Name",

  // Driver Model
  isActive: "Is Active",
  file: "File",

  // Invoice Model
  carrier: "Vendor",
  // PaymentTerms Model
  days: "Days",
  description: "Description",

  // User Model
  password: "Password",
  visibleCompany: "Visible Company",
  role: "Role",
  isBlocked: "Is Blocked",
  manager: "Manager",
  ActivePlan: "Active Plan",

  // Company Model
  label: "Label",
  type: "Type",
  prefix: "Prefix",
  logo: "Logo",
  termsandconditions: "Terms and Conditions",
  color: "Color",

  // Expense Fees Model
  value: "Value",

  // Tax Model
  ChartOfAccountId: "Chart Of Account ID",
  id: "ID",

  // Journal Entry Model
  journalDate: "Journal Date",
  deleted: "Deleted",
  journalNumber: "Journal Number",
  entries: "Entries",
  memo: "Memo",
  attachments: "Attachments",
  totalDebit: "Total Debit",

  // Note Model
  note: "Note",

  // Notification Model
  message: "Message",
  isRead: "Is Read",
  UserId: "User ID",
  expenseId: "Expense ID",

  // Parent Account Type Model
  masterType: "Master Type",
  desc: "Description",
  subLevel: "Sub Level",
  typeId: "Type ID",
  typeMnemonic: "Type Mnemonic",
  typeEnumName: "Type Enum Name",
  detailTypeId: "Detail Type ID",
  detailType: "Detail Type",
  detailTypeMnemonic: "Detail Type Mnemonic",
  detailTypeEnumName: "Detail Type Enum Name",
  journalCodeTypeId: "Journal Code Type ID",

  // Chart Of Accounts Model
  accountType: "Account Type",
  isSubAccount: "Is Sub Account",
  AccountId: "Parent Account ID",
  chartOfAccountNumber: "Chart Of Account Number",
};
const ModalNamesFields: Record<ModelName, string> = {
  'companies': "Company",
  'User': "User",
  'accountsinvoices': "Invoice",
  'vendorbills': "Bill",
  'estimates': "Estimate",
  'Customer': "Customer",
  'Carrier': "Carrier",
  'accountspayments': "Payments",
  'PaymentTerms': "PaymentTerms",
  'taxservices': "Tax Rate",
  'Report': "Report",
  'JournalEntry': "Journal Entry",
  'chartofaccounts': "Chart Of Account",
  'accountdetailtypes': "Account Detail Types",
  'Accounttypes': "Account Types",
  'productservices': "Product Service",
  'Plan': "User Plan",
  "Note": "Note", "Notifications": "Notifications",
  "ledgertransactions": "Ledger Transactions",
  "InvoiceReminderTemplate": "Invoice Reminder Template"
}
export { ModalNamesFields, FIELD_LABELS }
export default FIELD_LABELS;