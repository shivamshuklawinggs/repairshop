import { rabbitMQService } from './rabbitmq.service';
import { QUEUE_NAMES, ROUTING_KEYS } from './constants';
import { handleCreateUserRabitMQ, handleResetPasswordRabitMQ } from 'microservices/user-service/user.controller';
import InvoiceController from 'microservices/accounts-services/invoice/invoice.controller';
import BillController from 'microservices/accounts-services/bill-services/bill.controller';
import sendEmail from 'libs/sendEmail';
import { handleInvoiceUpdateNotification } from 'microservices/accounts-services/invoice/services/notifyadmin.service';
import { updateUserCountry } from 'services/geolocation.service';
import { handleEstimateGeneration } from 'microservices/accounts-services/estimate/estimate.controller';

const handleDataViaROutingKey = async (data: any, routingKey: string) => {
    try {
        console.log("routingKey",routingKey)
        switch (routingKey) {
            // invoice generate
            case ROUTING_KEYS.INVOICE.GENERATED:
                await InvoiceController.handleInvoiceGeneration(data);
                break;
                // 
            case ROUTING_KEYS.BILL.GENERATED:
                await BillController.handleBillGeneration(data);
                break;
            case ROUTING_KEYS.ESTIMATE.GENERATED:
                await handleEstimateGeneration(data);
                break;
            case ROUTING_KEYS.AUTH.RESET_PASSWORD:
                await handleResetPasswordRabitMQ(data);
                break;
            case ROUTING_KEYS.users.CREATE:
                await handleCreateUserRabitMQ(data);
                break;
            case ROUTING_KEYS.Email.SEND:
                await sendEmail(data);
                break;
            case ROUTING_KEYS.INVOICE.UPDATE_NOTIFICATION:
                await handleInvoiceUpdateNotification(data);
                break;
            case ROUTING_KEYS.users.GEOLOCATION:
                await updateUserCountry(data.userId, data.ipAddress);
                break;
            default:
                console.warn(`Unknown routing key: ${routingKey}`);
                break;
        }
    } catch (error) {
        console.error('Error processing message:', error);
        throw error;
    }
};

// Initialize message consumers
export const initializeConsumers = async () => {
    try {

        // Initialize invoice generation consumer
        await rabbitMQService.consumeMessages(
            QUEUE_NAMES.INVOICE_GENERATION,
            handleDataViaROutingKey
        );
        // Initialize bill generation consumer
        await rabbitMQService.consumeMessages(
            QUEUE_NAMES.BILL_GENERATION,
            handleDataViaROutingKey
        );
        // Initialize auth consumer
        await rabbitMQService.consumeMessages(
            QUEUE_NAMES.AUTH,
            handleDataViaROutingKey
        );
        // Initialize user  consumer
        await rabbitMQService.consumeMessages(
            QUEUE_NAMES.users,
            handleDataViaROutingKey
        );
         // Initialize ledger  consumer
        await rabbitMQService.consumeMessages(
            QUEUE_NAMES.Email,
            handleDataViaROutingKey
        );
        // Initialize invoice update notification consumer
        await rabbitMQService.consumeMessages(
            QUEUE_NAMES.INVOICE_UPDATE_NOTIFICATION,
            handleDataViaROutingKey
        );
        // Initialize invoice update notification consumer
        await rabbitMQService.consumeMessages(
            QUEUE_NAMES.ESTIMATE_GENERATION,
            handleDataViaROutingKey
        );
        // Initialize user geolocation consumer
        await rabbitMQService.consumeMessages(
            QUEUE_NAMES.USER_GEOLOCATION,
            handleDataViaROutingKey
        );
        console.log('✅ Message consumers initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing message consumers:', error);
        throw error;
    }
};