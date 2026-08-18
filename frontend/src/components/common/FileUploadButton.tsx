import React, { useRef } from 'react';
import { Button, CircularProgress } from '@mui/material';
import { getIcon } from './icons/getIcon';

interface FileUploadButtonProps {
  onFileSelect: (file: File) => void;
  loading: boolean;
  variant?: "text" | "outlined" | "contained";
  title?: string;
}

const FileUploadButton: React.FC<FileUploadButtonProps> = ({
  onFileSelect,
  loading,
  variant = "outlined",
  title = "Import"
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
    // Reset the input value to allow selecting the same file again
    if(fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileChange}
        accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
      />
      <Button
        variant={variant}
        onClick={handleButtonClick}
        disabled={loading}
        size="small"
        startIcon={
          loading
            ? <CircularProgress size={14} thickness={4} />
            : getIcon('fileImport')
        }
        sx={{
            borderRadius: {xs:'6px', md:'6px'},
            boxShadow:'none',
            background:'#fff',
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
        {loading ? 'Importing…' : title}
      </Button>
    </>
  );
};

export default FileUploadButton;
