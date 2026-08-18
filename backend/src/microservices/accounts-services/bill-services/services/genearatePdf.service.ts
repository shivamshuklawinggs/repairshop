import path from 'path';
import  { Document } from 'mongoose';
import { AppError } from 'middlewares/error';
import { generatePDFData } from 'utils/generatePdfData';
import  Invoice from "models/Bill.model";
import { fullurl } from "config";
import { IInvoiceBilExpensePopulated } from 'models/shared/schemas';
import { ICompany } from 'models/company.model';
import { IPaymentTerms } from 'models/PaymentTerms.model';
import { ICarrier } from 'models/Carrier.model';
import { capitalizeFirstLetter } from 'libs';
import { formatDate } from 'utils';

class GeneratePdf {
  constructor() {
    this.invoiceData=this.invoiceData.bind(this)
  }
  private async invoiceData(invoiceId:string){

  const result = await Invoice.findById(invoiceId).populate<{
  vendorId: Omit<ICarrier,keyof Document>;
  terms:Omit<IPaymentTerms,keyof Document>;
  companyId: Omit<ICompany,keyof Document>
  expense: Array<Omit<IInvoiceBilExpensePopulated,keyof Document>>;
}>([
  { path: "vendorId"},
  { path: "terms",},
  { path: "companyId" },
  { path: "expense.productservice" },
  { path: "expense.tax", }
]).lean()
return result;
}


  public async generatePdfData(invoiceId:string) {
    return new Promise (async(resolve,reject)=>{
      try {
        const invoice=await this.invoiceData(invoiceId)
         if (!invoice) {
          throw new AppError('Invoice not found', 404);
        }
     
        // Extract values from invoice
      const expense = invoice?.expense || [];
      const subTotal = invoice?.summary?.subTotal || 0; 
      const totalDiscount = invoice?.summary?.discount || 0
      const total = invoice?.summary?.finalAmount || 0;
      const taxAmount = invoice?.summary?.taxTotal || 0;
      
      const balanceDue = invoice?.summary?.balanceDue || 0;
      const taxPercentage = Number((taxAmount/total)*100).toFixed(2)
      const customer=invoice?.vendorId
      
      // Prepare params for EJS template
      let params = {
         invoice,
         logoUrl: `${fullurl}uploads/company-logo/${invoice?.companyId.logo?.filename}`,
         tax: taxPercentage,
         subTotal,
         totalDiscount,
         expense,
         total,
         taxAmount,
         customer: customer,
         carrier: customer,
         customerName:customer.displayCustomerName || customer.company,
         companyName:invoice?.companyId?.label ,
         companyAddress:invoice?.companyId?.billingDetails?.address ,
         companyCityState:invoice?.companyId?.billingDetails?.address,
         companyPhone:invoice?.companyId?.billingDetails?.phone,
         companyEmail:invoice?.companyId?.billingDetails?.email,
         invoiceNumber:invoice.BillNumber,
         invoiceDate:formatDate(invoice.invoiceDate),
         dueDate:formatDate(invoice.dueDate),
         customerCompany:customer.displayCustomerName || customer.company,
         customerAddress:customer?.billingAddress?.address,
         customerCityState:[customer?.billingAddress?.city, customer?.billingAddress?.state, customer?.billingAddress?.zipCode].filter(Boolean).join(', '),
         customerPhoneDisplay:customer?.phone ,
         customerEmailDisplay:customer?.email ,
         paymentMethod:capitalizeFirstLetter(invoice.paymentOptions),
         invoiceTotal:total || 0,
         amountPaid:invoice?.summary?.totalRecieved || 0,
         balanceDueDisplay:balanceDue || 0,
         subTotalDisplay:subTotal || 0,
         taxAmountDisplay:taxAmount || 0,
         discountPercent:invoice.discountPercent || 0,
         companyLabel:invoice?.companyId?.label ,
      };
      const templatePath = path.join(__dirname, "../bill.ejs");
      const base64PDF: Base64URLString = await generatePDFData({template:templatePath, data:params});
      resolve(base64PDF)
       } catch (error) {
          reject(error)
       }
    })
  }
}
export default new GeneratePdf();
