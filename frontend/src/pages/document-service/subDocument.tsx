import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/redux/store';
import { useQuery } from '@tanstack/react-query';
import { fetchSubDocuments } from '@/redux/api';
import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Stack, Chip, TablePagination, Tabs, Tab, Checkbox, Button, Typography, } from '@mui/material';
import { RemoveRedEye as ViewIcon, Download, Mail } from '@mui/icons-material';
import { IDocument, IFile } from '@/types';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { handleFileDownload,getSubDocumentName } from '@/utils';
import { toast } from 'react-toastify';
import SendEmail from './SendEmail';
import PreviewDocument from './previewDocument';
import {carrierSubTypes,customerSubTypes,loadSubTypes} from '@/data/documetsdata';
import ExpenseDocument from './ExpenseDocument';
import { HOUR_MINUTE_FORMAT, TIME_FORMAT } from '@/config/constant';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import moment from 'moment';

interface SubDocumentProps {
  parentId: string;
  type: string;
}

const SubDocument: React.FC<SubDocumentProps> = ({ parentId, type }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { data, pagination } = useSelector((state: RootState) => state.subDocuments);
  const [activeId, setActiveId] = useState<string>(
    type === 'carrier' ? 'carrierId' :
    type === 'customer' ? 'customerId' :
    type === 'load' ? 'loadId' : ''
  );
  const subtypes = type === 'carrier' ? carrierSubTypes : type === 'customer' ? customerSubTypes : loadSubTypes;
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [subtype, setSubtype] = useState<string>('');
  const [selectedDocuments, setSelectedDocuments] = useState<IFile[]>([]);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [file, setFile] = useState<IFile | null>(null);


  const handleCheckboxChange = (document: IFile) => {
    setSelectedDocuments(prev => {
      const isSelected = prev.some(doc => doc.filename === document.filename);
      if (isSelected) {
        return prev.filter(doc => doc.filename !== document.filename);
      } else {
        return [...prev, document];
      }
    });
  };
 const handleFileOpen = (document: IFile) => {
    setFile(document);
  };
  const handleFileClose = () => {
    setFile(null);
  };
  const handleEmailDialogOpen = () => {
    if (selectedDocuments.length === 0) {
      toast.error('Please select at least one document to send');
      return;
    }
    setEmailDialogOpen(true);
  };
  useEffect(() => {
    setCurrentPage(1);
    // Set default subtype and activeId when type changes
    if (type === 'carrier') {
      setSubtype('carrier');
      setActiveId('carrierId');
    } else if (type === 'customer') {
      setSubtype('customer');
      setActiveId('customerId');
    } else if (type === 'load') {
      setSubtype('load');
      setActiveId('loadId');
    }
  }, [type]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: string) => {
    setSubtype(newValue);
    setCurrentPage(1);
  };


  const { isPending } = useQuery({
    queryKey: ['subDocuments', type, subtype, parentId, currentPage, limit, activeId],
    queryFn: async () => {
      if (!activeId || !parentId || !subtype) {
        throw new Error('Missing required parameters');
      }

      const params:Record<string,any> = {
        page: currentPage,
        limit,
        type: subtype,
        [activeId as keyof typeof params]: parentId,
      };
      return await dispatch(fetchSubDocuments(params));
    },
    enabled: Boolean(parentId && activeId && subtype)
  });



  return (
    <Box>
      <Box sx={{ mb: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt:0}}>
        <Tabs value={subtype} onChange={handleTabChange} variant="scrollable" scrollButtons="auto"
         sx={{
               minHeight: '35px',
               mb:1,
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 500,
                minHeight: '35px',
                px: {xs:1.5, md:2.8},
                fontSize:{xs:'13px', md:'13.6px'},
                py:0,
              },
               '& .MuiTab-root.Mui-selected': {
                color: '#101721',
              },
              '& .Mui-selected': {
                color: '#101721',
                fontWeight: 600
              },
              '& .MuiTabs-indicator': {
                height: '2px',
                borderRadius: '0px'
              }
            }}
        >
          {subtypes.map((tab) => (
            <Tab key={tab.value} value={tab.value} label={tab.label} />
          ))}
        </Tabs>
        {selectedDocuments.length > 0 && (
          <Button
            variant="contained"
            size='small'
            startIcon={<Mail />}
            onClick={handleEmailDialogOpen}
            sx={{
              borderRadius:2,
              fontSize:'0.75rem',
              px:{xs:1, md:1.5},
              py:0.2,
              mr:1.5,
              ml:{xs:3, md:1.5},
              minWidth:'auto',
              whiteSpace:'nowrap',
              '& .MuiButton-startIcon svg': {
                fontSize: 13,
              },

              '& .MuiButton-startIcon': {
                mr:0.5,
              }
            }}
          >
          Send {selectedDocuments.length} Document(s)
          </Button>
        )}
      </Box>

      {subtype && (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell style={{width:'5%'}} padding="checkbox" sx={{fontSize:'13px'}}>Select</TableCell>
                <TableCell style={{width:'25%'}} sx={{fontSize:'13px', whiteSpace:'nowrap'}}>{subtype === 'expense' ? 'Service' : subtype === 'driver' ? 'Driver Name' :subtype === 'carrierinsurance' ? 'Insurance Company' : 'Name'}</TableCell>
                <TableCell style={{width:'20%'}} sx={{fontSize:'13px', whiteSpace:'nowrap'}}>Created At</TableCell>
                <TableCell style={{width:'30%'}} sx={{fontSize:'13px'}}>File</TableCell>
                <TableCell style={{width:'20%'}} align="center" sx={{fontSize:'13px'}}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isPending ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <LoadingSpinner size={30} />
                  </TableCell>
                </TableRow>
              ) :subtype === 'expense' ? (
                <ExpenseDocument data={data} selectedDocuments={selectedDocuments} setSelectedDocuments={setSelectedDocuments} file={file} setFile={setFile} />
              ) : data?.length > 0 ? (
                data.map((document: IDocument) => {
                  const files = document?.file
                  return (
                    <TableRow key={document._id}>
                      <TableCell padding="checkbox" align='center'>
                        <Checkbox
                          checked={selectedDocuments.some(doc => doc.filename === files?.filename)}
                          onChange={() => handleCheckboxChange(files as IFile)}
                          sx={{
                            '& .MuiSvgIcon-root': {
                              fontSize: 18
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{fontSize:{xs:13, md:14}, whiteSpace:'nowrap'}}>{ getSubDocumentName(document,subtype)}</TableCell>
                      <TableCell sx={{fontSize:{xs:13, md:14}, whiteSpace:'nowrap'}}>{moment(document.createdAt).format(`${TIME_FORMAT} ${HOUR_MINUTE_FORMAT}`)}</TableCell>
                      <TableCell className='tellipsis' sx={{fontSize:{xs:13, md:13}}}>
                       <ImageOutlinedIcon
                       sx={{
                        fontSize:'24px',
                        p:0.4,
                        backgroundColor:'#e3e4e6',
                        borderRadius:0.5,
                        mr:1,
                        verticalAlign:'middle',
                       }}/>
                       {files?.originalname || 'No file'}
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0} gap={1} justifyContent="center">
                          <IconButton
                            size="small"
                            onClick={() => handleFileOpen(files as IFile)}
                            disabled={!files}
                            sx={{
                              border:'1px solid #caced4',
                              borderRadius:0.2,
                              my:0.3,
                              p:0.4,
                              backgroundColor:'#fff'
                            }}
                          >
                            <ViewIcon  color='primary' sx={{fontSize:'13px',}}/>
                          </IconButton>
                          <IconButton
                            size="small"
                            color='primary'
                            onClick={() => handleFileDownload(files as IFile, files?.url as string)}
                            disabled={!files}
                            sx={{
                              border:'1px solid #caced4',
                              borderRadius:0.2,
                              my:0.3,
                              p:0.4,
                              backgroundColor:'#fff'
                            }}
                          >
                            <Download sx={{fontSize:'14px'}}/>
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell sx={{color:'text.secondary', py:2, fontSize:'15px'}} colSpan={5} align="center">
                    No documents found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={pagination?.total || 0}
            page={currentPage - 1}
            onPageChange={(_, newPage) => setCurrentPage(newPage + 1)}
            rowsPerPage={limit}
            onRowsPerPageChange={(event) => setLimit(Number(event.target.value))}
            sx={{
              "& .MuiTablePagination-toolbar": {
                minHeight: "30px",
              },
              "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
                fontSize: "12.6px",
                fontWeight: 500,
                my:0,
              },
              "& .MuiTablePagination-select": {
                fontSize: "12.6px",
              },
              "& .MuiSvgIcon-root": {
                fontSize: "20px",
              }
            }}
          />
        </TableContainer>
      )}
       <SendEmail selectedDocuments={selectedDocuments} setSelectedDocuments={setSelectedDocuments} emailDialogOpen={emailDialogOpen} setEmailDialogOpen={setEmailDialogOpen} />
      {file && (
        <PreviewDocument file={file} handleClose={handleFileClose} />
      )}
    </Box>
  );
};

export default SubDocument;