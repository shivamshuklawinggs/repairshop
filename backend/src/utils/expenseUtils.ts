import mongoose from 'mongoose';
/**
 * Common validation logic for document number existence
 */
export interface DocumentValidationOptions {
  documentNumber: string;
  companyId: mongoose.Types.ObjectId;
  documentType: 'invoice' | 'bill';
  documentField: 'invoiceNumber' | 'BillNumber';
  userId: mongoose.Types.ObjectId
}

export const validateDocumentExistence = async (
  options: DocumentValidationOptions,
  InvoiceModel: mongoose.Model<any>,
): Promise<void> => {
  const { documentNumber, companyId, documentType, documentField } = options;

  // 1. Check document existence
  const existingDocument = await InvoiceModel.exists(
    { [documentField]: documentNumber, companyId },
  )

  if (existingDocument) {
    throw new Error(
      `${documentType.charAt(0).toUpperCase() + documentType.slice(1)} number already exists`
    );
  }

};

