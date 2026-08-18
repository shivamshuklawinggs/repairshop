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
import { useQuery } from '@tanstack/react-query';
import { useAppSelector } from '@/redux/store';
import apiService from '@/service/apiService';
import { CustomerStatus, CustomerStatusList, FilterResponseData } from '@/types';
import FormSelect from './ui/FormSelect';

export interface CarrierFiltersType {
  search: string;
  status: CustomerStatus;
  hasOpenBalance: boolean;
  ratingRange: [number, number];
  hasDrivers: boolean;
  operatingStatus: string[];
  carrierOperation: string[];
}

interface CarrierFiltersProps {
  filters: CarrierFiltersType;
  onFiltersChange: (key: keyof CarrierFiltersType, value: any) => void;
  onClearFilters: () => void;
  showOprations:boolean
}
const CarrierFilters: React.FC<CarrierFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
  showOprations=false
}) => {
  const selectedCompany=useAppSelector((state)=>state.user.currentCompany)
  const [expanded, setExpanded] = useState<string | false>('panel1');

  const handleAccordionChange = (panel: string) => (
    event: React.SyntheticEvent,
    isExpanded: boolean
  ) => {
    setExpanded(isExpanded ? panel : false);
  };
  const {data}=useQuery({
    queryKey:['carrier-filters'],
    queryFn: async () => {
      const res:FilterResponseData= await apiService.getCarrierFilters()
      return res
    },
    enabled:Boolean(selectedCompany!!)
  })


  const handleOperatingStatusToggle = (status: string) => {
    const newStatus = filters.operatingStatus.includes(status)
      ? filters.operatingStatus.filter(s => s !== status)
      : [...filters.operatingStatus, status];
    onFiltersChange('operatingStatus', newStatus);
  };

  const handleCarrierOperationToggle = (operation: string) => {
    const newOperations = filters.carrierOperation.includes(operation)
      ? filters.carrierOperation.filter(o => o !== operation)
      : [...filters.carrierOperation, operation];
    onFiltersChange('carrierOperation', newOperations);
  };

  const activeFiltersCount = [
    filters.search,
    filters.status,
    filters.hasOpenBalance,
    filters.hasDrivers,
    filters.operatingStatus.length > 0,
    filters.carrierOperation.length > 0,
  ].filter(Boolean).length + (filters.ratingRange[0] > 0 || filters.ratingRange[1] < 5 ? 1 : 0);

  return (
    <Card sx={{ mb: 2, height: 'fit-content', borderRadius:0, boxShadow:'none'}}>
      <CardContent sx={{p:0}}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
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
            sx={{
              pr: 2,
              borderRadius: 2,
              '& .MuiButton-startIcon': {
                marginRight:'3px'
              }
            }}
          >
            Clear All
          </Button>
        </Box>

        {/* Search Filter */}
        <TextField
          fullWidth
          label="Search"
          value={filters.search}
          onChange={(e) => onFiltersChange('search', e.target.value)}
          placeholder="Company, MC Number, USDOT, Contact Person..."
          margin="normal"
          size="small"
          sx={{mb:4}}
        />

        {/* Status Filters */}
        <Accordion
           sx={{
            boxShadow: 'none',
            '&::before':
            {
              opacity: 0
            },

            '&.Mui-expanded::before': {
              opacity: 0
            },

            '& .MuiAccordionSummary-root': {
              minHeight: '48px',
            },

            '& .MuiAccordionSummary-root.Mui-expanded': {
              minHeight: '48px',
            },

            '& .MuiAccordionSummary-content': {
              margin: 0,
            },

            '& .MuiAccordionSummary-content.Mui-expanded': {
              margin: 0,
            },
          }}
          expanded={expanded === 'panel1'}
          onChange={handleAccordionChange('panel1')}
        >
          <AccordionSummary sx={{p:0}} expandIcon={<ExpandMoreIcon sx={{color:'text.primary'}}/>}>
           <Typography variant="subtitle1">Status & Balance</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{p:0}}>
            <Box display="flex" flexDirection="column" gap={1.5}>
              <FormControlLabel
              sx={{
                  '& .MuiFormControlLabel-label': {
                    fontSize: '14px',
                    fontWeight: 500,
                    color: 'text.primary'
                  }
                }}
                control={
                  <Checkbox
                    checked={filters.hasOpenBalance}
                    onChange={(e) => onFiltersChange('hasOpenBalance', e.target.checked)}
                    sx={{
                      pr: 0.5, // reduce spacing
                      py: 0, // reduce spacing
                      '& .MuiSvgIcon-root': {
                        fontSize: 18
                      }
                    }}
                  />
                }
                label="Has Open Balance"
              />
              {showOprations && (
                <>
              <FormControlLabel
              sx={{
                  '& .MuiFormControlLabel-label': {
                    fontSize: '14px',
                    fontWeight: 500,
                    color: 'text.primary'
                  }
                }}
                control={
                  <Checkbox
                    checked={filters.hasDrivers}
                    onChange={(e) => onFiltersChange('hasDrivers', e.target.checked)}
                    sx={{
                      pr: 0.5, // reduce spacing
                      py: 0, // reduce spacing
                      '& .MuiSvgIcon-root': {
                        fontSize: 18
                      }
                    }}
                  />
                }
                label="Has Drivers"
              />
              <FormSelect
              options={CustomerStatusList}
              label="Status"
              value={CustomerStatusList.find(opt => opt.value === filters.status) || CustomerStatusList[0]}
              onChange={(selectedOption) => onFiltersChange('status', (selectedOption as SelectOption)?.value || '')}
            />
            </>
              )
              }
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Rating Filter */}
        <Accordion
          sx={{
            boxShadow: 'none',
            '&::before':
            {
              opacity: 1
            },

            '&.Mui-expanded::before': {
              opacity: 1
            },

            '& .MuiAccordionSummary-root': {
              minHeight: '48px',
            },

            '& .MuiAccordionSummary-root.Mui-expanded': {
              minHeight: '48px',
            },

            '& .MuiAccordionSummary-content': {
              margin: 0
            },

            '& .MuiAccordionSummary-content.Mui-expanded': {
              margin: 0,
            },
          }}
          expanded={expanded === 'panel2'}
          onChange={handleAccordionChange('panel2')}
        >
          <AccordionSummary sx={{p:0}} expandIcon={<ExpandMoreIcon sx={{color:'text.primary'}}/>}>
            <Typography variant="subtitle1">Rating Range</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{py:0, px:1}}>
            <Box>
              <Typography variant='subtitle2' gutterBottom>
                Rating: {filters.ratingRange[0]} - {filters.ratingRange[1]} stars
              </Typography>
              <Slider
                value={filters.ratingRange}
                onChange={(_, newValue) => onFiltersChange('ratingRange', newValue as [number, number])}
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
                sx={{
                color: 'primary.main',

                '& .MuiSlider-thumb': {
                  width: 15,
                  height: 15,
                  boxShadow: 'none'
                },

                '& .MuiSlider-track': {
                  height: 3,
                  borderRadius: 3
                },

                '& .MuiSlider-rail': {
                  height: 3,
                  opacity: 0.3
                },

                '& .MuiSlider-mark': {
                  width: 3,
                  height: 3,
                  borderRadius: '50%',
                  backgroundColor: '#ffffff'
                },

                '& .MuiSlider-markLabel': {
                  fontSize: '13px'
                },

                '& .MuiSlider-valueLabel': {
                  fontSize: '13px',
                  fontWeight: 500
                }
              }}
              />
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Operating Status Filter */}
           {
          showOprations && (
            <>
        {
          Array.isArray(data?.data?.operating_status_list) && data?.data?.operating_status_list?.length>0 &&
        <Accordion
          sx={{
            boxShadow: 'none',
            '&::before':
            {
              opacity: 1
            },

            '&.Mui-expanded::before': {
              opacity: 1
            },

            '& .MuiAccordionSummary-root': {
              minHeight: '48px',
            },

            '& .MuiAccordionSummary-root.Mui-expanded': {
              minHeight: '48px',
            },

            '& .MuiAccordionSummary-content': {
              margin: 0
            },

            '& .MuiAccordionSummary-content.Mui-expanded': {
              margin: 0,
            },
          }}
          expanded={expanded === 'panel3'}
          onChange={handleAccordionChange('panel3')}
        >
          <AccordionSummary sx={{p:0}} expandIcon={<ExpandMoreIcon sx={{color:'text.primary'}}/>}>
            <Typography variant="subtitle1">Operating Status</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{p:0}}>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {data?.data?.operating_status_list?.map((status) => (
                <Chip
                  key={status}
                  label={status}
                  clickable
                  color={filters.operatingStatus.includes(status) ? 'primary' : 'default'}
                  onClick={() => handleOperatingStatusToggle(status)}
                  variant={filters.operatingStatus.includes(status) ? 'filled' : 'outlined'}
                  size="small"
                  sx={{borderColor:'#ccc', px:1, fontSize:'0.7rem'}}
                />
              ))}
            </Box>
          </AccordionDetails>
        </Accordion>
        }

        {/* Carrier Operation Filter */}
         {
          Array.isArray(data?.data?.operating_status_list) && data?.data?.carrier_operation_list?.length>0 &&
        <Accordion style={{borderBottomLeftRadius:'0px', borderBottomRightRadius:'0px'}}
          sx={{
            boxShadow: 'none',
            '&::before':
            {
              opacity: 1
            },

            '&.Mui-expanded::before': {
              opacity: 1
            },

            '& .MuiAccordionSummary-root': {
              minHeight: '48px',
            },

            '& .MuiAccordionSummary-root.Mui-expanded': {
              minHeight: '48px',
            },

            '& .MuiAccordionSummary-content': {
              margin: 0
            },

            '& .MuiAccordionSummary-content.Mui-expanded': {
              margin: 0,
            },
          }}
          expanded={expanded === 'panel4'}
          onChange={handleAccordionChange('panel4')}
        >
          <AccordionSummary sx={{p:0}} expandIcon={<ExpandMoreIcon sx={{color:'text.primary'}}/>}>
            <Typography variant="subtitle1">Carrier Operations</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{p:0}}>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {data?.data?.carrier_operation_list?.map((operation) => (
                <Chip
                  key={operation}
                  label={operation}
                  clickable
                  color={filters.carrierOperation.includes(operation) ? 'primary' : 'default'}
                  onClick={() => handleCarrierOperationToggle(operation)}
                  variant={filters.carrierOperation.includes(operation) ? 'filled' : 'outlined'}
                  size="small"
                  sx={{borderColor:'#ccc', px:1, fontSize:'0.8rem'}}
                />
              ))}
            </Box>
          </AccordionDetails>
        </Accordion>
        }
        </>
               )
          }
      </CardContent>
    </Card>
  );
};

export default CarrierFilters;
