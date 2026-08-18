import React, { useState, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Box,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Close as CloseIcon,
  Download as DownloadIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  Description as TextIcon,
  InsertDriveFile as DefaultFileIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';
import { IFile } from '@/types';
import { SxProps, Theme } from '@mui/material/styles';
import AppDialog from '@/components/ui/AppDialog';

interface FileViewerProps {
  file: IFile;
  url: string;
  files?: IFile[];
  getFileUrl?: (file: IFile) => string;
  ImageCss?: Object
  nonimageCss?: Object
}

const FileViewer: React.FC<FileViewerProps> = ({ file, url, files, getFileUrl, ImageCss, nonimageCss }) => {
  console.log("file", file)
  console.log("url", url)
  const [internalOpen, setInternalOpen] = useState(false);

  const fileList = files && files.length > 0 ? files : [file];
  const initialIndex = Math.max(
    0,
    fileList.findIndex((f) => f.filename === file.filename && f.originalname === file.originalname)
  );
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  const currentFile = fileList[currentIndex] || file;
  const currentUrl = files && getFileUrl
    ? getFileUrl(currentFile)
    : currentFile.filename === file.filename && currentFile.originalname === file.originalname
      ? url
      : currentFile.url || url;

  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < fileList.length - 1;

  const isOpen = internalOpen;

  const handleOpenModal = useCallback(() => {
    setCurrentIndex(initialIndex);
    setInternalOpen(true);
  }, [initialIndex]);

  const handleClose = useCallback(() => {
    setInternalOpen(false);
  }, []);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => Math.min(fileList.length - 1, prev + 1));
  }, [fileList.length]);
  const getFileExtension = useCallback((file: IFile): string => {
    return file.filename.split('.').pop()?.toLowerCase() || 'unknown';
  }, []);

  const isPdf = useCallback((file: IFile): boolean => {
    const extension = getFileExtension(file);
    return extension === 'pdf';
  }, [getFileExtension]);

  const isImage = useCallback((file: IFile): boolean => {
    const extension = getFileExtension(file);
    return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(extension);
  }, [getFileExtension]);

  const isText = useCallback((file: IFile): boolean => {
    const extension = getFileExtension(file);
    return ['txt', 'json', 'xml', 'csv', 'log', 'md'].includes(extension);
  }, [getFileExtension]);

  const getFileIcon = useCallback((file: IFile) => {
    if (isPdf(file)) return <PdfIcon />;
    if (isImage(file)) return <ImageIcon />;
    if (isText(file)) return <TextIcon />;
    return <DefaultFileIcon />;
  }, [isPdf, isImage, isText]);

  const downloadFile = useCallback(async () => {
    if (!currentUrl) return;

    const response = await fetch(currentUrl);
    const blob = await response.blob();

    const blobUrl = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = currentFile?.originalname || "download";
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  }, [currentUrl, currentFile?.originalname]);

  const renderFileContent = useCallback(() => {
    if (!currentFile) return null;
    // Handle IFile objects with File property

    if (isPdf(currentFile) && currentUrl) {
      return (
        <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
          <Viewer
            fileUrl={currentUrl}
            renderError={(error: any) => {
              const errorMessage = error?.message || 'Unknown error occurred';
              return <Alert severity="error">Failed to load PDF: {errorMessage}</Alert>;
            }}
          />
        </Worker>
      );
    }

    if (isImage(currentFile)) {
      const fileUrl = currentUrl;
      return (
        <Box display="flex" justifyContent="center" p={2}>
          <img
            src={fileUrl}
            alt={currentFile.originalname || 'Image'}
            style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiB2aWV3Qm94PSIwIDAgMjAwIDIwMCI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNlZWUiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTk5Ij5JbWFnZSBub3QgYXZhaWxhYmxlPC90ZXh0Pjwvc3ZnPg==';
            }}
          />
        </Box>
      );
    }

    if (isText(currentFile)) {
      return (
        <Box p={2}>
          <iframe
            src={currentUrl}
            style={{ width: '100%', height: '70vh', border: 'none' }}
            title="Text File Viewer"
          />
        </Box>
      );
    }

    // For other file types
    return (
      <Box p={2} textAlign="center">
        <Typography variant="body1" gutterBottom>
          This file type cannot be previewed. Please download to view.
        </Typography>
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={downloadFile}
        >
          Download File
        </Button>
      </Box>
    );
  }, [currentFile, currentUrl, isPdf, isImage, isText, downloadFile]);

  // Small preview component
  const renderSmallPreview = () => {
    if (!file) return null;

    if (isImage(file) && url) {
      return (
        <Box
          onClick={handleOpenModal}
          sx={{
            cursor: 'pointer',
            display: 'flex',
            border: '1px solid #6c6c6c',
            borderRadius: '25px',
            overflow: 'hidden',
            boxShadow: 'none',
            marginLeft: '-18px',
            '&:hover': {
              //boxShadow: 2,
            },
          }}
        >
          <img
            src={url}
            alt={file.originalname || 'Image'}
            onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiB2aWV3Qm94PSIwIDAgMjAwIDIwMCI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNlZWUiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTk5Ij5JbWFnZSBub3QgYXZhaWxhYmxlPC90ZXh0Pjwvc3ZnPg==';
            }}
            style={
              ImageCss ? ImageCss :
                {
                display: 'block',
                width: '36px',
                height: '36px',
                objectFit: 'cover',
                borderRadius: '25px',
                border: '2px solid #fff',
                cursor: 'pointer'
                }}
            />
        </Box>
      );
    }
    // For non-image files, show icon
    return (
      <Box
        onClick={handleOpenModal}
        sx={{
          cursor: 'pointer',
          display: 'flex',
          border: '1px solid #6c6c6c',
          borderRadius: '25px',
          overflow: 'hidden',
          boxShadow: 'none',
          marginLeft: '-18px',
          '&:hover': {
            //boxShadow: 2,
          },
        }}
      >
        {/* {getFileIcon(file)} */}
        <img
          src="/pdf-bg.png"
          alt="pdf-img"
          style={
            nonimageCss ? nonimageCss :
            {
              display: 'block',
              width: '36px',
              height: '36px',
              objectFit: 'cover',
              borderRadius: '25px',
              border: '2px solid #fff',
              cursor: 'pointer'
            }}
        />
       {/* <Typography fontSize={12} noWrap sx={{ maxWidth: '60px' }}>
         {file.originalname}
       </Typography> */}
      </Box>
    );
  };

  return (
    <>
      {/* Small preview by default */}
      {renderSmallPreview()}
      {/* Full modal dialog */}
      <AppDialog
        open={isOpen}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            //height: '90vh',
            //maxHeight: '90vh',
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #e0e0e0',
            py: 0.5,
            px: { xs: 2, md: 3 },
          }}
        >
          <Box display="flex" alignItems="center" gap={0.75}>
            {currentFile &&
              React.cloneElement(getFileIcon(currentFile), {
                sx: { fontSize: 18 }, // Change size here
              })}
            <Typography fontSize={{ xs: 13, md: 14 }} noWrap sx={{ maxWidth: { xs: '180px', md: '220px' } }} title={currentFile.originalname}>
              {currentFile.originalname}
            </Typography>
            {fileList.length > 1 && (
              <Typography fontSize={{ xs: 12, md: 13 }} color="text.secondary" sx={{ ml: 0.5 }}>
                ({currentIndex + 1}/{fileList.length})
              </Typography>
            )}
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            {/* <IconButton onClick={downloadFile} title="Download">
              <DownloadIcon sx={{color:'#555'}}/>
            </IconButton> */}
            <IconButton onClick={handleClose} title="Close">
              <CloseIcon sx={{ color: '#555' }} />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent
          sx={{
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            //overflow: 'hidden',
            //position: 'relative',
          }}
        >
          {fileList.length > 1 && (
            <IconButton
              onClick={handlePrev}
              disabled={!canGoPrev}
              title="Previous file"
              sx={{
                padding: { xs: '0px', md: '3px' },
                position: 'absolute',
                left: { xs: 8, md: 15 },
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 1,
                bgcolor: 'rgba(0, 0, 0, 0.5)',
                '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.5)' },
                '&.Mui-disabled': { bgcolor: 'rgba(0, 0, 0, 0.1)' },
              }}
            >
              <ChevronLeftIcon sx={{ color: canGoPrev ? '#fff' : '#fff' }} />
            </IconButton>
          )}
          {fileList.length > 1 && (
            <IconButton
              onClick={handleNext}
              disabled={!canGoNext}
              title="Next file"
              sx={{
                padding: { xs: '0px', md: '3px' },
                position: 'absolute',
                right: { xs: 8, md: 15 },
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 1,
                bgcolor: 'rgba(0, 0, 0, 0.5)',
                '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.5)' },
                '&.Mui-disabled': { bgcolor: 'rgba(0, 0, 0, 0.1)' },
              }}
            >
              <ChevronRightIcon sx={{ color: canGoNext ? '#fff' : '#fff' }} />
            </IconButton>
          )}
          {renderFileContent()}
        </DialogContent>

        <DialogActions sx={{ borderTop: '1px solid #e0e0e0', padding: 2, gap: 1 }}>
          <Button onClick={handleClose} variant="outlined">
            Close
          </Button>
          <Button onClick={downloadFile} variant="contained" startIcon={<DownloadIcon />}>
            Download
          </Button>
        </DialogActions>
      </AppDialog>
    </>
  );
};

export default FileViewer;
