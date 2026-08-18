import React, { useEffect } from 'react'
import LoadInvoices from '@/pages/estimate-service/LoadInvoices/CustomerInvoiseForm'
import apiService from '@/service/apiService'
import { toast } from 'react-toastify'
import { useParams } from 'react-router-dom'
import { Box, Button, DialogActions, Modal, Typography } from '@mui/material'
import { initialInvoiseData as initialLoadInvoiceData } from '@/pages/invoice-service/genearateInvoiceSchema';
import { useQueryClient } from '@tanstack/react-query'
import { getIcon } from '@/components/common/icons/getIcon'
import AppModalDialog from '@/components/ui/AppModalDialog'
interface IState {
  showModal: boolean;
  setShowModal: (showModal: boolean) => void;
}
const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: {xs:'95%', md:'80%'},
  maxHeight: '85vh',
  bgcolor: 'background.paper',
  boxShadow: 24,
  pt: {xs:2, md:2.5},
  pr: {xs:2, md:3.5},
  pb: {xs:2, md:3.5},
  pl: {xs:2, md:3.5},
  overflow: 'auto',
  borderRadius:'16px',
};

const InvoiseSection: React.FC<IState> = ({ showModal, setShowModal }) => {
  const queryClient = useQueryClient()
  const { id } = useParams();
  const handleCreateInvoice = async (data: any): Promise<void> => {
    try {
      const response = await apiService.generateEstimateInvoice(data, "other"  );
      toast.success(response?.message || `Invoice created successfully`);
      queryClient.refetchQueries({ queryKey: ['getEstimatesByCustomerId',] })
    } catch (error: any) {
      toast.error(`Failed to create invoice`);
      toast.error(error.message);
    }
  };
  const [initialData, setInitialData] = React.useState<any>(null)
    useEffect(() => {
      let data:any={}

        data={
          ...initialLoadInvoiceData,
          customerId:id as string
        }

      setInitialData(data)
    }, [id])

  return <AppModalDialog style={{backdropFilter:'blur(3px)'}}
    open={showModal}
    onClose={() => setShowModal(false)}

    aria-labelledby="invoice-modal-title"
    aria-describedby="invoice-modal-description"
  >
    <Box sx={modalStyle}>
      <DialogActions className='dialog-close'>
        <Button onClick={() => setShowModal(false)}>
          {getIcon('CloseIcon')}
        </Button>
      </DialogActions>
      <Typography id="invoice-modal-title" variant="h6" component="h2" sx={{mb:{xs:2, md:0}}}>
          Create Estimate
        </Typography>
      {<LoadInvoices onSubmit={handleCreateInvoice} initialData={initialData} loading={false} />}
    </Box>
  </AppModalDialog>
}

export default InvoiseSection