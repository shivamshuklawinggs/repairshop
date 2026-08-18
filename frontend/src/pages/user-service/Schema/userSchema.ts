import { IUser, Role } from '@/types';
import * as Yup from 'yup';

const permissionSchema = Yup.object().shape({
  create: Yup.boolean().default(false).optional(),
  delete: Yup.boolean().default(false).optional(),
  update: Yup.boolean().default(false).optional(),
  view: Yup.boolean().default(false).optional(),
  import: Yup.boolean().default(false).optional(),
  export: Yup.boolean().default(false).optional(),
});

const menuPermissionObjectSchema = Yup.object().shape({
  permissions: permissionSchema
});

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
      then: (schema) => schema.required('Please create a password').min(6, 'Password must contain at least 6 characters')
      .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .matches(/[0-9]/, 'Password must contain at least one number'),
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
    is: (role: string) => role === Role.MANAGER,
    then: (schema) => schema.required('Visible company is required for manager')
  }),
  menuPermission: Yup.object().shape({
    customers: menuPermissionObjectSchema,
    carriers: menuPermissionObjectSchema,
    documents: menuPermissionObjectSchema,
  }).when('role', {
    is: (role: string) => role === Role.MANAGER || role === Role.ACCOUNTANT,
    then: (schema) => schema.required("Menu permission is required for the selected role")
  })
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
  menuPermission:{
    customers: { permissions: { create: false, delete: false, update: false, view: false, import: false, export: false } },
    carriers: { permissions: { create: false, delete: false, update: false, view: false, import: false, export: false } },
    documents: { permissions: { create: false, delete: false, update: false, view: false, import: false, export: false } },
 },
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
