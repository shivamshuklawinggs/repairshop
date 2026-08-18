import { Job } from 'bullmq';
import { QUEUE_NAMES } from '../constants';
import { bullMQService } from '../bullmq.service';
import { invoiceProcessors } from './invoice.processor';
import { ratingProcessors } from './rating.processor';
import { notificationProcessors } from './notification.processor';


// Master processor map
export const processors = {
  ...invoiceProcessors,
  ...ratingProcessors,
  ...notificationProcessors
};

// Function to setup all processors
export const setupProcessors = async () => {
  console.log('🚀 [Processors] Setting up BullMQ job processors...');

  // Setup invoice processors
  await bullMQService.processJobs(
    QUEUE_NAMES.INVOICE_REMINDER,
    async (job: Job) => {
      const processor = processors[job.name];
      if (processor) {
        await processor(job);
      } else {
        console.warn(`⚠️ [Processors] No processor found for job: ${job.name}`);
        throw new Error(`No processor found for job: ${job.name}`);
      }
    },
    { concurrency: 2 }
  );

  // Setup rating processors
  await bullMQService.processJobs(
    QUEUE_NAMES.RATING,
    async (job: Job) => {
      const processor = processors[job.name];
      if (processor) {
        await processor(job);
      } else {
        console.warn(`⚠️ [Processors] No processor found for job: ${job.name}`);
        throw new Error(`No processor found for job: ${job.name}`);
      }
    },
    { concurrency: 5 }
  );


  console.log('✅ [Processors] All BullMQ job processors setup completed');
};
