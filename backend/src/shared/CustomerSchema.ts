
import * as yup from 'yup';
import { baseEntityFields, insuranceLiabilitySchema, addressSchema,optionaladdressSchema, agentInsurerFields, accountingContactFields, entityDetailsFields, contactPersonSchema, truckSchema } from './CommonSchema';

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
  contactPersons:yup
    .array()
    .of(contactPersonSchema)
    .default([])
    .notRequired(),
  isSubCustomer: yup.boolean().optional(),
  parentCustomer: yup.string().optional().test('valid-objectId', 'Invalid parent customer ID', function(value) {
    if (!value) return true; // Optional field
    return /^[0-9a-fA-F]{24}$/.test(value);
  }),
  ...agentInsurerFields,
  ...insuranceLiabilitySchema,
  ...entityDetailsFields,
  ...optionaladdressSchema,
};



// Freight/Operations customer schema (without accounting fields)
const freightCustomerSchema = yup.object().shape({
  ...baseCustomerFields,
  ...freightCustomerFields,
});

// Accounting customer schema (without freight fields)
const accountingCustomerSchema = (isRepairCompany: boolean) => {
  return yup.object().shape({
    ...baseCustomerFields,
    ...accountingContactFields,
    ...(!isRepairCompany ? addressSchema : {}),
    ...(isRepairCompany ? truckSchema : {}),
  })
}
export { freightCustomerSchema, accountingCustomerSchema };
