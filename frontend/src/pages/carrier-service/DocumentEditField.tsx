import React, { useCallback, useEffect, useState } from 'react';
import { Box, Paper, Typography, IconButton, Avatar, List, ListItem, ListItemAvatar, Dialog, DialogTitle, DialogContent, DialogActions, Button, CircularProgress, ListItemText } from '@mui/material';
import { CloudUpload, Delete, InsertDriveFile } from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import apiService from '@/service/apiService';
import { truncateText } from '@/utils';
import { toast } from 'react-toastify';
import { IFile } from '@/types';
import { getFileType, getFilePreview, getFileSize, getFileName } from '@/utils/getFilePreview';
import { CARRIER_DOCUMENTS_UPLOAD_URL } from '@/config';
import { useQuery, useMutation } from '@tanstack/react-query';
import { withPermission } from '@/hooks/authUtils';
import { getIcon } from '@/components/common/icons/getIcon';
import AppDialog from '@/components/ui/AppDialog';

const MAX_SIZE = 20 * 1024 * 1024; // 20MB

interface UploadFile {
  file: File | IFile;
  customName: string;
}

const DocumentUpload: React.FC<{ carrierId: string, onClose: () => void, onUpdate: () => void }> = ({ carrierId, onClose, onUpdate }) => {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [deletedfiles, setDeletedfiles] = useState<IFile[]>([]);

  const { data: initialFiles, isLoading: isLoadingFiles } = useQuery<IFile[]>({
    queryKey: ['carrierDocuments', carrierId],
    queryFn: async () => {
      const response = await apiService.getCarrierDocuments(carrierId);
      return response.data || [];
    },
    enabled: !!carrierId,
  });

  useEffect(() => {
    if (initialFiles) {
      setFiles(initialFiles.map((file) => ({ file, customName: file.originalname })))
    }
  }, [initialFiles]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map((file) => ({
      file,
      customName: file.name
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxSize: MAX_SIZE
  });

  const handleRemove = (index: number) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;
    const updated = [...files];
    const deletedFile = updated.splice(index, 1)[0];
    setFiles(updated);
    if (!(deletedFile.file instanceof File)) {
      setDeletedfiles((prev) => [...prev, deletedFile.file as IFile]);
    }
  };

  const updateDocumentsMutation = useMutation({
    mutationFn: (formData: FormData) => apiService.updateCarrierDocuments(carrierId, formData),
    onSuccess: () => {
      toast.success('Documents updated successfully');
      onUpdate();
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update documents');
    }
  });

  const handleSave = () => {
    const formData = new FormData();
    const newFiles = files.filter(f => f.file instanceof File);

    if (newFiles.length) {
      newFiles.forEach(item => {
        formData.append('documents', item.file as Blob, item.customName);
      });
    }

    if (deletedfiles.length > 0) {
      formData.append('deletedfiles', JSON.stringify(deletedfiles.map(file => file.filename)));
    }

    if (newFiles.length > 0 || deletedfiles.length > 0) {
      updateDocumentsMutation.mutate(formData);
    } else {
      onClose();
    }
  };

  return (
    <AppDialog
      open={!!carrierId}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogActions className='dialog-close'>
        <Button onClick={onClose}>
          {getIcon('CloseIcon')}
        </Button>
      </DialogActions>

      <DialogTitle className='dialog-title'>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            Manage Document
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent style={{paddingTop:'30px'}}>
        {isLoadingFiles ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
        ) : (
          <Box>
            <Paper
              {...getRootProps()}
              sx={{
                p: 2,
                textAlign: 'center',
                cursor: 'pointer',
                backgroundColor: 'background.default',
                border: '1.5px dashed',
                borderColor: 'primary.main',
                '&:hover': { backgroundColor: 'action.hover' }
              }}
            >
              <input {...getInputProps()} />
              <CloudUpload sx={{ fontSize: 32, color: 'primary.main' }} />
              <Typography variant='subtitle2'>Drag/Drop files here or click to select files</Typography>
            </Paper>

            {files.length > 0 && (
              <List>
                {files.map((item, index) => (
                  <ListItem
                    key={index}
                    sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb:0 }}
                  >
                    <ListItemAvatar>
                      {getFileType(item.file as any).startsWith('image') ? (
                        <Avatar variant="square" src={getFilePreview(item.file as any, CARRIER_DOCUMENTS_UPLOAD_URL) || undefined} />
                      ) : (
                        <Avatar>
                          <InsertDriveFile fontSize="small"/>
                        </Avatar>
                      )}
                    </ListItemAvatar>

                    <ListItemText
                        primary={truncateText(getFileName(item.file as any),15)}
                        secondary={`${getFileSize(item.file as any)} MB`}
                        primaryTypographyProps={{
                         fontSize: "0.875rem"
                        }}
                        secondaryTypographyProps={{
                        fontSize: "0.75rem"
                        }}
                      />

                    <IconButton
                    color="error"
                    onClick={() => handleRemove(index)}
                    disabled={updateDocumentsMutation.isPending}
                    size="small"
                      sx={{
                        bgcolor: 'error.main',
                        padding:'4px',
                        color: 'error.contrastText',
                        '&:hover': {
                          bgcolor: 'error.light',
                          color: 'error.contrastText',
                        },
                      }}
                    >
                    <Delete sx={{fontSize:'14px'}}/>
                    </IconButton>
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions className='dialog-action'>
        <Button
        variant='outlined'
        onClick={onClose}
        disabled={updateDocumentsMutation.isPending}>
          Cancel
        </Button>

        <Button
        variant='contained'
        onClick={handleSave}
        disabled={updateDocumentsMutation.isPending}>
          {updateDocumentsMutation.isPending ? <CircularProgress size={24} /> : 'Save'}
        </Button>

      </DialogActions>
    </AppDialog>
  );
};

export default withPermission("update",["carriers"])(DocumentUpload);
