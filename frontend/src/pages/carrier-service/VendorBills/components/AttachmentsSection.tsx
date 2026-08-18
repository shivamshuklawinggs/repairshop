import React, { useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box, Paper, Typography, IconButton, Avatar,
  List, ListItem, ListItemAvatar, ListItemText
} from '@mui/material';
import { CloudUpload, Delete, InsertDriveFile } from '@mui/icons-material';
import { getFilePreview, getFileSize, getFileType, getFileName } from '@/utils/getFilePreview';
import { INVOICE_UPLOAD_URL } from '@/config';
import { useFormContext, useFieldArray, useWatch } from 'react-hook-form';
import { IFile, IVendorBill } from '@/types';
import { truncateText } from '@/utils';

const AttachmentsSection: React.FC<{
  initialData: IVendorBill | null;
}> = ({ initialData }) => {
  const { control, setValue, } = useFormContext<IVendorBill>();

  const { append, remove } = useFieldArray({
    control,
    name: 'files',
  });

  const { append: appendDeletedFile } = useFieldArray({
    control,
    name: 'deletedfiles' as any,
  });

  const currentFiles = useWatch({ control, name: 'files' });

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxSize: 20971520,
    onDrop: (acceptedFiles: File[]) => {
      acceptedFiles.forEach((file) => {
        const fileId = Math.random().toString(36).substring(7);
        const previewUrl = URL.createObjectURL(file);

        const fakeIFile: IFile = {
          file, // store File instance (optional, for upload later)
          id: fileId,
          preview: previewUrl,
          isNew: true,
          fieldname: 'files',
          originalname: file.name,
          encoding: '7bit', // fallback or default
          mimetype: file.type,
          destination: '',
          filename: file.name,
          path: '',
          size: file.size,
          url: previewUrl, // optional
        };

        append(fakeIFile);
      });
    }

  });

  const handleRemoveFile = (index: number) => {
    const fileToRemove = currentFiles?.[index];
    const confirm = window.confirm('Are you sure you want to delete this file?');
    if (!confirm) return;

    if (fileToRemove?.originalname && fileToRemove?.filename) {
      appendDeletedFile(fileToRemove.filename as any); // append string filename
    }

    remove(index);
  };

  // Optional: Initialize files if initialData provided
  useEffect(() => {
    if (initialData?.files?.length) {
      setValue('files', initialData.files);
    }
  }, [initialData, setValue]);

  return (
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
          '&:hover': {
            backgroundColor: 'action.hover'
          }
        }}
      >
        <input {...getInputProps()} />
        <CloudUpload sx={{ fontSize: 32, color: 'primary.main' }} />
        <Typography sx={{fontSize:'14px'}}>
          Drag/Drop files here or click to select files
        </Typography>
      </Paper>

      {currentFiles?.length > 0 && (
        <List sx={{ mt: 1 }}>
          {currentFiles.map((file: any, index: number) => (
            <ListItem
              key={file.id ? file.id : file.filename ? `${file.filename}-${index}` : index}
              sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py:0}}
            >
              <ListItemAvatar sx={{minWidth:45}}>
                {getFileType(file).startsWith('image') ? (
                  <Avatar variant="square" src={getFilePreview(file, INVOICE_UPLOAD_URL) || undefined} sx={{ width: 34, height: 34 }}/>
                ) : (
                  <Avatar>
                    <InsertDriveFile fontSize='small'/>
                  </Avatar>
                )}
              </ListItemAvatar>
              <ListItemText
                primary={truncateText(getFileName(file),15)}
                secondary={`${getFileSize(file)} MB`}
                 primaryTypographyProps={{
                fontSize: '14px'
              }}
              secondaryTypographyProps={{
                fontSize: '12px'
              }}
              />
              <IconButton
              color="error"
              onClick={() => handleRemoveFile(index)}
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
  );
};

export default AttachmentsSection;
