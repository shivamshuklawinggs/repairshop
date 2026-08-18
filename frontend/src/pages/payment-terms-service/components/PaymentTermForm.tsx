import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Box, Button, IconButton } from '@mui/material';
import { IPaymentTerm } from '@/types';
import apiService from '@/service/apiService';
import { toast } from 'react-toastify';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { paymentTermSchema,PaymentTermFormData } from '../Schema/paymentTermSchema';
import { HasPermission } from '@/hooks/authUtils';
import { getIcon } from '@/components/common/icons/getIcon';
import AppDialog from '@/components/ui/AppDialog';

interface PaymentTermFormProps {
  open: boolean;
  onClose: () => void;
  initialData?: Partial<IPaymentTerm>;
  title: string;
  onSuccess?: () => void;
  customerId?: string;
}

const PaymentTermForm: React.FC<PaymentTermFormProps> = ({
  open,
  onClose,
  initialData,
  title,
  onSuccess,
  customerId
}) => {
  const queryClient=useQueryClient()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<PaymentTermFormData>({
    resolver: yupResolver(paymentTermSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      days: initialData?.days || 0,
        }
  });

  const mutation = useMutation({
    mutationFn: (data: PaymentTermFormData) => {
      if (initialData?._id) {
        return apiService.updatePaymentTerm(initialData._id, { ...data, _id: initialData._id },customerId);
      } else {
        const { _id, ...restData } = data;
        return apiService.createPaymentTerm({ ...restData },customerId);
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['paymenterms'] });
      toast.success(initialData?._id ? 'Payment term updated successfully' : 'Payment term created successfully');
      onSuccess?.();
      onClose();
      reset();
    },
    onError: (error: any) => {
      console.warn(error);
      const message = error instanceof Error ? error.message : 'An error occurred';
      toast.error(message);
    }
  });

  React.useEffect(() => {
    if (initialData) {
      reset(initialData);
    }else{
        reset({
            name: '',
            description: '',
            days: 0,
        });
    }
  }, [initialData, reset]);
 console.warn(errors)
  const onSubmit = (data: PaymentTermFormData) => {
    mutation.mutate(data);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <HasPermission action="create" resource={["accounting"]} component={
    <AppDialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogActions className='dialog-close'>
        <IconButton onClick={handleClose} size="small" style={{top:-3, right:3}} sx={{color:'#101721'}}>
          {getIcon('CloseIcon')}
        </IconButton>
      </DialogActions>
      <form onSubmit={(e) => {
        e.stopPropagation();
        handleSubmit(onSubmit)(e);
      }}>
        <DialogTitle sx={{backgroundColor:'#fff', color:'#101721', fontWeight:'600', py:1.4, fontSize:{xs:'14px', md:'15px'}, borderBottom:'1px solid #ddd',}}>{title}</DialogTitle>
        <DialogContent className='dialog-content'>
          <Box display="flex" flexDirection="column" gap={2} mt={3} mb={3} >
            <TextField size='small'
              {...register('name')}
              label="Name"
              error={!!errors.name}
              helperText={errors.name?.message}
              required
              fullWidth
            />
            <TextField size='small'
              {...register('description')}
              label="Description"
              error={!!errors.description}
              helperText={errors.description?.message}
              fullWidth
            />
            <TextField size='small'
              {...register('days')}
              label="Days"
              type="number"
              error={!!errors.days}
              helperText={errors.days?.message}
              required
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions className='dialog-action'>
          <Button
          variant="outlined"
          onClick={handleClose}
          disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" color="primary" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </form>
    </AppDialog>
    }/>
  );
};

export default PaymentTermForm;
