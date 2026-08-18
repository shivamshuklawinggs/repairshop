import { Job } from 'bullmq';
import { notificationService } from 'microservices/notification-services/services/NotificationService';
import {  ProductServiceReminderPayload} from 'microservices/notification-services/services/types';
import { JOB_NAMES } from '../constants';

export const notificationProcessors = {
  [JOB_NAMES.NOTIFICATION.productServiceReminder]: async (job: Job<ProductServiceReminderPayload>) => {
    console.log(`📬 [Notification] Processing Product Service reminder for job ${job.id}`);
    try {
      await notificationService.productServiceReminder(job);
      console.log(`✅ [Notification] Product Service reminder processed successfully`);
    } catch (error) {
      console.error(`❌ [Notification] Product Service reminder failed for job ${job.id}:`, error);
      throw error;
    }
  },
};
