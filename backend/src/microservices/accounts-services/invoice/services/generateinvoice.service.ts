import { Request, Response } from "express";
import mongoose, { Document, Types } from "mongoose";
import { IFile } from "types/file";
import InvoiceModel, { IInvoice } from "models/Invoice.model";
import { updateMockProductService, updateProductService, } from "microservices/products-services/product.service";
import EstimateModal from "models/estimate.model";
import { GenerateInvoiceSchema } from "../invoice.validate";
import { AppError } from "middlewares/error";
import { producers } from "config/bullmq";
import moment from "moment";
import { generateUniqueId } from "models/universalid.model";
import InvoiceReminderTemplate from "models/InvoiceReminderTemplate.model";

class GenerateInvoice {
  constructor() {
    this.generateCustomerInvoice = this.generateCustomerInvoice.bind(this);
    this.importInvoice = this.importInvoice.bind(this);
    this.validateInvoice = this.validateInvoice.bind(this)
    this.scheduleInvoiceReminders = this.scheduleInvoiceReminders.bind(this)

  }
  public async scheduleInvoiceReminders({
    invoiceId,
    dueDate,
    companyId,
  }: {
    invoiceId: Types.ObjectId;
    dueDate: Date;
    companyId: Types.ObjectId;
  }) {
    try {
      const now = moment();
      const due = moment(dueDate);

      // Fetch active reminder templates for the company
      const templates = await InvoiceReminderTemplate.find({
        companyId,
        isActive: true
      });

      if (templates.length === 0) {
        // No templates configured, skip scheduling
        return;
      }

      for (const template of templates) {
        let triggerDate;

        // Calculate trigger date based on template type
        if (template.templateType === 'before') {
          const daysBefore = template.daysBeforeDue || 7;
          triggerDate = due.clone().subtract(daysBefore, "days");
        } else if (template.templateType === 'after') {
          const daysAfter = template.daysAfterDue || 1;
          triggerDate = due.clone().add(daysAfter, "days");
        } else {
          // on_due
          triggerDate = due.clone();
        }

        // Calculate reminder count based on frequency
        const maxReminders = template.maxReminders || 5;

        if (template.frequency === 'daily' || template.frequency === 'weekly' || template.frequency === 'custom') {
          const intervalDays = template.frequency === 'custom' 
            ? (template.customIntervalDays || 1)
            : (template.frequency === 'weekly' ? 7 : 1);

          // Schedule multiple reminders based on frequency and maxReminders
          for (let i = 0; i < maxReminders; i++) {
            const currentTriggerDate = triggerDate.clone().add(i * intervalDays, 'days');

            // Only schedule future jobs
            if (currentTriggerDate.isAfter(now)) {
              const delay = currentTriggerDate.diff(now);

              await producers.invoice.sendReminder(
                { invoiceId },
                { delay }
              );
            }
          }
        } else {
          // Once only
          if (triggerDate.isAfter(now)) {
            const delay = triggerDate.diff(now);

            await producers.invoice.sendReminder(
              { invoiceId },
              { delay }
            );
          }
        }
      }
    } catch (error) {
      console.error('Error scheduling invoice reminders:', error);
      // Don't throw error to prevent invoice creation from failing
    }
  }
  public async generateCustomerInvoice(req: Request, res: Response, session: mongoose.ClientSession): Promise<{
    success: boolean,
    _id: string,
    message: string,
    dueDate: Date
  }> {

    return new Promise(async (resolve, reject) => {
      try {
        const files: IFile[] = req.files as IFile[] || [];
        const id=await generateUniqueId({prefix:"INVOICE-",companyId:res.locals.companyId as unknown as Types.ObjectId,session})
        // Create invoice payload
        const invoicePayload: Omit<IInvoice, keyof Document> = {
          ...req.body,
          status: 'Pending',
          files: files,
          createdBy: req.user?._id as unknown as Types.ObjectId,
          updatedBy: req.user?._id as unknown as Types.ObjectId,
          ownerAdminId:req.user?.ownerAdminId,
          manager:req.user?.manager,
          companyId: res.locals.companyId as unknown as Types.ObjectId,
          id:id
        };

        // Create invoice

        const [invoice] = await InvoiceModel.create([invoicePayload], { session });
        await updateProductService(invoicePayload.expense, [], true, session, "invoice", res,req)
        await invoice.save({ session });
        await EstimateModal.deleteMany({ invoiceNumber: invoice.invoiceNumber, companyId: invoice.companyId }).session(session)

        resolve({
          success: true,
          message: `Invoice created successfully`,
          _id: invoice._id,
          dueDate: invoice.dueDate
        })
      } catch (error) {
        reject(error)
      }
    })
  }
  public async generateMockInvoice({data,ownerAdminId,createdBy,companyId, session}:{data:Omit<IInvoice, keyof Document>,createdBy:Types.ObjectId,companyId:Types.ObjectId,ownerAdminId:Types.ObjectId, session: mongoose.ClientSession}): Promise<{
    success: boolean,
    _id: string,
    message: string,
  }> {
    return new Promise(async (resolve, reject) => {
      try {
        // Create invoice payload
        const invoicePayload: Omit<IInvoice, keyof Document> = {
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
        await EstimateModal.deleteMany({ invoiceNumber: invoice.invoiceNumber, companyId: invoice.companyId }).session(session)
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
    validateData: GenerateInvoiceSchema[],
    res: Response,
    session: mongoose.ClientSession,
    req: Request
  ): Promise<{
    success: boolean,
    message: string,
    invoices: {
      _id: string,
      invoiceNumber: string,
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
             const id=await generateUniqueId({prefix:"INVOICE-",companyId:res.locals.companyId as unknown as Types.ObjectId,session})
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
        const invoices: IInvoice[] = [];
        for (const carrierData of invoicePayloads) {
          const carrier = new InvoiceModel(carrierData);
          await carrier.validate(); // throws if documents required and missing
          await carrier.save({ session });
          invoices.push(carrier);
        }
        // Insert all invoices at once

        // Post insert ops for each invoice
        for (const invoice of invoices) {
          await updateProductService(
            invoice.expense,
            [],
            true,
            session,
            "invoice", res,req
          );

          await EstimateModal.deleteMany({
            invoiceNumber: invoice.invoiceNumber,
            companyId: invoice.companyId,
          }).session(session);
        }

        resolve({
          success: true,
          message: `${invoices.length} invoice(s) created successfully`,
          invoices: invoices.map((inv) => ({
            _id: inv._id,
            invoiceNumber: inv.invoiceNumber,
          })),
        });
      } catch (error) {
        reject(error);
      }
    });
  }
  public async validateInvoice(validateData: GenerateInvoiceSchema[],
    session: mongoose.ClientSession,companyId:string) {
    return new Promise(async (resolve, reject) => {
      try {
        // Build invoice payloads
        const invoicePayloads = validateData.map((reqData) => reqData.invoiceNumber)
        const checkInvoiceEsitornot = await InvoiceModel.find({ invoiceNumber: { $in: invoicePayloads },companyId:companyId }, { invoiceNumber: 1 }).session(session)
        if (checkInvoiceEsitornot.length > 0) {
          throw new AppError("Invoice Numbers Are Already exist", 400, { allErrors: checkInvoiceEsitornot.map((invoice) => invoice.invoiceNumber) })
        }
        resolve({
          success: true,
          message: "Invoice Numbers Are valid",
          list: checkInvoiceEsitornot
        })
      } catch (error) {
        reject(error)
      }
    });
  }



}
export default new GenerateInvoice();
