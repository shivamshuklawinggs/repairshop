import React, { useMemo, useState } from "react";
import {
  Box,
  Typography,
  FormControl,
  Select,
  MenuItem,
  IconButton,
  Chip,
  CircularProgress,
  TextField,
  TableCell,
  TableRow,
} from "@mui/material";
import DataTable from "@/components/ui/DataTable";
import { ColumnDef } from "@/components/ui/DataTable";
import { Edit, Download } from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import apiService from "@/service/apiService";
import { AccountRegisterResponse, IChartAccount, ReferenceType, Transaction } from "@/types";
import { downloadExcel, formatCurrency, formatDebitCredit } from "@/utils";
import { formatDate } from "@/utils/dateUtils";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { paths } from "@/utils/paths";
import { withPermission } from "@/hooks/authUtils";
import { useAppDispatch, useAppSelector } from "@/redux/store";
import { setFromDate, setToDate } from "@/store/reports";
import { toast } from "react-toastify";
import { Button, ButtonGroup } from "@mui/material";
const AccountRegister: React.FC = () => {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { fromDate, toDate } = useAppSelector((state) => state.report);

  // Define columns for DataTable
  const columns: ColumnDef[] = [
    { key: 'date', label: 'Date', align: 'left' },
    { key: 'refNo', label: 'Ref No', align: 'left' },
    { key: 'payeeAccount', label: 'Payee Account', align: 'left' },
    { key: 'memo', label: 'Memo', align: 'left' },
    { key: 'debit', label: 'Debit', align: 'right' },
    { key: 'credit', label: 'Credit', align: 'right' },
    { key: 'balance', label: 'Balance', align: 'right' },
    { key: 'edit', label: 'Edit', align: 'center' },
  ];
  // ✅ pagination states
  const [page, setPage] = useState(1); // backend expects 1-based
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const { data: accounts = [] } = useQuery<IChartAccount[]>({
    queryKey: ["chartAccounts"],
    queryFn: async () => {
      const response = await apiService.getChartAccounts({limit:100,isProductServicesPage:"0",isChartData:"1",nor:""});
      return response.data.data || [];
    },
  });
  const { data: endingBalanceData = {endingBalanceNumeric: 0,endingBalance: "",symbol: ""} } = useQuery<{endingBalanceNumeric: number,endingBalance: string,symbol: string}>({
    queryKey: ["endingBalanceData",id,fromDate,toDate],
    queryFn: async () => {
      const response = await apiService.getChartAccountEndingBalance(
        id,
       fromDate ? fromDate : undefined,
        toDate ? toDate : undefined
      );
      return response.data || {
        endingBalanceNumeric: 0,
        endingBalance:"",
        symbol: "Dr"
      }
    },
  });

  const {
    data: accountRegister,
    isLoading: isLoadingStats,
    isFetching,
  } = useQuery<AccountRegisterResponse | null>({
    queryKey: ["accountRegister", id, rowsPerPage, page, fromDate, toDate],
    queryFn: async () => {
     try {
        if (!id) return null;
      const response = await apiService.getChartAccountstats(
        id,
        page,
        rowsPerPage,
        fromDate ? fromDate : undefined,
        toDate ? toDate : undefined
      );
      // ✅ IMPORTANT: backend returns { data, totals, meta }
      return response
     } catch (error:any) {
      console.log(error)
      toast.error(error?.message || "Something is Wrong" )
      return null
     }
    },
    enabled: !!id,
  });

  const transactions = useMemo(
    () => accountRegister?.data || [],
    [accountRegister?.data]
  );
  // const transactions = accountregisterdata.data as unknown  as Transaction

  const totalCount = useMemo(
    () => accountRegister?.total || 0,
    [accountRegister?.total]
  );
  // const totalCount = accountregisterdata.total

  const handleEdit = (transaction: Transaction) => {
    try {
      if (transaction.type ===ReferenceType.JOURNAL_ENTRY) {
        navigate(`/accounting${paths.JournalEntry}/${transaction.referenceId}`);
      } else if (transaction.type === ReferenceType.INVOICE_PAYMENT) {
        navigate(`${paths.recievedpayment}/${transaction.referenceId}`);
      } else if (transaction.type === ReferenceType.BILL_PAYMENT) {
        navigate(`${paths.recievedbill}/${transaction.referenceId}`);
      } else if (
        transaction.type ===  ReferenceType.INVOICE ||
        transaction.type ===  ReferenceType.SALES_TAX ||
        transaction.type ===  ReferenceType.SALES_DISCOUNT
      ) {
        navigate(`${paths.editinvoice}/${transaction.referenceId}`);
      } else if (
        transaction.type === ReferenceType.BILL||
        transaction.type === ReferenceType.PURCHASE_TAX ||
        transaction.type === ReferenceType.PURCHASE_DISCOUNT
      ) {
        navigate(`${paths.editbill}/${transaction.referenceId}`);
      }
    } catch (error) {
      console.error(error);
    }
  };


  const getTransactionMemo = (transaction: Transaction) => {
    return transaction?.description;
  };

  const handleRowsPerPageChange = (
    rows: number
  ) => {
    setRowsPerPage(rows);
    setPage(1); // reset to first page
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage + 1); // Convert 0-based to 1-based
  };

  // Render function for DataTable rows
  const renderTransactionRow = (transaction: Transaction, index: number) => (
    <TableRow key={`${transaction._id}-${index}`}>
      <TableCell sx={{width:'15%'}}>
        {transaction?.postingDate
          ? formatDate(transaction?.postingDate)
          : "N/A"}
      </TableCell>
      <TableCell sx={{width:'15%'}}>
        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 0 }}>
          <Chip
            title={transaction.refrenceNo}
            label={transaction.refrenceNo}
            size="small"
            sx={{
              fontSize: '0.8rem',
              fontWeight: 600,
              height:'auto',
              width:'fit-content',
              maxWidth:'100px',
              backgroundColor:'transparent',
              mb:0,
              lineHeight:'1.1',
              '& .MuiChip-label':{
                pl:0,
               }
             }}
          />
          <Chip
            label={transaction.type}
            size="small"
            color="primary"
            variant="outlined"
            sx={{
              fontSize: '0.65rem',
              fontWeight:'600',
              height:'auto',
              width:'fit-content',
              lineHeight:'1.35' }}
          />
        </Box>
      </TableCell>

      <TableCell sx={{width:'15%'}} title={transaction?.customer} className='tellipsis'>{transaction?.customer}</TableCell>

      <TableCell sx={{width:'15%'}} title={getTransactionMemo(transaction)} className='tellipsis'>{getTransactionMemo(transaction)}</TableCell>

      <TableCell align="right" sx={{width:'10%', whiteSpace:'nowrap'}}>
        {formatCurrency(transaction.debit)}
      </TableCell>

      <TableCell align="right" sx={{width:'10%', whiteSpace:'nowrap'}}>
        {formatCurrency(transaction.credit)}
      </TableCell>

      <TableCell align="right" sx={{width:'10%', whiteSpace:'nowrap'}}>
        {formatDebitCredit(transaction?.balanceDuenumeric ??0)}
      </TableCell>

      <TableCell align="center" sx={{width:'10%'}}>
        <IconButton
          title="Edit"
          onClick={() => handleEdit(transaction)}
          sx={{
            bgcolor: '#e2e8f0',
            color: '#0f172a',
            padding: '3px',
            '&:hover': {
              bgcolor: '#f1f5f9',
            },
          }}
        >
          <Edit sx={{fontSize:'13px'}}/>
        </IconButton>
      </TableCell>
    </TableRow>
  );

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      if (!id) {
        toast.error('Please select an account first');
        return;
      }

      const response = await apiService.exportChartAccountstats(
        id,
        format,
        fromDate ? fromDate : undefined,
        toDate ? toDate : undefined
      );
      downloadExcel(response.data);
      toast.success(`Exported as ${format.toUpperCase()} successfully`);
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error(error?.message || 'Export failed');
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 0 }}>
        {/* Header Section */}
        <Box
          sx={{
            display: { xs: 'block', md: 'flex' },
            justifyContent: "space-between",
            alignItems: "end",
            mb: 3,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: 'wrap' }}>
            <FormControl size='small' sx={{ minWidth: { xs: '100%', md: '200px' }, backgroundColor:'#fff' }} >
              <Select
                value={id}
                onChange={(e) =>
                  navigate(`${paths.AccountRegister}/${e.target.value}`)
                }
                displayEmpty
              >
                {accounts?.map((account) => (
                  <MenuItem key={account._id} value={account._id}>
                    {account.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <DatePicker
              label="From Date"
              value={fromDate ? new Date(fromDate) : null}
              onChange={(newValue) => dispatch(setFromDate(new Date(newValue as Date) || undefined))}
              slotProps={{ textField: { size: 'small', sx: { width: 160 } } }}
            />

            <DatePicker
              label="To Date"
              value={toDate ? new Date(toDate) : null}
              onChange={(newValue) => dispatch(setToDate(new Date(newValue as Date) || undefined))}
              slotProps={{ textField: { size: 'small', sx: { width: 160 } } }}
            />

            {/* ✅ show totals small info */}
            {!!id && (
              <Typography variant="body2" color="text.primary">
                Total Transactions: <b>{totalCount}</b>
                {isFetching ? " (loading...)" : ""}
              </Typography>
            )}
          </Box>

          <Box sx={{ textAlign: "right", marginRight:'20px' }}>
            <Typography fontSize={12} color="text.secondary">
              ENDING BALANCE
            </Typography>
            <Typography
              variant="h5"
              sx={{ fontWeight: "bold", color: "text.primary" }}
            >
            {/* If backend sends endingBalance put here */}
            {formatDebitCredit(endingBalanceData?.endingBalanceNumeric ?? 0)}
            </Typography>
            {/* Export Buttons */}
            {!!id && transactions.length > 0 && (
              <Box sx={{mt:1}}>
                <ButtonGroup size="small" variant="outlined">
                  <Button
                    startIcon={<Download />}
                    onClick={() => handleExport('csv')}
                    disabled={isFetching}
                  >
                    Export Excel
                  </Button>
                </ButtonGroup>
              </Box>
            )}
          </Box>
        </Box>

      {/* DataTable Section */}
      <DataTable
        columns={columns}
        data={transactions}
        isLoading={isLoadingStats}
        renderRow={renderTransactionRow}
        total={totalCount}
        page={page - 1} // DataTable expects 0-based
        rowsPerPage={rowsPerPage}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        rowsPerPageOptions={[5, 10, 25, 50]}
        emptyMessage="No Records Found"
        size="small"
        stickyHeader={false}
      />
    </Box>
    </LocalizationProvider>
  );
};

export default withPermission("view", ["accounting"])(AccountRegister);
