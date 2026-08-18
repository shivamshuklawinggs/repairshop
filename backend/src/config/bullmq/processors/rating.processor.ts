import { Job } from "bullmq";
import { JOB_NAMES } from "../constants";
import { updateEntityRating } from "microservices/rating-services/rating.calulate";
import { Types } from "mongoose";

// Rating processors
export const ratingProcessors = {
  [JOB_NAMES.RATING.CARRIER]: async (job: Job) => {
    console.log(`🚀 [Rating Processor] Processing CARRIER rating job ${job.id}`, job.data);
    const { carrierId } = job.data as {
      carrierId: Types.ObjectId;
    };
    if (!carrierId) {
      console.warn(`⚠️ [Rating Processor] Missing required data for CARRIER job ${job.id}: carrierId=${carrierId}`);
      return;
    }
    try {
      await updateEntityRating({
        entityType: "carrier",
        entityId: carrierId,
      });
      console.log(`✅ [Rating Processor] CARRIER rating job ${job.id} completed successfully`);
      return { success: true };
    } catch (error) {
      console.error(`❌ [Rating Processor] CARRIER rating job ${job.id} failed:`, error);
      throw error;
    }
  },
  [JOB_NAMES.RATING.CUSTOMER]: async (job: Job) => {
    console.log(`🚀 [Rating Processor] Processing CUSTOMER rating job ${job.id}`, job.data);
    const { customerId } = job.data as {
      customerId: Types.ObjectId;
    };
    if (!customerId) {
      console.warn(`⚠️ [Rating Processor] Missing required data for CUSTOMER job ${job.id}: customerId=${customerId}`);
      return;
    }
    try {
      await updateEntityRating({
        entityType: "customer",
        entityId: customerId,
      });
      console.log(`✅ [Rating Processor] CUSTOMER rating job ${job.id} completed successfully`);
      return { success: true };
    } catch (error) {
      console.error(`❌ [Rating Processor] CUSTOMER rating job ${job.id} failed:`, error);
      throw error;
    }
  },
};
