import  * as Yup from 'yup'

export const createCompanyServiceSchema=Yup.object({
    label: Yup.string().required('Name is required'),
  description: Yup.string().default('').optional(),
  signature: Yup.string().default('').optional(),
  type: Yup.string().oneOf(['BROKER', 'DISPATCH','REPAIR']).required('Type is required'),
  color: Yup.string().required('Color is required'),
  prefix: Yup.string().required('Color is required'),
  mcNumber: Yup.string().label('MC Number').when("type", {
    is: (type: string) => type === 'BROKER' || type === 'DISPATCH',
    then: (schema) => schema.required('MC Number is required for Broker or Dispatch'),
    otherwise: (schema) => schema.optional().default(''),
  }),
  usdot: Yup.string().label('Usdot Number').when("type", {
    is: (type: string) => type === 'BROKER' || type === 'DISPATCH',
    then: (schema) => schema.required('Usdot Number is required for Broker or Dispatch'),
    otherwise: (schema) => schema.optional().default(''),
  }),
  termsandconditions: Yup.string().required("Terms and conditions is required"),
  physicalDetails:Yup.mixed(),
  billingDetails:Yup.mixed(),

})
