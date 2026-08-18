import React, { useCallback, useState } from 'react';
import {
  Box,
  Button,
  Typography,
  IconButton,
  Avatar,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useDropzone } from 'react-dropzone';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import { Block, InsertDriveFile } from '@mui/icons-material';
import { Controller, useFormContext } from 'react-hook-form';

import { getFileName, getFilePreview, getFileSize, getFileType } from '@/utils/getFilePreview';
import { DRIVING_LICENSE_UPLOAD_URL } from '@/config';
import { IDriver } from '@/types';

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

const UploadFile: React.FC = () => {
  const { control, setValue, watch,formState: { errors } } = useFormContext<IDriver>();
  const file = watch('file');


  const [localFile, setLocalFile] = useState<File | null>(null);

  const handleFile = useCallback(
    (file: File | null) => {
      setLocalFile(file);
      setValue('file', file as unknown as any);
    },
    [setValue]
  );

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      handleFile(acceptedFiles[0]);
    }
  }, [handleFile]);

  const { getRootProps, getInputProps, open } = useDropzone({
    onDrop,
    multiple: false,
    noClick: true,
    noKeyboard: true,
    accept: {
      'image/*': [],
      'application/pdf': [],
    },
  });

  const handleManualChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    handleFile(selectedFile);
  };

  const handleDelete = () => {
    handleFile(null);
  };

  const displayFile = localFile || file;
  const fileType = getFileType(displayFile as unknown as any);

  return (
    <Controller
      name="file"
      control={control}
      render={() => (
        <Box sx={{ mt: 1 }}>
          {!displayFile ? (
            <Box
              {...getRootProps()}
              sx={{
                border: '2px dashed #b1b1b1',
                borderRadius: 1,
                p: 3,
                textAlign: 'center',
                cursor: 'pointer',
              }}
            >
              <input {...getInputProps()} />
              <Button
                variant="outlined"
                startIcon={<CloudUploadIcon />}
                onClick={open}
              >
                Upload License
              </Button>
              <VisuallyHiddenInput
                type="file"
                onChange={handleManualChange}
                accept="image/*,.pdf"
              />
              <Typography variant="subtitle2" color="text.secondary" mt={1} sx={{display:'block'}}>
                Drag and drop a file here or click to select
              </Typography>
            </Box>
          ) : (
            <Box sx={{ mt: 2, position: 'relative', mb:2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {fileType?.startsWith('image') ? (
                  <Avatar
                    variant="square"
                    src={getFilePreview( displayFile as unknown as any, DRIVING_LICENSE_UPLOAD_URL ) || undefined}
                    sx={{ width: 42, height: 42 }}
                  />
                ) : (
                  <Avatar>
                    <InsertDriveFile fontSize='small'/>
                  </Avatar>
                )}
                <Box sx={{ flexGrow: 1, lineHeight:1.1 }}>
                  <Typography variant="body2" noWrap>
                    {getFileName(displayFile as unknown as any)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {getFileSize(displayFile as unknown as any)} MB
                  </Typography>
                </Box>
                  <IconButton
                    onClick={handleDelete}
                    size="small"
                    color="error"
                    sx={{
                      bgcolor: 'error.main',
                      color: 'error.contrastText',
                      '&:hover': {
                        bgcolor: 'error.light',
                        color: 'error.contrastText',
                      },
                    }}
                  >
                  <DeleteIcon sx={{fontSize:14}}/>
                </IconButton>
              </Box>
            </Box>
          )}
          {errors?.file && <Typography variant="caption" color="error">{errors?.file?.message  || ''}</Typography>}
        </Box>
      )}
    />
  );
};

export default UploadFile;
