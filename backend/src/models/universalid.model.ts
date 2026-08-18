import mongoose, { Schema, Types } from "mongoose";
import { commonSchemaOptions } from "./shared/schemas";
export const PrefixTypeData = ['TAX-', 'BAL-', 'BILL-', 'PAYMENT-', 'CUSTOMER-', 'INVOICE-', 'PL-', 'PS-', 'VENDOR-', 'CARRIER-', 'UNKNOWN-', 'JE-', 'CN-', 'DN-'] as const
export type PrefixType = typeof PrefixTypeData[number]

const CounterSchema = new mongoose.Schema({
  prefix: { type: String, required: true, immutable: true },
  companyId: {
    type: Schema.Types.ObjectId,
    required: [true, "Please Add Company"],
    ref: "companies", immutable: true
  },
  seq: { type: Number, default: 0 }
}, {
  ...commonSchemaOptions,
  collection: "counters"
});

CounterSchema.index({ prefix: 1, companyId: 1 }, { unique: true });
const Counter = mongoose.model("counters", CounterSchema);
// generator function - increments the counter
async function generateUniqueId({prefix,session,companyId}: {prefix: PrefixType, session?: mongoose.ClientSession,companyId:Types.ObjectId}): Promise<string> {
  const counter = await Counter.findOneAndUpdate(
    { prefix,companyId },
    {
      $inc: { seq: 1 },
      $setOnInsert: { prefix,companyId } 
    },
    { new: true, upsert: true ,session:session }
  )
  return `${prefix}${counter.seq}`;
}


// peek function - returns next number WITHOUT incrementing
async function peekNextUniqueId({prefix,session,companyId}: {prefix: PrefixType, session?: mongoose.ClientSession,companyId:Types.ObjectId}): Promise<string> {
  let counter = await Counter.findOne({ prefix,companyId }).session(session || null);
  if(counter){
    return `${prefix}${(counter?.seq)+ 1}`;
  }else if(!counter){
    return `${prefix}${1}`;
  }
  return "Unknknokn"
}
export const generateBulkIds = async ({
  prefix,
  count,
  session,
}: {
  prefix: string;
  count: number;
  session?: any;
}): Promise<string[]> => {
  const counter = await Counter.findOneAndUpdate(
    { prefix },
    { $inc: { seq: count } }, // 🔥 increment by total needed
    { new: true, upsert: true, session }
  );

  const start = counter.seq - count + 1;

  const ids: string[] = [];

  for (let i = 0; i < count; i++) {
    ids.push(`${prefix}${start + i}`);
  }

  return ids;
};
export { generateUniqueId, peekNextUniqueId }
export default Counter;
