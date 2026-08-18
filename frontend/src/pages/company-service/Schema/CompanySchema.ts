import * as yup from 'yup';

export const CompanySchema = yup.object().shape({
  _id: yup.mixed().default(null).nullable().optional(),
   signature: yup.string().default('').optional(),
  label: yup.string().required('Name is required'),
  description: yup.string().default('').optional(),
  type: yup.string().oneOf(['BROKER', 'DISPATCH','REPAIR']).required('Type is required'),
  logo:yup.mixed().required("Logo is required"),
  color:yup.string().optional(),
  termsandconditions:yup.string().required("Terms and conditions is required"),
  physicalDetails: yup.object().shape({
    phone: yup.string().min(10).max(10).required().label("Physical Phone"),
    email: yup.string().email().required().label("Physical Eamil"),
    address: yup.string().required().label("Physical Address"),
  }),
  billingDetails: yup.object().shape({
    phone: yup.string().min(10).max(10).required().label("Biiling Phone"),
    email: yup.string().email().required().label("Biiling Email"),
    address: yup.string().required().label("Biiling Address"),
  }),
  prefix: yup.string().required('Color is required'),
  mcNumber: yup.string().label('MC Number').when("type", {
    is: (type: string) => type === 'BROKER' || type === 'DISPATCH',
    then: (schema) => schema.required('MC Number is required for Broker or Dispatch'),
    otherwise: (schema) => schema.optional().default(''),
  }),
  usdot: yup.string().label('Usdot Number').when("type", {
    is: (type: string) => type === 'BROKER' || type === 'DISPATCH',
    then: (schema) => schema.required('Usdot Number is required for Broker or Dispatch'),
    otherwise: (schema) => schema.optional().default(''),
  }),
});