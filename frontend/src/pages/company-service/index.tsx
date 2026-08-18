import React, { useState } from 'react';
import { Button, Box, TableRow, TableCell, Typography } from '@mui/material';
import { PageHeader, DataTable } from '@/components/ui';
import CompanyForm from './components/CompanyForm';
import {Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon,} from '@mui/icons-material';
import { ICompany } from '@/types';

interface CompanyResponse {
  data: ICompany[];
  pagination: {
    total: number;
    limit: number;
    page: number;
    totalPages: number;
  };
}

type CompanyQueryKey = ['company', number, number, string];
import { useQuery } from '@tanstack/react-query';
import apiService from '@/service/apiService';
import VerticalMenu from '@/components/VerticalMenu';
import { withPermission } from '@/hooks/authUtils';
import { toast } from 'react-toastify';
import { useAppSelector } from '@/redux/store';

const CompanyList: React.FC = () => {
   const { initialized, currentCompany, } = useAppSelector((state) => state.user)
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<ICompany | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [search] = useState<string>('');

  // Fetch companies using React Query
  const { data, isLoading, error,refetch } = useQuery<CompanyResponse, Error, CompanyResponse, CompanyQueryKey>({
    queryKey: ['company', currentPage, limit, search],
    queryFn: async () => {
      const response = await apiService.getCompanies({ page: currentPage, limit, search });
      return response;
    },
    staleTime: 5000,
    refetchOnWindowFocus: false,
    refetchInterval: 30000 // Refetch every 30 seconds
  });
  const handleDelete=async(id:string)=>{
    try {
         const confirmDelete = window.confirm("Are you sure you want to delete this Company?");
         if(confirmDelete){
           await apiService.deleteCompany(id)
         }
       refetch()
    } catch (error:any) {
      toast.error(error.message || "Something is wrong")
    }
  }
  const { data: companies = [], pagination } = data || {};

  const handleOpenDialog = (company?: ICompany) => {
    if (company) {
      setSelectedCompany(company);
    } else {
      setSelectedCompany(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedCompany(null);
  };

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <PageHeader
        title="Company Management"
        subtitle="Manage your company profiles"
        actions={
          <Button className='themBtn' variant="contained" size="small" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}
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
        }
      />

      <DataTable
        columns={[
          { key: 'name', label: 'Name' },
          { key: 'prefix', label: 'Abbreviation/Prefix' },
          { key: 'description', label: 'Description' },
          { key: 'actions', label: 'Actions', align:'center' },
        ]}
        data={companies}
        isLoading={isLoading}
        emptyMessage={error ? 'Error loading companies' : 'No companies found'}
        total={pagination?.total ?? 0}
        page={currentPage - 1}
        rowsPerPage={limit}
        onPageChange={(newPage) => setCurrentPage(newPage + 1)}
        onRowsPerPageChange={(rows) => { setLimit(rows); setCurrentPage(1); }}
        renderRow={(company) => (
          <TableRow key={company._id} sx={{ '&:last-child td': { border: 0 } }}>
            <TableCell sx={{lineHeight:'1.3', width:'25%'}}>
              <Box sx={{display:'flex', gap:1, alignItems:'center',}}>
              <Box
                  sx={{
                    width: 7,
                    height: 7,
                    borderRadius: '2px',
                    bgcolor:company?.color || 'primary.main',
                    flexShrink: 0,
                    mt:0.2,
                  }}
                />
                <Typography fontSize={{xs:13, md:14}} sx={{maxWidth:'200px !important'}} className='tellipsis' title={company.label}>
                 {company.label}
                </Typography>

              </Box>
            </TableCell>
            <TableCell className='tellipsis' title={company.prefix} sx={{width:'20%'}}>{company.prefix}</TableCell>
            <TableCell className='tellipsis' title={company.description} sx={{width:'25%'}}>{company.description || "N/A"}</TableCell>
           <TableCell align='center' sx={{width:'10%'}}>
              <VerticalMenu actions={[
                { label: 'Edit', onClick: () => handleOpenDialog(company), icon: 'edit' },
                { label: 'Delete', onClick: () => handleDelete(company._id as string), icon: 'delete', disabled:currentCompany===company._id || company.test },
              ]}
              />
            </TableCell>
          </TableRow>
        )}
      />

      <CompanyForm
        open={openDialog}
        onClose={handleCloseDialog}
        initialData={selectedCompany || undefined}
        title={selectedCompany ? 'Edit Company' : 'Add New Company'}

      />
    </Box>
  );
};

export default withPermission("view",["company"])(CompanyList);