import { IUser, Role } from '@/types';
import * as Yup from 'yup';


const Userschema = Yup.object().shape({
  isUpdate: Yup.boolean().default(false),
  name: Yup.string()
    .label('Full Name')
    .required('Please enter your full name')
    .min(2, 'Name must be at least 2 characters long')
    .matches(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
  email: Yup.string()
    .label('Email Address')
    .email('Please enter a valid email address (e.g. user@example.com)')
    .required('Email address is required for registration'),
  password: Yup.string()
    .label('Password')
    .when('isUpdate', {
      is: false,
      then: (schema) => schema.required('Please create a password').min(8, 'Password must contain at least 8 characters'),
      otherwise: (schema) => schema.optional(),
    }),
    phone: Yup.string()
    .required("Phone is required")
    .matches(/^[0-9]{10}$/, "Phone must be a valid 10-digit number"),
  extentionNo:Yup.string().nullable().optional(),

  repeatPassword: Yup.string()
    .label('Confirm Password')
    .when('isUpdate', {
      is: false,
      then: (schema) => schema.required('Please confirm your password').oneOf([Yup.ref('password')], 'Both passwords must match'),
      otherwise: (schema) => schema.optional(),
    }).when("password", {
      is: (password: string) => password !== '',
      then: (schema) => schema.required('Please confirm your password').oneOf([Yup.ref('password')], 'Both passwords must match'),
      otherwise: (schema) => schema.optional(),
    }),
  role: Yup.string()
    .label('User Role')
    .oneOf(Object.values(Role))
    .required('Please select a role'),
  manager: Yup.string()
    .label('Manager').optional().nullable(),
  visibleCompany: Yup.array().of(Yup.string()).optional().when('role', {
    is: (role: string) => role === Role.ACCOUNTANT,
    then: (schema) => schema.required('Visible company is required')
  }),
});
export const MenuTitles={
  dashboard:"Dashboard",
  customers:"Customers",
  carriers:"Carriers",
  documents:"Documents",
  accounting:"Accounting"
}
const defaulUsertValues:IUser = {
  isUpdate:false,
  
   phone: '',
  extentionNo: '',
  name: '', // Default name
  email: '', // Default email
  password: '', // Default password (ensure this is more secure in production)
  repeatPassword: '', // Default repeat password
  role: "" as Role, // Default role
  manager: null, // Default manager
};

export { Userschema, defaulUsertValues }
