import React, { useCallback } from 'react';
import {
  Box, Paper, Typography, IconButton, Avatar,
  List, ListItem, ListItemAvatar, ListItemText
} from '@mui/material';
import { CloudUpload, Delete, InsertDriveFile } from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { getFileType, getFilePreview, getFileSize, getFileName } from '@/utils/getFilePreview';
import { ICarrier, ICustomer, IFile } from '@/types';
import { truncateText } from '@/utils';

const MAX_SIZE = 20 * 1024 * 1024; // 20MB

interface DocumentsProps {
  uploadUrl: string;
  title?: string;
  borderStyle?: '1px' | '1.5px';
  iconSize?: number;
  typographyVariant?: 'body2' | 'body1';
  listItemStyles?: {
    pb?: number;
    pt?: number;
    avatarMinWidth?: string;
    avatarWidth?: number;
    avatarHeight?: number;
  };
}

const Documents: React.FC<DocumentsProps> = ({
  uploadUrl,
  title = 'Documents',
  borderStyle = '1.5px',
  iconSize = 32,
  typographyVariant = 'body2',
  listItemStyles = {
    pb: 0,
    pt: 0,
    avatarMinWidth: '43px',
    avatarWidth: 32,
    avatarHeight: 32
  }
}) => {
  const form = useFormContext<ICarrier | ICustomer>();
  const { control } = form;

  const {
    fields: documentsFields,
    append: appendDocuments,
    remove: removeDocuments,
  } = useFieldArray({
    control,
    name: 'documents' as const,
  });

  const {
    append: appendDeleteFiles,
  } = useFieldArray({
    control,
    name: 'deleteFiles' as any
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map((file) => ({
      file,
      name: file.name,
      extension: file.name.split('.').pop(),
    }));
    appendDocuments(newFiles as any);
  }, [appendDocuments]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxSize: MAX_SIZE,
  });

  const handleRemove = (index: number) => {
    if (window.confirm('Are you sure you want to delete this file?')) {
      const fileItem = documentsFields[index];
      fileItem.filename && deleteFilesHandler(fileItem);
      removeDocuments(index);
    }
  };

  const deleteFilesHandler = (file: IFile) => {
    if ('fieldname' in file && 'filename' in file) {
      appendDeleteFiles(file.filename);
    }
  };

  return (
    <Box>
      <Paper
        {...getRootProps()}
        sx={{
          p: 3,
          textAlign: 'center',
          cursor: 'pointer',
          backgroundColor: 'background.default',
          border: `${borderStyle} dashed`,
          borderColor: 'primary.main',
          '&:hover': { backgroundColor: 'action.hover' },
        }}
      >
        <input {...getInputProps()} />
        <CloudUpload sx={{ fontSize: iconSize, color: 'primary.main' }} />
        <Typography variant={typographyVariant}>
          Drag/Drop files here or click to select files
        </Typography>
      </Paper>

      {documentsFields.length > 0 && (
        <List sx={{ mt: 0.5 }}>
          {documentsFields.map((item, index) => {
            const file = item as IFile;
            return (
              <ListItem
                key={item.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  pb: listItemStyles.pb,
                  pt: listItemStyles.pt,
                }}
              >
                <ListItemAvatar style={{ minWidth: '43px' }}>
                  {getFileType(item as any).startsWith('image') ? (
                    <Avatar
                      variant="square"
                      src={getFilePreview(item as any, uploadUrl) || undefined}
                      sx={{
                        width: listItemStyles.avatarWidth,
                        height: listItemStyles.avatarHeight,
                      }}
                    />
                  ) : (
                    <Avatar
                      sx={{
                        width: listItemStyles.avatarWidth,
                        height: listItemStyles.avatarHeight,
                      }}
                    >
                      <InsertDriveFile fontSize="small" />
                    </Avatar>
                  )}
                </ListItemAvatar>

                <ListItemText
                  sx={{ my:0.3}}
                  primary={truncateText(getFileName(file as any), 15)}
                  secondary={`${getFileSize(file as any)} MB`}
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
                  <Delete sx={{ fontSize:'14px'}} />
                </IconButton>
              </ListItem>
            );
          })}
        </List>
      )}
    </Box>
  );
};

export default Documents;
