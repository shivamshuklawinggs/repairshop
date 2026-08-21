import React, { useEffect, useRef } from 'react';
import {
  Box,
  Dialog,
  DialogContent,
  DialogActions,
  DialogTitle,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Grid,
  Switch,
  FormControlLabel,
  CircularProgress,
  Divider,
  Tooltip,
  IconButton,
  InputAdornment
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { IInvoiceReminderTemplate, ReminderTemplateType, ReminderFrequency } from '@/types';
import { toast } from 'react-toastify';
import { Info as InfoIcon } from '@mui/icons-material';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import AppDialog from '@/components/ui/AppDialog';
import { getIcon } from '@/components/common/icons/getIcon';

interface TemplateFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  template?: IInvoiceReminderTemplate | null;
  loading?: boolean;
}

const TemplateForm: React.FC<TemplateFormProps> = ({
  open,
  onClose,
  onSubmit,
  template,
  loading
}) => {
  const editorRef = useRef<any>(null);

  const { control, handleSubmit, reset, formState: { errors }, watch } = useForm({
    defaultValues: {
      templateType: 'before' as ReminderTemplateType,
      name: '',
      subject: '',
      htmlContent: '',
      isActive: true,
      daysBeforeDue: 7,
      daysAfterDue: 1,
      frequency: 'once' as ReminderFrequency,
      customIntervalDays: 1,
      maxReminders: 5,
      sendTime: '09:00'
    }
  });

  const templateType = watch('templateType');
  const frequency = watch('frequency');

  useEffect(() => {
    if (template) {
      reset({
        templateType: template.templateType,
        name: template.name,
        subject: template.subject,
        htmlContent: template.htmlContent,
        isActive: template.isActive,
        daysBeforeDue: template.daysBeforeDue || 7,
        daysAfterDue: template.daysAfterDue || 1,
        frequency: template.frequency || 'once',
        customIntervalDays: template.customIntervalDays || 1,
        maxReminders: template.maxReminders || 5,
        sendTime: template.sendTime || '09:00'
      });
    } else {
      reset({
        templateType: 'before' as ReminderTemplateType,
        name: '',
        subject: '',
        htmlContent: '',
        isActive: true,
        daysBeforeDue: 7,
        daysAfterDue: 1,
        frequency: 'once' as ReminderFrequency,
        customIntervalDays: 1,
        maxReminders: 5,
        sendTime: '09:00'
      });
    }
  }, [template, reset, open]);

  const availableVariables = [
    { name: 'invoiceNumber', description: 'Invoice number' },
    { name: 'invoiceDate', description: 'Invoice date (formatted)' },
    { name: 'dueDate', description: 'Due date (formatted)' },
    { name: 'amount', description: 'Total amount' },
    { name: 'balance', description: 'Balance due' },
    { name: 'days', description: 'Days until/after due date' },
    { name: 'reminderCount', description: 'Reminder number (1, 2, 3, etc.)' },
    { name: 'customerName', description: 'Customer name' },
    { name: 'companyName', description: 'Your company name' },
    { name: 'companyAddress', description: 'Your company address' },
    { name: 'companyEmail', description: 'Your company email' },
    { name: 'companyPhone', description: 'Your company phone' },
    { name: 'paymentLink', description: 'Payment link' },
    { name: 'logoUrl', description: 'Company logo URL' }
  ];

  const insertVariable = (variableName: string) => {
    if (editorRef.current) {
      const editor = editorRef.current;
      const variableText = `{{${variableName}}}`;
      editor.model.change((writer: any) => {
        const view = editor.editing.view;
        const viewRange = view.document.selection.getFirstRange();
        const modelRange = editor.editing.mapper.toModelRange(viewRange);
        writer.insertText(variableText, modelRange.end);
      });
      editor.editing.view.focus();
    }
  };

  return (
    <AppDialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogActions className='dialog-close'>
        <Button onClick={onClose}>
          {getIcon('CloseIcon')}
        </Button>
      </DialogActions>

      <DialogTitle style={{paddingBottom:'10px'}}>
        {template ? 'Edit Template' : 'Create New Template'}
      </DialogTitle>
      <DialogContent>
        <Box component="form" sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Controller
                name="templateType"
                control={control}
                rules={{ required: 'Template type is required' }}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.templateType}>
                    <InputLabel>Template Type</InputLabel>
                    <Select {...field} label="Template Type" size="small">
                      <MenuItem value="before">Before Due Date</MenuItem>
                      <MenuItem value="on_due">On Due Date</MenuItem>
                      <MenuItem value="after">After Due Date</MenuItem>
                    </Select>
                    <Typography variant="caption" color="error">
                      {errors.templateType?.message}
                    </Typography>
                  </FormControl>
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="name"
                control={control}
                rules={{ required: 'Template name is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    size="small"
                    label="Template Name"
                    error={!!errors.name}
                    helperText={errors.name?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="subject"
                control={control}
                rules={{ required: 'Subject is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    size="small"
                    label="Email Subject"
                    error={!!errors.subject}
                    helperText={errors.subject?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Scheduling Configuration
              </Typography>
            </Grid>

            {templateType === 'before' && (
              <Grid item xs={12} md={6}>
                <Controller
                  name="daysBeforeDue"
                  control={control}
                  rules={{ required: 'Days before due is required', min: 1, max: 365 }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      size="small"
                      type="number"
                      label="Days Before Due Date"
                      InputProps={{ inputProps: { min: 1, max: 365 } }}
                      error={!!errors.daysBeforeDue}
                      helperText={errors.daysBeforeDue?.message || 'How many days before due date to start sending reminders'}
                      InputLabelProps={{
                        shrink: true,
                      }}
                      sx={{
                        '& .MuiFormHelperText-root': {
                          lineHeight:'17px',
                        },
                      }}
                    />
                  )}
                />
              </Grid>
            )}

            {templateType === 'after' && (
              <Grid item xs={12} md={6}>
                <Controller
                  name="daysAfterDue"
                  control={control}
                  rules={{ required: 'Days after due is required', min: 1, max: 365 }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      size="small"
                      type="number"
                      label="Days After Due Date"
                      InputProps={{ inputProps: { min: 1, max: 365 } }}
                      error={!!errors.daysAfterDue}
                      helperText={errors.daysAfterDue?.message || 'How many days after due date to start sending reminders'}
                      InputLabelProps={{
                        shrink: true
                      }}
                    />
                  )}
                />
              </Grid>
            )}

            <Grid item xs={12} md={6}>
              <Controller
                name="frequency"
                control={control}
                rules={{ required: 'Frequency is required' }}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.frequency}>
                    <InputLabel>Reminder Frequency</InputLabel>
                    <Select {...field} label="Reminder Frequency" size="small">
                      <MenuItem value="once">Once Only</MenuItem>
                      <MenuItem value="daily">Daily</MenuItem>
                      <MenuItem value="weekly">Weekly</MenuItem>
                      <MenuItem value="custom">Custom Interval</MenuItem>
                    </Select>
                    <Typography variant="caption" color="error">
                      {errors.frequency?.message}
                    </Typography>
                  </FormControl>
                )}
              />
            </Grid>

            {frequency === 'custom' && (
              <Grid item xs={12} md={6}>
                <Controller
                  name="customIntervalDays"
                  control={control}
                  rules={{ required: 'Custom interval days is required', min: 1, max: 365 }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      size="small"
                      type="number"
                      label="Custom Interval (Days)"
                      InputProps={{ inputProps: { min: 1, max: 365 } }}
                      error={!!errors.customIntervalDays}
                      helperText={errors.customIntervalDays?.message || 'Send reminders every X days'}
                      InputLabelProps={{
                        shrink: true
                      }}
                    />
                  )}
                />
              </Grid>
            )}

            <Grid item xs={12} md={6}>
              <Controller
                name="maxReminders"
                control={control}
                rules={{ required: 'Max reminders is required', min: 1, max: 50 }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    size="small"
                    type="number"
                    label="Maximum Number of Reminders"
                    InputProps={{ inputProps: { min: 1, max: 50 } }}
                    error={!!errors.maxReminders}
                    helperText={errors.maxReminders?.message || 'Maximum reminders to send (1-50)'}
                    InputLabelProps={{
                      shrink: true
                    }}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="sendTime"
                control={control}
                rules={{ required: 'Send time is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    size="small"
                    type="time"
                    label="Send Time"
                    error={!!errors.sendTime}
                    helperText={errors.sendTime?.message || 'Time of day to send reminders'}
                    InputLabelProps={{
                      shrink: true
                    }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <Tooltip title="Time in HH:MM format (24-hour)">
                            <IconButton size="small">
                              <InfoIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </InputAdornment>
                      )
                    }}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Email Content
              </Typography>
            </Grid>

            <Grid item xs={12} style={{paddingTop:'0px'}}>
              <Controller
                name="htmlContent"
                control={control}
                rules={{ required: 'HTML content is required' }}
                render={({ field }) => (
                  <Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Available Variables (click to insert):
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {availableVariables.map((variable) => (
                          <Button
                            key={variable.name}
                            size="small"
                            variant="outlined"
                            onClick={() => insertVariable(variable.name)}
                            title={variable.description}
                            sx={{
                              padding:'0px 7px',
                            }}
                          >
                            {`{{${variable.name}}}`}
                          </Button>
                        ))}
                      </Box>
                    </Box>
                    <Box
                      sx={{
                        border: errors.htmlContent ? '1px solid #d32f2f' : '0px solid #c4c4c4',
                        //borderRadius: 1,
                        '& .ck-editor__editable': {
                        minHeight: '180px'
                        }
                      }}
                    >
                      <CKEditor
                        editor={ClassicEditor as any}
                        data={field.value}
                        onReady={(editor) => {
                          editorRef.current = editor;
                        }}
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
                            'underline',
                            'strikethrough',
                            '|',
                            'bulletedList',
                            'numberedList',
                            '|',
                            'link',
                            'blockQuote',
                            '|',
                            'undo',
                            'redo',
                            '|',
                            'sourceEditing'
                          ]
                        }}
                      />
                    </Box>
                    {errors.htmlContent && (
                      <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                        {errors.htmlContent.message}
                      </Typography>
                    )}
                  </Box>
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                    <Switch
                    size="small"
                    {...field} checked={field.value}
                     sx={{
                        ml:{xs:1, md:1.5},
                        '& .MuiSwitch-switchBase': {
                          color: '#616161', // thumb color when inactive (dark grey)
                        },

                        '& .MuiSwitch-track': {
                          backgroundColor: '#636363', // inactive track color
                        },

                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: '#10b981', // active thumb
                        },

                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: '#10b981',
                        },
                      }}
                    />
                   }
                    label={
                    <Typography
                    fontSize={{xs:14, md:15}}
                    sx={{
                      ml:1,
                      lineHeight:'17px',
                    }}>
                      Active (Only one active template per type)
                    </Typography>}
                  />
                )}
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>

      <DialogActions sx={{padding:'18px 25px !important', borderTop:'1px solid #ddd', gap:1}}>
        <Button variant='outlined' onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit(onSubmit)}
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Saving...' : template ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </AppDialog>
  );
};

export default TemplateForm;