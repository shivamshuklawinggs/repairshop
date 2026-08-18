import { Channel } from "amqplib";
import { EXCHANGE_NAMES, QUEUE_NAMES } from "./constants";
/**
 * ✅ Auto setup everything dynamically
 */
 class RabbitQueuesExchangesSetup {

  /**
   * ✅ Setup all exchanges
   */
 static async setupExchanges(channel: Channel): Promise<void> {
     if (!channel) return;
    for (const exchange of Object.values(EXCHANGE_NAMES)) {
      await channel.assertExchange(exchange, 'topic', { durable: true });
    }
  }
  /**
   * ✅ Setup all queues + bindings
   */
 static async setupQueues(channel: Channel): Promise<void> {
    if (!channel) return;
      
       await channel.assertQueue(QUEUE_NAMES.INVOICE_GENERATION, { durable: true });
       await channel.bindQueue(QUEUE_NAMES.INVOICE_GENERATION, EXCHANGE_NAMES.INVOICE, 'invoice.*');
       await channel.assertQueue(QUEUE_NAMES.ESTIMATE_GENERATION, { durable: true });
       await channel.bindQueue(QUEUE_NAMES.ESTIMATE_GENERATION, EXCHANGE_NAMES.estimate, 'estimate.*');
       await channel.assertQueue(QUEUE_NAMES.INVOICE_UPDATE_NOTIFICATION, { durable: true });
       await channel.bindQueue(QUEUE_NAMES.INVOICE_UPDATE_NOTIFICATION, EXCHANGE_NAMES.INVOICE, 'invoice.update.*');
       await channel.assertQueue(QUEUE_NAMES.BILL_GENERATION, { durable: true });
       await channel.bindQueue(QUEUE_NAMES.BILL_GENERATION, EXCHANGE_NAMES.BILL, 'bill.*');
       await channel.assertQueue(QUEUE_NAMES.AUTH, { durable: true });
       await channel.bindQueue(QUEUE_NAMES.AUTH, EXCHANGE_NAMES.AUTH, 'auth.*');
       await channel.assertQueue(QUEUE_NAMES.users, { durable: true });
       await channel.bindQueue(QUEUE_NAMES.users, EXCHANGE_NAMES.users, 'users.*');
       await channel.assertQueue(QUEUE_NAMES.Email, { durable: true });
       await channel.bindQueue(QUEUE_NAMES.Email, EXCHANGE_NAMES.Email, 'email.*');
       await channel.assertQueue(QUEUE_NAMES.USER_GEOLOCATION, { durable: true });
       await channel.bindQueue(QUEUE_NAMES.USER_GEOLOCATION, EXCHANGE_NAMES.users, 'users.geolocation');
  }
}
export default  RabbitQueuesExchangesSetup