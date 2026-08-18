
import { SeederResult } from 'seeders';
import { PaymentMethods } from 'types/enum';

// Default Bank Chart of Account
export const defaultBankChartOfAccount = {
  name: 'Bank',
  type: 'asset',
  accountType: '68cda01af4df46c867aa89d6',
  detailType: '68cda01af4df46c867aa8a03',
  typeId: '0',
  isSubAccount: false,
  AccountId: null,
  description: '',
  isActive: true,
  masterType: 'other',
  id: 'BAL-361',
  accountTypeData: {
    _id: '68cda01af4df46c867aa89d6',
    name: 'Bank',
    type: 'asset',
    masterType: 'other',
    typeId: '0',
    detailTypeId: '1010',
    detailType: 'Checking'
  },
  detailTypeData: {
    _id: '68cda01af4df46c867aa8a03',
    name: 'Savings',
    typeId: '0',
    type: 'asset',
    masterType: 'other',
    detailTypeId: '1012',
    detailType: 'Savings',
    AccountTypeId: '68cda01af4df46c867aa89d6'
  },
};

// Default Customer
export const defaultCustomer = {
  company: 'Default Test Customer',
  displayCustomerName: 'Default Test Customer',
  email: 'default@testcustomer.com',
  phone: '1234567890',
  address: '123 Test Street',
  state: 'CA',
  zipCode: '90210',
  paymentMethod: PaymentMethods.BANK_TRANSFER,
  id: 'CUSTOMER-DEFAULT-001'
};

// Default Vendor
export const defaultVendor = {
  company: 'Default Test Vendor',
  displayCustomerName: 'Default Test Vendor',
  email: 'default@testvendor.com',
  phone: '9876543210',
  address: '456 Vendor Avenue',
  state: 'NY',
  zipCode: '10001',
  paymentMethod: PaymentMethods.BANK_TRANSFER,
  id: 'VENDOR-DEFAULT-001'
};

// Mock Data Configuration
export interface MockDataConfig {
  seedResult:SeederResult;
  invoiceCount?: number;
  billCount?: number;
}

// Mock Data Result
export interface MockDataResult {
  success: boolean;
  errors: string[];
  stats: {
    invoicesCreated: number;
    billsCreated: number;
    paymentsCreated: number;
    allocationsCreated: number;
  };
}
