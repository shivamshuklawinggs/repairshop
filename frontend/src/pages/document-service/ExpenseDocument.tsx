import React, { useState, useMemo, useEffect } from 'react'
import { TableRow, TableCell, Stack, Chip, IconButton, Select, MenuItem, FormControl } from '@mui/material';
import { IDocument, IFile, IitemService } from '@/types';
import { handleFileDownload } from '@/utils';
import { Checkbox } from '@mui/material';
import ViewIcon from '@mui/icons-material/RemoveRedEye';
import Download from '@mui/icons-material/Download';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import { formatDate } from '@/utils/dateUtils';

const ExpenseDocument = ({data,selectedDocuments,setSelectedDocuments,file,setFile}: {data: IDocument[],selectedDocuments: IFile[],setSelectedDocuments: React.Dispatch<React.SetStateAction<IFile[]>>,file: IFile | null,setFile: React.Dispatch<React.SetStateAction<IFile | null>>}) => {
      const [selectedExpense, setSelectedExpense] = useState<string>('');
console.log('data', data);

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

  return (
    <>
    {/* {Array.isArray(uniqueExpenses) && uniqueExpenses?.length>0 && (
       <FormControl size='small' sx={{ m: 1, minWidth: 120 }}>
        <Select
          value={selectedExpense}
          onChange={(e) => setSelectedExpense(e.target.value)}
          size="small"
        >
          {uniqueExpenses?.map((expense) => (
            <MenuItem key={expense?._id} value={expense?._id}>
              {expense?.label}
            </MenuItem>
          ))}
        </Select>
        </FormControl>
    )} */}

    {Array.isArray(data) && data.length>0 ? data?.map((document: IDocument) => {
            const files = document?.file
            return (
              <TableRow key={document?._id}>
                <TableCell padding="checkbox" align='center'>
                  <Checkbox
                    checked={selectedDocuments.some(doc => doc?.filename === files?.filename)}
                    onChange={() => handleCheckboxChange(files as IFile)}
                    sx={{
                      '& .MuiSvgIcon-root': {
                        fontSize: 18
                      }
                    }}
                  />
                </TableCell>

                <TableCell sx={{fontSize:{xs:13, md:14}, whiteSpace:'nowrap'}}>
                 {document?.service?.label}
                </TableCell>

                <TableCell sx={{fontSize:{xs:13, md:14}, whiteSpace:'nowrap'}}>
                 {document.file?.createdAt ? formatDate(document.file?.createdAt) : 'N/A'}
                </TableCell>

                <TableCell className='tellipsis' sx={{fontSize:{xs:13, md:13}}}>
                  <ImageOutlinedIcon
                    sx={{
                      fontSize: '24px',
                      p: 0.4,
                      backgroundColor: '#e3e4e6',
                      borderRadius: 0.5,
                      mr: 1,
                      verticalAlign: 'middle',
                    }} />
                 {files?.originalname || 'No file'}
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0} gap={1} justifyContent="center">
                    <IconButton
                      size="small"
                      onClick={() => handleFileOpen(files as IFile)}
                      disabled={!files}
                      sx={{
                        border: '1px solid #caced4',
                        borderRadius: 0.2,
                        my: 0.3,
                        p:0.4,
                        backgroundColor: '#fff'
                      }}
                    >
                    <ViewIcon  color='primary' sx={{fontSize:'13px'}}/>
                    </IconButton>
                    <IconButton
                      size="small"
                      color='primary'
                      onClick={() => handleFileDownload(files as IFile, files?.url as string)}
                      disabled={!files}
                      sx={{
                        border: '1px solid #caced4',
                        borderRadius: 0.2,
                        my: 0.3,
                        p:0.4,
                        backgroundColor: '#fff'
                      }}
                    >
                      <Download sx={{fontSize:'14px'}}/>
                    </IconButton>
                  </Stack>
                </TableCell>
              </TableRow>
            );
          }):<>
          <TableRow>
            <TableCell sx={{ color: 'text.secondary', py: 2, fontSize: '15px' }} colSpan={5} align="center">
              No documents found
            </TableCell>
          </TableRow>
          </>}
          </>


  )
}

export default ExpenseDocument