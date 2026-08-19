import React, { useState, useEffect } from 'react';
import { Modal, Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Tabs, Tab, IconButton, TablePagination, DialogActions, Button, } from '@mui/material';
import { PageHeader } from '@/components/ui';
import { useDispatch, useSelector } from 'react-redux';
import { Remove as RemoveIcon, Add as AddIcon, CheckCircleOutline, CheckBox, Checklist, CheckTwoTone, CheckBoxRounded, CheckBoxOutlineBlank, CheckBoxOutlineBlankRounded, CheckBoxOutlineBlankSharp, ArrowDownward, ArrowDropDown, ArrowDropUp, ArrowUpward } from '@mui/icons-material';
import { RootState, AppDispatch } from '@/redux/store';
import { useQuery } from '@tanstack/react-query';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { fetchDocuments } from '@/redux/api';
import { getSubDocumentName,getDocumentCell } from '@/utils';
import { IDocument, IFile } from '@/types';
import { setDocuments } from '@/redux/Slice/DocumentSlice';
import {documentType} from '@/data/documetsdata';
import { withPermission } from '@/hooks/authUtils';
import { HOUR_MINUTE_FORMAT, TIME_FORMAT } from '@/config/constant';
import moment from 'moment';
import { ArrowDropDownIcon } from '@mui/x-date-pickers';
import { getIcon } from '@/components/common/icons/getIcon';
import AppModalDialog from '@/components/ui/AppModalDialog';


const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: {xs:'95%', md:'80%'},
  maxHeight: '85vh',
  bgcolor: 'background.paper',
  boxShadow: 24,
  pt: 2.5,
  pr: 3.5,
  pb: 3.5,
  pl: 3.5,
  overflow: 'auto',
  borderRadius:'16px',
};

const Documents: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { data, pagination } = useSelector((state: RootState) => state.documents);
  const [activeTab, setActiveTab] = useState<string>('customer');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [selectedDocument] = useState<IFile | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);

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

  useEffect(() => {
    dispatch(setDocuments([]));
    setCurrentPage(1);
  }, [activeTab, dispatch]);

  return (
    <>
      <Box sx={{ minHeight: '100vh' }}>
          <PageHeader title="Documents & Files" subtitle="View and manage uploaded documents" />
          <Paper elevation={0}
          sx={{
            mb: 2.5,
            mt:{xs:2, md:2},
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
                gap:0,
              },
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 500,
                minHeight: 30,
                px: 2.5,
                py:{ xs: 0.4, md: 0.6 },
                fontSize:{ xs: '0.8rem', md: '0.85rem' },
                color: '#444',
                borderTop:'1px solid #383e4b80',
                borderRight:'1px solid #383e4b80',
                borderBottom:'1px solid #383e4b80',
                borderRadius:0,
                background:'#fff',
                '&:first-of-type': {
                  borderLeft: '1px solid #383e4b80',
                  borderRadius:'5px 0px 0px 5px',
                },
                '&:last-of-type': {
                  borderRadius:'0px 5px 5px 0px',
                },
              },
              '& .MuiTab-root.Mui-selected': {
                color: '#fff',
                background:'#383e4b',
                borderRadius:0,
                fontWeight: 500,
                border:'none',
                 '&:first-of-type': {
                  borderRadius:'5px 0px 0px 5px',
                },
                 '&:last-of-type': {
                  borderRadius:'0px 5px 5px 0px',
                },
              },
              '& .Mui-selected': {
                color: '#fff',
                background:'#383e4b',
                borderRadius:0,
                fontWeight: 500,
                border:'none',
                 '&:first-of-type': {
                  borderRadius:'5px 0px 0px 5px',
                },
                 '&:last-of-type': {
                  borderRadius:'0px 5px 5px 0px',
                },
              },
              '& .MuiTabs-indicator': {
                height: 0,
                borderRadius: '0px',
                background:'#101721',
              }
            }}
            >
              {documentType.map((status) => (
                <Tab key={status.value} label={status.label} value={status.value} />
              ))}
            </Tabs>
          </Paper>

          <Paper variant="outlined" sx={{ borderRadius: 0.5, overflow: 'hidden' }}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell className='tellipsis' title={getDocumentCell(activeTab)}>{getDocumentCell(activeTab)}</TableCell>
                    <TableCell className='tellipsis' title='Created Date'>Created Date</TableCell>
                    <TableCell className='tellipsis' title='Last Updated'>Last Updated</TableCell>
                    <TableCell  sx={{width:'15%', textAlign:'center'}} title='Actions'>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {isPending ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                        <LoadingSpinner size={32} />
                      </TableCell>
                    </TableRow>
                  ) :Array(data) &&  data?.length > 0 ? (
                    data?.map((document: IDocument) => {
                      return (
                        <React.Fragment key={document?._id}>
                          <TableRow hover>
                            <TableCell sx={{whiteSpace:'nowrap'}}>{getSubDocumentName(document, activeTab)}</TableCell>
                            <TableCell sx={{whiteSpace:'nowrap'}}>{moment(document?.createdAt).format(`${TIME_FORMAT} ${HOUR_MINUTE_FORMAT}`)}</TableCell>
                            <TableCell sx={{whiteSpace:'nowrap'}}>{moment(document?.updatedAt).format(`${TIME_FORMAT} ${HOUR_MINUTE_FORMAT}`)}</TableCell>
                          </TableRow>
                        </React.Fragment>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                        <Box>
                          <img src="/empty.png" alt="empty" width={42} />
                        </Box>
                        <Typography fontSize={15} color="text.secondary">No records found</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={pagination?.total || 0}
              page={currentPage - 1}
              rowsPerPage={limit}
              onPageChange={(_, newPage) => setCurrentPage(newPage + 1)}
              onRowsPerPageChange={(event) => setLimit(Number(event.target.value))}
              sx={{ '& .MuiTablePagination-toolbar': { minHeight: 48 } }}
            />
          </Paper>
      </Box>
      <AppModalDialog
        open={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
      >
        <Box sx={modalStyle}>
          <DialogActions className='dialog-close'>
            <Button onClick={() => setViewModalOpen(false)}>
              {getIcon('CloseIcon')}
            </Button>
          </DialogActions>
          <Typography variant="h6" component="h2" gutterBottom>
            Document Preview
          </Typography>
          {selectedDocument && (
            <iframe
              src={selectedDocument.url}
              style={{ width: '100%', height: 'calc(90vh - 100px)' }}
              title="Document Preview"
            />
          )}
        </Box>
      </AppModalDialog>
    </>
  );
};

export default withPermission("view",["documents"])(Documents);
