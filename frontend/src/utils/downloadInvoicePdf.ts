// utils/downloadInvoicePdf.ts

import { toast } from "react-toastify";
import apiService from "@/service/apiService";

interface DownloadInvoicePdfProps {
  invoiceId: string;
  setLoading?: (loading: boolean) => void;
  title?:"Invoice" | "Estimate"
}

export const downloadInvoicePdf = async ({
  invoiceId,
  setLoading,
  title="Invoice"
}: DownloadInvoicePdfProps): Promise<void> => {
  try {
    setLoading?.(true);

    const response =title==="Invoice"? await apiService.generateAccountInvoicePdf(
      invoiceId
    ): await apiService.generateEstimateInvoicePdf(
      invoiceId
    );

    const data = response.data;

    const linkSource = `data:application/pdf;base64,${data}`;

    const downloadLink = document.createElement("a");

    downloadLink.href = linkSource;
    downloadLink.download = `${title.toLowerCase()}-${invoiceId}.pdf`;

    downloadLink.click();
  } catch (error: any) {
    console.warn("Error downloading invoice:", error);

    toast.error(
      error?.message || `Failed To download ${title}`
    );
  } finally {
    setLoading?.(false);
  }
};