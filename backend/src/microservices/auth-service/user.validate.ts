
import * as yup from 'yup';
import { Role } from './types';

const AuthRegisterSchema=yup.object().shape({
    name: yup.string()
       .required("Name is required")
       .min(3, "Name must be at least 3 characters long")
       .max(50, "Name must be at most 50 characters long"),
       email: yup.string().required("Email is required")
       .email("Email must be a valid email address")
       .max(100, "Email must be at most 100 characters long"),
       password: yup.string().required("Password is required")
       .min(8, "Password must be at least 8 characters long"),
       role: yup.string().oneOf(Object.values(Role), "Invalid role").required("Role is required")
       .min(1, "At least one role is required"),
        manager: yup.string()
           .label('Manager').optional(),
        
})
const AuthUpdateSchema = yup.object().shape({
  name: yup.string()
    .optional()
    .min(3, "Name must be at least 3 characters long")
    .max(50, "Name must be at most 50 characters long"),
  email: yup.string().optional()
    .email("Email must be a valid email address")
    .max(100, "Email must be at most 100 characters long"),
  password: yup.string().optional()
    .min(8, "Password must be at least 8 characters long"),
  phone: yup.string().optional()
    .min(10, "Phone must be at least 10 characters long")
    .max(10, "Phone must be at most 10 characters long"),
})
const AuthLoginSchema=yup.object().shape({
    email:yup.string().email().required('Email is required'),
    password:yup.string().required('Password is required')
})
const ForgtPasswordSchema=yup.object().shape({
    email:yup.string().email().required('Email is required')
})
const ResetPasswordSchema = yup.object().shape({
    token: yup.string().required('Token is required'),
    password: yup.string()
        .required('Password is required')
        .min(8, 'Password must be at least 8 characters long')
})

export {AuthRegisterSchema,AuthLoginSchema,ForgtPasswordSchema,ResetPasswordSchema,AuthUpdateSchema}

