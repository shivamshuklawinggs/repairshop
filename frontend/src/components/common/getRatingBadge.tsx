import { CustomerRating } from '@/types';
import { Chip } from '@mui/material';
import { JSX } from 'react';

const getRatingBadge = (rating: CustomerRating): JSX.Element => {
  const ratingColors: Record<CustomerRating, string> = {
    A: 'success',
    B: 'info',
    C: 'warning',
    D: 'error',
    F: 'default',
  };
  return (
    <Chip
      label={rating}
      color={ratingColors[rating] as 'success' | 'info' | 'warning' | 'error' | 'default'}
      className="customer-rating"
    />
  );
};

export default getRatingBadge;
