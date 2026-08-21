import { invoiceexpense, IProductService } from '@/types';
import { Alert } from '@mui/material';
import React from 'react';

interface ReorderAlertProps {
  expense: invoiceexpense;
  product: string;
  productServiceArray: IProductService[];
}

const ReorderAlert: React.FC<ReorderAlertProps> = ({
  expense,
  product,
  productServiceArray,
}) => {
  if (
    expense?.readonly ||
    !product ||
    !productServiceArray?.length
  ) {
    return null;
  }

  const service = productServiceArray.find(
    (item) => item._id === product
  );

  if (!service || service.category !== 'inventory') {
    return null;
  }

  const currentStock = service.currentLevel - expense.qty;

  if (currentStock <= service.reorderStock) {
  return (
    <Alert
      color="error"
      severity="error"
      sx={{
        width: 'fit-content',
        mt: 0.5,
        py: 0,
        fontSize: '12px',
      }}
    >
      Stock is at or below reorder point (Current: {currentStock}, Reorder:{' '}
      {service.reorderStock})
    </Alert>
  )
}
};

export default ReorderAlert;