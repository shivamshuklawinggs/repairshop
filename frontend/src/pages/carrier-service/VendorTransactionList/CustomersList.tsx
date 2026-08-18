import React from 'react';
import TransactionSidebarList from '@/components/common/TransactionSidebarList';
import { getAllDataOfBillCustomers } from '@/utils/getAllDataByApi';
import { paths } from '@/utils/paths';

const CustomersListSidebar: React.FC = () => (
  <TransactionSidebarList
    queryKey="getBillVendors"
    fetchData={getAllDataOfBillCustomers}
    navigatePath={paths.vendortransactionlist}
    searchPlaceholder="Search Vendor..."
    emptyText="No vendors available"
    emptySearchText="No vendors found"
  />
);

export default CustomersListSidebar;