import React, { useState } from 'react';


import apiService from '@/service/apiService';
import { ITaxOption } from '@/types';
import { PageHeader, DataTable } from '@/components/ui';
import {
  Button,
  TableCell,
  TableRow,
  Box,
  IconButton,
  Tooltip,
  Typography,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useQuery, useMutation } from '@tanstack/react-query';
import TaxForm from './TaxForm';
import { HasPermission, withPermission } from '@/hooks/authUtils';
import { toast } from 'react-toastify';
import { getIcon } from '@/components/common/icons/getIcon';
import FileUploadButton from '@/components/common/FileUploadButton';
import { FileImportError } from '@/components/common/FileImportError';
import { API_URL } from '@/config';
import { useAppSelector } from '@/redux/store';




const TaxServicesList: React.FC = () => {
  const primary = useAppSelector((state) => state.user.currentCompanyDetails.color)
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ITaxOption | null>(null);

  const fetchItemServices = async () => {
    try {
      const response = await apiService.getTaxOptions();
      return response.data
    } catch (error) {
      console.warn('Error:', error);
      return []
    }
  };

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['taxOptions'],
    queryFn: async () => await fetchItemServices(),

  })
  const handleDelete = async (id: string) => {
    try {
      const confirmDelete = window.confirm('Are you sure you want to delete this tax option?');
      if (!confirmDelete) return;
      await apiService.deleteTaxOption(id);
      refetch();
    } catch (error: any) {
      toast.error(error?.message || "Failed to delete tax option")
    }
  };

  const handleModalShow = () => {
    setEditingItem(null);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setEditingItem(null)
    setShowModal(false);
  };

  const handleEdit = (item: ITaxOption) => {
    setEditingItem(item);
    setShowModal(true);
  };

  const importMutation = useMutation({
    mutationFn: (data: any) => {
      const formData = new FormData();
      formData.append('file', data.file);
      return apiService.importTaxOptions(formData);
    },
    onSuccess: () => {
      refetch();
      toast.success('Tax options imported successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to import tax options');
    },
  });

  const handleImport = (file: File) => {
    importMutation.mutate({ file });
  };
  return (
    <Box sx={{ minHeight: '100vh' }}>
      <PageHeader
        title="Tax Options"
        subtitle="Manage tax rates and labels"
        actions={
          <Box display="flex" alignItems="center" gap={0.5}>
            <FileUploadButton onFileSelect={handleImport} loading={importMutation.isPending} />
            <Tooltip title="Download Sample CSV">
              <IconButton
                size="small"
                href={`${API_URL}public/samples/taxes.csv`}
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
                onClick={handleModalShow}
                sx={{
                  borderRadius: {xs:'6px', md:'6px'},
                  boxShadow: 'none',
                  py:{xs:0, md:0.5},
                  pr:{xs: 1.5, md:2.5},
                  pl:{xs: 1, md:2},
                  fontWeight: '500',
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
            } />
          </Box>
        }
      />

      <FileImportError
        allerrors={importMutation?.error?.response?.data?.errors?.allErrors || []}
        message={importMutation?.error?.response?.data?.message || 'Error importing tax options'}
      />

      {/* <DataTable
        columns={[
          { key: 'label', label: 'Label' },
          { key: 'value', label: 'Value' },
          { key: 'actions', label: 'Actions' },
        ]}
        data={Array.isArray(data) ? data : []}
        isLoading={isLoading}
        emptyMessage="No tax options found"
        renderRow={(item: ITaxOption) => (
          <TableRow key={item._id}  sx={{ '&:last-child td': { border: 0 } }}>
            <TableCell>{item.label}</TableCell>
            <TableCell>{item.value}</TableCell>
            <TableCell>
              <Box display="flex" gap={1}>
                <HasPermission action="update" resource={["accounting"]} component={
                  <IconButton size="small" style={{padding:'0px'}}
                  color="primary" onClick={() => handleEdit(item)}
                  sx={{
                    '& svg': {
                      fontSize: 16,
                    }
                  }}
                  >
                    {getIcon("edit")}
                  </IconButton>
                }/>

                <IconButton size="small" style={{padding:'0px'}}
                color="error" onClick={() => item._id && handleDelete(item._id)}
                sx={{
                    '& svg': {
                      fontSize: 16,
                    }
                  }}
                >
                  {getIcon("delete")}
                </IconButton>
              </Box>
            </TableCell>
          </TableRow>
        )}
      /> */}

      <Box
        sx={{
          display: 'grid',
          mt: 3.5,
          gridTemplateColumns:
            data?.length > 0
              ? {
                xs: '1fr',
                sm: 'repeat(3, 1fr)',
                md: 'repeat(5, 1fr)',
              }
              : '1fr',
          gap: 2,
        }}
      >
        {isLoading ? (
          <Typography>Loading...</Typography>
        ) : Array.isArray(data) && data.length > 0 ? (
          data.map((item: ITaxOption) => (
            <Card
              key={item._id}
              sx={{
                borderRadius: '10px',
                border: '1px solid #0000001a',
                boxShadow: 'none',
                transition: '0.3s',
                position: 'relative',
                overflow: 'hidden',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 'none',
                },
              }}
            >
              {/* Top Border */}
              {/* <Box
                sx={{
                  height: 3,
                  background: primary,
                }}
              /> */}

              <CardContent sx={{padding:'12px 16px !important'}}>
                {/* Label */}
                <Typography
                  sx={{
                    color: '#64748b',
                    mb: 0.2,
                    fontSize: '12.6px',
                    fontWeight: 500,
                  }}
                >
                  Label
                </Typography>

                <Typography
                  sx={{
                    fontSize: '15px',
                    fontWeight: 600,
                    color: '#0f172a',
                    mb: 1,
                    lineHeight: 1.4,
                  }}
                >
                  {item.label}
                </Typography>

                {/* Actions */}
                <Box
                  display="flex"
                  justifyContent="flex-end"
                  alignItems="end"
                  gap={1.5}
                >

                  <Box sx={{ mr: 'auto' }}>
                    {/* Value */}
                    <Typography
                      sx={{
                        fontSize: '12.6px',
                        fontWeight: 500,
                        color: '#64748b',
                        mb: 0.5,
                      }}
                    >
                      Value
                    </Typography>

                    <Chip
                      label={item.value}
                      size="small"
                      sx={{
                        mb: 0,
                        fontWeight: 700,
                        borderRadius: '8px',
                        background: '#ecfdf3',
                        color: '#027a48',
                        fontSize: '16px',
                      }}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1.5, }}>
                    <HasPermission
                      action="update"
                      resource={['accounting']}
                      component={
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(item)}
                          sx={{
                            width: 28,
                            height: 28,
                            background: '#f1f5f9',
                            borderRadius: '6px',
                            '&:hover': {
                              background: '#e2e8f0',
                            },
                            '& svg': {
                              fontSize: 15,
                              color: '#101721',
                            },
                          }}
                        >
                          {getIcon('edit')}
                        </IconButton>
                      }
                    />
                    <IconButton
                      size="small"
                      onClick={() =>
                        item._id && handleDelete(item._id)
                      }
                      sx={{
                        width: 28,
                        height: 28,
                        background: '#fef2f2',
                        borderRadius: '6px',
                        '&:hover': {
                          background: '#fee2e2',
                        },
                        '& svg': {
                          fontSize: 14,
                          color: '#ff5c5c',
                        },
                      }}
                    >
                      {getIcon('delete')}
                    </IconButton>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))
        ) : (
          <Box
            sx={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              py: 6,
              color: '#64748b',
              fontWeight: 500,
              fontSize:'17px',
            }}
          >
          <img src="/empty.png" alt="empty" width={44}/> <br/>
          No tax options found
          </Box>
        )}
      </Box>


      <TaxForm
        showModal={showModal}
        handleModalClose={handleModalClose}
        editingItem={editingItem}

      />

    </Box>
  );
};

export default withPermission("view", ["accounting"])(TaxServicesList);