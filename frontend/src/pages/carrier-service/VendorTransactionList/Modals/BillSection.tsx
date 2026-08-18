import React from 'react'
import CustomerInvoiceForm from '@/pages/carrier-service/VendorBills/CustomerInvoiseForm'
import apiService from '@/service/apiService'
import { toast } from 'react-toastify'
import { Box, Button, DialogActions, Modal, Typography } from '@mui/material'
import { initialInvoiseData as initialLoadInvoiceData } from '@/pages/carrier-service/VendorBills/genearateInvoiceSchema';
import { getIcon } from '@/components/common/icons/getIcon'
import AppModalDialog from '@/components/ui/AppModalDialog'

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

interface IState {
  showModal: boolean;
  setShowModal: (showModal: boolean) => void;
}
const BillSection:React.FC<IState> = ({showModal,setShowModal}) => {
    const handleCreateInvoice = async (data: any): Promise<void> => {
      try {
        const  response = await apiService.generateAccountBill(data);
        toast.success(response?.message || `Invoice created successfully`);
      } catch (error: any) {
        toast.error(`Failed to create invoice`);
        toast.error(error.message);
      }
    };

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
        <Typography id="invoice-modal-title" variant="h6" component="h2" sx={{mb:{xs:2.5, md:0}}}>
          Create Bill
        </Typography>
        <CustomerInvoiceForm onSubmit={handleCreateInvoice} initialData={initialLoadInvoiceData} loading={false} />
      </Box>
    </AppModalDialog>
}

export default BillSection