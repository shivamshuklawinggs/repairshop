import { Job } from "bullmq";
import { JOB_NAMES } from "../constants";
import {
  sendManualReminder,
  sendReminder,
} from "microservices/reminder-services/reminder.utilities";

// Invoice job processors
export const invoiceProcessors = {
  [JOB_NAMES.INVOICE.sendReminder]: async (job: Job) => {
    console.log(` [Invoice] Generating invoice for job ${job.id}`);
    try {
      const { invoiceId } = job.data;

      // Add your invoice generation logic here
      console.log(` [Invoice] Processing invoice ${invoiceId} `);
      console.log(`📄 [Invoice] Processing invoice ${invoiceId} `);
      if (!invoiceId) return;
      // Simulate processing time
      await sendReminder(invoiceId);

      const result = {
        success: true,
        invoiceId,
        generatedAt: new Date(),
      };

      console.log(`✅ [Invoice] Invoice ${invoiceId} generated successfully`);
      return result;
    } catch (error) {
      console.error(
        ` [Invoice] Failed to generate invoice for job ${job.id}:`,
        error,
      );
      throw error;
    }
  },
  [JOB_NAMES.INVOICE.sendManualReminder]: async (job: Job) => {
    console.log(`📄 [Invoice] Generating invoice for job ${job.id}`);
    try {
      const { ccList, bccList, toEmail, invoiceId } = job.data;
      // Add your invoice generation logic here
      console.log(`📄 [Invoice] Processing invoice ${invoiceId} `);
      if (!invoiceId) return;
      if (!toEmail) return;
      // Simulate processing time
      const result = await sendManualReminder({
        ccList,
        bccList,
        toEmail,
        invoiceId,
      });

      console.log({ result });
      console.log(`✅ [Invoice] Invoice ${invoiceId} generated successfully`);
      return result;
    } catch (error) {
      console.error(
        `[Invoice] Failed to generate invoice for job ${job.id}:`,
        error,
      );
      throw error;
    }
  },
};
