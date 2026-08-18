import mongoose, { Schema, Document, Types } from 'mongoose';
import { IFile } from 'types/file';
import { commonSchemaOptions, FileSchema } from './shared/schemas';
import { deleteGuardPlugin } from './plugins/deleteGuard.plugin';
import { companyPlanLimitPlugin } from './plugins/company.plan.imit.plugin';
import validator from 'validator';
export type companyType = "BROKER" | "DISPATCH" | "REPAIR"
export interface IContactDetails {
  phone?: string;
  email?: string;
  address?: string;
}

export interface ICompany extends Document {
  label: string; 
  description:string; 
  type:companyType
  mcNumber?:string;
  usdot?:string;
  prefix:string;
  physicalDetails?: IContactDetails;
  billingDetails?: IContactDetails;
  logo?:IFile;
  termsandconditions?:string;
  color:string;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  signature?:string;
  manager?:Types.ObjectId,
  ownerAdminId:Types.ObjectId
  test:boolean
}

const ContactDetailsSchema = new Schema({
  phone: { 
    type: String, 
    required: false, 
    trim: true,
  },
  email: { 
    type: String, 
    required: false, 
    trim: true, 
    lowercase: true, 
    validate: {
      validator: function(v: string) {
        return !v || validator.isEmail(v);
      },
      message: 'Please provide a valid email'
    }
  },
  address: { type: String, required: false, trim: true }
}, { _id: false });

const CompanySchema: Schema<ICompany> = new Schema({
  label: { type: String, required: [true,'Name is required'] ,unique:true,trim:true}, 
  description:{type:String,required:false,trim:true},
  mcNumber:{type:String,required:false,trim:true},
  usdot:{type:String,required:false,trim:true},
  type:{type:String,enum:["BROKER","DISPATCH","REPAIR"],required:[true,'Type is required']},
  color:{type:String,required:false ,default:"#C2410C"},
  physicalDetails: { type: ContactDetailsSchema, required: false },
  billingDetails: { type: ContactDetailsSchema, required: false },
  prefix:{type:String,required:false,trim:true},
  signature:{type:String,required:false,trim:true},
  logo:FileSchema,
  termsandconditions:{type:String,required:false,trim:true},
  createdBy:{
    type: Schema.Types.ObjectId,
    ref: 'User',
    required:[true,'Please Add Created By'],
    immutable: true,
  },
  updatedBy:{
    type: Schema.Types.ObjectId,
    ref: 'User',
    required:[true,'Please Add Updated By']
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
  test:{
    type:Boolean,
    default:false
  }
}, {
  ...commonSchemaOptions,
  collection:"companies"
});
CompanySchema.pre<ICompany>('save', async function (next) {
try{

  if(!this.usdot) {
    this.usdot = undefined
  }
  if(!this.mcNumber) {
    this.mcNumber = undefined
  }
  next();
}
catch(err){
  console.warn(err)
}
})
CompanySchema.index({ createdBy: 1 });
// create a index for usdot and companyId
CompanySchema.index(
  { usdot: 1 },
  { 
    unique: true,
    partialFilterExpression: { usdot: { $type: "string" } }
  }
);
CompanySchema.index(
  {  mcNumber: 1 },
  { 
    unique: true,
    partialFilterExpression: { mcNumber: { $type: "string" } }
  }
);
CompanySchema.plugin(companyPlanLimitPlugin);
CompanySchema.plugin(deleteGuardPlugin, {
  modelName: "companies",
  protectedFields: [
    {
      field: "test",
      values: [true],
      message: "Testing Company cannot deleted",
    },
  ],
});
export { CompanySchema };
export default mongoose.model<ICompany>('companies', CompanySchema);
