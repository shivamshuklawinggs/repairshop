import { ICarrier } from "models/Carrier.model";
import { PaymentStatus } from "services/paymentQueryBuilder";

export interface BillResponse {
  vendorId: string;
  _id: string;
  customerId: string;
  BillNumber: string;
  invoiceDate: Date;
  dueDate: Date;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  receivedAmount: number;
  balanceDue: number;
  carrier: ICarrier
}