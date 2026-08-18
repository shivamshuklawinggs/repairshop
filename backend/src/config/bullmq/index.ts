// BullMQ Configuration and Setup
export * from './constants';
export * from './bullmq.service';
export * from './processors';
export * from './producers';

// Main initialization function
export const initializeBullMQ = async () => {
  const { bullMQService } = await import('./bullmq.service');
  const { setupProcessors } = await import('./processors');
  
  try {
    // Initialize BullMQ service
    await bullMQService.initialize();
    
    // Setup all job processors
    await setupProcessors();
    
    console.log('✅ [BullMQ] BullMQ service initialized and processors setup completed');
  } catch (error) {
    console.error('❌ [BullMQ] Failed to initialize BullMQ service:', error);
    throw error;
  }
};

// Graceful shutdown function
export const shutdownBullMQ = async () => {
  const { bullMQService } = await import('./bullmq.service');
  
  try {
    await bullMQService.close();
    console.log('✅ [BullMQ] BullMQ service shutdown completed');
  } catch (error) {
    console.error('❌ [BullMQ] Failed to shutdown BullMQ service:', error);
    throw error;
  }
};
