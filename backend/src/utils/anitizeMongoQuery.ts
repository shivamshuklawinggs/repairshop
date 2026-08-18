import { Types } from "mongoose";

// src/utils/sanitizeMongoQuery.ts
export const sanitizeObjectId = (id: string): Types.ObjectId | null => {
  if (!Types.ObjectId.isValid(id)) return null;
  return new Types.ObjectId(id);
};

