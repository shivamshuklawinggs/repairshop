import React from 'react';
import ItemsTable from '@/components/common/ItemsTable';

const EstimateItemsTable: React.FC<{handleTaxModalShow:()=>void,handleProductServiceModalShow:()=>void}> = (props) => {
  return <ItemsTable {...props} type="invoice" />;
};

export default EstimateItemsTable;
