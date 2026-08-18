import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Dialog, DialogContent, DialogActions, TextField, Box, Button, FormControl, RadioGroup, FormControlLabel, Radio, Grid, Avatar, Typography, useTheme, alpha, Card, IconButton, CircularProgress } from '@mui/material';
import { Close as CloseIcon, Save as SaveIcon } from '@mui/icons-material';
import { ICompany } from '@/types';
import apiService from '@/service/apiService';
import { toast } from 'react-toastify';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { CompanySchema } from '../Schema/CompanySchema';
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import { getFilePreview } from '@/utils/getFilePreview';
import { getIcon } from '@/components/common/icons/getIcon';
import { Business, Phone, Palette, Description, Upload, Brush } from '@mui/icons-material';
import SignatureDrawer from '@/components/SignatureDrawer';
import { colorPresets } from '@/data/colors';
import ErrorHandlerAlert from '@/components/common/ErrorHandlerAlert';
import { COMPANY_LOGO_UPLOAD_URL } from '@/config';
import { useAppDispatch, useAppSelector } from '@/redux/store';
import { setCompany } from '@/redux/Slice/UserSlice';
import AppDialog from '@/components/ui/AppDialog';

interface CompanyFormProps {
  open: boolean;
  onClose: () => void;
  initialData?: Partial<ICompany>;
  title: string;
}

