import { UseFormReturn } from 'react-hook-form';
import { IInvoice, invoiceexpense, IProductService, ITaxOption, IVendorBill } from '@/types';
interface InvoiceCalculationResult {
  subTotal: number;
  totalDiscount: number;
  taxAmount: number;
  total: number;
  balanceDue: number;
}
export const serviceGetQuery=(service:string,form:UseFormReturn< IInvoice>,type:"invoice"|"bill")=>{
  if(!service){
    return ""
  }
  const {watch}=form
  const product=(watch("productServiceArray") || [])?.find((item:IProductService)=>item._id===service)
  
  return type==="invoice"?product?.incomeAccountData?.name || "N/A":product?.expenseAccountData?.name || "N/A"
}
export const calculateexpenseAmount = (expense:invoiceexpense,data: IInvoice) => {
  const taxId = expense.tax;
  const taxRate =taxId? data.taxArray?.find((option:ITaxOption) => option._id === taxId)?.value || 0:0
  const taxAmount = (expense.rate * expense.qty || 0) * taxRate / 100;
  const amount = expense.rate * expense.qty + taxAmount;
  return amount;
}
export const calculateExpenseTotalAmount = (expense:invoiceexpense[]) => {
   return expense.reduce((total,expense)=>{
    const amount = (expense.rate * expense.qty || 0) 
    return total + amount;
   },0)
}
export const calculateExpenseTaxAmount = (expense:invoiceexpense,data:IInvoice|IVendorBill) => {
  const taxId =expense.tax;
  const taxRate =taxId? data.taxArray?.find((option:ITaxOption) => option._id === taxId)?.value || 0:0
  const taxAmount = (expense.rate * expense.qty || 0) * taxRate / 100;
  return taxAmount;
}
export function calculateInvoiceSummary(
  form: UseFormReturn<IInvoice>,
): InvoiceCalculationResult {
  const { watch, setValue } = form as UseFormReturn<IInvoice>
 
  const formData = watch(); // one call to watch() for all fields

  const subTotal =calculateExpenseTotalAmount(formData.expense);
  const discountPercent = Number(isNaN(formData.discountPercent) ? 0 : formData.discountPercent);
  const totalDiscount = (subTotal || 0) * discountPercent / 100;
  const totalAfterDiscount=(subTotal-totalDiscount)
  const taxAmount = watch("expense")?.reduce((total, expense:invoiceexpense) =>{
    let amount = calculateExpenseTaxAmount(expense,formData) 
   
    return total + amount;
  }, 0) || 0;
  const total = totalAfterDiscount + taxAmount;
  const recievedAmount=watch("recievedPaymentAmount")?.reduce((total, payment) =>{
    return total + payment.amount;
  }, 0) || 0;
  const balanceDue = recievedAmount > total ? 0 : total - recievedAmount;
  // Optionally update the form
    setValue("subTotal",subTotal);
    setValue("totalDiscount",totalDiscount);
    setValue("taxAmount",taxAmount);
    setValue("total",total);
    setValue("balanceDue",balanceDue) // temporary set we will update it when payment modal create
   
  return {
    subTotal,
    totalDiscount,
    taxAmount,
    total,
    balanceDue,
  };
}
export function calculateBillSummary(
  form: UseFormReturn<IVendorBill>,
): InvoiceCalculationResult {
  const { watch, setValue } = form as UseFormReturn<IVendorBill>
 
  const formData = watch(); // one call to watch() for all fields
  const subTotal =calculateExpenseTotalAmount(formData.expense);

  const discountPercent = Number(isNaN(formData.discountPercent) ? 0 : formData.discountPercent);
  const totalDiscount = (subTotal || 0) * discountPercent / 100;

  const totalAfterDiscount=(subTotal-totalDiscount)
  const taxAmount = watch("expense")?.reduce((total, expense:invoiceexpense) =>{
    let amount = calculateExpenseTaxAmount(expense,formData) 
   
    return total + amount;
  }, 0) || 0;
  const total = totalAfterDiscount + taxAmount;
  const recievedAmount=watch("recievedPaymentAmount")?.reduce((total, payment) =>{
    return total + payment.amount;
  }, 0) || 0;
  const balanceDue = recievedAmount > total ? 0 : total - recievedAmount;
  // Optionally update the form
    setValue("subTotal",subTotal);
    setValue("totalDiscount",totalDiscount);
    setValue("taxAmount",taxAmount);
    setValue("total",total);
    setValue("balanceDue",balanceDue) // temporary set we will update it when payment modal create
    
   
  return {
    subTotal,
    totalDiscount,
    taxAmount,
    total,
    balanceDue,
  };
}

