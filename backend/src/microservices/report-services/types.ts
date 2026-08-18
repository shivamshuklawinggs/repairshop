import { PaymentMethods } from "types/enum"

export interface IACRecievableReportData {
  data: [
    {
      _id: string,
      totalDueAmount: number,
      customer: {
        _id: string,
        email: string,
        phone: string,
        paymentMethod: PaymentMethods,
        company: string,
        billingAddress: {
          address: string,
          state: string,
          zipCode: string
        },
        shippingAddress: {
          address: string,
          state: string,
          zipCode: string
        }
      },
      totalAmount: number,
      currentDueAmount: number,
      due_0_30: number,
      due_31_60: number,
      due_61_90: number,
      due_90_plus: number,
      daysPastDue: number
    }
  ],
  totalData: {
    totalDueAmount: number,
    due_0_30: number,
    due_31_60: number,
    due_61_90: number,
    due_90_plus: number
  },
}
export interface IAccountsPayableDetail {
       invoices: 
            {
                _id: string,
                date: string,
                vendorDisplayName: string,
                num:string,
                transactionType:"Bill" | "Invoice",
                dueDate: string,
                daysPastDue: number,
                amount: number,
                openBalance: number,
                bucket: string,
                bucketOrder: number
            }[] ,
        summary:
            {
                _id: number,
                bucket: string,
                totalDueAmount: number,
                totalAmount: number,
                count: number
            }[] ,
        totalDueAmount: number,
        totalAmountWithTax: number,
        total: number
    
}

export interface GroupedInvoices {
  bucket: string
  bucketOrder: number
  invoices: IAccountsPayableDetail['invoices']
  totalAmount: number
  totalOpenBalance: number
}