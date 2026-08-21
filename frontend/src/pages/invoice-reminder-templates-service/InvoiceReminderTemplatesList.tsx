import React, { useState } from 'react';
import {
  Box,
  Button,
  IconButton,
  Typography,
  Chip,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  Switch,
  alpha,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as DuplicateIcon,
  Visibility as VisibilityIcon,
  DeleteOutline,
  DeleteOutlineOutlined
} from '@mui/icons-material';
import { PageHeader } from '@/components/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiService from '@/service/apiService';
import { IInvoiceReminderTemplate, ReminderTemplateType } from '@/types';
import { toast } from 'react-toastify';
import TemplateForm from './components/TemplateForm';
import { HasPermission } from '@/hooks/authUtils';
import { useTheme } from '@mui/material/styles';
import AppDialog from '@/components/ui/AppDialog';

const InvoiceReminderTemplatesList: React.FC = () => {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [openForm, setOpenForm] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<IInvoiceReminderTemplate | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<IInvoiceReminderTemplate | null>(null);

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['invoiceReminderTemplates'],
    queryFn: () => apiService.InvoiceReminderTemplates.getTemplates()
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiService.InvoiceReminderTemplates.createTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoiceReminderTemplates'] });
      toast.success('Template created successfully');
      setOpenForm(false);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to create template');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiService.InvoiceReminderTemplates.updateTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoiceReminderTemplates'] });
      toast.success('Template updated successfully');
      setOpenForm(false);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update template');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiService.InvoiceReminderTemplates.deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoiceReminderTemplates'] });
      toast.success('Template deleted successfully');
      setDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to delete template');
    }
  });

  const setActiveMutation = useMutation({
    mutationFn: (id: string) => apiService.InvoiceReminderTemplates.setActiveTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoiceReminderTemplates'] });
      toast.success('Active template updated successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update active template');
    }
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: string) => apiService.InvoiceReminderTemplates.duplicateTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoiceReminderTemplates'] });
      toast.success('Template duplicated successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to duplicate template');
    }
  });

  const handleOpenForm = (template?: IInvoiceReminderTemplate) => {
    setSelectedTemplate(template || null);
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    setSelectedTemplate(null);
  };

  const handleSubmit = (data: any) => {
    if (selectedTemplate) {
      updateMutation.mutate({ id: selectedTemplate._id!, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDeleteClick = (template: IInvoiceReminderTemplate) => {
    setTemplateToDelete(template);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (templateToDelete) {
      deleteMutation.mutate(templateToDelete._id!);
    }
  };

  const handleSetActive = (template: IInvoiceReminderTemplate) => {
    if (!template.isActive) {
      setActiveMutation.mutate(template._id!);
    }
  };

  const handleDuplicate = (template: IInvoiceReminderTemplate) => {
    duplicateMutation.mutate(template._id!);
  };

  const getTemplateTypeLabel = (type: ReminderTemplateType) => {
    switch (type) {
      case 'before':
        return 'Before Due Date';
      case 'on_due':
        return 'On Due Date';
      case 'after':
        return 'After Due Date';
      default:
        return type;
    }
  };

  const getTemplateTypeColor = (type: ReminderTemplateType) => {
    switch (type) {
      case 'before':
        return 'info';
      case 'on_due':
        return 'warning';
      case 'after':
        return 'error';
      default:
        return 'default';
    }
  };
  console.log("templates", templates)
  const groupedTemplates = templates?.data ?? []
  console.log("groupedTemplates", groupedTemplates)
  console.log("groupedTemplates", groupedTemplates)
  return (
    <Box sx={{ minHeight: '100vh' }}>
      <PageHeader
        title="Invoice Reminder Templates"
        subtitle="Manage email templates for invoice reminders"
        actions={
          <HasPermission action="create" resource={["accounting"]} component={
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenForm()}
              sx={{
                borderRadius: { xs: '6px', md: '6px' },
                boxShadow: 'none',
                py: { xs: 0, md: 0.5 },
                pr: { xs: 1.5, md: 2.5 },
                pl: { xs: 1.3, md: 2 },
                fontWeight: '500',
                minHeight: { xs: '28px', md: '35px' },
                fontSize: { xs: '13px', md: '14px' },
                '& .MuiButton-startIcon': {
                  marginRight: '3px',
                },
                '& .MuiButton-startIcon svg': {
                  fontSize: '15px'
                }
              }}>
              Create Template
            </Button>
          } />
        }
      />

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <Typography>Loading templates...</Typography>
        </Box>
      ) : groupedTemplates?.length > 0 ? (
        <Grid container spacing={3}>
          {groupedTemplates.map((template: IInvoiceReminderTemplate) => (
            <Grid item xs={12} md={4} key={template._id}>
              <Typography fontSize={14} sx={{ mb: 1, fontWeight: 600 }}>
                {getTemplateTypeLabel(template.templateType)}
              </Typography>
              <Card
                key={template._id}
                sx={{
                  mb: 0,
                  border: '1px solid #ddd',
                  borderLeft: template.isActive ? `3px solid ${theme.palette.success.main}` : '1px solid #ddd',
                  backgroundColor: '#fff',
                }}
              >
                <CardContent style={{ padding: '12px 20px 12px 20px' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {template.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb:1.5}}>
                        {template.subject}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                        <Chip
                          label={template.isActive ? 'Active' : 'Inactive'}
                          size="small"
                          sx={{
                            fontSize: '13px',
                            height: 'auto',
                            fontWeight: '600',
                           // border:template.isActive ? '1px solid #52b594' : '1px solid #94a3b8',
                            color: template.isActive ? '#008c5e' : '#101721',
                            backgroundColor: template.isActive ? '#daf6ee' : '#e2e2e2',
                          }}
                        />
                        <Chip
                          label={`Frequency: ${template.frequency}`}
                          size="small"
                          variant="outlined"
                          sx={{
                            fontSize: '13px',
                            height: 'auto',
                            fontWeight: '500',
                            color: '#333',
                            backgroundColor: '#fff',
                          }}
                        />
                        {template.templateType === 'before' && (
                          <Chip
                            label={`${template.daysBeforeDue} days before`}
                            size="small"
                            variant="outlined"
                            sx={{
                              fontSize: '13px',
                              height: 'auto',
                              fontWeight: '500',
                              color: '#333',
                              backgroundColor: '#fff',
                            }}
                          />
                        )}
                        {template.templateType === 'after' && (
                          <Chip
                            label={`${template.daysAfterDue} days after`}
                            size="small"
                            variant="outlined"
                            sx={{
                              fontSize: '13px',
                              height: 'auto',
                              fontWeight: '500',
                              color: '#333',
                              backgroundColor: '#fff',
                            }}
                          />
                        )}
                        <Chip
                          label={`Max: ${template.maxReminders}`}
                          size="small"
                          variant="outlined"
                          sx={{
                            fontSize: '13px',
                            height: 'auto',
                            fontWeight: '500',
                            color: '#333',
                            backgroundColor: '#fff',
                          }}
                        />
                        <Chip
                          label={`Time: ${template.sendTime}`}
                          size="small"
                          variant="outlined"
                          sx={{
                            fontSize: '13px',
                            height: 'auto',
                            fontWeight: '500',
                            color: '#333',
                            backgroundColor: '#fff',
                          }}
                        />
                      </Box>
                    </Box>

                    <Switch
                      checked={template.isActive}
                      onChange={() => handleSetActive(template)}
                      disabled={template.isActive}
                      size="small"
                      sx={{
                        '& .MuiSwitch-switchBase': {
                          color: '#616161', // thumb color when inactive (dark grey)
                        },

                        '& .MuiSwitch-track': {
                          backgroundColor: '#636363', // inactive track color
                        },

                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: theme.palette.success.main, // active thumb
                        },

                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: theme.palette.success.main, // active track
                        },

                        // Disabled
                        '& .MuiSwitch-switchBase.Mui-disabled': {
                          color: '#10b981 !important',

                        },
                        '& .MuiSwitch-switchBase.Mui-disabled + .MuiSwitch-track': {
                          backgroundColor: '#10b981 !important',
                          opacity:0.35,
                        },
                      }}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                    <HasPermission action="update" resource={["accounting"]} component={
                      <Tooltip title="Edit">
                        <IconButton sx={{p:0}}
                          size="small"
                          color="primary"
                          onClick={() => handleOpenForm(template)}
                        >
                          <EditIcon fontSize="small" sx={{ fontSize: '16px' }} />
                        </IconButton>
                      </Tooltip>
                    } />
                    <HasPermission action="create" resource={["accounting"]} component={
                      <Tooltip title="Duplicate">
                        <IconButton sx={{p:0}}
                          size="small"
                          color="primary"
                          onClick={() => handleDuplicate(template)}
                        >
                          <DuplicateIcon fontSize="small" sx={{ fontSize: '16px' }} />
                        </IconButton>
                      </Tooltip>
                    } />
                    <HasPermission action="delete" resource={["accounting"]} component={
                      <Tooltip title="Delete">
                        <IconButton sx={{p:0}}
                          size="small"
                          onClick={() => handleDeleteClick(template)}
                          color="error"
                        >
                          <DeleteOutlineOutlined fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    } />
                  </Box>
                </CardContent>
              </Card>

              {groupedTemplates.length === 0 && (
                <Card sx={{ border: '1px dashed #ccc', backgroundColor: 'background.paper' }}>
                  <CardContent sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No templates for this type
                    </Typography>
                  </CardContent>
                </Card>
              )}
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box
          sx={{
            gridColumn: '1 / -1',
            textAlign: 'center',
            py: 6,
            color: '#64748b',
            fontWeight: 500,
            fontSize: '17px',
          }}
        >
          <img src="/empty.png" alt="empty" width={44} /> <br />
          No templates found
        </Box>
      )}

      <TemplateForm
        open={openForm}
        onClose={handleCloseForm}
        onSubmit={handleSubmit}
        template={selectedTemplate}
        loading={createMutation.isPending || updateMutation.isPending}
      />

      <AppDialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle style={{paddingBottom:'10px'}} fontSize={{xs:16, md:17}}>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography fontSize={{xs:14.6, md:16}}>
            Are you sure you want to delete the template "{templateToDelete?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>

        <DialogActions className='dialog-action'>
          <Button variant="outlined" onClick={() => setDeleteDialogOpen(false)} disabled={deleteMutation.isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            disabled={deleteMutation.isPending}
            startIcon={deleteMutation.isPending ? <CircularProgress size={20} /> : null}
          >
            Delete
          </Button>
        </DialogActions>
      </AppDialog>
    </Box>
  );
};

export default InvoiceReminderTemplatesList;