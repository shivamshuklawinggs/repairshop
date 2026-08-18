import React from "react";
import CustomerInvoiceForm from "@/pages/carrier-service/VendorBills/CustomerInvoiseForm";
import apiService from "@/service/apiService";
import { toast } from "react-toastify";
import { useParams } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { useQuery, useMutation } from '@tanstack/react-query';

const modalStyle = {
  //position: 'absolute',
  //top: '50%',
  //left: '50%',
  //transform: 'translate(-50%, -50%)',
  //width: '90%',
  //maxHeight: '90vh',
  // bgcolor: 'background.paper',
  // boxShadow: 24,
  // pt: 2.5,
  // pr: 3.5,
  // pb: 3.5,
  // pl: 3.5,
  // overflow: 'auto',
  // borderRadius:'16px',
};

const BillSectionEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const { data: initialData, isLoading } = useQuery({
    queryKey: ['accountBill', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await apiService.getAccountBillById(id);
      return response.data;
    },
    enabled: !!id,
  });

  const updateBillMutation = useMutation({
    mutationFn: (data: FormData) => apiService.updateAccountBill(id as string, data),
    onSuccess: (response) => {
      toast.success(response?.message || "Bill updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update bill");
    },
  });

  const handleCreateInvoice = async (data: FormData): Promise<void> => {
    await updateBillMutation.mutateAsync(data);
  };

  return isLoading ? (
    <LoadingSpinner size={50} />
  ) : !initialData ? (
    <Box sx={modalStyle}>
      <Typography id="invoice-modal-title" variant="h6" component="h2">
        Create Bill
      </Typography>
      <Typography variant="body1" color="error">
        Bill not found
      </Typography>
    </Box>
  ) : (
    <Box sx={modalStyle}>
      <Typography id="invoice-modal-title" variant="h6" component="h2">
        Edit Bill
      </Typography>
        <CustomerInvoiceForm
          onSubmit={handleCreateInvoice}
          initialData={initialData}
          loading={updateBillMutation.isPending}
        />
    </Box>
  );
};

export default BillSectionEdit;
