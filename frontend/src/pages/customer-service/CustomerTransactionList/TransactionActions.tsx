import React, { useState } from 'react';
import { Box, Button, ButtonGroup, Menu, MenuItem, } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { paths } from '@/utils/paths';
import { useNavigate,useParams } from 'react-router-dom';
import EstimateSection from './Modals/EstimateSection';
import InvoiseSection from './Modals/InvoiseSection';
import { ICustomerTransactionDetails } from '@/types';
import UniversalCustomerForm from '../UniversalCustomerForm';
import { useQueryClient } from '@tanstack/react-query';

const TransactionActions = ({setOpen,data}: {setOpen: (open: boolean) => void,data:ICustomerTransactionDetails}) => {
  const navigate = useNavigate();
  const {id=""}=useParams()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const[InvoiceModal,setInvoiceModal] = useState(false)
  const [EstimateModal,setEstimateModal] = useState(false)
  const [customOpen,setCustomOpen] = useState(false)
  const qc = useQueryClient();

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };


  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  const handleCloseCustomForm = () => {
    setCustomOpen(false);

      qc.invalidateQueries({
        queryKey: ['getCustomerInvoiceDetails', id],
      })

  }
  return (
    <>
    <Box display="flex" justifyContent="flex-end" gap={1.5}>
      {/* Edit Button Group */}
      <ButtonGroup variant="outlined">
        <Button onClick={() => setCustomOpen(true)} sx={{borderRadius:'6px', px:1.2, py:0.2}}>
          <EditIcon sx={{ mr:0.3, fontSize:'15px' }}/>
          Edit
        </Button>
      </ButtonGroup>
      {/* New Transaction Button with Dropdown */}
      <Button sx={{borderRadius:'6px', fontSize:'13px', padding:'5px 8px 5px 12px'}}
        variant="contained"
        onClick={handleMenuOpen}
        endIcon={<ArrowDropDownIcon />}
      >
        New Transaction
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => setInvoiceModal(true)}>Invoice</MenuItem>
        <MenuItem onClick={() => navigate(`${paths.accountrecievedpayment}/${id}`)}>Receive Payment</MenuItem>
        <MenuItem onClick={() => setEstimateModal(true)}>Estimate</MenuItem>
        <MenuItem onClick={() => setOpen(true)}>Statement</MenuItem>
      </Menu>
    </Box>
    <EstimateSection showModal={EstimateModal} setShowModal={setEstimateModal} />
    <InvoiseSection showModal={InvoiceModal} setShowModal={setInvoiceModal} />
    <UniversalCustomerForm data={data} onClose={handleCloseCustomForm} open={customOpen} id={id}/>
    </>

  );
};

export default TransactionActions;
