import { Request, Response } from "express";
import mongoose from "mongoose";
import { AppError } from "middlewares/error";
import { IFile } from "types/file";
import InvoiceModel, { IIestimate } from "models/estimate.model";
import { FileService } from "./file.service";

const updateCustomerInvoice = async (req: Request, res: Response, session: mongoose.ClientSession) => {
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
      const invoicePayload:Partial<IIestimate> = {
        ...req.body,
        createdBy : req.user?._id as unknown as mongoose.Types.ObjectId,
        updatedBy : req.user?._id as unknown as mongoose.Types.ObjectId,
        companyId:res.locals.companyId as unknown as mongoose.Types.ObjectId
      };

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
      }
    } catch (error) {
     throw error;
    } 
  };
  export {updateCustomerInvoice};
