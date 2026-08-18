import { ICompany, Role } from '@/types'
import { Box, FormControl, MenuItem, Select, SelectChangeEvent, Typography } from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '@/redux/store'
import { setCompany } from '@/redux/Slice/UserSlice'
import { useNavigate, useSearchParams } from 'react-router-dom'
import React, { useEffect } from 'react';
import { switchCompany } from '@/redux/actions';
import { useQueryClient } from '@tanstack/react-query';
import { paths } from '@/utils/paths';
import { useCompanies } from '@/hooks/useCompanies';

const SelectCoompany = () => {
  const [SearchParam] = useSearchParams()
  const qc = useQueryClient()
  const dispatch = useDispatch<AppDispatch>();
  const { user, currentCompany, token } = useSelector((state: RootState) => state.user);
  const navigate = useNavigate();
  const { data: companies = [], isLoading, error } = useCompanies();
  const handleCompanyChange = async (event: SelectChangeEvent<string>) => {
    try {
      const id = event.target.value;
      const selectedCompany = companies.find((company: ICompany) => company._id === id);
      if (selectedCompany) {
        dispatch(switchCompany(selectedCompany));
        // Invalidate all queries to ensure they refetch with new company context
        await qc.invalidateQueries();
        // Additionally, refetch all active queries to ensure immediate data refresh
        qc.refetchQueries();
        navigate(paths.dashboard)
      }
    } catch (error) {
      console.log("company select error", error)
    } finally {
      const NextUrl = SearchParam.get('next')
      NextUrl && navigate(NextUrl);
    }
  };
  // Set initial company when companies are loaded and no company is selected
  useEffect(() => {
    if (!currentCompany && companies.length > 0) {
      dispatch(setCompany(companies[0]));
      // Invalidate all queries to ensure they refetch with new company context
      qc.invalidateQueries();
      // Additionally, refetch all active queries to ensure immediate data refresh
      qc.refetchQueries();
    }
  }, [companies, currentCompany, dispatch, qc]);

  // Handle loading and error states
  if (error) {
    console.error('Error fetching companies:', error);
  }

  return (
    <React.Fragment>
      <FormControl size='small' className='company-select-tour'
      sx={{
        //minWidth: 250,
        minWidth: { xs: 150, md: 230 },
        maxWidth: 300,
        }}>
        <Select
          value={currentCompany || ''}
          onChange={handleCompanyChange}
          disabled={isLoading}
          sx={{
            fontSize: '0.875rem',
            fontWeight: 500,
            borderRadius: 0.5,
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: '#ccc',
            },
            '& .MuiSelect-select': {
              //py: '5px',
              py: { xs: '3px', md: '5px' },
            },
          }}
          renderValue={(selected) => {
            if (!selected) {
              return (
                <Typography variant="caption" color="text.secondary" fontWeight={500}>
                  Select Company
                </Typography>
              );
            }
            const selectedCompany = companies.find((c: ICompany) => c._id === selected);
            return (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minHeight:'20px'}}>
                <Box
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: '2px',
                    bgcolor: selectedCompany?.color || 'primary.main',
                    flexShrink: 0,
                  }}
                />
                <Typography className='tellipsis' fontWeight={500} noWrap sx={{fontSize:{ xs: '12px', md: '13px' }}}>
                  {selectedCompany?.prefix || selectedCompany?.label}
                </Typography>
              </Box>
            );
          }}
        >
          {companies.map((company: ICompany) => (
            <MenuItem
              key={company._id}
              value={company._id}
              sx={{
                gap: 1,
                py: 0.5,
                fontSize: '0.8rem',
                textTransform: 'capitalize',
                color: '#111',
                '&.Mui-selected.Mui-focusVisible': {
                  backgroundColor: 'rgba(56, 62, 75, 0.08)', // overrides dark gray
                },
              }}
            >
              <Box
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: '2px',
                  bgcolor: company.color,
                  flexShrink: 0,
                }}
              />
              {company.label.length > 30
                ? company.label.slice(0, 30) + '...'
                : company.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </React.Fragment>)
}

export default SelectCoompany