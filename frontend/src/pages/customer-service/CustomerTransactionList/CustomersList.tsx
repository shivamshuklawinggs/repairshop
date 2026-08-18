import React from 'react';
import TransactionSidebarList from '@/components/common/TransactionSidebarList';
import { getAllDataOfCustomers } from '@/utils/getAllDataByApi';
import { paths } from '@/utils/paths';

const CustomersListSidebar: React.FC = () => (
  <TransactionSidebarList
    queryKey="getCustomers"
    fetchData={getAllDataOfCustomers}
    navigatePath={paths.customertransactionlist}
    searchPlaceholder="Search customers..."
    emptyText="No customers available"
    emptySearchText="No customers found"
  />
);

export default CustomersListSidebar;