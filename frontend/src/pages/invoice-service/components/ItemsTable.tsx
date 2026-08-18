import React from 'react';
import ItemsTable from '@/components/common/ItemsTable';

const InvoiceItemsTable: React.FC<{handleTaxModalShow:()=>void,handleProductServiceModalShow:()=>void}> = (props) => {
  return <ItemsTable {...props} type="invoice" />;
};

export default InvoiceItemsTable;
