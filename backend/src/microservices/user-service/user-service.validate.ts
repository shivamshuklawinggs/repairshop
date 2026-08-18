import { Role } from "microservices/auth-service/types"
import * as Yup from "yup"

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

const CreateuserSchema = Yup.object().shape({
  name: Yup.string()
    .required("Name is required")
    .min(3, "Name must be at least 3 characters long")
    .max(50, "Name must be at most 50 characters long"),
  phone: Yup.string()
    .required("Phone is required")
    .matches(/^[0-9]{10}$/, "Phone must be a valid 10-digit number"),
  extentionNo:Yup.string().nullable().optional(),
  email: Yup.string().required("Email is required")
    .email("Email must be a valid email address")
    .max(100, "Email must be at most 100 characters long"),
  password: Yup.string().required("Password is required")
    .min(8, "Password must be at least 8 characters long"),
  role: Yup.string().oneOf(Object.values(Role), "Invalid role").required("Role is required")
    .min(1, "At least one role is required"),
  manager: Yup.string()
    .label('Manager').optional(),
  visibleCompany: Yup.array().of(Yup.string()).optional().when('role', {
    is: (role: string) => role === Role.MANAGER,
    then: (schema) => schema.required('Visible company is required for manager')
  }),
  menuPermission: Yup.object().shape({
    dashboard: menuPermissionObjectSchema,
    documents: menuPermissionObjectSchema,
    accounting: menuPermissionObjectSchema,
    chart_of_accounts: menuPermissionObjectSchema,
    journal_entry: menuPermissionObjectSchema,
  }).when('role', {
    is: (role: string) => role === Role.MANAGER || role === Role.ACCOUNTANT,
    then: (schema) => schema.required(`Menu permission is required for the selected role`)
  })
})

const updateUserSchema = Yup.object().shape({
  name: Yup.string(),
   phone: Yup.string()
    .required("Phone is required")
    .matches(/^[0-9]{10}$/, "Phone must be a valid 10-digit number"),
  extentionNo:Yup.string().nullable().optional(),
  email: Yup.string().email("Email must be a valid email address"),
  password: Yup.string(),
  role: Yup.string().oneOf(Object.values(Role), "Invalid role"),
  manager: Yup.string()
    .label('Manager').optional(),
  visibleCompany: Yup.array().of(Yup.string()).optional().when('role', {
    is: (role: string) => role === Role.MANAGER,
    then: (schema) => schema.required('Visible company is required for manager')
  }),
  menuPermission: Yup.object().shape({
    dashboard: menuPermissionObjectSchema,
    customers: menuPermissionObjectSchema,
    carriers: menuPermissionObjectSchema,
    documents: menuPermissionObjectSchema,
    accounting: menuPermissionObjectSchema,
    chart_of_accounts: menuPermissionObjectSchema,
    journal_entry: menuPermissionObjectSchema,
  }).optional()
})
const ActiveUserSchema = Yup.object().shape({
  isActive: Yup.boolean().required("isActive is required"),
})
const BlockUserSchema = Yup.object().shape({
  isBlocked: Yup.boolean().required("isBlocked is required"),
})
export { CreateuserSchema, updateUserSchema, ActiveUserSchema, BlockUserSchema }