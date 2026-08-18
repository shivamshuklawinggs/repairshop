
 interface InvoicePayment {
  invoiceId: string;
  amount: number;
}

 interface DeletedPayment {
  invoiceId: string;
  amount: number;
  PaymentAllocateId: string;
  recievedPaymentId: string;
}

 interface RecievedPaymentItem {
  _id: string;
  invoiceId: string;
  amount: number;
  PaymentAllocateId: string;
  recievedPaymentId: string;
}

export interface RecievedPamentPayload {
  customerId: string;
  postingDate: Date;
  paymentDate: Date;
  paymentMethod: string;
  referenceNo: string;
  amount: number;
  depositTo: string;
  invoicePayments: InvoicePayment[];
}

export interface UpdateRecievedPamentPayload {
  customerId: string;
  postingDate: Date;
  paymentDate: Date;
  paymentMethod: string;
  referenceNo?: string;
  amount: number;
  depositTo: string;
  invoicePayments?: InvoicePayment[];
  deletedPayments?: DeletedPayment[];
  recievedPayments?: RecievedPaymentItem[];
}


interface Address {
  address: string
  state: string
  zipCode: string
}

 interface RecievedPayment {
    readonly amountWithTax:     number;
    readonly totalTaxAmount:    number;
    readonly totalAmount:       number;
    readonly recievedAmount:    number;
    readonly balanceDue:        number;
    readonly invoiceId:         string;
    readonly invoiceNumber:     string;
    readonly amount:            number;
    readonly OriginalAmount:    number;
    readonly recievedPaymentId: string;
    readonly PaymentAllocateId: string;
}

 interface Customer {
    readonly _id:             string;
    readonly email:           string;
    readonly phone:           string;
    readonly rate:            number;
    readonly company:         string;
    readonly billingAddress:  Address;
    readonly shippingAddress: Address;
}
interface data {
    readonly _id:                string;
    readonly BillNumber:         string;
    readonly invoiceNumber:         string;
    readonly status:             string;
    readonly invoiceDate:        Date;
    readonly dueDate:            Date;
    readonly totalAmountWithTax: number;
    readonly totalTaxAmount:     number;
    readonly totalAmount:        number;
    readonly overbalanceDue:     number;
    readonly recievedAmount:     number;
    readonly balanceDue:         number;
}
export interface IPaymentReicevedData {
   readonly _id:                 string;
    readonly amount:              number;
    readonly paymentDate:         Date;
    readonly paymentMethod:       string;
    readonly referenceNo:         string;
    readonly depositTo:           string;
    readonly customerId:          string;
    readonly recievedPayments:    RecievedPayment[];
    readonly nonRecievedPayments: RecievedPayment[];
    readonly settledAmount:       number;
    readonly credits:             number;
    readonly status:              string;
    readonly customer:            Customer;
    readonly data:                data[];
    readonly totalBalance:        number;
    readonly totalRecievedAmount: number;
    readonly totalDueAmount:      number;
}
 

