import { bullMQService } from '../bullmq.service';
import { QUEUE_NAMES, JOB_NAMES, JOB_DELAYS, JOB_PRIORITIES } from '../constants';
import { ProductServiceReminderPayload } from 'microservices/notification-services/services/types';

export const notificationProducers = {
  /**
   * Schedule delivery reminder
   */
  productServiceReminder: (
    payload: ProductServiceReminderPayload,
    _options?: { delay?: number; priority?: number }
  ) => {
    return bullMQService.addJob(
      QUEUE_NAMES.NOTIFICATION,
      JOB_NAMES.NOTIFICATION.productServiceReminder,
      payload,
      {
        delay: JOB_DELAYS.IMMEDIATE,
        priority: JOB_PRIORITIES.HIGH,
      }
    );
  },
};
