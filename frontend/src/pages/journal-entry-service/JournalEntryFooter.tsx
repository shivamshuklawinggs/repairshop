import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Grid, TextField, Typography, Paper,Tooltip, Box, IconButton, useTheme, alpha } from '@mui/material';
import { useDropzone } from 'react-dropzone';
import { CloudUpload, Delete, Note as NoteIcon } from '@mui/icons-material';
import { IJournalEntry } from './Schema/JournalEntrySchema';
import { getFileName, getFilePreview, getFileSize } from '@/utils/getFilePreview';
import { JOURNAL_ENTRY_UPLOAD_URL } from '@/config';
import { toast } from 'react-toastify';
import { truncateText } from '@/utils';

const JournalEntryFooter: React.FC = () => {
  const { control, setValue, watch } = useFormContext<IJournalEntry>();
  const theme = useTheme();
  const uploadedFile = watch('attachments');

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxFiles: 1,
    onDropRejected: (fileRejections) => {
      toast.error("Only one file is allowed");
    },
    onDrop: (acceptedFiles) => {
      setValue('attachments', acceptedFiles[0]);
    },
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  const handleRemoveFile = () => {
    setValue('attachments', "");
  };

  return (
    <Grid container spacing={2}>
      {/* Memo */}
      <Grid item xs={12} md={6}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          {/* <NoteIcon sx={{ fontSize: 18, color: theme.palette.primary.main }} /> */}
          <Typography fontSize={15} sx={{ fontWeight: 600 }}>
            Memo
          </Typography>
        </Box>
        <Paper
          elevation={0}
          sx={{
            px: 0.5,
          }}
        >
          <Controller
            name="memo"
            control={control}
            render={({ field }) => (
              <TextField size='small'
                {...field}
                multiline
                rows={5}
                variant="outlined"
                fullWidth
                placeholder="Add a memo for this journal entry..."
              />
            )}
          />
        </Paper>
      </Grid>

      {/* Attachments */}
      <Grid item xs={12} md={6}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          {/* <CloudUpload sx={{ fontSize: 18, color: theme.palette.primary.main }} /> */}
          <Typography fontSize={15} sx={{ fontWeight: 600 }}>
            Attachments
          </Typography>
        </Box>

        {!uploadedFile ? (
          <Paper
            elevation={0}
            sx={{
              p: 2,
              textAlign: 'center',
              borderStyle: 'dashed',
              borderWidth: 1.8,
              borderColor: alpha(theme.palette.primary.main, 0.3),
              borderRadius: 0.5,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              cursor: 'pointer',
              bgcolor: alpha(theme.palette.primary.main, 0.02),
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.05),
                borderColor: alpha(theme.palette.primary.main, 0.5),
              }
            }}
            {...getRootProps()}
          >
            <input {...getInputProps()} />
            <CloudUpload sx={{ fontSize: 30, color: theme.palette.primary.main, mb: 1 }} />
            <Typography variant="h6" color="textPrimary" sx={{ mb: 0, fontWeight: 500 }}>
              Choose a file or drag & drop
            </Typography>
            <Typography fontSize={13} color="textSecondary">
              JPEG, PNG, PDF, DOC, XLS (up to 50MB)
            </Typography>
          </Paper>
        ) : (
          <Paper
            elevation={0}
            sx={{
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              borderRadius: 0.5,
              bgcolor: alpha(theme.palette.success.main, 0.02),
              border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
            }}
          >
            {/* Show preview if image */}
            {uploadedFile ? (
              <Box
                component="img"
                src={getFilePreview(uploadedFile as any, JOURNAL_ENTRY_UPLOAD_URL) || ""}
                alt="preview"
                sx={{
                  width: 50,
                  height: 50,
                  objectFit: 'cover',
                  borderRadius: 0.5,
                }}
              />
            ) : (
              <CloudUpload sx={{ fontSize: 32, color: theme.palette.primary.main, mb:1 }} />
            )}

            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 500, mb: 0 }}>
                {truncateText (getFileName(uploadedFile as any), 15)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {getFileSize(uploadedFile as any)}
              </Typography>
            </Box>

            <Tooltip title="Remove file">
              <IconButton
                color="error"
                onClick={handleRemoveFile}
                  sx={{
                    bgcolor: 'error.main',
                    color: 'error.contrastText',
                    padding:'4px',
                    '&:hover': {
                      bgcolor: 'error.light',
                      color: 'error.contrastText',
                    },
                  }}
                >
                <Delete sx={{fontSize:'14px'}}/>
              </IconButton>
            </Tooltip>
          </Paper>
        )}
      </Grid>
    </Grid>
  );
};

export default JournalEntryFooter;
