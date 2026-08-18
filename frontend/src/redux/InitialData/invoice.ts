// frontend/src/redux/InitialData/invoice.js

import { todayDate } from "@/config/constant";


interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date;
  location: string;
  terms: string;
  company: string;
  customerEmail: string;
  customerAddress: string;
  customerNotes: string;
  terms_conditions: string;
  discountPercent: number;
  deposit: number;
  files: any[];
  paymentStatus: 'Unpaid' | 'Paid' | 'Partially Paid';
}

export const initialinvoiceData: InvoiceData = {
  invoiceNumber: '',
  invoiceDate: todayDate,
  dueDate: todayDate,
  location: '',
  terms: '',
  company: '',
  customerEmail: '',
  customerAddress: '',
  customerNotes: '',
  terms_conditions: '',
  discountPercent: 0,
  deposit: 0,
  files: [],
  paymentStatus: 'Unpaid'
};