
import * as yup from 'yup';
import { baseEntityFields, insuranceLiabilitySchema, addressSchema, agentInsurerFields, accountingContactFields, entityDetailsFields, contactPersonSchema, optionaladdressSchema } from './CommonSchema';
// Base fields common to both carrier types (imported from CommonSchema)
const baseCarrierFields = baseEntityFields;
// Freight/Operations carrier specific fields
const freightCarrierFields = {
  usdot: yup.string().label('USDOT').when('withoutUsdot', {
    is: true,
    then: (schema) => schema.optional().nullable().optional(),
    otherwise: (schema) => schema.required('USDOT is required'),
  }),
  mcNumber: yup.string().label('MC Number').required('MC Number is required'),
  // address: yup.string().label('Address').required('Address is required'),
  contactPersons:yup
    .array()
    .of(contactPersonSchema)
    .default([])
    .notRequired(),
  alternatphone: yup.string().optional()
  // .test('is-valid-phone', 'Invalid Alternate Phone No number', (value) => {
  //     if (!value) return true;
  //     return validPhoneNumber(value);
  //   })
    .label('Alternate Contact').when('phone', {
      is: (value: string) => !value,
      then: (schema) => schema.required('Alternate Phone No is required'),
    })
    ,
  extentionNo: yup.string().optional().label('Extension No'),
  rate: yup.number().label('Rate').required('Rate is required'),
  powerunit: yup.array().of(yup.string()).label('Power Unit').required('Power Unit is required'),
  trailer: yup.array().of(yup.string()).label('Trailer').required('Trailer is required'),
  isSubVendor: yup.boolean().optional(),
  parentVendor: yup.string().optional().test('valid-objectId', 'Invalid parent vendor ID', function(value) {
    if (!value) return true; // Optional field
    return /^[0-9a-fA-F]{24}$/.test(value);
  }),
  ...agentInsurerFields,
  ...insuranceLiabilitySchema,
  ...entityDetailsFields,
   ...optionaladdressSchema
};
// Accounting vendor specific fields
const accountingVendorFields = {
  ...accountingContactFields,
  ...addressSchema,
  rating: yup.string().optional(),
};

// Freight/Operations carrier schema
const carrierFormSchema = yup.object().shape({
  ...baseCarrierFields,
  ...freightCarrierFields,
});

// Accounting vendor schema
const vendorFormSchema = yup.object().shape({
  ...baseCarrierFields,
  ...accountingVendorFields,
});
export { carrierFormSchema, vendorFormSchema };
