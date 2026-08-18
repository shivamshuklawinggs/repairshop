import { ledgerAdapter, TransactionType } from "models/Ledger.model";
import { Types ,Document} from "mongoose";
import { generateInvoiceNumber, generateLineItems, mockRandom, randomDate } from "./mockDataHelpers";
import { PaymentMethods } from "types/enum";
import moment from "moment";
import { IBill } from "models/Bill.model";
import GenerateBill from 'microservices/accounts-services/bill-services/services/generatebill.service';
import { generateUniqueId } from "models/universalid.model";
// Helper function to generate mock bills
const generateMockBills = async (
  billCount: number,
  companyId: Types.ObjectId,
  userId: Types.ObjectId,
  ownerAdminId: Types.ObjectId,
  session: any,
  products: any[],
  defaultVendor: any,
) => {
  console.log(`📄 Generating ${billCount} mock bills...`);
  for (let i = 0; i < billCount; i++) {
    const productCount = mockRandom.number.int({ min: 1, max: 3 });
    const billDate = await randomDate(moment().subtract(6, 'months').toDate(), new Date());
    const paymentDays = mockRandom.number.int({ min: 15, max: 45 });
    const dueDate = new Date(billDate.getTime() + paymentDays * 24 * 60 * 60 * 1000);
    const id=await generateUniqueId({prefix:"BILL-",companyId,session})
    const expenses = await generateLineItems(products, productCount, true);

    const billData: Omit<IBill, keyof Document> & { id: string } = {
      BillNumber: generateInvoiceNumber(i, 'BILL'),
      vendorId: defaultVendor._id,
      companyId,
      createdBy: userId,
      updatedBy: userId,
      ownerAdminId,
      manager: userId,
      invoiceDate: billDate,
      postingDate: billDate,
      dueDate,
      paymentOptions: PaymentMethods.BANK_TRANSFER,
      address: defaultVendor.address || '456 Vendor Ave',
      customerNotes: 'Mock bill for testing',
      terms_conditions: `Net ${paymentDays} days`,
      discountPercent: mockRandom.number.float({ min: 0, max: 100, fractionDigits: 2 }),
      deposit: mockRandom.number.float({ min: 0, max: 500, fractionDigits: 2 }),
      expense: expenses,
      emailStatus: "Save",
      id:id
    };

    const response = await GenerateBill.generateMockBill({
      data: billData,
      companyId,
      ownerAdminId,
      createdBy: userId,
      session
    });

    await ledgerAdapter.recordLedgerById({
      id: new Types.ObjectId(response._id),
      session,
      type: TransactionType.BILL,
      companyId: companyId
    });
  }

  console.log(`✅ Created ${billCount} bills`);
};

export default generateMockBills