import React from 'react';
import { useAppSelector } from '@/redux/store';
import { useAccountsReceivableQuery } from '@/hooks/useDashboardQueries';
import AgingChart, { AgingChartDataItem } from './AgingChart';
import { formatDebitCredit } from '@/utils';

const AccReceivable: React.FC = () => {
  const { dashboard } = useAppSelector((state) => state.dashboard);
  const dateFilter = useAppSelector(
    (state) => state.dashboard.dashboard.dateFilters['AccReceivable']
  );

  useAccountsReceivableQuery(dateFilter.fromDate!, dateFilter.toDate!);

  const accountsReceivable = dashboard?.AccountsReceivable || {
    currentMonth: 0,
    oneMonth: 0,
    twoToSixMonths: 0,
    greaterThanSixMonths: 0,
  };

  const chartData: AgingChartDataItem[] = [
    {
      name: 'Current',
      amount: formatDebitCredit(accountsReceivable.currentMonth),
      value: accountsReceivable.currentMonth,
      color: '#f3ab30',
    },
    {
      name: '1 Month',
      amount:formatDebitCredit(accountsReceivable.oneMonth),
      value: accountsReceivable.oneMonth,
      color: '#3F51B5',
    },
    {
      name: '2-6 Months',
      amount:formatDebitCredit( accountsReceivable.twoToSixMonths),
      value: accountsReceivable.twoToSixMonths,
      color: '#FF8A80',
    },
    {
      name: '6+ Months',
      amount: formatDebitCredit(accountsReceivable.greaterThanSixMonths),
      value: accountsReceivable.greaterThanSixMonths,
      color: '#8b5cf6',
    },
  ];

  return (
    <AgingChart
      title="ACCOUNTS RECEIVABLE"
      filterType="AccReceivable"
      totalAmount={formatDebitCredit(accountsReceivable.totalAmount)}
      chartLabel="Receivable"
      data={chartData}
    />
  );
};

export default AccReceivable;
