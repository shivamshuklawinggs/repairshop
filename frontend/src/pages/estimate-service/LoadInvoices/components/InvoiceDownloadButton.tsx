import React, { useState } from "react";
import { Button} from "@mui/material";
import apiService from "@/service/apiService";
import { toast } from "react-toastify";
import { getIcon } from "@/components/common/icons/getIcon";

const buttonStyle = {
  textTransform: "none",
  fontSize: "10px",
  padding: "2px 4px",
  borderRadius: "3px",
  cursor: "pointer",
  transition: "all 0.2s ease-in-out",
}
const InvoiceDownloadButton: React.FC<{
  invoiseId:string,
  invoiceType: 'customer' | 'carrier' | "repair";
}> = ({ invoiseId }) => {
  const [loading, setLoading] = useState(false);



  // Handle Selection and Download
  const handleDownload = async (invoiceType: "customer" | "carrier" | 'repair') => {
    try {
      setLoading(true);
      const response = await apiService.generateAccountInvoicePdf(invoiseId);
      const data = response.data;
      const linkSource = `data:application/pdf;base64,${data}`;
      const downloadLink = document.createElement("a");
      const fileName = `invoice-${invoiceType}-${invoiseId}.pdf`;
      downloadLink.href = linkSource;
      downloadLink.download = fileName;
      downloadLink.click();
    } catch (error: any) {
      console.warn("Error downloading invoice:", error);
      toast.error(error.message || "Failed to download invoice");
    } finally {
      setLoading(false);
    }
  };

  return (
   
        <Button
          variant="contained"
          color="primary"
          size="small"
          startIcon={getIcon("pictureAsPdf")}
          onClick={() => handleDownload("carrier")}
          disabled={loading}
          sx={buttonStyle}
        >
          {loading ? "Downloading..." : "PDF"}
        </Button> 
  );
};

export default InvoiceDownloadButton;
