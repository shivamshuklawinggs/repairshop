import * as yup from 'yup';
// Base fields common to both carrier and customer
export const baseEntityFields = {
  company: yup.string().required('Company is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  phone: yup.string().label('Phone NO').required('Phone No is Required')
    // .test('is-valid-phone', 'Invalid phone number', (value) => {
    //   if (!value) return true;
    //   return validPhoneNumber(value);
    // })
    ,
  paymentMethod: yup.string().optional(),
  paymentTerms: yup.string().optional(),
  documents: yup.array().default([]),
  deleteFiles: yup.array().of(yup.string()).optional(),
};

// Insurance liability schema (reused in both carrier and customer)
export const insuranceLiabilitySchema = {
  commercialGeneralLiability: yup.object().shape({
    issueDate: yup.date().label('Issue Date').max(new Date(), 'Issue Date must be today or in the past').optional(),
    expiryDate: yup.date().label('Expiry Date').min(new Date(), 'Expiry Date must be in the future').optional(),
    amount: yup.number().label('Amount').optional(),
  }).optional(),
  automobileLiability: yup.object().shape({
    issueDate: yup.date().label('Issue Date').max(new Date(), 'Issue Date must be today or in the past').optional(),
    expiryDate: yup.date().label('Expiry Date').min(new Date(), 'Expiry Date must be in the future').optional(),
    amount: yup.number().label('Amount').optional(),
  }).optional(),
  cargoLiability: yup.object().shape({
    issueDate: yup.date().label('Issue Date').max(new Date(), 'Issue Date must be today or in the past').optional(),
    expiryDate: yup.date().label('Expiry Date').min(new Date(), 'Expiry Date must be in the future').optional(),
    amount: yup.number().label('Amount').optional(),
  }).optional(),
};
export const contactPersonSchema = yup.object({
  name: yup.string().trim().required("Contact person name is required"),
  email: yup
    .string()
    .trim()
    .email("Invalid email")
    .nullable()
    .notRequired(),
  extentionNo: yup.string().trim().nullable().notRequired(),
  phone: yup.string().trim().nullable().notRequired(),
});
const OpddressSchema = yup.object({
  address: yup.string().optional(),
  city: yup.string().optional(),
  state: yup.string().optional(),
  zipCode: yup.string().optional(),
  country: yup.string().optional(),
});

// Address schema (reused in both carrier and customer)
export const optionaladdressSchema = {
  billingAddress: OpddressSchema.notRequired(),
  shippingAddress: OpddressSchema.notRequired(),
};
// Address schema (reused in both carrier and customer)
export const addressSchema = {
  billingAddress: yup.object().shape({
    address: yup.string().required('Billing Address is required'),
    city: yup.string().required('Billing City is required'),
    state: yup.string().required('Billing State is required'),
    zipCode: yup.string().required('Billing Zip Code is required'),
    country: yup.string().required('Billing Country is required'),
  }),
  shippingAddress: yup.object().shape({
    address: yup.string().required('Shipping Address is required'),
    city: yup.string().required('Shipping City is required'),
    state: yup.string().required('Shipping State is required'),
    zipCode: yup.string().required('Shipping Zip Code is required'),
    country: yup.string().required('Shipping Country is required'),
  }),
};
// Truck Details schema (reused in both carrier and customer)
export const truckSchema = {
  truckDetails: yup.object().shape({
    vinNumber: yup
      .string()
      .label('VIN No')
      .transform((value) => (value ? String(value).toUpperCase().trim() : value))
      .matches(/^[A-HJ-NPR-Z0-9]{17}$/i, { message: 'VIN No must be exactly 17 characters', excludeEmptyString: true })
      .required(),
    licenseNumber: yup.string().required('license Number  is required'),
  }),
};

// Agent/Insurer fields (reused in both carrier and customer)
export const agentInsurerFields = {
  insurerCompany: yup.string().label('Insurer Company').optional(),
  agentName: yup.string().label('Agent Name').optional(),
  agentAddress: yup.string().label('Agent Address').optional(),
  agentEmail: yup.string().label('Agent Email').optional(),
  agentPhoneNumber: yup.string()
    .label('Agent Phone Number')
    // .test('is-valid-phone', 'Invalid agent Phone number', (value) => {
    //   if (!value) return true;
    //   return validPhoneNumber(value);
    // })
    .optional(),
};

// Entity details fields populated from USDOT lookup
export const entityDetailsFields = {
  entityDetails: yup.object().shape({
    entity_type: yup.string().optional(),
    dba_name: yup.string().optional(),
    legal_name: yup.string().optional(),
    operating_status: yup.string().optional(),
    physical_address: yup.string().optional(),
    mailing_address: yup.string().optional(),
    carrier_operation: yup.array().of(yup.string()).optional(),
    out_of_service_date: yup.string().optional(),
  }).optional(),
  withoutUsdot: yup.boolean().optional(),
};

// Accounting contact fields (reused in both carrier and customer)
export const accountingContactFields = {
  nickName: yup.string().optional(),
  displayCustomerName: yup.string().required('Display Customer Name is required'),
  mobileNo: yup.string()
    // .test('is-valid-phone', 'Invalid Mobile Phone number', (value) => {
    //   if (!value) return true;
    //   return validPhoneNumber(value);
    // })
    .optional(),
  fax: yup.string().optional(),
  other: yup.string().optional(),
  website: yup.string().url('Invalid URL').optional(),
  nameToPrintOnCheck: yup.string().optional(),
  isSubCustomer: yup.boolean().optional(),
  parentCustomer: yup.string().nullable().optional(),
  notes: yup.string().optional(),
  status: yup.string().optional(),
  sameAsBillingAddress: yup.boolean().optional(),
};
