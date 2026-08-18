import { Request, Response } from "express";
import mongoose, { Types } from "mongoose";
import { IFile } from "types/file";
import InvoiceModel, { IIestimate } from "models/estimate.model";
import { calculateEstimateSummary } from "utils/CalculateInvoiceBillInput";


 class GenerateInvoice {
    constructor() {
        this.generateCustomerInvoice = this.generateCustomerInvoice.bind(this);
    }
    public async generateCustomerInvoice (req: Request, res: Response, session: mongoose.ClientSession) {
      return new Promise(async(resolve,reject)=>{
      try {
        const files:IFile[] = req.files as IFile[] || [];
        // Create invoice payload
        const invoicePayload:Partial<IIestimate> = {
          ...req.body,
          type:'customer',
          status: 'Pending',
          files:files,
          createdBy : req.user?._id as unknown as Types.ObjectId,
          updatedBy : req.user?._id as unknown as Types.ObjectId,
          companyId:res.locals.companyId as unknown as Types.ObjectId,
          ownerAdminId:req.user?.ownerAdminId,
          manager:req.user?.manager
        };
        // Create invoice
        const [invoice] = await InvoiceModel.create([invoicePayload], { session });
        await invoice.save({ session });
        await  calculateEstimateSummary({
          id:invoice._id,
          session,
        });
        resolve({
          success: true,
          message:`Invoice created successfully`,
          _id:invoice._id
        })
      } catch (error) {
        reject(error)
      } 
    })
    }

}
export default new GenerateInvoice();
