import { initializeBullMQ } from "config/bullmq";
import { initializeConsumers } from "config/rabbitmq/consumers";
import { rabbitMQService } from "config/rabbitmq/rabbitmq.service";
import { connectRedis } from "config/redis";
import runMigrations from "migrations";
// import { ledgerAdapter } from "models/Ledger.model";
import Seeder from "seeders";
import MockDataGenerator from "utils/mockDataGenerator/mockDataGenerator";

const initializeServices=async()=>{
    try {
    // Initialize RabbitMQ
    await rabbitMQService.initialize();
        // Connect Redis
    await connectRedis();
    // console.log('✅ Redis connected');
    await  initializeConsumers()
    // // Initialize BullMQ before migrations
    await initializeBullMQ();
    console.log('✅ BullMQ initialized');
        // Run seeders
    const seederResult = await Seeder(process.env.SKIP_SEEDER=="true");
    console.log('✅ Database seeding completed');
    // //    // Run migrations
    await runMigrations({
        skipIndexSync:process.env.SKIP_INDEX_MIGRATION=="true",
       skipChartOfAccountsMigration:process.env.SKIP_CHART_OF_ACCOUNTS_MIGRATION=="true",
     });
    // await ledgerAdapter.initiaTeAllData()
    // Generate mock data for testing (optional - set MOCK_DATA_GENERATOR=true in env)
    MockDataGenerator({
    seedResult: seederResult,
    invoiceCount: 500,
    billCount: 500,
    });
    } catch (error) {
        console.log(error,"Failed to initialize services")
    }
}
export default initializeServices