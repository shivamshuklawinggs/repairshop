import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  FormControlLabel,
  Checkbox,
  TextField,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Slider,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Clear as ClearIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { CustomerStatus,CustomerStatusList } from '@/types';
import FormSelect from './ui/FormSelect';

export interface VendorFiltersType {
  search: string;
  status: CustomerStatus;
  hasOpenBalance: boolean;
  ratingRange: [number, number];
}

interface VendorFiltersProps {
  filters: VendorFiltersType;
  onFiltersChange: (filters: VendorFiltersType) => void;
  onClearFilters: () => void;
}

const VendorFilters: React.FC<VendorFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
}) => {
  const [expanded, setExpanded] = useState<string | false>('panel1');

  const handleAccordionChange = (panel: string) => (
    event: React.SyntheticEvent,
    isExpanded: boolean
  ) => {
    setExpanded(isExpanded ? panel : false);
  };

  const updateFilter = (key: keyof VendorFiltersType, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

 
  const activeFiltersCount = [
    filters.search,
    filters.status,
    filters.hasOpenBalance,
  ].filter(Boolean).length + (filters.ratingRange[0] > 0 || filters.ratingRange[1] < 5 ? 1 : 0);

  return (
    <Card sx={{ mb: 2, height: 'fit-content' }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <FilterIcon />
            <Typography variant="h6">Filters</Typography>
            {activeFiltersCount > 0 && (
              <Chip label={activeFiltersCount} color="primary" size="small" />
            )}
          </Box>
          <Button
            variant="outlined"
            size="small"
            startIcon={<ClearIcon />}
            onClick={onClearFilters}
          >
            Clear All
          </Button>
        </Box>

        {/* Search Filter */}
        <TextField
          fullWidth
          label="Search Carriers"
          value={filters.search}
          onChange={(e) => updateFilter('search', e.target.value)}
          placeholder="Company, MC Number, USDOT, Contact Person..."
          margin="normal"
          size="small"
        />

        {/* Status Filters */}
        <Accordion
          expanded={expanded === 'panel1'}
          onChange={handleAccordionChange('panel1')}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">Status & Balance</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box display="flex" flexDirection="column" gap={2}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={filters.hasOpenBalance}
                    onChange={(e) => updateFilter('hasOpenBalance', e.target.checked)}
                  />
                }
                label="Has Open Balance"
              />
             <FormSelect 
              options={CustomerStatusList}
              label="Status"
              value={CustomerStatusList.find(opt => opt.value === filters.status) || CustomerStatusList[0]}
              onChange={(selectedOption) => updateFilter('status', (selectedOption as SelectOption)?.value || '')}
            />
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Rating Filter */}
        <Accordion
          expanded={expanded === 'panel2'}
          onChange={handleAccordionChange('panel2')}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">Rating Range</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box>
              <Typography gutterBottom>
                Rating: {filters.ratingRange[0]} - {filters.ratingRange[1]} stars
              </Typography>
              <Slider
                value={filters.ratingRange}
                onChange={(_, newValue) => updateFilter('ratingRange', newValue as [number, number])}
                valueLabelDisplay="auto"
                min={0}
                max={5}
                step={0.5}
                marks={[
                  { value: 0, label: '0' },
                  { value: 1, label: '1' },
                  { value: 2, label: '2' },
                  { value: 3, label: '3' },
                  { value: 4, label: '4' },
                  { value: 5, label: '5' },
                ]}
              />
            </Box>
          </AccordionDetails>
        </Accordion>
     
      </CardContent>
    </Card>
  );
};

export default VendorFilters;
