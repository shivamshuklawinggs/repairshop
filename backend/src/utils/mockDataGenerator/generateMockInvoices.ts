import { ledgerAdapter, TransactionType } from "models/Ledger.model";
import { Types ,Document} from "mongoose";
import { generateInvoiceNumber, generateLineItems, mockRandom, randomDate } from "./mockDataHelpers";
import { PaymentMethods } from "types/enum";
import moment from "moment";
import { IInvoice } from "models/Invoice.model";
import GenerateInvoice from 'microservices/accounts-services/invoice/services/generateinvoice.service';
import { generateUniqueId } from "models/universalid.model";
// Helper function to generate mock invoices
const generateMockInvoices = async (
  invoiceCount: number,
  companyId: Types.ObjectId,
  userId: Types.ObjectId,
  ownerAdminId: Types.ObjectId,
  session: any,
  products: any[],
  defaultCustomer: any,
) => {
  console.log(`📄 Generating ${invoiceCount} mock invoices...`);
  for (let i = 0; i < invoiceCount; i++) {
    const productCount = mockRandom.number.int({ min: 1, max: 3 });
    const invoiceDate = await randomDate(moment().subtract(6, 'months').toDate(), new Date());
    const paymentDays = mockRandom.number.int({ min: 15, max: 45 });
    const dueDate = new Date(invoiceDate.getTime() + paymentDays * 24 * 60 * 60 * 1000);
    // const generateInvoiceId=await generateUniqueId({prefix:"INVOICE-",companyId,session})

    const expenses = await generateLineItems(products, productCount, false);
    const id=await generateUniqueId({prefix:"INVOICE-",companyId,session})
    const invoiceData: Omit<IInvoice, keyof Document> & { id: string } = {
      invoiceNumber: generateInvoiceNumber(i, 'INV'),
      customerId: defaultCustomer._id,
      companyId,
      createdBy: userId,
      updatedBy: userId,
      ownerAdminId,
      manager: userId,
      invoiceDate,
      postingDate: invoiceDate,
      dueDate,
      paymentOptions: PaymentMethods.BANK_TRANSFER,
      address: defaultCustomer.address || '123 Business St',
      customerNotes: 'Mock invoice for testing',
      terms_conditions: `Net ${paymentDays} days`,
      discountPercent: mockRandom.number.float({ min: 0, max: 100, fractionDigits: 2 }),
      deposit: mockRandom.number.float({ min: 0, max: 500, fractionDigits: 2 }),
      expense: expenses,
      emailStatus:"Save",
      id:id
    };

    const response = await GenerateInvoice.generateMockInvoice({
      data: invoiceData,
      companyId,
      ownerAdminId,
      createdBy: userId,
      session
    });

    await ledgerAdapter.recordLedgerById({
      id: new Types.ObjectId(response._id),
      session,
      type: TransactionType.INVOICE,
      companyId: companyId
    });
  }

  console.log(`✅ Created ${invoiceCount} invoices`);
};

export default generateMockInvoices