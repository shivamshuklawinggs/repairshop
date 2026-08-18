import React, { useState } from 'react';
import {
  Box, Button, Container, Typography, TableRow, TableCell,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  Pagination, Alert, CircularProgress, Tooltip
} from '@mui/material';
import { PageHeader, DataTable } from '@/components/ui';
import {
  Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiService from '@/service/apiService';
import { IJournalEntry } from './Schema/JournalEntrySchema';
import { format } from 'date-fns';
import { formatCurrency } from '@/utils';
import { paths } from '@/utils/paths';
import { getIcon } from '@/components/common/icons/getIcon';
import FileUploadButton from '@/components/common/FileUploadButton';
import { FileImportError } from '@/components/common/FileImportError';
import AppDialog from '@/components/ui/AppDialog';
import { API_URL } from '@/config';

// Extended interface to include database fields
interface IJournalEntryWithId extends IJournalEntry {
  _id: string;
  createdAt?: string;
  updatedAt?: string;
  totalDebit: number;
  totalCredit: number;
}

interface JournalEntryListProps {
  onEdit?: (entry: IJournalEntryWithId) => void;
}

const JournalEntryList: React.FC<JournalEntryListProps> = ({ onEdit }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);
  const limit = 10;

  const { data: journalEntriesData, isLoading, error } = useQuery({
    queryKey: ['journalEntries', page, limit],
    queryFn: () => apiService.getJournalEntries({ page, limit }).then(res => res),
  });

  const importMutation = useMutation({
    mutationFn: (data: any) => {
      const formData = new FormData();
      formData.append('file', data.file);
      return apiService.importJournalEntries(formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journalEntries'] });
      toast.success('Journal entries imported successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to import journal entries');
    },
  });

  const handleImport = (file: File) => {
    importMutation.mutate({ file });
  };

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiService.deleteJournalEntry(id),
    onSuccess: () => {
      toast.success('Journal entry deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['journalEntries'] });
      setDeleteDialogOpen(false);
      setEntryToDelete(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete journal entry');
    },
  });

  const handleEdit = (entry: IJournalEntryWithId) => {
    if (onEdit) {
      onEdit(entry);
    } else {
      navigate(`/accounting${paths.JournalEntry}/${entry._id}`);
    }
  };

  const handleDelete = (id: string) => {
    setEntryToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (entryToDelete) {
      deleteMutation.mutate(entryToDelete);
    }
  };




  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container style={{maxWidth:'100%', padding:'0px'}}>
        <Alert severity="error">
          Failed to load journal entries. Please try again.
        </Alert>
      </Container>
    );
  }
  const journalEntries = journalEntriesData?.data || [];
  const totalPages = journalEntriesData?.totalPages || 0

  return (
    <Container style={{maxWidth:'100%', padding:'0px'}}>
      <PageHeader
        title="Journal Entries"
        subtitle="View, edit, and manage your journal entries"
        actions={
          <Box display="flex" alignItems="center" gap={0.5}>
            {/* <FileUploadButton onFileSelect={handleImport} loading={importMutation.isPending} /> */}
            {/* <Tooltip title="Download Sample CSV">
              <IconButton
                size="small"
                href={`${API_URL}public/samples/journal-entries.csv`}
                download
                sx={{ color: '#5c626e', '& svg': { fontSize: 21 } }}
              >
                {getIcon('fileDownload')}
              </IconButton>
            </Tooltip> */}
            <Button className='themBtn' variant="contained"
            size="small" startIcon={<AddIcon />}
            onClick={() => navigate(`/accounting${paths.JournalEntry}`)}
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
        message={importMutation?.error?.response?.data?.message || 'Error importing journal entries'}
      />
      <DataTable
        columns={[
          { key: 'journalNo', label: 'Journal No' },
          { key: 'date', label: 'Date' },
          { key: 'memo', label: 'Memo' },
          { key: 'totalDebit', label: 'Total Debit' },
          { key: 'totalCredit', label: 'Total Credit' },
          { key: 'actions', label: 'Actions' },
        ]}
        data={journalEntries}
        isLoading={false}
        emptyMessage="No journal entries found"
        renderRow={(entry: IJournalEntryWithId) => (
          <TableRow key={entry._id} hover>
            <TableCell>{entry.journalNumber}</TableCell>
            <TableCell>{entry.journalDate ? format(new Date(entry.journalDate), 'MMM dd, yyyy') : ''}</TableCell>
            <TableCell>
              <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>{entry.memo || '-'}</Typography>
            </TableCell>
            <TableCell>{formatCurrency(entry.totalDebit)}</TableCell>
            <TableCell>{formatCurrency(entry.totalCredit)}</TableCell>
            <TableCell>
              <Box sx={{ display: 'flex' }}>
                <IconButton size="small"
                onClick={() => handleEdit(entry)}
                title="Edit"><EditIcon sx={{color:'#333', fontSize:'17px'}} />
                </IconButton>
                <IconButton size="small"
                onClick={() => handleDelete(entry._id)}
                title="Delete" color="error">
                  <DeleteIcon sx={{fontSize:'17px'}}/>
                </IconButton>
              </Box>
            </TableCell>
          </TableRow>
        )}
      />

      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <Pagination count={totalPages} page={page} onChange={(_, newPage) => setPage(newPage)} color="primary" />
        </Box>
      )}

      {/* Delete Confirmation Dialog */}
      <AppDialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogActions className='dialog-close'>
          <IconButton onClick={() => setDeleteDialogOpen(false)} size="small" sx={{color:'#333'}}>
            {getIcon('CloseIcon')}
          </IconButton>
        </DialogActions>

        <DialogTitle className='dialog-title'>Confirm Delete</DialogTitle>

        <DialogContent style={{paddingTop:'25px', paddingBottom:'25px'}}>
          <Typography>
            Are you sure you want to delete this journal entry? This action cannot be undone.
          </Typography>
        </DialogContent>

        <DialogActions className='dialog-action'>
          <Button
          variant='outlined'
          onClick={() => setDeleteDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={confirmDelete}
            color="error"
            variant="contained"
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>

      </AppDialog>
    </Container>
  );
};

export default JournalEntryList;
