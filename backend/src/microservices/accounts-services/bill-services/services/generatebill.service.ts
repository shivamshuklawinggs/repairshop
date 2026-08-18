import { Request, Response } from "express";
import mongoose, { Document, Types } from "mongoose";
import { IFile } from "types/file";
import { GenerateBillSchema } from "../bill.validate";
import InvoiceModel, { IBill } from "models/Bill.model";
import { updateMockProductService, updateProductService } from "microservices/products-services/product.service"
import { AppError } from "middlewares/error";
import { generateUniqueId } from "models/universalid.model";
class GenerateInvoice {
  constructor() {
    this.generateCarrierInvoice = this.generateCarrierInvoice.bind(this);
    this.validateBill = this.validateBill.bind(this)
    this.importInvoice = this.importInvoice.bind(this)
  }

  public async generateCarrierInvoice(req: Request, res: Response, session: mongoose.ClientSession):Promise<{
           success: boolean,
          _id: string,
          message: string,
  }> {
    return new Promise(async (resolve, reject) => {
      try {

        // consert req.body to json format
       
        const files: IFile[] = req.files as IFile[] || [];
      
        // Find the load by invoice number

        // Create invoice payload
         const id=await generateUniqueId({prefix:"BILL-",companyId:res.locals.companyId as unknown as Types.ObjectId,session})
        const invoicePayload: Omit<IBill, keyof Document> = {
           ...req.body,
          createdBy: req.user?._id as unknown as Types.ObjectId,
          updatedBy: req.user?._id as unknown as Types.ObjectId,
          companyId: res.locals.companyId as unknown as Types.ObjectId,
          ownerAdminId:req.user?.ownerAdminId,
          manager:req.user?.manager,
          files,
          id:id
        };

        const [invoice] = await InvoiceModel.create([invoicePayload], { session });
        await updateProductService(invoicePayload.expense, [], true, session, "bill",res,req)

        await invoice.save({ session });
        resolve({
          success: true,
          _id: invoice._id,
          message: `Invoice created successfully`,
        })
      } catch (error) {
        reject(error);
      }
    })
  }
    public async generateMockBill({data,ownerAdminId,createdBy,companyId, session}:{data:Omit<IBill, keyof Document>,createdBy:Types.ObjectId,companyId:Types.ObjectId,ownerAdminId:Types.ObjectId, session: mongoose.ClientSession}): Promise<{
      success: boolean,
      _id: string,
      message: string,
    }> {
      return new Promise(async (resolve, reject) => {
        try {
          // Create invoice payload
          const invoicePayload: Omit<IBill, keyof Document> = {
            ...data,
            createdBy: createdBy,
            updatedBy: createdBy,
            ownerAdminId:ownerAdminId,
            companyId: companyId,
          };
          // Create invoice
          const [invoice] = await InvoiceModel.create([invoicePayload], { session });
          await updateMockProductService(invoicePayload.expense, [], true, session, "invoice", companyId)
          await invoice.save({ session });
          resolve({
            success: true,
            message: `Invoice created successfully`,
            _id: invoice._id,
          })
        } catch (error) {
          reject(error)
        }
      })
    }
  public async importInvoice(
    validateData: GenerateBillSchema[],
    res: Response,
    session: mongoose.ClientSession,
    req:Request
  ): Promise<{
      success: boolean,
      message: string,
      invoices: {
        _id: string,
        BillNumber: string,
      }[]
    }> {
    return new Promise(async (resolve, reject) => {
      try {
        if (!Array.isArray(validateData) || validateData.length === 0) {
          return reject(new Error("validateData must be a non-empty array"));
        }

        // Build invoice payloads
        const invoicePayloads = await Promise.all(
          validateData.map(async (reqData) => {
            const id = await generateUniqueId({ prefix: "BILL-", companyId: res.locals.companyId as unknown as Types.ObjectId, session })

            return {
              ...reqData,
              status: "Pending",
              createdBy: req.user?._id as unknown as Types.ObjectId,
              updatedBy: req.user?._id as unknown as Types.ObjectId,
              companyId: res.locals.companyId as unknown as Types.ObjectId,
              ownerAdminId:req.user?.ownerAdminId,
              manager:req.user?.manager,
              id:id
            };
          })
        );
        const invoices: IBill[] = [];
        // Insert all invoices at once
        for (const carrierData of invoicePayloads) {
            const carrier = new InvoiceModel(carrierData);
            await carrier.validate(); // throws if documents required and missing
            await carrier.save({ session  });
            invoices.push(carrier);
          }
       

        // Post insert ops for each invoice
        for (const invoice of invoices) {
          await updateProductService(
            invoice.expense,
            [],
            true,
            session,
            "bill",res,req
          );
        }

        resolve({
          success: true,
          message: `${invoices.length} invoice(s) created successfully`,
          invoices: invoices.map((inv) => ({
            _id: inv._id,
            BillNumber: inv.BillNumber,
          })),
        });
      } catch (error) {
        reject(error);
      }
    });
  }
  public async validateBill(validateData: GenerateBillSchema[],
    session: mongoose.ClientSession,companyId:string) {
    return new Promise(async (resolve, reject) => {
      try {
        // Build invoice payloads
        const invoicePayloads = validateData.map((reqData) => reqData.BillNumber)


        const checkInvoiceEsitornot = await InvoiceModel.find({ BillNumber: { $in: invoicePayloads } ,companyId:companyId}, { BillNumber: 1 }).session(session)
        if (checkInvoiceEsitornot.length > 0) {
          throw new AppError("Bill Numbers Are Already exist",400,{allErrors:checkInvoiceEsitornot.map((invoice)=>invoice.BillNumber)})
        }
        resolve({
          success: true,
          message: "Bill Numbers Are valid",
          list:invoicePayloads
        })
      } catch (error) {
        reject(error);
      }
    });
  }

}
export default new GenerateInvoice();
