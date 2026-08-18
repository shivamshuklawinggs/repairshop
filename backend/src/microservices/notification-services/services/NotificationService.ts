
import Notification, { INotification } from 'models/Notification.model';
import { Job } from 'bullmq';
import {  ProductServiceReminderPayload} from './types';
import { Document } from 'mongoose';
import ProductService from 'models/product-service.model';
/**
 * Notification Service - Handles all notification processing with optimized class-based architecture
 */
export class NotificationService {
  private static instance: NotificationService;
  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }


  /**
   * Process follow-up reminder job
   */
  public async productServiceReminder(job: Job<ProductServiceReminderPayload>): Promise<void> {
    const { productServiceId,userId } = job.data;
   
    try {
      console.log(`- Processing...`);
      const Product = await ProductService.findById(productServiceId).lean()
      if (
        Product &&
        Product.currentLevel <= Product.reorderStock
      ) {
        const payload :Omit<INotification,keyof Document>= {
          title: "Reorder stock",
          message: `Please reorder stock for ${Product.name}. Current stock is ${Product.currentLevel}.`,
          referenceId: Product._id,
          UserId:userId,
          companyId:Product.companyId,
          isRead:false,
          referenceNumber:Product.name,
          type:"ProductServiceReminer"
        };
        this.createNotification(payload)
        await Notification.create(payload)
        // Save or send notification
      }
     
    } catch (error) {
      throw error;
    }
  }

 
  /**
   * Create or update notification
   */
  private async createNotification(data: Omit<INotification,keyof Document>): Promise<void> {
    await Notification.create(data);
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();
