import * as yup from 'yup';
export const paymentTermSchema = yup.object().shape({
  name: yup.string().required('Name is required'),
  description: yup.string().default('').required('Description is required'),
  days: yup.number()
    .required('Days is required')
    .min(0, 'Days must be a positive number')
    .typeError('Days must be a number'),
    _id: yup.mixed().default(null).nullable().optional(),
});
export type PaymentTermFormData = yup.InferType<typeof paymentTermSchema>;
