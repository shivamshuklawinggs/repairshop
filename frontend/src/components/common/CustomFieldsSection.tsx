import React, { useState } from 'react';
import {
  Box, Button, Chip, CircularProgress, Divider, FormControlLabel,
  Grid, IconButton, MenuItem, Select, Switch, TextField, Tooltip, Typography,
} from '@mui/material';
import { Add as AddIcon, Close as CloseIcon } from '@mui/icons-material';
import { useFormContext, Controller } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import apiService from '@/service/apiService';
import { IFieldDefinition } from '@/types/customField.types';

interface CustomFieldsSectionProps {
  schemaName: string;
}

function FieldInput({ field, fieldPath }: { field: IFieldDefinition; fieldPath: string }) {
  const { control, watch } = useFormContext();
  const defaultVal = field.type === 'boolean' ? false
    : (field.type === 'number' || field.type === 'currency') ? '' : '';
  const isReadOnly = field.immutable === true  && Boolean(watch("_id"))
  return (
    <Controller
      name={fieldPath as any}
      control={control}
      defaultValue={defaultVal}
      render={({ field: rhf, fieldState }) => {
        if (field.type === 'boolean') {
          return (
            <FormControlLabel
              control={
                <Switch size="small" checked={Boolean(rhf.value)}
                  disabled={isReadOnly}
                  onChange={e => rhf.onChange(e.target.checked)} />
              }
              label={<Typography fontSize={13}>{field.label}{field.required && ' *'}</Typography>}
            />
          );
        }
        if (field.type === 'select' && field.options?.length) {
          return (
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                {field.label}{field.required && ' *'}
              </Typography>
              <Select fullWidth size="small" value={rhf.value ?? ''}
                onChange={e => rhf.onChange(e.target.value)} displayEmpty
                readOnly={isReadOnly} error={!!fieldState.error}>
                <MenuItem value=""><em>— Select —</em></MenuItem>
                {field.options!.map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
              </Select>
              {fieldState.error && <Typography variant="caption" color="error">{fieldState.error.message}</Typography>}
            </Box>
          );
        }
        if (field.type === 'date') {
          return (
            <TextField fullWidth type="date" size="small" label={field.label}
              required={field.required} InputLabelProps={{ shrink: true }}
              InputProps={{ readOnly: isReadOnly }}
              value={rhf.value ?? ''} onChange={rhf.onChange}
              error={!!fieldState.error} helperText={fieldState.error?.message} />
          );
        }
        if (field.type === 'textarea') {
          return (
            <TextField fullWidth multiline minRows={2} size="small" label={field.label}
              placeholder={field.placeholder} required={field.required}
              InputProps={{ readOnly: isReadOnly }}
              value={rhf.value ?? ''} onChange={rhf.onChange}
              error={!!fieldState.error} helperText={fieldState.error?.message} />
          );
        }
        return (
          <TextField fullWidth size="small"
            type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel'
              : (field.type === 'number' || field.type === 'currency') ? 'number' : 'text'}
            label={field.label + (field.type === 'currency' ? ' ($)' : '')}
            placeholder={field.placeholder} required={field.required}
            InputProps={{ readOnly: isReadOnly }}
            value={rhf.value ?? ''}
            onChange={e => rhf.onChange(
              (field.type === 'number' || field.type === 'currency') && e.target.value !== ''
                ? Number(e.target.value) : e.target.value
            )}
            error={!!fieldState.error} helperText={fieldState.error?.message} />
        );
      }}
    />
  );
}

const CustomFieldsSection: React.FC<CustomFieldsSectionProps> = ({ schemaName }) => {
  const [activeKeys, setActiveKeys] = useState<string[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const { watch } = useFormContext();

  const { data, isLoading } = useQuery({
    queryKey: ['cf-definitions', schemaName],
    queryFn:  () => apiService.getCustomFieldDefinitions(schemaName),
    enabled:  !!schemaName,
    staleTime: Infinity,
  });

  const definitions: IFieldDefinition[] = data?.data ?? [];

  // Auto-activate keys that already have a value in the saved customFields
  const existingCustomFields = watch('customFields') as Record<string, any> | undefined;
  React.useEffect(() => {
    if (!definitions.length) return;
    const savedKeys = Object.keys(existingCustomFields ?? {}).filter(
      key => existingCustomFields![key] !== undefined && existingCustomFields![key] !== '' && existingCustomFields![key] !== null
    );
    const validSavedKeys = savedKeys.filter(k => definitions.some(d => d.key === k));
    if (validSavedKeys.length > 0) {
      setActiveKeys(prev => Array.from(new Set([...prev, ...validSavedKeys])));
    }
  }, [definitions.length]);

  const available = definitions.filter(d => !activeKeys.includes(d.key));
  const activeFields = definitions.filter(d => activeKeys.includes(d.key));

  const addKey   = (key: string) => setActiveKeys(k => [...k, key]);
  const removeKey = (key: string) => setActiveKeys(k => k.filter(x => x !== key));

  if (isLoading) return <Box sx={{ py: 1 }}><CircularProgress size={16} /></Box>;
  if (definitions.length === 0) return null;

  return (
    <Box sx={{ mt: 0, mb:1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2}}>
        <Typography variant="subtitle2" fontWeight={600}>Additional Fields</Typography>
        {available.length > 0 && (
          <Button
            size="small" variant="outlined" startIcon={<AddIcon />}
            onClick={() => setPickerOpen(p => !p)}
            sx={{
              borderRadius: 0.5,
              pr: 1.5,
              pl: 1,
              py:0.2,
              fontWeight:600,
              '& .MuiButton-startIcon': {
                marginRight: '3px',
              },
            }}
          >
            Add Field
          </Button>
        )}
      </Box>

      {pickerOpen && available.length > 0 && (
        <Box sx={{ mb: 1.5, p: 1.5, border: '1px dashed #ccc', borderRadius: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {available.map(d => (
            <Chip
              key={d.key}
              label={d.label}
              size="small"
              variant="outlined"
              onClick={() => { addKey(d.key); if (available.length === 1) setPickerOpen(false); }}
              icon={<AddIcon style={{ fontSize: 14 }} />}
              sx={{
                borderRadius:0.5,
                px:1,
                py:1.7,
              }}
            />
          ))}
        </Box>
      )}

      {activeFields.length > 0 && (
        <>
          {/* <Divider sx={{ mb: 1.5 }} /> */}
          <Grid container spacing={2}>
            {activeFields.map(field => (
              <Grid item xs={12} sm={field.width as any ?? 6} key={field.key}
                sx={{
                  position: 'relative',
                  '&:hover .remove-btn':
                  {
                    opacity: 1
                  }
                  }}>

                <FieldInput field={field} fieldPath={`customFields.${field.key}`} />
                <Tooltip title="Remove field">
                  <IconButton
                    className="remove-btn"
                    size="small"
                    onClick={() => removeKey(field.key)}
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: -4,
                      opacity: 1,
                      transition: 'opacity 0.2s',
                      bgcolor: '#ef4444',
                      boxShadow: 1,
                      padding: '3px',
                      '&:hover':
                      {
                        bgcolor: '#ef4444',
                      }
                    }}
                  >
                    <CloseIcon sx={{ fontSize: 12, color:'#fff', }} />
                  </IconButton>
                </Tooltip>

              </Grid>
            ))}
          </Grid>
        </>
      )}
    </Box>
  );
};

export default CustomFieldsSection;
