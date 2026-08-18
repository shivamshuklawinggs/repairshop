import React, { useState } from 'react';
import { Button, IconButton, Box, TableRow, TableCell, Tooltip } from '@mui/material';
import { PageHeader, DataTable } from '@/components/ui';
import { Add as AddIcon, AddCircleTwoTone, AddIcCall, Edit as EditIcon, Delete } from '@mui/icons-material';
import PaymentTermForm from './components/PaymentTermForm';
import { IPaymentTerm } from '@/types';
import { useDispatch, } from 'react-redux';
import { AppDispatch } from '@/redux/store';
import { useQuery, useMutation } from '@tanstack/react-query';
import apiService from '@/service/apiService';
import { HasPermission, withPermission } from '@/hooks/authUtils';
import { toast } from 'react-toastify';
import FileUploadButton from '@/components/common/FileUploadButton';
import { FileImportError } from '@/components/common/FileImportError';
import { getIcon } from '@/components/common/icons/getIcon';
import { API_URL } from '@/config';
const PaymentTermsList: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState<IPaymentTerm | null>(null);
  const[State,setState] = useState({
    page:1,
    limit:10,
    search:"",
    sort:"asc",
    sortby:"name",
    total:0,
    data:[]
  })
  const {data,isLoading,refetch} = useQuery({
    queryKey: ['paymenterms', { page: State.page, limit: State.limit }],
    queryFn: async() => apiService.getPaymentTerms({ page: State.page, limit: State.limit }),
  });

  const importMutation = useMutation({
    mutationFn: (data: any) => {
      const formData = new FormData();
      formData.append('file', data.file);
      return apiService.importPaymentTerms(formData);
    },
    onSuccess: () => {
      refetch();
      toast.success('Payment terms imported successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to import payment terms');
    },
  });
  const handelDeleteMutation = useMutation({
    mutationFn: (id:string) => {
      return apiService.deletePaymentTerm(id);
    },
    onSuccess: () => {
      refetch();
      toast.success('Payment terms deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to delete payment terms');
    },
  });
  const handelDelete=async(id:string)=>{
   try {
    await handelDeleteMutation.mutate(id)
   } catch (error:any) {
    toast.error(error.message )
   }
  }

  const handleImport = (file: File) => {
    importMutation.mutate({ file });
  };



  const handleOpenDialog = (term?: IPaymentTerm) => {
    if (term) {
      setSelectedTerm(term);
    } else {
      setSelectedTerm(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedTerm(null);
  };

  return (
<Box sx={{ minHeight: '100vh' }}>
      <PageHeader
        title="Payment Terms"
        subtitle="Configure invoice payment terms"
        actions={
          <Box display="flex" alignItems="center" gap={0.5}>
            <FileUploadButton onFileSelect={handleImport} loading={importMutation.isPending} />
            <Tooltip title="Download Sample CSV">
              <IconButton
                size="small"
                href={`${API_URL}public/samples/payment-terms.csv`}
                download
                sx={{ color: '#5c626e', '& svg': { fontSize: 21 } }}
              >
                {getIcon('fileDownload')}
              </IconButton>
            </Tooltip>
            <HasPermission action="create" resource={["accounting"]} component={
              <Button className='themBtn' variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              sx={{
                borderRadius: {xs:'6px', md:'6px'},
                boxShadow:'none',
                py:{xs:0, md:0.5},
                pr:{xs: 1.5, md:2.5},
                pl:{xs: 1, md:2},
                fontWeight:'500',
                minHeight:{xs:'28px', md:'35px'},
                fontSize:{xs:'13px', md:'14px'},
                '& .MuiButton-startIcon': {
                  marginRight: '3px',
                    },
                  '& .MuiButton-startIcon svg': {
                  fontSize: '15px'
                  }
                }}>
                Add
                </Button>
            }/>
          </Box>
        }
      />

      <FileImportError
        allerrors={importMutation?.error?.response?.data?.errors?.allErrors || []}
        message={importMutation?.error?.response?.data?.message || 'Error importing payment terms'}
      />

      <DataTable
        columns={[
          { key: 'name', label: 'Name' },
          { key: 'description', label: 'Description' },
          { key: 'days', label: 'Days' },
          { key: 'actions', label: 'Actions', align:'center' },
        ]}
        data={data?.data?.filter((term: IPaymentTerm) => term._id !== "") ?? []}
        isLoading={isLoading}
        emptyMessage="No payment terms found"
        total={data?.total ?? 0}
        page={State.page - 1}
        rowsPerPage={State.limit}
        onPageChange={(newPage) => setState({ ...State, page: newPage + 1 })}
        onRowsPerPageChange={(rows) => setState({ ...State, limit: rows })}
        renderRow={(term: IPaymentTerm) => (
          <TableRow key={term._id}  sx={{ '&:last-child td': { border: 0 } }}>
            <TableCell title={term.name} className='tellipsis'>{term.name}</TableCell>
            <TableCell title={term.description} className='tellipsis'>{term.description}</TableCell>
            <TableCell>{term.days}</TableCell>
            <TableCell align='center'>
              <HasPermission action="update" resource={["accounting"]} component={
                <IconButton
                size="small"
                sx={{
                    bgcolor: '#e2e8f0',
                    color: '#0f172a',
                    padding:'3px',
                    marginRight:'8px',
                    '&:hover': {
                      bgcolor: '#f1f5f9',
                    },
                  }}
                onClick={() => handleOpenDialog(term)}>
                  <EditIcon sx={{fontSize:'13px'}} />
                  </IconButton>
              }/>
              <HasPermission action="delete" resource={["accounting"]} component={
                <IconButton
                 size="small"
                  sx={{
                    bgcolor: 'error.main',
                    color: 'error.contrastText',
                    padding:'3px',
                    '&:hover': {
                      bgcolor: 'error.light',
                      color: 'error.contrastText',
                    },
                  }}
                onClick={() => handelDelete(term._id as string)}>
                <Delete sx={{fontSize:'12px'}}/>
                </IconButton>
              }/>
            </TableCell>
          </TableRow>
        )}
      />

      <PaymentTermForm
        open={openDialog}
        onClose={handleCloseDialog}
        initialData={selectedTerm || undefined}
        title={selectedTerm ? 'Edit Payment Term' : 'Add New Payment Term'}
        onSuccess={() => refetch()}
      />
    </Box>
  );
};

export default withPermission("view",["accounting"])(PaymentTermsList);