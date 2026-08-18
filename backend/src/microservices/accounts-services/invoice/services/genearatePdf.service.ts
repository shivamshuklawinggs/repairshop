import path from 'path';
import  { ClientSession } from 'mongoose';
import { AppError } from 'middlewares/error';
import { generatePDFData } from 'utils/generatePdfData';
import  Invoice from "models/Invoice.model";
import { fullurl } from "config";
import { ICustomer } from 'models/Customer.model';
import { IPaymentTerms } from 'models/PaymentTerms.model';
import { ICompany } from 'models/company.model';
import { IInvoiceBilExpensePopulated } from 'models/shared/schemas';
import { capitalizeFirstLetter } from 'libs';
import { formatDate } from 'utils';


class GeneratePdf {
  constructor() {
    this.invoiceData=this.invoiceData.bind(this)
  }
  private async invoiceData(invoiceId:string,session?:ClientSession){
   
   const result = await Invoice.findById(invoiceId).session(session!!).populate<{
  customerId: Omit<ICustomer,keyof Document>;
  terms:Omit<IPaymentTerms,keyof Document>;
  companyId: Omit<ICompany,keyof Document>
  expense: Array<Omit<IInvoiceBilExpensePopulated,keyof Document>>;
}>([
  { path: "customerId"},
  { path: "terms",},
  { path: "terms",},
  { path: "companyId" },
  { path: "expense.productservice" },
  { path: "expense.tax", }
]).lean()
return result;
  }

   public async generatePdfData(invoiceId:string,session?:ClientSession) {
     return new Promise (async(resolve,reject)=>{
       try {
         const invoice=await this.invoiceData(invoiceId,session)
          if (!invoice) {
           throw new AppError('Invoice not found', 404);
         }
         // Extract values from invoice
       // Extract values from invoice
      const expense = invoice?.expense || [];
      const subTotal = invoice?.summary?.subTotal || 0; 
      const totalDiscount = invoice?.summary?.discount || 0
      const total = invoice?.summary?.finalAmount || 0;
      const taxAmount = invoice?.summary?.taxTotal || 0;
      const balanceDue = invoice?.summary?.balanceDue || 0;
      const taxPercentage = Number((taxAmount/total)*100).toFixed(2)
      const customer=invoice?.customerId
    
       // Prepare params for EJS template
       let params = {
         invoice,
         tax: taxPercentage,
         subTotal,
         totalDiscount,
         expense,
         total,
         taxAmount,
         customer: customer,
         customerName:customer.displayCustomerName || customer.company || customer.nickName,
         companyName:invoice?.companyId?.label ,
         companyAddress:invoice?.companyId?.billingDetails?.address || invoice.address ,
         companyCityState:invoice?.companyId?.billingDetails?.address,
         companyPhone:invoice?.companyId?.billingDetails?.phone,
         companyEmail:invoice?.companyId?.billingDetails?.email,
         invoiceNumber:invoice.invoiceNumber,
         invoiceDate:formatDate(invoice.invoiceDate),
         dueDate:formatDate(invoice.dueDate),
         customerCompany:customer.displayCustomerName || customer.company || customer.nickName,
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
         logoUrl: `${fullurl}uploads/company-logo/${invoice?.companyId.logo?.filename}`,
       };
       const templatePath = path.join(__dirname, "../invoice.ejs");
       const base64PDF: Base64URLString = await generatePDFData({template:templatePath, data:params,async:true});
       resolve(base64PDF)
        } catch (error) {
           reject(error)
        }
     })
   }
}
export default new GeneratePdf();
