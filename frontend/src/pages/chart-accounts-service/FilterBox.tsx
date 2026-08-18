import { Box, Grid, TextField, Select, MenuItem, FormControl } from '@mui/material';
import {ChartAccountFilterType} from "./index"
interface FilterBoxProps {
    searchQuery: string;
    setSearchQuery: (search: string) => void;
    filterType: string;
    setFilterType: (type: ChartAccountFilterType) => void;
    setPage: (page: number) => void;
}

const filterOptions = [
    { value: 'all', label: 'All' },
    {value:"createdBy",label:"Created by You"},
    { value: 'balance_sheet', label: 'Balance sheet accounts' },
    { value: 'profit_and_loss', label: 'Profit and loss accounts' },
];

const FilterBox = ({ searchQuery, setSearchQuery, filterType, setFilterType,setPage }: FilterBoxProps) => {
  return (
    <Box>
      <Grid container spacing={1.5} alignItems="center" justifyContent={'space-between'}>
        <Grid item xs={12} md={6}>
          <TextField size='small'
            fullWidth
            label="Filter by name or number"
            value={searchQuery}
            onChange={(e) =>{
             setSearchQuery(e.target.value)
              setPage(1)
            }}
            sx={{
              '& .MuiInputLabel-root': {
                lineHeight: '1em',
                fontSize: '13px',
              },
              '& .MuiOutlinedInput-root': {
                height: 32,
              },
              '& .MuiInputBase-input': {
                padding: '4px 10px',
                fontSize: '13px',
              },
              '& .MuiInputBase-input::placeholder': {
                fontSize: '13px',
              },
            }}
          />
        </Grid>
        <Grid item xs={12} md={2.5}>
            <FormControl size='small'
            sx={{
              minWidth: '100%',
              backgroundColor: '#fff',
              '& .MuiOutlinedInput-root': {
                height: 32,
              },
              '& .MuiSelect-select': {
                fontSize: '13px',
                padding: '3px 10px',
                display: 'flex',
                alignItems: 'center',
              },
            }}
            >
                <Select
                    value={filterType}
                    onChange={(e) => {
                      setFilterType(e.target.value as ChartAccountFilterType)
                      setPage(1)
                    }}
                    displayEmpty
                >
                    {filterOptions.map(option => (
                        <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                    ))}
                </Select>
            </FormControl>
        </Grid>
      </Grid>
    </Box>
  );
}

export default FilterBox;