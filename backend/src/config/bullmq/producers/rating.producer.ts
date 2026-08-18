import {
  QUEUE_NAMES,
  JOB_NAMES,
  JOB_PRIORITIES,
  JOB_DELAYS,
} from "../constants";
import { bullMQService } from "../bullmq.service";
import { Types } from "mongoose";

// Rating job producers
export const ratingProducers = {
  carrierRated: (
    payload: { carrierId: Types.ObjectId;},
    options?: { delay?: number; priority?: number },
  ) => {
    console.log(`📋 [Rating Producer] Adding CARRIER rating job`, { payload, options });
    return bullMQService.addJob(
      QUEUE_NAMES.RATING,
      JOB_NAMES.RATING.CARRIER,
      payload,
      {
        delay: options?.delay ?? JOB_DELAYS.IMMEDIATE,
        priority: options?.priority ?? JOB_PRIORITIES.HIGH,
      },
    ).then((job) => {
      console.log(`✅ [Rating Producer] CARRIER rating job added successfully with ID: ${job?.id}`);
      return job;
    }).catch((error) => {
      console.error(`❌ [Rating Producer] Failed to add CARRIER rating job:`, error);
      throw error;
    });
  },
  customerRated: (
    payload: { customerId: Types.ObjectId;},
    options?: { delay?: number; priority?: number },
  ) => {
    console.log(`📋 [Rating Producer] Adding CUSTOMER rating job`, { payload, options });
    return bullMQService.addJob(
      QUEUE_NAMES.RATING,
      JOB_NAMES.RATING.CUSTOMER,
      payload,
      {
        delay: options?.delay ?? JOB_DELAYS.IMMEDIATE,
        priority: options?.priority ?? JOB_PRIORITIES.HIGH,
      },
    ).then((job) => {
      console.log(`✅ [Rating Producer] CUSTOMER rating job added successfully with ID: ${job?.id}`);
      return job;
    }).catch((error) => {
      console.error(`❌ [Rating Producer] Failed to add CUSTOMER rating job:`, error);
      throw error;
    });
  },
};
