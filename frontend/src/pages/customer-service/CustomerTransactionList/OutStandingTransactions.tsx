import React from 'react'
import { Box } from '@mui/material'
import { ICustomerInvoicesPaymentDetails, ITotalTransactionCount } from '@/types';
import { useQuery } from '@tanstack/react-query';
import apiService from '@/service/apiService';
import { useParams } from 'react-router-dom';
import TransactionTable from '../../../components/common/TransactionTable';
import { todayDate } from '@/config/constant';
import FilterTransaction from '../../../components/common/FilterTransaction';
import { DataTable } from '@/components/ui';
const OutStandingTransactions: React.FC = () => {
  const { id } = useParams();

  const [selectedYear, setSelectedYear] = React.useState<number>(
    todayDate.getFullYear()
  );

  // Pagination States
  const [currentPage, setCurrentPage] = React.useState<number>(1);
  const [limit, setLimit] = React.useState<number>(5);

  // Get Transactions
  const {
    data,
    isFetching,
    isLoading: isLoadingInvoice,
  } = useQuery({
    queryKey: [
      'getTransactionsByCustomerId',
      id,
      currentPage,
      limit,
      selectedYear,
    ],
    queryFn: async () => {
      const response =
        await apiService.getTransactionsByCustomerId(
          id as string,
          currentPage,
          limit,
          selectedYear
        );

      return response;
    },
    enabled: !!id,
  });

  // Total Transaction Count
  const { data: TotalTransactionCount } =
    useQuery<ITotalTransactionCount>({
      queryKey: ['TotalTransactionCount', id],
      queryFn: async () => {
        const response =
          await apiService.getTotalTransactionCountByCustomerId(
            id as string,
            'customer'
          );

        return response.data;
      },
      enabled: !!id,
    });

  // Transactions
  const invoiceData = data?.data || [];

  // Years Data
  const years = TotalTransactionCount?.years || [];

  // Total Records
  const totalRecords =
    years.find((item) => item._id === selectedYear)?.total || 0;

  // Reset page on year change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedYear]);

  return (
    <Box sx={{mt:1.5}}>
      <FilterTransaction years={years}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        totalLoaded={invoiceData.length}
        totalRecords={totalRecords} type='customer' />
      <DataTable
        data={invoiceData}
        columns={[
          { key: "srNo", label: "S.No", align:'center'},
          { key: "date", label: "Date"},
          { key: "type", label: "Ref No. Type"},
          { key: "party", label: "Customer"},
          { key: "memo", label: "Memo"},
          { key: "debit", label: "Debit"},
          { key: "credit", label: "Credit"},
          { key: "balanceDue", label: "Balance"},
          { key: "status", label: "Status", align:'center'},
          // { key: "actions", label: "Actions" },
          { key: "actions", label: "Edit", align:'center'},
        ]}
        isLoading={isFetching || isLoadingInvoice}
        emptyMessage="No Records found"
        total={totalRecords}
        page={currentPage - 1}
        rowsPerPage={limit}
        rowsPerPageOptions={[5, 10, 25, 50]}
        onPageChange={(newPage) => {
          setCurrentPage(newPage + 1);
        }}
        onRowsPerPageChange={(rows) => {
          setLimit(rows);
          setCurrentPage(1);
        }}
        renderRow={(invoice: ICustomerInvoicesPaymentDetails, index) => (
          <TransactionTable
            key={invoice._id}
            transaction={invoice}
            index={(currentPage - 1) * limit + index}
          />
        )}
      />

    </Box>
  )
}

export default OutStandingTransactions