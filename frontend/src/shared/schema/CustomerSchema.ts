import { PaymentMethods } from '@/types/enum';
import * as yup from 'yup';
import { ICustomer, OpraStatus } from '@/types';
import { baseEntityFields, insuranceLiabilitySchema, addressSchema,optionaladdressSchema, agentInsurerFields, accountingContactFields, entityDetailsFields, truckSchema } from './CommonSchema';

// Base fields common to both customer types (imported from CommonSchema)
const baseCustomerFields = baseEntityFields;

// Freight/Operations customer specific fields
const freightCustomerFields = {
  nickName: yup.string().optional(),
  usdot: yup.string().optional(),
  mcNumber: yup.string().optional().label("Mc Number"),
  alternatphone: yup.string()
    .label('Alternate Phone No')
    .optional()
    // .test('is-valid-phone', 'Invalid Alternate Phone No number', (value) => {
    //   if (!value) return true;
    //   return validPhoneNumber(value);
    // })
    .when('phone', {
      is: (value: string) => !value,
      then: (schema) => schema.required('Alternate Phone No is required'),
    }),
  extentionNo: yup.string().optional(),
  // address: yup.string().required('Address is required'),
  // city: yup.string().optional(),
  // state: yup.string().optional(),
  // zipCode: yup.string().optional(),
  vatNumber: yup.string().optional(),
  utrNumber: yup.string().optional(),
  contactPersons: yup.array().default([]).of(yup.object().shape({})),
  ...agentInsurerFields,
  ...insuranceLiabilitySchema,
  ...entityDetailsFields,
  ...optionaladdressSchema,
};


// Accounting customer schema (without freight fields)
const accountingCustomerSchema =  yup.object().shape({
    ...baseCustomerFields,
    ...accountingContactFields,
     ...truckSchema,
  })


// Default data for accounting customer
const defaultAccountingCustomerData: ICustomer = {
  company: '',
  email: '',
  autoScore: 100,
  stars: 5,
  phone: '',
  mobileNo: '',
  fax: '',
  other: '',
  website: '',
  notes: '',
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
  isSubCustomer: false,
  parentCustomer: undefined,
  documents: [],
  deleteFiles: [],
  truckDetails: {
    vinNumber: '',
    licenseNumber: ''
  },
};

export {  accountingCustomerSchema ,defaultAccountingCustomerData };
