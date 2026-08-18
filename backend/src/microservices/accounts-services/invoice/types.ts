import { ICustomer } from "models/Customer.model";
import { PaymentStatus } from "services/paymentQueryBuilder";

export interface InvoiceResponse {
  _id: string;
  customerId: string;
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  receivedAmount: number;
  balanceDue: number;
  customer: ICustomer
}
