
import { Types } from "mongoose";

export type EntityType = "driver" | "carrier" | "customer";

export interface RatingSummary {
  stars: number;
  score: number;
}
export interface interfaceRatingUpdate {
  entityType: EntityType;
  entityId: Types.ObjectId;
}
export interface PaymentSummaryResult {
  totalPaid: number;
  totalUnPaid: number;
  onTimePayments: number;
  latePayments: number;
  partial_late: number;
  overdue: number;
}

const defaultSummary: PaymentSummaryResult = {
  totalPaid: 0,
  totalUnPaid: 0,
  onTimePayments: 0,
  latePayments: 0,
  partial_late: 0,
  overdue: 0,
};
export {defaultSummary}