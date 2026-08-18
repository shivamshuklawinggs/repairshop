import * as yup from 'yup';
// Yup validation schema
export const TaxSchema = yup.object().shape({
    label: yup.string().required('Label is required'),
    value: yup.number().min(1).max(100).required('Value is required'),
    ChartOfAccountId: yup.string().required('Chart Of Account is required'),
    _id: yup.string().optional(),
  });
