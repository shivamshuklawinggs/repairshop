import { useCallback, useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import apiService from '@/service/apiService';
import { useAppSelector } from '@/redux/store';
import { capitalizeFirstLetter } from '@/utils';

interface UseLoadStatusCheckProps {
  documentNumber: string;
  documentType: 'invoice' | 'estimate' | 'bill';
  initialData?: any;
  onDocumentCheckSuccess?: (response: any) => void;
  onDocumentCheckError?: (error: any) => void;
  onDocumentNotFound?: () => void;
  apiMethod: 'checkAccountInvoiceNumberExist' | 'checkAccountBillNumberExist';
}

interface LoadStatusCheckResult {
  isAvailable: null | boolean;
  isLoading: boolean;
  loadStatusError?: string;
  checkDocumentNumber: () => Promise<void>;
}

export const useLoadStatusCheck = ({
  documentNumber,
  documentType,
  initialData,
  onDocumentCheckSuccess,
  onDocumentCheckError,
  onDocumentNotFound,
  apiMethod
}: UseLoadStatusCheckProps): LoadStatusCheckResult => {
  const form = useFormContext();
  const [isAvailable, setIsAvailable] = useState<null | boolean>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadStatusError, setLoadStatusError] = useState<string>();

  const checkDocumentNumber = useCallback(async () => {
    if (!documentNumber?.trim()) return;
    try {
      setIsLoading(true);
      setLoadStatusError(undefined);
      form.clearErrors(documentType === 'bill' ? 'BillNumber' : 'invoiceNumber');
      const response = await apiService[apiMethod](documentNumber, form.watch("type"));
      setIsAvailable(true);
      onDocumentCheckSuccess?.(response);

    } catch (error:any) {
      const errorMessage =error?.message  || "Something IS Wrong"
      form.setError(documentType === 'bill' ? 'BillNumber' : 'invoiceNumber', {
        type: 'manual',
        message: errorMessage
      });
      setIsAvailable(false);
      onDocumentCheckError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [documentNumber, documentType, initialData, apiMethod, form, onDocumentCheckSuccess, onDocumentCheckError, onDocumentNotFound]);

  // Auto-check when document number changes (only for new documents)
  useEffect(() => {
    if (!initialData?._id && documentNumber?.trim()) {
      const timeoutId = setTimeout(() => {
        checkDocumentNumber();
      }, 500); // Debounce for 500ms

      return () => clearTimeout(timeoutId);
    }
  }, [documentNumber]);

  // Set availability when editing
  useEffect(() => {
    if (initialData?._id) {
      setIsAvailable(true);
      setLoadStatusError(undefined);
    }
  }, [initialData?._id]);

  return {
    isAvailable,
    isLoading,
    loadStatusError,
    checkDocumentNumber
  };
};
