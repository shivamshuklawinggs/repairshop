import { ProductServiceData,CategoryType } from '@/data/ProductServiceData';
import * as yup from 'yup';

// Yup validation schema
export const ProductServiceSchema = yup.object().shape({
    name: yup.string().label('Name').required('Name is required'),
    isUpdate:yup.boolean().default(false),
    category: yup.string().label('Category').oneOf(ProductServiceData.category.map((item) => item.value), 'Invalid category').required('Category is required'),
    description: yup.string().label('Description').required('Description is required'),
    incomeAccount: yup.string().label('Income Account').required('Income Account is required'),
    expenseAccount: yup.string().label('Expense Account').required('Expense Account is required'),
    OpeningStock: yup.number().optional().default(0).label('Opening Stock').transform((value)=>value || 0),
    currentLevel: yup.number().optional().default(0).label('Current Level').transform((value)=>value || 0),
    inventoryAccount: yup.string().label('Inventory Account').when('category', {
      is: (category:CategoryType) => category !== 'inventory',
      then: (schema) =>schema.optional(),
      otherwise: (schema) =>schema.required('Inventory account is required'),
    }),
    reorderStock: yup.number().optional().default(0).label('Reorder Stock Notification').transform((value)=>value || 0),
    ProductRate: yup.number().optional().default(0).label('Product Rate').transform((value)=>value || 0),
  });