import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiService from '@/service/apiService';
import { Button, Dialog, DialogActions, DialogContent, Box, Paper, Chip, DialogTitle, Grid, IconButton, Stack, Switch, TextField, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { IPlan } from '@/types';
import { withPermission } from '@/hooks/authUtils';
import { getIcon } from '@/components/common/icons/getIcon';
import { toast } from 'react-toastify';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import PeopleIcon from '@mui/icons-material/People';
import BusinessIcon from '@mui/icons-material/Business';
import DateRangeIcon from '@mui/icons-material/DateRange';
import AppDialog from '@/components/ui/AppDialog';
import { Add } from '@mui/icons-material';
const Plans: React.FC = () => {
  const qc = useQueryClient();
  const [search, setSearch] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState<IPlan>({ name: '', description: '', price: 0, noOfUsers: 1, isActive: true,noOfCompanies:0,noOfDays:0,isUnlimited:false });

  const { data } = useQuery({
    queryKey: ['plans', search],
    queryFn: () => apiService.getPlans({ search }),
  });

  const upsert = useMutation({
    mutationFn: (body: IPlan) => body._id ? apiService.updatePlan(body._id, body) : apiService.createPlan(body),
    onSuccess: (response) => {
      setOpen(false);
      qc.invalidateQueries({ queryKey: ['plans'] });
      toast.success(response?.message || (form._id ? 'Plan updated successfully' : 'Plan created successfully'));
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error?.message || 'Failed to save plan');
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) => apiService.deletePlan(id),
    onSuccess: (response) => {
      qc.invalidateQueries({ queryKey: ['plans'] });
      toast.success(response?.message || 'Plan deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error?.message || 'Failed to delete plan');
    },
  });
  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => apiService.setPlanActive(id, isActive),
    onSuccess: (response) => {
      qc.invalidateQueries({ queryKey: ['plans'] });
      toast.success(response?.message || 'Plan status updated successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error?.message || 'Failed to update plan status');
    },
  });

  const list: IPlan[] = data?.data || [];

  return (
    <>
   <Stack spacing={3}>
  {/* Header */}
  <Box
    sx={{
      //p: 2,
      //borderRadius: 0.5,
      //background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
      //color: '#fff',
      //boxShadow: '0 10px 30px rgba(25,118,210,0.18)',
    }}
  >
    <Typography variant="h5" fontWeight="bold">
      Subscription Plans
    </Typography>

    <Typography variant="body2" sx={{ opacity: 0.9, mt: 0 }}>
      Manage pricing plans, user limits, company access, and subscriptions.
    </Typography>
  </Box>

  {/* Top Actions */}
  <Paper
    elevation={0}
    sx={{
      //px: 2,
      //py:1.5,
      borderRadius: 0.5,
      border: 'none',
      borderColor: 'none',
      background: 'none',
    }}
  >
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={2.5}
      //justifyContent="space-between"
      alignItems={{ xs: 'stretch', sm: 'center' }}
    >
      <TextField
        size="small"
        label="Search Plans"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{
          minWidth: { xs: '100%', sm: 450 },
          '& .MuiOutlinedInput-root': {
            borderRadius: 0.5,
            background: '#f8fafc',
          },
        }}
      />

      <Button
        variant="contained"
        startIcon={<Add/>}
        onClick={() => {
          setForm({
            name: '',
            description: '',
            price: 0,
            noOfUsers: 1,
            isActive: true,
            noOfCompanies: 0,
            noOfDays: 0,
            isUnlimited: false,
          });
          setOpen(true);
        }}
              sx={{
                borderRadius: 0.5,
                px: 2,
                height: "auto",
                textTransform: 'none',
                fontWeight: 400,
                boxShadow: 'none',
                fontSize: '13.6px',
                '& .MuiButton-startIcon': {
                  marginRight: '3px',
                },
                '& .MuiButton-startIcon svg': {
                  fontSize: '16px'
                }
              }}
            >
        Add New Plan
      </Button>
    </Stack>
  </Paper>

  {/* Plans */}
  <Grid container spacing={2.5} style={{marginLeft:'-20px'}}>
    {list.map((p, index) => {
      const gradients = [
        'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
        'linear-gradient(135deg, #7b1fa2 0%, #ba68c8 100%)',
        'linear-gradient(135deg, #00897b 0%, #4db6ac 100%)',
        'linear-gradient(135deg, #ef6c00 0%, #ffb74d 100%)',
      ];

      return (

        <Grid item xs={12} sm={6} md={4} lg={3} key={p._id}>
          <Paper
            elevation={0}
            sx={{
              height: '100%',
              overflow: 'hidden',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              transition: '0.3s',
              position: 'relative',
              background: '#fff',
              '&:hover': {
                transform: 'translateY(-6px)',
                boxShadow: '0 14px 35px rgba(0,0,0,0.08)',
              },
            }}
          >
            {/* Top */}
            <Box
              sx={{
                px: 3,
                py:2,
                color: '#fff',
                background: gradients[index % gradients.length],
              }}
            >
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography variant="h6" fontWeight="bold">
                  {p.name}
                </Typography>

                <MonetizationOnIcon sx={{ fontSize: 28 }} />
              </Stack>

              <Typography
                variant="h3"
                fontWeight="bold"
                sx={{ mt: 0 }}
              >
                ${p.price}
              </Typography>

              <Typography variant="body2" sx={{ opacity: 0.85 }}>
                {p.isUnlimited ? 'Unlimited Access' : 'Subscription Plan'}
              </Typography>
            </Box>

            {/* Content */}
            <Stack spacing={2} sx={{ px: 2.5, py:1.5 }}>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  minHeight: 24,
                }}
              >
                {p.description}
              </Typography>

              {/* Features */}
              <Stack spacing={1}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <PeopleIcon color="secondary" sx={{fontSize:'17px'}} />
                  <Typography variant="body2" color="primary" fontWeight={700}>
                    {p.noOfUsers} Users
                  </Typography>
                </Stack>

                <Stack direction="row" spacing={1.5} alignItems="center">
                  <DateRangeIcon color="secondary" sx={{fontSize:'17px'}} />
                  <Typography variant="body2" color="primary" fontWeight={700}>
                    {p.noOfDays} Days Access
                  </Typography>
                </Stack>

                <Stack direction="row" spacing={1.5} alignItems="center">
                  <BusinessIcon color="secondary" sx={{fontSize:'17px'}} />
                  <Typography variant="body2" color="primary" fontWeight={700}>
                    {p.noOfCompanies} Companies
                  </Typography>
                </Stack>
              </Stack>

              {/* Status */}
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{
                  pt: 1,
                  borderTop: '1px dashed',
                  borderColor: 'divider',
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip
                    label={p.isActive ? 'Active' : 'Inactive'}
                    size="small"
                    sx={{
                      fontWeight: 500,
                      borderRadius: 2,
                      fontSize: '13px',
                      px: 1,
                      backgroundColor: p.isActive ? '#01af00' : '#e5e5e5',
                      color: p.isActive ? '#fff' : '#101721',
                      border: `1px solid ${p.isActive ? '#01af00' : '#e5e5e5'}`,
                    }}
                  />

                  <Switch
                    checked={p.isActive}
                    onChange={(_, v) =>
                      p._id &&
                      toggleActive.mutate({
                        id: p._id,
                        isActive: v,
                      })
                    }
                    size="small"
                    sx={{
                      '& .MuiSwitch-switchBase': {
                        color: '#616161', // thumb color when inactive (dark grey)
                      },

                      '& .MuiSwitch-track': {
                        backgroundColor: '#636363', // inactive track color
                      },

                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: '#01af00', // active thumb
                      },

                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: '#01af00', // active track
                      }
                    }}
                  />
                </Stack>

                <Stack direction="row" spacing={0.5}>
                  <IconButton
                    color="primary"
                    onClick={() => {
                      setForm(p);
                      setOpen(true);
                    }}
                    sx={{
                    '& svg': {
                      fontSize: 18
                    }
                  }}
                  >
                    {getIcon('edit')}
                  </IconButton>

                  <IconButton
                    color="error"
                    onClick={() => p._id && remove.mutate(p._id)}
                  >
                    <DeleteIcon sx={{fontSize:'17px'}} />
                  </IconButton>
                </Stack>
              </Stack>
            </Stack>
          </Paper>
        </Grid>
      );
    })}
  </Grid>

  {/* Dialog */}
  <AppDialog
    open={open}
    onClose={() => setOpen(false)}
    maxWidth="sm"
    fullWidth
    PaperProps={{
      sx: {
        borderRadius: 1,
      },
    }}
  >
    <DialogTitle
      sx={{
        pb: 1,
        fontWeight: 'bold',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      {form._id ? 'Edit Plan' : 'Create New Plan'}

      <IconButton onClick={() => setOpen(false)} size="small" sx={{color:'#101721'}}>
        {getIcon('CloseIcon')}
      </IconButton>
    </DialogTitle>

    <DialogContent>
      <Stack spacing={2.2} mt={1}>
        <TextField
          size="small"
          label="Plan Name"
          value={form.name}
          onChange={(e) =>
            setForm({ ...form, name: e.target.value })
          }
        />

        <TextField
          size="small"
          multiline
          rows={3}
          label="Description"
          value={form.description}
          onChange={(e) =>
            setForm({ ...form, description: e.target.value })
          }
        />

        <Grid container spacing={2} style={{marginLeft:'-16px', marginTop:'10px'}}>
          <Grid item xs={6}>
            <TextField
              size="small"
              fullWidth
              type="number"
              label="Price"
              value={form.price}
              onChange={(e) =>
                setForm({
                  ...form,
                  price: Number(e.target.value),
                })
              }
            />
          </Grid>

          <Grid item xs={6}>
            <TextField
              size="small"
              fullWidth
              type="number"
              label="Users"
              value={form.noOfUsers}
              onChange={(e) =>
                setForm({
                  ...form,
                  noOfUsers: Number(e.target.value),
                })
              }
            />
          </Grid>

          <Grid item xs={6}>
            <TextField
              size="small"
              fullWidth
              type="number"
              label="Days"
              value={form.noOfDays}
              onChange={(e) =>
                setForm({
                  ...form,
                  noOfDays: Number(e.target.value),
                })
              }
            />
          </Grid>

          <Grid item xs={6}>
            <TextField
              size="small"
              fullWidth
              type="number"
              label="Companies"
              value={form.noOfCompanies}
              onChange={(e) =>
                setForm({
                  ...form,
                  noOfCompanies: Number(e.target.value),
                })
              }
            />
          </Grid>
        </Grid>

        <Paper
          variant="outlined"
          sx={{
            p: 1.5,
            borderRadius: 0.5,
            background: '#f8fafc',
          }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Box>
              <Typography fontWeight={600}>
                Unlimited Access
              </Typography>

              <Typography variant="caption" color="text.secondary">
                Enable unlimited plan benefits
              </Typography>
            </Box>

            <Switch
              checked={form.isUnlimited}
              onChange={(_, v) =>
                setForm({ ...form, isUnlimited: v })
              }
            />
          </Stack>
        </Paper>
      </Stack>
    </DialogContent>

    <DialogActions sx={{ px: 3, pb: 3, gap:1 }}>
      <Button
      variant="outlined"
        onClick={() => setOpen(false)}
        sx={{
          //borderRadius: 2,
          textTransform: 'none',
        }}
      >
        Cancel
      </Button>

      <Button
        variant="contained"
        onClick={() => upsert.mutate(form)}
        sx={{
          //borderRadius: 2,
          px: 3,
          textTransform: 'none',
          fontWeight: 600,
        }}
      >
        Save Plan
      </Button>
    </DialogActions>
  </AppDialog>
</Stack>


    </>
  );
};

export default withPermission("view", ["superadmin"])(Plans);


