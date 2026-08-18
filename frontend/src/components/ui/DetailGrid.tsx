import React from 'react';
import { Grid } from '@mui/material';
import LabelValue from './LabelValue';

export interface DetailField {
  label: string;
  value: string | number | React.ReactNode;
  xs?: number;
  sm?: number;
  md?: number;
}

interface DetailGridProps {
  fields: DetailField[];
  spacing?: number;
}

const DetailGrid: React.FC<DetailGridProps> = ({ fields, spacing = 1 }) => {
  return (
    <Grid container spacing={spacing}>
      {fields.map((field, idx) => (
        <Grid item xs={field.xs ?? 12} sm={field.sm ?? 6} md={field.md} key={idx}>
          <LabelValue label={field.label} value={field.value} />
        </Grid>
      ))}
    </Grid>
  );
};

export default DetailGrid;
