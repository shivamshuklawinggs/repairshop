import React from 'react';
import ItemsTable from '@/components/common/ItemsTable';

const BillItemsTable: React.FC<{handleTaxModalShow:()=>void,handleProductServiceModalShow:()=>void}> = (props) => {
  return <ItemsTable {...props} type="bill" />;
};

export default BillItemsTable;
