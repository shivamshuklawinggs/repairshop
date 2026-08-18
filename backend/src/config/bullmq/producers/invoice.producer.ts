import {
  QUEUE_NAMES,
  JOB_NAMES,
  JOB_PRIORITIES,
  JOB_DELAYS,
} from "../constants";
import { bullMQService } from "../bullmq.service";

// Invoice job producers
export const invoiceProducers = {
  sendReminder: async (
    invoiceData: { invoiceId: any },
    options?: { delay?: number; priority?: number },
  ) =>
    bullMQService.addJob(
      QUEUE_NAMES.INVOICE_REMINDER,
      JOB_NAMES.INVOICE.sendReminder,
      invoiceData,
      {
        delay: options?.delay ?? JOB_DELAYS.IMMEDIATE,
        priority: options?.priority ?? JOB_PRIORITIES.HIGH,
      },
    ),

  sendManualReminder: async (
    invoiceData: {
      ccList: string[];
      bccList: string[];
      toEmail: string;
      invoiceId: any;
    },
    options?: { delay?: number; priority?: number },
  ) =>
    bullMQService.addJob(
      QUEUE_NAMES.INVOICE_REMINDER,
      JOB_NAMES.INVOICE.sendManualReminder,
      invoiceData,
      {
        delay: options?.delay ?? JOB_DELAYS.IMMEDIATE,
        priority: options?.priority ?? JOB_PRIORITIES.HIGH,
      },
    ),
};
