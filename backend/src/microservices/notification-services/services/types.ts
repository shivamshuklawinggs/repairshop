import { Types } from "mongoose";

export interface ProductServiceReminderPayload {
  productServiceId:Types.ObjectId;
  userId:Types.ObjectId
}

