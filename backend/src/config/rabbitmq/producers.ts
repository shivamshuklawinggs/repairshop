import { rabbitMQService } from './rabbitmq.service';
import { EXCHANGE_NAMES, ROUTING_KEYS } from './constants';

/**
 * ✅ Producer Service
 * Handles publishing messages to RabbitMQ for background tasks
 * such as invoice and bill PDF generation.
 */
export class Producer {
  
  /**
   * 🔹 Trigger invoice PDF generation
   * @param invoiceId - The unique ID of the invoice
   * @returns A user-friendly message
   */
  public static async generateInvoice(id: string): Promise<string> {
    try {
      const message = { id };

      const published = await rabbitMQService.produceMessage(
        EXCHANGE_NAMES.INVOICE,
        ROUTING_KEYS.INVOICE.GENERATED,
        message
      );

      if (published) {
        console.log(`✅ Invoice generation message queued for invoiceId: ${id}`);
        return 'Your invoice PDF is being generated. You will receive it shortly.';
      } else {
        console.warn(`⚠️ Failed to queue invoice message for invoiceId: ${id}`);
        return 'We encountered an issue while processing your invoice. Please try again.';
      }
    } catch (error) {
      console.error('❌ Error while generating invoice PDF:', error);
      return 'An unexpected error occurred while generating your invoice.';
    }
  }
  /**
   * 🔹 Trigger invoice PDF generation
   * @param invoiceId - The unique ID of the invoice
   * @returns A user-friendly message
   */
  public static async generateEstimate(id: string): Promise<string> {
    try {
      const message = { id };

      const published = await rabbitMQService.produceMessage(
        EXCHANGE_NAMES.estimate,
        ROUTING_KEYS.ESTIMATE.GENERATED,
        message
      );

      if (published) {
        console.log(`✅ estimate generation message queued for estimateId: ${id}`);
        return 'Your estimate PDF is being generated. You will receive it shortly.';
      } else {
        console.warn(`⚠️ Failed to queue estimate message for estimateId: ${id}`);
        return 'We encountered an issue while processing your estimate. Please try again.';
      }
    } catch (error) {
      console.error('❌ Error while generating estimate PDF:', error);
      return 'An unexpected error occurred while generating your estimate.';
    }
  }
  /**
   * 🔹 Trigger bill PDF generation
   * @param id - The unique ID of the bill
   * @returns A user-friendly message
   */
  public static async generateBill(id: string): Promise<string> {
    try {
      const message = { id };

      const published = await rabbitMQService.produceMessage(
        EXCHANGE_NAMES.BILL,
        ROUTING_KEYS.BILL.GENERATED,
        message
      );

      if (published) {
        console.log(`✅ Bill generation message queued for billId: ${id}`);
        return 'Your bill PDF is being generated. You will receive it shortly.';
      } else {
        console.warn(`⚠️ Failed to queue bill message for billId: ${id}`);
        return 'We encountered an issue while processing your bill. Please try again.';
      }
    } catch (error) {
      console.error('❌ Error while generating bill PDF:', error);
      return 'An unexpected error occurred while generating your bill.';
    }
  }
  /**
   * 🔹 Trigger Reset password
   * @param id - The unique ID of the user
   * @returns A user-friendly message
   */
  public static async resetPassword(id: string): Promise<string> {
    try {
      const message = { id };

      const published = await rabbitMQService.produceMessage(
        EXCHANGE_NAMES.AUTH,
        ROUTING_KEYS.AUTH.RESET_PASSWORD,
        message
      );

      if (published) {
        return 'Your password reset request has been processed. You will receive it shortly.';
      } else {
        return 'We encountered an issue while processing your reset password request. Please try again.';
      }
    } catch (error) {
      return 'An unexpected error occurred while resetting your password.';
    }
  }
  /**
   * 🔹 Trigger Create User
   * @param id - The unique ID of the user
   * @returns A user-friendly message
   */
  public static async createUser(data: { id: string; password: string }): Promise<string> {
    try {
      const message = { id:data.id,password:data.password };

      const published = await rabbitMQService.produceMessage(
        EXCHANGE_NAMES.users,
        ROUTING_KEYS.users.CREATE,
        message
      );

      if (published) {
        console.log(`✅ Create user message queued for userId: ${data.id}`);
        return 'User created successfully.';
      } else {
        console.warn(`⚠️ Failed to queue create user message for userId: ${data.id}`);
        return 'We encountered an issue while processing your create user request. Please try again.';
      }
    } catch (error) {
      console.error('❌ Error while create user:', error);
      return 'An unexpected error occurred while creating user.';
    }
  }
  /**
   * 🔹 Trigger Create User
   * @param id - The unique ID of the user
   * @returns A user-friendly message
   */
  public static async SendEmail({to,subject,html,attachments=[],cc,bcc}:{to: string, subject: string, html: string, attachments?: Array<{filename: string,content:Buffer}>, cc?: string[], bcc?: string[]}): Promise<string> {
    try {
      const message = { to, subject, html, attachments, cc, bcc };

      const published = await rabbitMQService.produceMessage(
        EXCHANGE_NAMES.Email,
        ROUTING_KEYS.Email.SEND,
        message
      );

      if (published) {
        return 'Email Send successfully.';
      } else {
        console.warn(`⚠️ Failed to queue Email Send message`);
        return 'We encountered an issue while processing your Email Send request. Please try again.';
      }
    } catch (error) {
      console.error('❌ Error while create user:', error);
      return 'An unexpected error occurred while creating user.';
    }
  }

