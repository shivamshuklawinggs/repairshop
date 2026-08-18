import { AppDispatch, RootState } from '@/redux/store'
import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Box, FormControl, MenuItem, Select, Typography, Paper, SelectChangeEvent } from '@mui/material'
import { setCompany } from '@/redux/Slice/UserSlice'
import { fetchAllCompanies } from '@/redux/api'
import { ICompany, Role } from '@/types'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { initialCompanyData } from '@/redux/InitialData/initialCompanyData'
const PleaseSelectCompany: React.FC = () => {
  const qc=useQueryClient()
  const [SearchParam] = useSearchParams()
  const { currentCompany, user } = useSelector((state: RootState) => state.user)
  const navigate = useNavigate()
  const dispatch = useDispatch<AppDispatch>()

  const handleCompanyChange = (event: SelectChangeEvent<string>) => {
    const id = event.target.value;
    const selectedCompany = companies.find(company => company._id === id);
    if (selectedCompany) {
      dispatch(setCompany(selectedCompany));
      // qc.invalidateQueries({ queryKey: ['getCompany', currentCompany] });
      qc.invalidateQueries({ predicate: (query) => query.queryKey[0] !== 'companies' });
      const NextUrl = SearchParam.get('next')
      NextUrl && navigate(NextUrl);
    } else if (!selectedCompany) {
      dispatch(setCompany(initialCompanyData));
      // qc.invalidateQueries({ queryKey: ['getCompany', currentCompany] });
     qc.invalidateQueries({ predicate: (query) => query.queryKey[0] !== 'companies' });
      const NextUrl = SearchParam.get('next')
      NextUrl && navigate(NextUrl);
    }
  };
  
 const { data: companies = [] } = useQuery<ICompany[], Error, ICompany[], ['companies', string | undefined]>({
  queryKey: ['companies', user?._id],
  queryFn: async () => {
    const response = await dispatch(fetchAllCompanies({ check: true })).unwrap();
    return response;
  },
  enabled: !!user && user.role !== Role.SUPERADMIN,
});
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '80vh',
        p: 3,
        bgcolor: 'background.default',
      }}
    >
      <Paper
        elevation={0}
        variant="outlined"
        sx={{
          p: { xs: 3, sm: 4 },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          maxWidth: 420,
          width: '100%',
          borderRadius: 3,
          textAlign: 'center',
        }}
      >
        {/* Icon */}
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            bgcolor: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 2.5,
          }}
        >
          <Typography sx={{ color: '#fff', fontWeight: 900, fontSize: '1.5rem' }}>F</Typography>
        </Box>

        <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
          Select a Company
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Choose a company to continue
        </Typography>

        <FormControl size='small' fullWidth>
          <Select
            value={currentCompany || ''}
            onChange={handleCompanyChange}
            displayEmpty
            sx={{ borderRadius: 2 }}
            renderValue={(selected) => {
              if (!selected) {
                return (
                  <Typography variant="body2" color="text.disabled">
                    Select Company
                  </Typography>
                );
              }
              const selectedCompany = companies.find(c => c._id === selected);
              return (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '3px',
                      bgcolor: selectedCompany?.color || 'primary.main',
                      flexShrink: 0,
                    }}
                  />
                  <Typography variant="body2">
                    {selectedCompany?.prefix || selectedCompany?.label}
                  </Typography>
                </Box>
              );
            }}
          >
            {companies.map((company: ICompany) => (
              <MenuItem
                key={company._id || `empty-${company.label}`}
                value={company._id}
                sx={{ gap: 1.5, py: 1 }}
              >
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '3px',
                    bgcolor: company.color,
                    flexShrink: 0,
                  }}
                />
                <Typography variant="body2">
                  {company.label.length > 30
                    ? company.label.slice(0, 30) + '...'
                    : company.label}
                </Typography>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>
    </Box>
  )
}
export default PleaseSelectCompany

