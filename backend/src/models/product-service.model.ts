
import mongoose, { Schema, Document, Types } from 'mongoose';
import { commonSchemaOptions, CustomFieldsSchema } from './shared/schemas';
import { deleteGuardPlugin } from './plugins/deleteGuard.plugin';
import { reservedNamePlugin } from './plugins/reservedName.plugin';
import { existsValidator } from './shared/existsValidator';
// types.ts
export type CategoryType = 'inventory' | 'non inventory' | 'service';
export type IncomeAccountType = 'sales' | 'other income';
export type ExpenseAccountType = 'cogs' | 'discount' | 'other expense';
export type InventoryAccountType = 'inventory asset';

export interface IProductServiceData {
  category: Array<{ value: CategoryType; label: string }>;
}

export const ProductServiceData: IProductServiceData = {
  category: [
    { value: "inventory", label: "Inventory" },
    { value: "non inventory", label: "Non Inventory" },
    { value: "service", label: "Service" }
  ],
};// productService.model.ts


export interface IProductService extends Document {
  name: string;
  category: CategoryType;
  description: string;
  incomeAccount: mongoose.Types.ObjectId;
  expenseAccount: mongoose.Types.ObjectId;
  inventoryAccount?: mongoose.Types.ObjectId;
  OpeningStock: number;
  reorderStock: number;
  currentLevel: number;
  _id?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  companyId: Types.ObjectId;
  ProductRate: number;
  id: string;
  customFields?: Record<string, any>;
  manager?:Types.ObjectId,
  ownerAdminId: Types.ObjectId;
  isLoad?:boolean
}

// Helper functions to extract enum values
const getEnumValues = <T extends { value: string }>(items: T[]): string[] => 
  items.map(item => item.value);

const ProductServiceSchema: Schema<IProductService> = new Schema({
  name: { 
    type: String, 
    required: [true, "Name is required"],
    trim: true,
  },
  category: {
    type: String,
    required: [true, "Category is required"],
    enum: {
      values: getEnumValues(ProductServiceData.category),
      message: "Invalid category"
    }
  },
  description: {
    type: String,
    required: [true, "Description is required"],
    trim: true
  },
  incomeAccount: {
    type: Schema.Types.ObjectId,
    required: [true, "Income Account is required"],
    ref:"chartofaccounts",
      validate: {
      validator: existsValidator(
        (_ctx, value) => ({
          _id: value,
          
        }),
        "chartofaccounts"
      ),
      message: "Chart Of Account is not associated with this Company"
    },
  },
  expenseAccount: {
    type: Schema.Types.ObjectId,
    required: [true, "Expense Account is required"],
    ref:"chartofaccounts",
      validate: {
      validator: existsValidator(
        (_ctx, value) => ({
          _id: value,
          
        }),
        "chartofaccounts"
      ),
      message: "Chart Of Account is not associated with this Company"
    },
   
  },
  inventoryAccount: {
    type: Schema.Types.ObjectId,
    required: false,
    ref:"chartofaccounts",
    validate: {
      validator: existsValidator(
        (_ctx, value) => ({
          _id: value,
          
        }),
        "chartofaccounts"
      ),
      message: "Chart Of Account is not associated with this Company"
    },
  },
  OpeningStock: {
    type: Number,
    default:0,
  
  },
  reorderStock: {
    type: Number,
    default:0,
  },
  currentLevel: {
    type: Number,
    default:0,
  },
  ProductRate:{
    type: Number,
    default:0,
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please Add Created By'],
    immutable: true
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please Add Updated By']
  },
  companyId: {
    type: Schema.Types.ObjectId,
    ref: "companies",
    required: [true, 'Please Add Company Id'],
    immutable: true
  },
  id:{
    type: String,
    required: [true, 'Please Add Id'],
    immutable: true
  },
   manager: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    immutable: true,
    },
    ownerAdminId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    immutable: true,
    required:[true,"Owner admin id is reuired"]
    },
  customFields: {
    type: CustomFieldsSchema,
    default: {}
  },
  isLoad:{
    type:Boolean,
    default:false,
    immutable:true
  }
}, {
  ...commonSchemaOptions,
  collection:"productservices",
});

// Product Service Schema
ProductServiceSchema.index({ companyId: 1, name: 1 }, { unique: true });
ProductServiceSchema.index({ companyId: 1, id: 1 }, { unique: true });
ProductServiceSchema.index({ createdBy: 1 });
ProductServiceSchema.index({ companyId: 1 });
ProductServiceSchema.index({ incomeAccount: 1 });
ProductServiceSchema.index({ expenseAccount: 1 });
ProductServiceSchema.index({ inventoryAccount: 1 });
ProductServiceSchema.index({ category: 1 });
ProductServiceSchema.plugin(reservedNamePlugin, {
  reservedNames: ["Load"],
});
ProductServiceSchema.plugin(deleteGuardPlugin, {
  modelName: "productservices",
  protectedFields: [
    { field: "name", values: ["Load"] },
  ],
});
const ProductService = mongoose.model<IProductService>('productservices', ProductServiceSchema);

export { ProductServiceSchema };
export default ProductService;