  /**
   * 🔹 Trigger invoice update notification
   * @param invoiceId - The unique ID of the invoice
   * @param updatedById - The ID of the user who updated the invoice
   * @param invoiceBeforeUpdate - The invoice document before the update
   * @param invoiceAfterUpdate - The invoice document after the update
   * @returns A message indicating the notification was queued
   */
  public static async invoiceUpdateNotification(
    invoiceId: string,
    updatedById: string,
    invoiceBeforeUpdate: any,
    invoiceAfterUpdate: any
  ): Promise<string> {
    try {
      const message = { invoiceId, updatedById, invoiceBeforeUpdate, invoiceAfterUpdate };

      const published = await rabbitMQService.produceMessage(
        EXCHANGE_NAMES.INVOICE,
        ROUTING_KEYS.INVOICE.UPDATE_NOTIFICATION,
        message
      );

      if (published) {
        console.log(`✅ Invoice update notification queued for invoiceId: ${invoiceId}`);
        return 'Invoice update notification queued.';
      } else {
        console.warn(`⚠️ Failed to queue invoice update notification for invoiceId: ${invoiceId}`);
        return 'We encountered an issue while processing the invoice update notification.';
      }
    } catch (error) {
      console.error('❌ Error while queuing invoice update notification:', error);
      return 'An unexpected error occurred while queuing the invoice update notification.';
    }
  }

  /**
   * 🔹 Trigger user geolocation update
   * @param userId - The unique ID of the user
   * @param ipAddress - The IP address of the user
   * @returns A user-friendly message
   */
  public static async updateUserGeolocation(userId: string, ipAddress: string): Promise<string> {
    try {
      const message = { userId, ipAddress };

      const published = await rabbitMQService.produceMessage(
        EXCHANGE_NAMES.users,
        ROUTING_KEYS.users.GEOLOCATION,
        message
      );

      if (published) {
        console.log(`✅ User geolocation update queued for userId: ${userId}`);
        return 'User geolocation update queued.';
      } else {
        console.warn(`⚠️ Failed to queue geolocation update for userId: ${userId}`);
        return 'We encountered an issue while processing the geolocation update.';
      }
    } catch (error) {
      console.error('❌ Error while queuing geolocation update:', error);
      return 'An unexpected error occurred while queuing the geolocation update.';
    }
  }

 
}
