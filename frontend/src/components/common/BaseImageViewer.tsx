import { useParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import apiService from "@/service/apiService";
import {
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Box,
  CardMedia,
} from "@mui/material";
import { useEffect } from "react";

const BaseImageViewer = () => {
  const { id, type } = useParams<{ id: string; type: "invoice" | "bill" | "estimate" }>();

  const fetchPdf = async (): Promise<string> => {
    if (!id || !type) throw new Error("Missing parameters");

    let response;
    if (type === "estimate") {
      response = await apiService.generateEstimateInvoicePdf(id);
    } else if (type === "bill") {
      response = await apiService.generateAccountBillPdf(id);
    } else {
      response = await apiService.generateAccountInvoicePdf(id);
    }

    if (typeof response.data !== "string") throw new Error("Invalid PDF data");
    return response.data;
  };

  const {
    mutate,
    data: pdfData,
    isPending,
    isError,
    error,
  } = useMutation({
    mutationFn: fetchPdf,
  });

  // 🔁 Trigger mutation when params change
  useEffect(() => {
    if (id && type) mutate();
  }, [id, type]);

  return (
    <Card sx={{ mt: 4, boxShadow: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {type === "estimate" ? "Estimate" : type === "bill" ? "Bill" : "Invoice"}
        </Typography>

        {isPending ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="300px">
            <CircularProgress />
          </Box>
        ) : isError ? (
          <Typography color="error" textAlign="center">
            {(error as Error).message || "Failed to load PDF"}
          </Typography>
        ) : (
          pdfData && (
            <CardMedia
              component="iframe"
              src={`data:application/pdf;base64,${pdfData}`}
              title="Invoice PDF"
              width="100%"
              height="600px"
              style={{ border: "none", borderRadius: "8px" }}
            />
          )
        )}
      </CardContent>
    </Card>
  );
};

export default BaseImageViewer;
