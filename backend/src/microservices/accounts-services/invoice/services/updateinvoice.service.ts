import { Request, Response } from "express";
import mongoose, { Document } from "mongoose";
import { AppError } from "middlewares/error";
import { IFile } from "types/file";
import InvoiceModel, { IInvoice } from "models/Invoice.model";
import { FileService } from "./file.service";
import { updateProductService } from "microservices/products-services/product.service";


const updateCustomerInvoice = async (req: Request, session: mongoose.ClientSession,res:Response) => {
    try {
      const invoiceId=req.params.invoiceId;
     
      const files:IFile[] = req.files as IFile[] || [];
      
      let existingInvoice = await InvoiceModel.findOne({_id:invoiceId}).session(session)
      if (!existingInvoice) {
        throw new AppError('Invoice not found', 404);
      }
      if (req?.body?.deletedfiles?.length) {
        const deletedFiles = req?.body?.deletedfiles.map((file: string) => file);
        await FileService.deleteExistedFiles(deletedFiles);
        existingInvoice && (existingInvoice.files = existingInvoice?.files?.filter((file) => !deletedFiles.includes(file.filename)));
      }

       if(files && files.length>0){
         files.forEach((file) => {
           existingInvoice?.files?.push(file);
         });
      }
     
     
      // Create invoice payload
      const invoicePayload:Omit<IInvoice,keyof Document> = {
        ...req.body,
        updatedBy : req.user?._id as unknown as mongoose.Types.ObjectId,
      };
      await updateProductService(invoicePayload.expense,existingInvoice.expense,false,session,"invoice",res,req)
        for(const key in invoicePayload) {
           let value=(invoicePayload as any)[key];
      
          if (value || value === 0) {
            (existingInvoice as any)[key] = value;
          }
        }
    
      await existingInvoice.save({ session });
      return {
        success: true,
        message:`Invoice updated successfully`,
        _id:existingInvoice._id?.toString()
      }
    } catch (error) {
      throw error;
    } 
  };

  export {updateCustomerInvoice};
