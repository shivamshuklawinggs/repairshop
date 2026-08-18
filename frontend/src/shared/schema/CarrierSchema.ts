import { PaymentMethods } from '@/types/enum';
import * as yup from 'yup';
import { ICarrier, OpraStatus } from '@/types';
import { baseEntityFields, insuranceLiabilitySchema, addressSchema, agentInsurerFields, accountingContactFields, entityDetailsFields, optionaladdressSchema } from './CommonSchema';

// Base fields common to both carrier types (imported from CommonSchema)
const baseCarrierFields = baseEntityFields;
// Accounting vendor specific fields
const accountingVendorFields = {
  ...accountingContactFields,
  ...addressSchema,
  rating: yup.string().optional(),
};


// Accounting vendor schema
const vendorFormSchema = yup.object().shape({
  ...baseCarrierFields,
  ...accountingVendorFields,
});

// Default data for accounting vendor
const defaultVendorData: ICarrier = {
  company: '',
  email: '',
  extentionNo: '',
  mcNumber: '',
  usdot: '',
  alternatphone: '',
  address: '',
  autoScore: 100,
  stars: 5,
  phone: '',
  mobileNo: '',
  fax: '',
  other: '',
  website: '',
  notes: '',
  rating: '',
  billingAddress: {
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: ''
  },
  shippingAddress: {
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: ''
  },
  sameAsBillingAddress: false,
  nameToPrintOnCheck: '',
  displayCustomerName: '',
  paymentMethod: PaymentMethods.NA,
  paymentTerms: '',
  isSubVendor: false,
  parentVendor: undefined,
  documents: [],
  deleteFiles: [],
};

export {  vendorFormSchema ,defaultVendorData };
