import React, { useState } from "react";
import { Button } from "@mui/material";
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
}> = ({ invoiseId }) => {
  const [loading, setLoading] = useState(false);



  // Handle Selection and Download
  const handleDownload = async () => {

    try {
      setLoading(true);
      const response = await apiService.generateAccountInvoicePdf(invoiseId);
      const data = response.data;
      const linkSource = `data:application/pdf;base64,${data}`;
      const downloadLink = document.createElement("a");
      const fileName = `invoice-${invoiseId}.pdf`;
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
          variant="outlined"
          color="primary"
          size="small"
          startIcon={getIcon("pictureAsPdf")}
          onClick={() => handleDownload()}
          disabled={loading}
          sx={{
            py: 0,
            px:1,
            minWidth:'auto',
            minHeight:'auto',
            borderRadius: 0.5,
            border:'none',
            fontSize: '12px',
            fontWeight: '600',
            '& .MuiButton-startIcon': {
              marginRight: '4px'
            },
            '& .MuiButton-startIcon svg': {
              fontSize: '15px'
            }
          }}
        >
          {loading ? "Downloading.." : "PDF"}
        </Button>
  );
};

export default InvoiceDownloadButton;
