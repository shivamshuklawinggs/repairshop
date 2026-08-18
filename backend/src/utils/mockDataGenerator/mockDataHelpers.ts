import { Types } from 'mongoose';
import Customer from 'models/Customer.model';
import Carrier from 'models/Carrier.model';
import ChartOfAccount from 'models/chartOfAccounts.model';
import { defaultBankChartOfAccount, defaultCustomer, defaultVendor } from './mockDataConstants';
const mockRandom = {
  number: {
    int: ({ min, max }: { min: number; max: number }) =>
      Math.floor(Math.random() * (max - min + 1)) + min,
    float: ({ min, max, fractionDigits = 2 }: { min: number; max: number; fractionDigits?: number }) =>
      parseFloat((Math.random() * (max - min) + min).toFixed(fractionDigits)),
  },
  date: {
    between: ({ from, to }: { from: Date; to: Date }) =>
      new Date(from.getTime() + Math.random() * (to.getTime() - from.getTime())),
  },
};
export { mockRandom };
// Helper to generate random invoice/bill number
export const generateInvoiceNumber = (index: number, prefix: string): string => {
  return `${prefix}-${String(index + 1).padStart(4, '0')}`;
};

// Helper to generate random date within range
export const randomDate = async(start: Date, end: Date): Promise<Date> => {
  return mockRandom.date.between({ from: start, to: end });
};

// Helper to create or get default customer
export const createDefaultCustomer = async (
  companyId: Types.ObjectId,
  userId: Types.ObjectId,
  ownerAdminId: Types.ObjectId,
  session: any
) => {
  const existingCustomer = await Customer.findOne({ id: defaultCustomer.id, companyId }).session(session);
  if (!existingCustomer) {
    console.log('👤 Creating default customer...');
    const createdCustomer = await Customer.create([{
      ...defaultCustomer,
      companyId,
      createdBy: userId,
      updatedBy: userId,
      ownerAdminId,
      manager: userId
    }], { session });
    console.log('✅ Default customer created');
    return createdCustomer[0];
  } else {
    console.log('✅ Default customer already exists');
    return existingCustomer;
  }
};

// Helper to create or get default vendor
export const createDefaultVendor = async (
  companyId: Types.ObjectId,
  userId: Types.ObjectId,
  ownerAdminId: Types.ObjectId,
  session: any
) => {
  const existingVendor = await Carrier.findOne({ id: defaultVendor.id, companyId }).session(session);
  if (!existingVendor) {
    console.log('🏢 Creating default vendor...');
    const createdVendor = await Carrier.create([{
      ...defaultVendor,
      companyId,
      createdBy: userId,
      updatedBy: userId,
      ownerAdminId,
      manager: userId
    }], { session });
    console.log('✅ Default vendor created');
    return createdVendor[0];
  } else {
    console.log('✅ Default vendor already exists');
    return existingVendor;
  }
};

// Helper to create or get default bank chart of account
export const createDefaultBankChartOfAccount = async (
  companyId: Types.ObjectId,
  userId: Types.ObjectId,
  ownerAdminId: Types.ObjectId,
  session: any
) => {
  const existingAccount = await ChartOfAccount.findOne({ 
    companyId, 
    detailType: defaultBankChartOfAccount.detailType 
  }).session(session);
  
  if (!existingAccount) {
    console.log('🏦 Creating default bank chart of account...');
    const createdAccount = await ChartOfAccount.create([{
      ...defaultBankChartOfAccount,
      companyId,
      createdBy: userId,
      updatedBy: userId,
      ownerAdminId,
      manager: userId
    }], { session });
    console.log('✅ Default bank chart of account created');
    return createdAccount[0];
  } else {
    console.log('✅ Default bank chart of account already exists');
    return existingAccount;
  }
};

// Helper to generate random line items
export const generateLineItems =async (
  products: any[],
  productCount: number,
  isBill: boolean = false
) => {
  const expenses = [];
  for (let j = 0; j < productCount; j++) {
    const product = products[mockRandom.number.int({ min: 0, max: products.length - 1 })];
    const qty = mockRandom.number.int({ min: 1, max: 5 });
    const rate = isBill 
      ? mockRandom.number.float({ min: 50, max: 300, fractionDigits: 2 })
      : (product.ProductRate || mockRandom.number.float({ min: 100, max: 500, fractionDigits: 2 }));
    expenses.push({
      productservice: product._id,
      description: product.description || product.name,
      qty,
      rate,
      readonly: true,
       paidByAmount: 0,
        billToAmount:0,
    });
  }
  return expenses;
};
