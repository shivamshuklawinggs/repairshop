import mongoose, { Schema, Document } from 'mongoose';
import { commonSchemaOptions } from './shared/schemas';

export interface INotes extends Document {
  _id?:Schema.Types.ObjectId;
  note: string;
  loadid:Schema.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  manager?:mongoose.Types.ObjectId,
  ownerAdminId: mongoose.Types.ObjectId
}

const NotesSchema: Schema<INotes> = new Schema({
  note: {type:String,required:[true,"Note is Required"]},
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    immutable: true
  },
  loadid: {
    type: Schema.Types.ObjectId,
    ref: 'Load',
    required:[true,"Load Id is Required"]
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
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
}, {
  ...commonSchemaOptions,
  collection:"notes",
});
const Notes = mongoose.model<INotes>('Notes', NotesSchema);

export default Notes
