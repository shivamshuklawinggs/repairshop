import React from 'react';
import { Box } from '@mui/material';
import StatCard from './StatCard';

export interface StatItem {
  label: string;
  value: string | number;
  subValue?: string;
  icon?: React.ReactNode;
  color?: string;
  trend?: { value: number; label?: string };
}

interface StatsRowProps {
  stats: StatItem[];
}

const StatsRow: React.FC<StatsRowProps> = ({ stats }) => {
  return (
    <Box
      display="flex"
      gap={2}
      mb={2.5}
      flexWrap="wrap"
    >
      {stats.map((stat, idx) => (
        <StatCard key={idx} {...stat} />
      ))}
    </Box>
  );
};

export default StatsRow;
