import React from 'react';
import { useAppSelector } from '@/redux/store';
import { useAccountsPayableQuery } from '@/hooks/useDashboardQueries';
import AgingChart, { AgingChartDataItem } from './AgingChart';
import { formatDebitCredit } from '@/utils';

const AccPayable: React.FC = () => {
  const { dashboard } = useAppSelector((state) => state.dashboard);
  const dateFilter = useAppSelector(
    (state) => state.dashboard.dashboard.dateFilters['AccPayable']
  );

  useAccountsPayableQuery(dateFilter.fromDate!, dateFilter.toDate!);

  const accountsPayable = dashboard?.AccountsPayable || {
    currentMonth: 0,
    oneMonth: 0,
    twoToSixMonths: 0,
    greaterThanSixMonths: 0,
    totalAmountString: '0',
    currentMonthString: '0',
    oneMonthString: '0',
    twoToSixMonthsString: '0',
    greaterThanSixMonthsString: '0',
  };

  const chartData: AgingChartDataItem[] = [
    {
      name: 'Current',
      amount:formatDebitCredit(accountsPayable.currentMonth) ,
      value: accountsPayable.currentMonth,
      color: '#f3ab30',
    },
    {
      name: '1 Month',
      amount:formatDebitCredit(accountsPayable.oneMonth),
      value: accountsPayable.oneMonth,
      color: '#3F51B5',
    },
    {
      name: '2-6 Months',
      amount: formatDebitCredit(accountsPayable.twoToSixMonths),
      value: accountsPayable.twoToSixMonths,
      color: '#FF8A80',
    },
    {
      name: '6+ Months',
      amount:formatDebitCredit( accountsPayable.greaterThanSixMonths),
      value: accountsPayable.greaterThanSixMonths,
      color: '#8b5cf6',
    },
  ];

  return (
    <AgingChart
      title="ACCOUNTS PAYABLE"
      filterType="AccPayable"
      totalAmount={formatDebitCredit(accountsPayable.totalAmount)}
      chartLabel="Payable"
      data={chartData}
    />
  );
};

export default AccPayable;
