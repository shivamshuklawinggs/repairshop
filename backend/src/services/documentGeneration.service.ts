import { Model, Document } from 'mongoose';
import genearatePdfService from '../microservices/accounts-services/bill-services/services/genearatePdf.service';
import genearatePdfInvoiceService from '../microservices/accounts-services/invoice/services/genearatePdf.service';
import genearatePdfEstimateService from '../microservices/accounts-services/estimate/services/genearatePdf.service';
import sendEmail from '../libs/sendEmail';
import mongoose from 'mongoose';
import EmailTemplateService, { EmailTemplateData } from './emailTemplate.service';
import { ICustomer } from 'models/Customer.model';
import { ICarrier } from 'models/Carrier.model';

export interface DocumentConfig {
  model: Model<any>;
  documentType: 'bill' | 'invoice' | 'estimate';
  numberField: 'BillNumber' | 'invoiceNumber';
  pdfService: typeof genearatePdfService | typeof genearatePdfInvoiceService | typeof genearatePdfEstimateService;
  emailSubject: string;
  attachmentPrefix: string;
  populateField:"vendorId" |"customerId"
}

export interface DocumentMessage {
  id: string;
  [key: string]: any;
}

export interface DocumentFields {
  email?: string;
  emailStatus?: string;
  BillNumber?: string;
  invoiceNumber?: string;
  customerId?: ICustomer;
  vendorId?: ICarrier;
  invoiceDate?: Date;
  dueDate?: Date;
  summary?: {
    finalAmount?: number;
    balanceDue?: number;
  };
}

class DocumentGenerationService {
  private static async generatePdf(
    id: string, 
    pdfService: any,
    session?: mongoose.ClientSession
  ): Promise<string> {
    if (session) {
      return await pdfService.generatePdfData(id, session) as string;
    }
    return await pdfService.generatePdfData(id) as string;
  }

  private static async updateDocumentStatus(
    document: Document & DocumentFields,
    status: string,
    session?: mongoose.ClientSession
  ): Promise<void> {
    document.emailStatus = status;
    if (session) {
      await document.save({ session });
    } else {
      await document.save();
    }
  }

  private static extractCustomerName(document: Document & DocumentFields): string {
    // Try to get customer name from customerId (for invoices/estimates)
    if (document.customerId && document.customerId.company) {
      return document.customerId.company;
    }
    
    // Try to get vendor name from vendorId (for bills)
    if (document.vendorId && document.vendorId.company) {
      return document.vendorId.company;
    }
    
    // Fallback to default
    return 'Valued Customer';
  }

  static async handleDocumentGeneration(
    message: DocumentMessage,
    config: DocumentConfig
  ): Promise<void> {
    const { id = "" } = message;
    if (!id) return;

    let document: (Document & DocumentFields) | null = null;
    const session = await mongoose.startSession();

    try {
      await session.startTransaction();
      
      // Find document by ID with specific fields
      document = await config.model.findById(
        id,
        { 
          email: 1, 
          emailStatus: 1, 
          [config.numberField]: 1,
          invoiceDate: 1,
          dueDate: 1,
          summary: 1
        }
      ).populate(
        [
          {path: config.populateField},
        ]
      ).session(session);

      if (!document) {
        await session.abortTransaction();
        return;
      }

      if (!document.email) {
        await session.abortTransaction();
        return;
      }

      // Generate PDF
      const encodedPdf = await this.generatePdf(id, config.pdfService, session);

      // Prepare email data
      const documentNumber = document[config.numberField];
      
      // Prepare template data
      const templateData: EmailTemplateData = {
        [`${config.documentType}Number`]: documentNumber,
        customerName: this.extractCustomerName(document),
        invoiceDate: document.invoiceDate?.toLocaleDateString(),
        dueDate: document.dueDate?.toLocaleDateString(),
        amount: document.summary?.finalAmount?.toString(),
        balanceDue: document.summary?.balanceDue?.toString(),
      };

      // Render email template
      const emailHtml = await EmailTemplateService.renderTemplate(config.documentType, templateData);

      const emailData = {
        to:document.email,
        subject: config.emailSubject,
        html: emailHtml,
        attachments: [{
          filename: `${documentNumber}-${config.attachmentPrefix}.pdf`,
          content: Buffer.from(encodedPdf, 'base64'),
        }]
      };

      // Send email
      await sendEmail(emailData);

      // Update status
      await this.updateDocumentStatus(document, "Save & Send", session);

      await session.commitTransaction();

    } catch (error) {
      if (document && session) {
        try {
          await session.withTransaction(async () => {
            await this.updateDocumentStatus(document!, "Failed To Send", session);
          });
        } catch (saveError) {
          console.error('Failed to update document status:', saveError);
        }
      }
      
      console.error(`Error in ${config.documentType} generation:`, error);
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  // Specific handlers for each document type
  static async handleBillGeneration(message: DocumentMessage): Promise<void> {
    const BillModel = require('../models/Bill.model').default;
    
    const config: DocumentConfig = {
      model: BillModel,
      documentType: 'bill',
      numberField: 'BillNumber',
      pdfService: genearatePdfService,
      emailSubject: 'Bill',
      attachmentPrefix: 'bill',
      populateField:"vendorId",
    };

    await this.handleDocumentGeneration(message, config);
  }

  static async handleInvoiceGeneration(message: DocumentMessage): Promise<void> {
    const InvoiceModel = require('../models/Invoice.model').default;
    
    const config: DocumentConfig = {
      model: InvoiceModel,
      documentType: 'invoice',
      numberField: 'invoiceNumber',
      pdfService: genearatePdfInvoiceService,
      emailSubject: 'Invoice',
      attachmentPrefix: 'invoice',
      populateField:"customerId"
    };

    await this.handleDocumentGeneration(message, config);
  }

  static async handleEstimateGeneration(message: DocumentMessage): Promise<void> {
    const EstimateModel = require('../models/estimate.model').default;
    
    const config: DocumentConfig = {
      model: EstimateModel,
      documentType: 'estimate',
      numberField: 'invoiceNumber',
      pdfService: genearatePdfEstimateService,
      emailSubject: 'Estimate',
      attachmentPrefix: 'estimate',
      populateField:"customerId"
    };

    await this.handleDocumentGeneration(message, config);
  }
}

export default DocumentGenerationService;
