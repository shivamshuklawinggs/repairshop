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
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { PageHeader } from '@/components/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiService from '@/service/apiService';
import { IInvoiceReminderTemplate, ReminderTemplateType } from '@/types';
import { toast } from 'react-toastify';
import TemplateForm from './components/TemplateForm';
import { HasPermission } from '@/hooks/authUtils';
import { useTheme } from '@mui/material/styles';

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
   console.log("templates",templates)
  const groupedTemplates = templates?.data?.reduce((acc: Record<ReminderTemplateType, IInvoiceReminderTemplate[]>, template: IInvoiceReminderTemplate) => {
    if (!acc[template.templateType]) {
      acc[template.templateType] = [];
    }
    acc[template.templateType].push(template);
    return acc;
  }, {} as Record<ReminderTemplateType, IInvoiceReminderTemplate[]>);

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
            >
              Create Template
            </Button>
          }/>
        }
      />

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <Typography>Loading templates...</Typography>
        </Box>
      ) : (
        <Grid container spacing={3} sx={{ mt: 2 }}>
          {(Object.keys(groupedTemplates) as ReminderTemplateType[]).map((type: ReminderTemplateType) => (
            <Grid item xs={12} md={4} key={type}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                {getTemplateTypeLabel(type)}
              </Typography>
              {groupedTemplates[type].map((template: IInvoiceReminderTemplate) => (
                <Card
                  key={template._id}
                  sx={{
                    mb: 2,
                    border: template.isActive ? `2px solid ${theme.palette.primary.main}` : '1px solid #e0e0e0',
                    backgroundColor: template.isActive ? alpha(theme.palette.primary.main, 0.05) : 'background.paper'
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                          {template.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {template.subject}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                          <Chip
                            label={template.isActive ? 'Active' : 'Inactive'}
                            color={template.isActive ? 'success' : 'default'}
                            size="small"
                          />
                          <Chip
                            label={`Frequency: ${template.frequency}`}
                            size="small"
                            variant="outlined"
                          />
                          {template.templateType === 'before' && (
                            <Chip
                              label={`${template.daysBeforeDue} days before`}
                              size="small"
                              variant="outlined"
                            />
                          )}
                          {template.templateType === 'after' && (
                            <Chip
                              label={`${template.daysAfterDue} days after`}
                              size="small"
                              variant="outlined"
                            />
                          )}
                          <Chip
                            label={`Max: ${template.maxReminders}`}
                            size="small"
                            variant="outlined"
                          />
                          <Chip
                            label={`Time: ${template.sendTime}`}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      </Box>
                      <Switch
                        checked={template.isActive}
                        onChange={() => handleSetActive(template)}
                        disabled={template.isActive}
                        size="small"
                      />
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      <HasPermission action="update" resource={["accounting"]} component={
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenForm(template)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      }/>
                      <HasPermission action="create" resource={["accounting"]} component={
                        <Tooltip title="Duplicate">
                          <IconButton
                            size="small"
                            onClick={() => handleDuplicate(template)}
                          >
                            <DuplicateIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      }/>
                      <HasPermission action="delete" resource={["accounting"]} component={
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteClick(template)}
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      }/>
                    </Box>
                  </CardContent>
                </Card>
              ))}
              {groupedTemplates[type].length === 0 && (
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
      )}

      <TemplateForm
        open={openForm}
        onClose={handleCloseForm}
        onSubmit={handleSubmit}
        template={selectedTemplate}
        loading={createMutation.isPending || updateMutation.isPending}
      />

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the template "{templateToDelete?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleteMutation.isPending}>
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
      </Dialog>
    </Box>
  );
};

export default InvoiceReminderTemplatesList;