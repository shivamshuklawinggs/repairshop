import mongoose from 'mongoose';
import InvoiceModal from 'models/Invoice.model';
import BillModal from 'models/Bill.model';
import ProductService from 'models/product-service.model';
import { MockDataConfig, MockDataResult } from './mockDataConstants';
import {
  createDefaultCustomer,
  createDefaultVendor,
} from './mockDataHelpers';
import generateMockBills from './generateMockBills';
import generateMockInvoices from './generateMockInvoices';
// import { generateUniqueId } from 'models/universalid.model';






const MockDataGenerator = async (config: MockDataConfig): Promise<MockDataResult> => {
  const {
    invoiceCount = 50,
    billCount = 50,
    seedResult
  } = config;

  const errors: string[] = [];
  const stats = {
    invoicesCreated: 0,
    billsCreated: 0,
    paymentsCreated: 0,
    allocationsCreated: 0
  };
  
  const session = await mongoose.startSession();
  
  try {
    if(process.env.SKIP_MOCK_DATA_GENERATOR === 'true'){
      return {
        success:true,
        errors,
        stats
      }
    }
  
    if(!seedResult?.results?.users){
     return {
        success:true,
        errors,
        stats
      }
    }
    if(!seedResult.results.users.companyId || !seedResult.results.users.admin || !seedResult.results.users.superAdmin){
       return {
        success:true,
        errors,
        stats
      }
    }
    console.log('🎭 Starting mock data generation...');
    const companyId = seedResult.results.users.companyId;
    const userId = seedResult.results.users.admin;
    const ownerAdminId = seedResult.results.users.admin;

    await session.withTransaction(async () => {
      console.log('🎭 Starting mock data generation...');
      const invoicecounts = await InvoiceModal.countDocuments({ companyId });
      const billcounts = await BillModal.countDocuments({ companyId });

      if (billcounts === billCount && invoicecounts === invoiceCount) return;

      const defaultCustomer = await createDefaultCustomer(companyId, userId, ownerAdminId, session);
      const defaultVendor = await createDefaultVendor(companyId, userId, ownerAdminId, session);

      // Get required reference data (products)
      const [products] = await Promise.all([
        ProductService.find({ companyId }).session(session).limit(20),
      ]);

      if (products.length === 0) {
        throw new Error('No products/services found. Cannot generate invoices/bills.');
      }


      // Generate Mock Invoices
      if (invoicecounts !== invoiceCount) {
        await generateMockInvoices(
          invoiceCount,
          companyId,
          userId,
          ownerAdminId,
          session,
          products,
          defaultCustomer,
        );
      }

      // Generate Mock Bills
      if (billcounts !== billCount) {
        await generateMockBills(
          billCount,
          companyId,
          userId,
          ownerAdminId,
          session,
          products,
          defaultVendor,
        );
      }
    });
  

    console.log('🎉 Mock data generation completed successfully');
    return {
      success: true,
      errors,
      stats
    };
  } catch (error) {
    const errorMsg = `Mock data generation failed: ${error instanceof Error ? error.message : String(error)}`;
    console.error(`❌ ${errorMsg}`);
    errors.push(errorMsg);
    return {
      success: false,
      errors,
      stats
    };
  } finally {
    await session.endSession();
  }
};

export default MockDataGenerator;
