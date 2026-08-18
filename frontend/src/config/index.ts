const Production=import.meta.env.MODE==="production";
// const API_URL=
// import.meta.env.VITE_API_URL_PRODUCTION
const API_URL=Production?
import.meta.env.VITE_API_URL_PRODUCTION
:
import.meta.env.VITE_API_URL

// Define upload directories
const EXPENSE_UPLOAD_URL =API_URL+"uploads/expense/";
const CHECKOUT_UPLOAD_URL = API_URL+"uploads/checkout/";
const DRIVING_LICENSE_UPLOAD_URL = API_URL+"uploads/driving-license/";
const LOAD_UPLOAD_URL = API_URL+"uploads/loads/";
const INVOICE_UPLOAD_URL = API_URL+"uploads/invoice/";
const CARRIER_DOCUMENTS_UPLOAD_URL = API_URL+"uploads/carrier-documents/";
const CARRIER_INSURANCE_DOCUMENTS_UPLOAD_URL = API_URL+"uploads/carrier-insurance-documents/";
const CUSTOMER_INSURANCE_DOCUMENTS_UPLOAD_URL = API_URL+"uploads/customer-insurance-documents/";
const CUSTOMER_DOCUMENTS_UPLOAD_URL = API_URL+"uploads/customer-documents/";
const COMPANY_LOGO_UPLOAD_URL = API_URL+"uploads/company-logo/";
const JOURNAL_ENTRY_UPLOAD_URL = API_URL+"uploads/journal-entry/";
const dest={
    "load":LOAD_UPLOAD_URL,
    "customerinvoice":INVOICE_UPLOAD_URL,
    "driver":DRIVING_LICENSE_UPLOAD_URL,
    "carrierinsurance":CARRIER_INSURANCE_DOCUMENTS_UPLOAD_URL,
    "customerinsurance":CUSTOMER_INSURANCE_DOCUMENTS_UPLOAD_URL,
    "deliverycheckout":CHECKOUT_UPLOAD_URL,
    "pickupcheckout":CHECKOUT_UPLOAD_URL,
    "expense":EXPENSE_UPLOAD_URL,
    "companylogo":COMPANY_LOGO_UPLOAD_URL,
    "journalentry":JOURNAL_ENTRY_UPLOAD_URL
}
export {API_URL,EXPENSE_UPLOAD_URL,LOAD_UPLOAD_URL,INVOICE_UPLOAD_URL,CHECKOUT_UPLOAD_URL,DRIVING_LICENSE_UPLOAD_URL,CARRIER_DOCUMENTS_UPLOAD_URL,CUSTOMER_DOCUMENTS_UPLOAD_URL,COMPANY_LOGO_UPLOAD_URL,JOURNAL_ENTRY_UPLOAD_URL,CARRIER_INSURANCE_DOCUMENTS_UPLOAD_URL,CUSTOMER_INSURANCE_DOCUMENTS_UPLOAD_URL,dest,Production};
