import {  Request, Response } from "express";
import mongoose, { Document, Types } from "mongoose";
import { AppError } from "middlewares/error";
import { IFile } from "types/file";
import InvoiceModel, { IBill } from "models/Bill.model";
import { FileService } from "./file.service";
import { updateProductService } from "microservices/products-services/product.service";
const updateCarrierInvoice=async (req: Request, session: mongoose.ClientSession,res:Response)=> {
    try {
      // consert req.body to json forma
      const files:IFile[] = req.files as IFile[] || [];
      // Find the load by invoice number
     
      let existingInvoice = await InvoiceModel.findOne({_id:req.params.invoiceId})
      if(!existingInvoice){
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
      const invoicePayload :Omit<IBill,keyof Document> = {
         ...req.body,
        updatedBy: req.user?._id as unknown as Types.ObjectId,
      };
      await updateProductService(invoicePayload.expense,existingInvoice.expense,false,session,"bill",res,req)
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
        _id:existingInvoice._id
      };
    } catch (error) {
      throw error;
    } 
  };

  export {updateCarrierInvoice};
