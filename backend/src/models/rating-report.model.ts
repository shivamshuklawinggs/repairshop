import { IFile } from "types/file";
import mongoose, { Schema,Document } from "mongoose";
import { commonSchemaOptions } from "./shared/schemas";
import { deleteGuardPlugin } from "./plugins/deleteGuard.plugin";
import { existsValidator } from "./shared/existsValidator";

export type ReportType =  'warning' | 'issue' | 'complaint';
export const REPORT_TYPES: ReportType[] = ['warning','issue','complaint'];

export interface IComment extends Document {
  text: string;
  customerId: mongoose.Types.ObjectId;
  carrierId: mongoose.Types.ObjectId;
  driverId: mongoose.Types.ObjectId;
  file?: IFile;
  incidentDate: Date;
  type: ReportType;
  createdBy: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const RatingSchema: Schema<IComment> = new Schema({
  text: { type: String, trim: true },
  customerId: {
    type: Schema.Types.ObjectId, ref: 'Customer', required: false, immutable: true, validate: {
      validator: existsValidator(
        (_ctx, value) => ({
          _id: value,
          
        }),
        "Customer"
      ),
      message: "Customer is not associated with this Company"
    },
  },
  carrierId: { type: Schema.Types.ObjectId, ref: 'Carrier', required: false,immutable: true,validate: {
      validator: existsValidator(
        (_ctx, value) => ({
          _id: value,
          
        }),
       "Carrier"
      ),
      message: "Carrier is not associated with this Company"
    }, },
  driverId: {
    type: Schema.Types.ObjectId, ref: 'Driver', required: false, immutable: true, validate: {
      validator: existsValidator(
        (_ctx, value) => ({
          _id: value,
          
        }),
        "Driver"
      ),
      message: "Driver is not associated with this Company"
    },
  },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true ,immutable:true},
  file: { type: Object, required: false },

  incidentDate: { type: Date, required: true },
  type: { type: String, enum: REPORT_TYPES, required: true },
}, {
   ...commonSchemaOptions,
});
// Rating Report Schema
RatingSchema.index({ customerId: 1 });
RatingSchema.index({ carrierId: 1 });
RatingSchema.index({ driverId: 1 });
RatingSchema.index({ createdBy: 1 });
RatingSchema.plugin(deleteGuardPlugin, { modelName: "Report" });
const ReportModel = mongoose.model('Report', RatingSchema);
export { RatingSchema };
export default ReportModel
