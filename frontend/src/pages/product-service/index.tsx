import React, { useState } from 'react';
import apiService from '@/service/apiService';
import { IProductService } from '@/types';
import { Button, TableRow, TableCell, Box, IconButton, Tooltip } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import ProductServiceForm from './ProductServiceForm';
import { useQuery, useMutation } from '@tanstack/react-query';
import { capitalizeFirstLetter } from '@/utils';
import { withPermission } from '@/hooks/authUtils';
import { toast } from 'react-toastify';
import { PageHeader, DataTable } from '@/components/ui';
import { getIcon } from '@/components/common/icons/getIcon';
import FileUploadButton from '@/components/common/FileUploadButton';
import { FileImportError } from '@/components/common/FileImportError';
import { API_URL } from '@/config';

const ProductServices: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<IProductService | null>(null);
  const [isPagination, setIsPagination] = useState<{ limit: number, page: number }>({ limit: 10, page: 1 })

  const { data, isPending, error,refetch } = useQuery({
    queryKey: ["productService", isPagination.limit, isPagination.page],
    queryFn: async () => await apiService.getProductServiceData(isPagination)
  })

  const { data: productServices = [], pagination } = data || {};

  const handleModalShow = () => {
    setEditingItem(null);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
  };

  const handleEdit = (item: IProductService) => {
    setEditingItem(item);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this item service?')) {
      try {
        await apiService.deleteProductServiceData(id);
        refetch()
      } catch (error:any) {
        console.warn('Error:', error);
        toast.error(error.message || "Failed to delete")
      }
    }
  };

  const importMutation = useMutation({
    mutationFn: (data: any) => {
      const formData = new FormData();
      formData.append('file', data.file);
      return apiService.importProductServices(formData);
    },
    onSuccess: () => {
      refetch();
      toast.success('Products imported successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to import products');
    },
  });

  const handleImport = (file: File) => {
    importMutation.mutate({ file });
  };



  return (
   <Box sx={{ minHeight: '100vh' }}>
      <PageHeader
        title="Products & Services"
        subtitle="Manage your product and service catalog"
        actions={
          <Box display="flex" alignItems="center" gap={0.5}>
            <FileUploadButton onFileSelect={handleImport} loading={importMutation.isPending} />
            <Tooltip title="Download Sample CSV">
              <IconButton
                size="small"
                href={`${API_URL}public/samples/products.csv`}
                download
                sx={{ color: '#5c626e', '& svg': { fontSize: 21 } }}
              >
                {getIcon('fileDownload')}
              </IconButton>
            </Tooltip>
            <Button className='themBtn' variant="contained"
            size="small" startIcon={<AddIcon />}
            onClick={handleModalShow}
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
          </Box>
        }
      />

      <FileImportError
        allerrors={importMutation?.error?.response?.data?.errors?.allErrors || []}
        message={importMutation?.error?.response?.data?.message || 'Error importing products'}
      />

      <DataTable
        columns={[
          { key: 'label', label: 'Label' },
          { key: 'category', label: 'Category' },
          { key: 'description', label: 'Description' },
          { key: 'incomeAccount', label: 'Income Account' },
          { key: 'expenseAccount', label: 'Expense Account' },
          { key: 'openingStock', label: 'Opening Stock' },
          { key: 'reorderPoint', label: 'Reorder Point' },
          { key: 'currentLevel', label: 'Current Level' },
          { key: 'inventoryAccount', label: 'Inventory Account' },
          { key: 'actions', label: 'Actions' },
        ]}
        data={productServices}
        isLoading={isPending}
        emptyMessage={error ? 'Failed to fetch product services' : 'No products or services found'}
        total={pagination?.total ?? 0}
        page={isPagination.page - 1}
        rowsPerPage={isPagination.limit}
        rowsPerPageOptions={[5, 10, 25, 50, 100]}
        onPageChange={(newPage) => setIsPagination({ ...isPagination, page: newPage + 1 })}
        onRowsPerPageChange={(rows) => setIsPagination({ ...isPagination, limit: rows, page: 1 })}
        renderRow={(item: IProductService) => (
          <TableRow key={item._id}  sx={{ '&:last-child td': { border: 0 } }}>
            <TableCell>{capitalizeFirstLetter(item.name || 'N/A')}</TableCell>
            <TableCell>{capitalizeFirstLetter(item.category || 'N/A')}</TableCell>
            <TableCell title={item.description} className='tellipsis'>{item.description || 'N/A'}</TableCell>
            <TableCell>{capitalizeFirstLetter(item?.incomeAccountData?.name || item?.incomeAccount || 'N/A')}</TableCell>
            <TableCell>{capitalizeFirstLetter(item?.expenseAccountData?.name || item?.expenseAccount || 'N/A')}</TableCell>
            <TableCell>{item.OpeningStock || 0}</TableCell>
            <TableCell>{item.reorderStock || 0}</TableCell>
            <TableCell>{item.currentLevel || 0}</TableCell>
            <TableCell>{capitalizeFirstLetter(item?.inventoryAccountData?.name || item?.inventoryAccount || 'N/A')}</TableCell>
            <TableCell>
              <Box display="flex" gap={0}>
                <IconButton size="small"
                color="primary" onClick={() => handleEdit(item)}
                sx={{
                    '& svg': {
                      fontSize: 16
                    }
                  }}
                >
                {getIcon("edit")}
                </IconButton>
                <IconButton size="small"
                color="error" onClick={() => item._id && handleDelete(item._id)}
                sx={{
                    '& svg': {
                      fontSize: 16
                    }
                  }}
                >
                {getIcon("delete")}
                </IconButton>
              </Box>
            </TableCell>
          </TableRow>
        )}
      />

       <ProductServiceForm showModal={showModal} handleModalClose={handleModalClose} editingItem={editingItem} />
    </Box>
  );
};

export default withPermission("view",["accounting"])(ProductServices);