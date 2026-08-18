import * as yup from 'yup';

export const chartAccountSchema = yup.object().shape({
  name: yup.string().required('Name is required'),
  accountType: yup.string().required('Account type is required'),
  detailType: yup.string().required('Detail type is required'),
  isSubAccount: yup.boolean().default(false),
  AccountId: yup.mixed().nullable().optional(),

  description: yup.string().default(''),
  _id: yup.mixed().default(null).nullable().optional(),
});