const CompanyForm: React.FC<CompanyFormProps> = ({ open, onClose, initialData, title }) => {
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const { currentCompany, } = useAppSelector((state) => state.user)
  const theme = useTheme();
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch()
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    control,
    formState: { errors }
  } = useForm<ICompany>({
    resolver: yupResolver(CompanySchema) as any,
    defaultValues: {
      label: initialData?.label || '',
      description: initialData?.description || '',
      color: initialData?.color || colorPresets.teal.main,
      logo: initialData?.logo || null,
      termsandconditions: initialData?.termsandconditions || '',
      phone: initialData?.phone || '',
      email: initialData?.email || '',
      address: initialData?.address || '',
      physicalDetails: initialData?.physicalDetails || { phone: '', email: '', address: '' },
      billingDetails: initialData?.billingDetails || { phone: '', email: '', address: '' },
      prefix: initialData?.prefix || '',
      mcNumber: initialData?.mcNumber || '',
      usdot: initialData?.usdot || '',
      signature: initialData?.signature || '',
    }
  });

  const mutation = useMutation({
    mutationFn: (data: ICompany) => {
      const formData = new FormData();
      formData.append('label', data.label);
      formData.append('description', data.description || "");
      formData.append('color', data.color);
      formData.append('prefix', data.prefix);
      formData.append('mcNumber', data.mcNumber);
      formData.append('usdot', data.usdot);

      if (data.logo instanceof File) {
        formData.append('logo', data.logo);
      }
      formData.append('termsandconditions', data.termsandconditions);
      formData.append('phone', data.phone);
      formData.append('email', data.email);
      formData.append('address', data.address);

      if (data.physicalDetails) {
        formData.append('physicalDetails', JSON.stringify(data.physicalDetails));
      }
      if (data.billingDetails) {
        formData.append('billingDetails', JSON.stringify(data.billingDetails));
      }

      if (data.signature) formData.append('signature', data.signature);

      if (initialData?._id) {
        return apiService.updateCompany(initialData._id, formData);
      }
      return apiService.createCompany(formData);
    },
    onSuccess: async (response) => {
      toast.success(initialData?._id ? 'Company updated successfully' : response.message);
      await queryClient.invalidateQueries({ queryKey: ['company'] });
      await queryClient.invalidateQueries({ queryKey: ['companies'] });
      await queryClient.invalidateQueries({ queryKey: ['user'] });
      if (currentCompany === response._id) {
        dispatch(setCompany(response.data));
      }
      onClose();
      reset({
        label: response.data.label,
        description: response.data.description,
        color: response.data.color,
        logo: response.data?.logo,
        termsandconditions: response.data?.termsandconditions,
        phone: response.data?.phone,
        email: response.data?.email,
        address: response.data?.address,
        physicalDetails: response.data?.physicalDetails,
        billingDetails: response.data?.billingDetails,
        prefix: response.data?.prefix,
        mcNumber: response.data?.mcNumber,
        usdot: response.data?.usdot,
      });
    },
    onError: (error: any) => {
      const message = error instanceof Error ? error.message : 'An error occurred';
      toast.error(message);
    }
  });

  React.useEffect(() => {
    if (initialData) {
      reset(initialData);
    } else {
      reset({
        label: '',
        description: '',
        color: colorPresets.teal.main,
        logo: null,
        termsandconditions: '',
        phone: '',
        email: '',
        address: '',
        physicalDetails: { phone: '', email: '', address: '' },
        billingDetails: { phone: '', email: '', address: '' },
        prefix: '',
        mcNumber: '',
        usdot: '',
      });
    }
  }, [initialData, reset]);

  const onSubmit = (data: ICompany) => {
    mutation.mutate(data);
  };

  const handleClose = () => {
    reset();
    onClose();
  };
  console.log("errors", errors)
  return (
    <AppDialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 1,
          boxShadow: theme.shadows[4],
          //overflow: 'hidden',
          maxHeight: '90vh'
        }
      }}
    >
      {/* Header */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        pl: 2.7,
        pr: 2,
        py: 0.5,
        bgcolor: '#fff',
        color: '#101721',
        position: 'relative',
        borderBottom:'1px solid #ddd',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {/* <Box sx={{
            p: 0.5,
            borderRadius: 2,
            bgcolor: alpha('#fff', 0.15),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Business sx={{ fontSize: 16 }} />
          </Box> */}
          <Typography sx={{ fontWeight: 600, fontSize: '0.95rem' }}>
            {title}
          </Typography>
        </Box>
        <IconButton
          onClick={handleClose}
          sx={{
            color: 'inherit',
            '&:hover': {
              bgcolor: alpha('#fff', 0.1),
              transition: 'all 0.2s ease-in-out'
            }
          }}
        >
          {getIcon('CloseIcon')}
        </IconButton>
      </Box>

      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        <DialogContent sx={{ px:{xs: 2, md:3}, py: {xs: 2, md:3}, maxHeight: 'calc(90vh - 200px)', overflowY: 'auto' }}>
          <Grid container spacing={2}>
            {/* Basic Information Section */}
            <Grid item xs={12}>
              <Card
                variant="outlined"
                sx={{
                  p: 0,
                  borderRadius: 0,
                  border: 'none',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Box>
                    <Business sx={{ fontSize: 16, color: 'primary.main' }} />
                  </Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    Basic Information
                  </Typography>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField size='small'
                      {...register('label')}
                      label="Company Name"

                      placeholder="Enter company name"
                      error={!!errors.label}
                      helperText={errors.label?.message}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField size='small'
                      {...register('prefix')}
                      label="Abbreviation/Prefix"

                      placeholder="Enter abbreviation"
                      error={!!errors.prefix}
                      helperText={errors.prefix?.message}
                      fullWidth
                    />
                  </Grid>
               
                  <Grid item xs={12}>
                    <TextField size='small'
                      {...register('description')}
                      label="Description"

                      placeholder="Enter company description"
                      multiline
                      rows={3}
                      error={!!errors.description}
                      helperText={errors.description?.message}
                      fullWidth
                    />
                  </Grid>
                </Grid>
              </Card>
            </Grid>

            {/* Physical Contact Details Section */}
            <Grid item xs={12}>
              <Card
                variant="outlined"
                sx={{
                  p: 0,
                  borderRadius: 0,
                  border: 'none',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Box>
                    <Phone sx={{ fontSize: 16, color: 'primary.main' }} />
                  </Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    Physical Contact Details
                  </Typography>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField size='small'
                      {...register('physicalDetails.email')}
                      label="Email Address"
                      placeholder="Enter email address"
                      type="email"
                      error={!!errors.physicalDetails?.email}
                      helperText={errors.physicalDetails?.email?.message}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Controller
                      name="physicalDetails.phone"
                      control={control}
                      render={({ field }) => (
                        <TextField size='small'
                          {...field}
                          fullWidth
                          label="Phone Number"
                          placeholder="Enter phone number"
                          onChange={(e) =>  field.onChange(e)}
                          error={!!errors.physicalDetails?.phone}
                          helperText={errors.physicalDetails?.phone?.message}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField size='small'
                      {...register('physicalDetails.address')}
                      label="Address"
                      placeholder="Enter physical address"
                      multiline
                      rows={2}
                      error={!!errors.physicalDetails?.address}
                      helperText={errors.physicalDetails?.address?.message}
                      fullWidth
                    />
                  </Grid>
                </Grid>
              </Card>
            </Grid>

            {/* Billing Contact Details Section */}
            <Grid item xs={12}>
              <Card
                variant="outlined"
                sx={{
                  p: 0,
                  borderRadius: 0,
                  border: 'none',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Box>
                    <Phone sx={{ fontSize: 16, color: 'primary.main' }} />
                  </Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    Billing Contact Details
                  </Typography>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField size='small'
                      {...register('billingDetails.email')}
                      label="Email Address"
                      placeholder="Enter billing email address"
                      type="email"
                      error={!!errors.billingDetails?.email}
                      helperText={errors.billingDetails?.email?.message}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Controller
                      name="billingDetails.phone"
                      control={control}
                      render={({ field }) => (
                        <TextField size='small'
                          {...field}
                          fullWidth
                          label="Phone Number"
                          placeholder="Enter billing phone number"
                          onChange={(e) =>  field.onChange(e)}
                          error={!!errors.billingDetails?.phone}
                          helperText={errors.billingDetails?.phone?.message}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField size='small'
                      {...register('billingDetails.address')}
                      label="Address"
                      placeholder="Enter billing address"
                      multiline
                      rows={2}
                      error={!!errors.billingDetails?.address}
                      helperText={errors.billingDetails?.address?.message}
                      fullWidth
                    />
                  </Grid>
                </Grid>
              </Card>
            </Grid>
            {/* Branding Section */}
            <Grid item xs={12}>
              <Card
                variant="outlined"
                sx={{
                  p: 0,
                  borderRadius: 0,
                  border: 'none',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Box>
                    <Palette sx={{ fontSize: 16, color: 'primary.main' }} />
                  </Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    Branding
                  </Typography>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Controller
                      name="color"
                      control={control}
                      render={({ field }) => (
                        <Box>
                          <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: 'text.primary' }}>
                            Brand Color
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <Box
                              sx={{
                                width: 40,
                                height: 40,
                                borderRadius: '50%',
                                backgroundColor: field.value,
                                border: '2px solid #ddd',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                              }}
                            />
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                              {field.value}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {Object.entries(colorPresets).filter(([fkey, value]) => !["grey", "darkSlate", "slate", "teal"].includes(fkey)).map(([key, val]) => (
                              <Box
                                key={key}
                                onClick={() => field.onChange(val.dark)}
                                sx={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: '50%',
                                  backgroundColor: val.dark,
                                  cursor: 'pointer',
                                  border: field.value === val.dark ? `3px solid ${theme.palette.primary.main}` : '2px solid transparent',
                                  transition: 'all 0.2s ease-in-out',
                                  '&:hover': {
                                    transform: 'scale(1.15)',
                                    boxShadow: `0 2px 8px ${alpha(val.dark, 0.5)}`
                                  }
                                }}
                              />
                            ))}
                          </Box>
                        </Box>
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Box>
                      <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: 'text.primary' }}>
                        Company Logo
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar
                          src={watch('logo') ? (getFilePreview(watch('logo') as any, COMPANY_LOGO_UPLOAD_URL) || undefined) : undefined}
                          sx={{ width: 30, height: 30, bgcolor: 'primary.main' }}>
                          <Upload />
                        </Avatar>
                        <Box>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setValue('logo', file as any);
                              }
                            }}
                            style={{ display: 'none' }}
                            id="logo-upload"
                          />
                          <label htmlFor="logo-upload">
                            <Button
                              variant="outlined"
                              component="span"
                              size="small"
                              sx={{
                                borderColor: 'primary.main',
                                borderRadius: 2,
                                px: 2,
                                '&:hover': {
                                  borderColor: 'primary.main',
                                  bgcolor: alpha(theme.palette.primary.main, 0.04)
                                }
                              }}
                            >
                              Choose Logo
                            </Button>
                          </label>
                        </Box>
                      </Box>
                    </Box>
                    {errors.logo && (
                      <Typography variant="caption" sx={{ color: 'error.main', mt: 0.5 }}>
                        {errors.logo.message as string}
                      </Typography>
                    )}
                  </Grid>
                </Grid>
              </Card>
            </Grid>

            {/* Terms & Conditions Section */}
            <Grid item xs={12}>
              <Card
                variant="outlined"
                sx={{
                  p: 0,
                  borderRadius: 0,
                  border: 'none',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <Box>
                    <Description sx={{ fontSize: 16, color: 'primary.main' }} />
                  </Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    Terms & Conditions
                  </Typography>
                </Box>
                <Controller
                  name="termsandconditions"
                  control={control}
                  render={({ field }) => (
                    <Box>
                      <CKEditor
                        editor={ClassicEditor as any}
                        data={field.value || ''}
                        onChange={(event, editor) => {
                          const data = editor.getData();
                          field.onChange(data);
                        }}
                        config={{
                          toolbar: [
                            'heading',
                            '|',
                            'bold',
                            'italic',
                            'link',
                            'bulletedList',
                            'numberedList',
                            '|',
                            'outdent',
                            'indent',
                            '|',
                            'blockQuote',
                            'insertTable',
                            'mediaEmbed',
                            '|',
                            'undo',
                            'redo'
                          ] as any
                        }}
                      />
                    </Box>
                  )}
                />
              </Card>
            </Grid>

            {/* Signature Section */}
            <Grid item xs={12}>
              <Card
                variant="outlined"
                sx={{
                  p: 0,
                  borderRadius: 0,
                  border: 'none',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Box>
                    <Brush sx={{ fontSize: 16, color: 'primary.main' }} />
                  </Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    Digital Signature
                  </Typography>
                </Box>
                <Box>
                  {watch('signature') && (
                    <Box sx={{ mb: 2 }}>
                      <img
                        src={watch('signature')}
                        alt="Signature"
                        style={{
                          maxWidth: '400px',
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: 4
                        }}
                      />
                    </Box>
                  )}
                  <Button
                    variant="outlined"
                    startIcon={<Brush />}
                    onClick={() => setDrawerOpen(true)}
                    sx={{
                      borderColor: 'primary.main',
                      borderRadius: 2,
                      px: 3,
                      py: 0.5,
                      '&:hover': {
                        borderColor: 'primary.main',
                        bgcolor: alpha(theme.palette.primary.main, 0.04)
                      }
                    }}
                  >
                    {watch('signature') ? 'Update Signature' : 'Add Signature'}
                  </Button>
                </Box>
              </Card>
            </Grid>
            <ErrorHandlerAlert error={errors || mutation.error} />
          </Grid>
        </DialogContent>

        {/* Actions */}
        <DialogActions sx={{
          px: {xs:2, md:3},
          py: 1.5,
          borderTop: '1px solid #ddd',
        }}>
          <Box sx={{
            display: 'flex',
            //justifyContent: 'space-between',
            justifyContent: {xs:'flex-end', md:'space-between'},
            alignItems: 'center',
            width: '100%'
          }}>
            {/* Left side - Form info */}
            <Box sx={{ display:{xs:'none', md:'flex'}, alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" color="text.primary" sx={{ fontWeight: 500}}>
                Company Information
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: 'primary.main',
                    transition: 'all 0.2s ease-in-out'
                  }}
                />
              </Box>
            </Box>

            {/* Right side - Action buttons */}
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
              <Button
                onClick={handleClose}
                disabled={mutation.isPending}
                variant="outlined"
              >
                Cancel
              </Button>

              <Button
                type="submit"
                variant="contained"
                disabled={mutation.isPending}
                color="primary"
              >
                {mutation.isPending ? (
                  <CircularProgress size={18} thickness={4} />
                ) : (
                  'Save'
                )}
              </Button>
            </Box>
          </Box>
        </DialogActions>
      </Box>

      {/* Signature Drawer */}
      <SignatureDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        defaultSignature={watch("signature")}
        onSave={(dataUrl) => {
          setValue('signature', dataUrl);
          setDrawerOpen(false);
        }}
      />
    </AppDialog>
  );
};

export default CompanyForm;
