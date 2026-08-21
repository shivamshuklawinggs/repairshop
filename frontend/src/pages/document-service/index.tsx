import React, { useState, useEffect } from 'react';
import { Modal, Box, Typography, TableCell, TableRow, Paper, Tabs, Tab, IconButton, DialogActions, Button, Stack } from '@mui/material';
import { PageHeader } from '@/components/ui';
import { useDispatch, useSelector } from 'react-redux';
import { RemoveRedEye as ViewIcon, Download, ImageOutlined } from '@mui/icons-material';
import { RootState, AppDispatch } from '@/redux/store';
import { useQuery } from '@tanstack/react-query';
import { fetchDocuments } from '@/redux/api';
import { getSubDocumentName, getDocumentCell, handleFileDownload } from '@/utils';
import { IDocument, IFile } from '@/types';
import { setDocuments } from '@/redux/Slice/DocumentSlice';
import { documentType } from '@/data/documetsdata';
import { withPermission } from '@/hooks/authUtils';
import { HOUR_MINUTE_FORMAT, TIME_FORMAT } from '@/config/constant';
import moment from 'moment';
import FileViewer from "@/components/FileViewer";
import DataTable, { ColumnDef } from '@/components/ui/DataTable';
const Documents: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { data, pagination } = useSelector((state: RootState) => state.documents);
  const [activeTab, setActiveTab] = useState<string>('customer');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [file, setFile] = useState<IFile | null>(null);
  const { isPending } = useQuery({
    queryKey: ['documents', activeTab, currentPage, limit],
    queryFn: async () => {
      return await dispatch(fetchDocuments({
        page: currentPage,
        limit,
        type: activeTab
      }));
    },
  });

  const handleFileOpen = (document: IFile) => {
    setFile(document);
  };
  useEffect(() => {
    dispatch(setDocuments([]));
    setCurrentPage(1);
  }, [activeTab, dispatch]);

  const columns: ColumnDef[] = [
    { key: 'company', label: getDocumentCell(activeTab) },
    { key: 'createdAt', label: 'Created Date' },
    { key: 'updatedAt', label: 'Last Updated' },
    { key: 'fileSize', label: 'File' },
    { key: 'actions', label: 'Actions', align: 'center', width: '15%' },
  ];

  return (
    <>
      <Box sx={{ minHeight: '100vh' }}>
        <PageHeader title="Documents & Files" subtitle="View and manage uploaded documents" />
        <Paper elevation={0}
          sx={{
            mb: 2.5,
            mt: { xs: 2, md: 2 },
            overflow: 'hidden',
            borderRadius: 0,
            border: 'none',
            //borderBottom:'1px solid #c3c3c3',
            //borderColor: 'divider',
            //bgcolor: 'background.paper',
            bgcolor: 'transparent',
          }}>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              minHeight: 30,
              '& .MuiTabs-list': {
                gap: 0,
              },
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 500,
                minHeight: 30,
                px: 2.5,
                py: { xs: 0.4, md: 0.6 },
                fontSize: { xs: '0.8rem', md: '0.85rem' },
                color: '#444',
                borderTop: '1px solid #383e4b80',
                borderRight: '1px solid #383e4b80',
                borderBottom: '1px solid #383e4b80',
                borderRadius: 0,
                background: '#fff',
                '&:first-of-type': {
                  borderLeft: '1px solid #383e4b80',
                  borderRadius: '5px 0px 0px 5px',
                },
                '&:last-of-type': {
                  borderRadius: '0px 5px 5px 0px',
                },
              },
              '& .MuiTab-root.Mui-selected': {
                color: '#fff',
                background: '#383e4b',
                borderRadius: 0,
                fontWeight: 500,
                border: 'none',
                '&:first-of-type': {
                  borderRadius: '5px 0px 0px 5px',
                },
                '&:last-of-type': {
                  borderRadius: '0px 5px 5px 0px',
                },
              },
              '& .Mui-selected': {
                color: '#fff',
                background: '#383e4b',
                borderRadius: 0,
                fontWeight: 500,
                border: 'none',
                '&:first-of-type': {
                  borderRadius: '5px 0px 0px 5px',
                },
                '&:last-of-type': {
                  borderRadius: '0px 5px 5px 0px',
                },
              },
              '& .MuiTabs-indicator': {
                height: 0,
                borderRadius: '0px',
                background: '#101721',
              }
            }}
          >
            {documentType.map((status) => (
              <Tab key={status.value} label={status.label} value={status.value} />
            ))}
          </Tabs>
        </Paper>
        <DataTable
          columns={columns}
          data={data || []}
          isLoading={isPending}
          renderRow={(document: IDocument) => (
            <TableRow key={document?._id} hover>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>{getSubDocumentName(document, activeTab)}</TableCell>
              <TableCell
                sx={{
                  fontSize: { xs: 13, md: 14 },
                  whiteSpace: "nowrap",
                }}
              >
                {moment(document.file?.createdAt).format(
                  `${TIME_FORMAT} ${HOUR_MINUTE_FORMAT}`,
                )}
              </TableCell>
              <TableCell
                sx={{
                  fontSize: { xs: 13, md: 14 },
                  whiteSpace: "nowrap",
                }}
              >
                {moment(document.file?.createdAt).format(
                  `${TIME_FORMAT} ${HOUR_MINUTE_FORMAT}`,
                )}
              </TableCell>
              <TableCell
                className="tellipsis"
                sx={{ fontSize: { xs: 13, md: 13 } }}
              >
                <ImageOutlined
                  sx={{
                    fontSize: "24px",
                    p: 0.4,
                    backgroundColor: "#e3e4e6",
                    borderRadius: 0.5,
                    mr: 1,
                    verticalAlign: "middle",
                  }}
                />
                {document.file?.originalname || "No file"}
              </TableCell>
              <TableCell>
                <Stack
                  direction="row"
                  spacing={0}
                  gap={1}
                  justifyContent="center"
                >
                    <FileViewer
                      file={document.file}
                      url={`${document.file.url || ""}${document.file.filename}`}
                    trigger={
                      <IconButton
                        size="small"
                        onClick={() => handleFileOpen(document.file as IFile)}
                        disabled={!document.file}
                        sx={{
                          border: "1px solid #caced4",
                          borderRadius: 0.2,
                          my: 0.3,
                          p: 0.4,
                          backgroundColor: "#fff",
                        }}
                      >
                        <ViewIcon color="primary" sx={{ fontSize: "13px" }} />
                      </IconButton>
                    }
                    />
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() =>
                      handleFileDownload(
                        document.file as IFile,
                        document.file?.url as string,
                      )
                    }
                    disabled={!document.file}
                    sx={{
                      border: "1px solid #caced4",
                      borderRadius: 0.2,
                      my: 0.3,
                      p: 0.4,
                      backgroundColor: "#fff",
                    }}
                  >
                    <Download sx={{ fontSize: "14px" }} />
                  </IconButton>
                </Stack>
              </TableCell>
            </TableRow>
          )}
          total={pagination?.total || 0}
          page={currentPage - 1}
          rowsPerPage={limit}
          onPageChange={(newPage) => setCurrentPage(newPage + 1)}
          onRowsPerPageChange={setLimit}
        />
      </Box>
    </>
  );
};

export default withPermission("view", ["documents"])(Documents);
