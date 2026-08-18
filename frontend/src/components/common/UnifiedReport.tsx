import React from 'react';
import { Box, Paper, Typography, Stack, Divider, TextField, Button, Rating, MenuItem, Grid, Chip, IconButton, Tooltip, CircularProgress } from '@mui/material';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import RefreshIcon from '@mui/icons-material/Refresh';
import CustomDatePicker from './CommonDatePicker';
import apiService from '@/service/apiService';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDate } from '@/utils/dateUtils';
import { useForm, Controller } from 'react-hook-form';
import ErrorHandlerAlert from './ErrorHandlerAlert';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { getRatingColor } from '@/utils';
import { getIcon } from './icons/getIcon';

const REPORT_TYPES = [
  'warning',
  'issue',
  'complaint',
] as const;

type ReportType = typeof REPORT_TYPES[number];
type EntityType = 'customer' | 'carrier' | 'driver';

const reportSchema: yup.ObjectSchema<ReportFormPayload> = yup.object({
  incidentDate: yup.date().required('Incident date is required') as yup.DateSchema<Date>,
  type: yup.mixed<ReportType>().oneOf(REPORT_TYPES).required('Type is required') as yup.Schema<ReportType>,
  text: yup.string().required('Text is required'),
  file: yup.mixed<File>().nullable().optional(),
}).required();

export interface ReportItem {
  _id: string;
  text: string;
  createdBy: string;
  createdAt: Date;
  incidentDate?: Date;
  type: ReportType;
}

export interface ReportFormPayload {
  text: string;
  incidentDate?: Date;
  type: ReportType;
  file?: File | null;
}

interface UnifiedReportProps {
  entityId: string;
  entityType: EntityType;
  reportScore?: number;
  entityName?: string;
}

interface AverageRatingResponse {
  overallAvgRating: number;
  totalReports: number;
  details: Array<{
    type: string;
    avgRating: number;
    count: number;
  }>;
}

const UnifiedReport: React.FC<UnifiedReportProps> = ({ entityId, entityType, reportScore, entityName }) => {
  const queryClient = useQueryClient();
  const { control, register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<ReportFormPayload>({
    resolver: yupResolver<ReportFormPayload>(reportSchema),
    defaultValues: { incidentDate: new Date(), type: 'warning' as ReportType, text: '', file: null }
  });

  // Dynamic query key based on entity type
  const queryKey = [`${entityType}ReportDetails`, entityId];
  const ratingQueryKey = [`${entityType}RatingDetails`, entityId];
  const avgRatingQueryKey = [`${entityType}AvgReportRating`, entityId];

  // Get average report rating
  const avgRatingQuery = useQuery<{ data: AverageRatingResponse }>({
    queryKey: avgRatingQueryKey,
    queryFn: () => apiService.getAverageReportRating(entityId, entityType),
    enabled: !!entityId,
  });

  const calculatedReportScore = avgRatingQuery.data?.data?.overallAvgRating || reportScore || 0;

  // Get reports based on entity type
  const getReportsQuery = useQuery<{ data: ReportItem[] }>({
    queryKey,
    queryFn: () => {
      if (entityType === 'customer') {
        return apiService.getCustomerRatingComments(entityId);
      } else if (entityType === 'carrier') {
        return apiService.getCarrierRatingComments(entityId);
      } else if (entityType === 'driver') {
        return apiService.getDriverRatingComments(entityId);
      }
      return apiService.getCustomerRatingComments(entityId);
    },
    enabled: !!entityId,
  });

  // Add report mutation
  const addreportMutation = useMutation({
    mutationFn: (payload: FormData) => {
      if (entityType === 'customer') {
        return apiService.addCustomerRatingComment(entityId, payload);
      } else if (entityType === 'carrier') {
        return apiService.addCarrierRatingComment(entityId, payload);
      } else if (entityType === 'driver') {
        return apiService.addDriverRatingComment(entityId, payload);
      }
      return apiService.addCustomerRatingComment(entityId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ratingQueryKey });
      queryClient.invalidateQueries({ queryKey: avgRatingQueryKey });
    },
  });

  // Delete report mutation
  const deleteReportMutation = useMutation({
    mutationFn: (commentId: string) => {
      if (entityType === 'customer') {
        return apiService.deleteCustomerRatingComment(commentId);
      } else if (entityType === 'carrier') {
        return apiService.deleteCarrierRatingComment(commentId);
      } else if (entityType === 'driver') {
        return apiService.deleteDriverRatingComment(commentId);
      }
      return apiService.deleteCustomerRatingComment(commentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ratingQueryKey });
      queryClient.invalidateQueries({ queryKey: avgRatingQueryKey });
    },
  });

  const OndeleteReport = async (commentId: string) => {
    await deleteReportMutation.mutateAsync(commentId);
  }

  const onSubmit = handleSubmit(async (values) => {
    const formdata = new FormData();
    formdata.append('text', values.text.trim());
    formdata.append('incidentDate', values.incidentDate?.toISOString() || '');
    formdata.append('type', values.type);
    if (values.file) formdata.append('file', values.file);
    await addreportMutation.mutateAsync(formdata);
    reset();
  });

  const formerrors = Object.keys(errors).length > 0 ? errors : null;

  const getEntityLabel = () => {
    switch (entityType) {
      case 'customer':
        return 'customer';
      case 'carrier':
        return 'carrier';
      case 'driver':
        return 'driver';
      default:
        return 'entity';
    }
  };

  return (
    <Grid container spacing={2}>
      {/* ---------- Right: Report Form ---------- */}
      <Grid item xs={12} md={6}>
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: 0.5,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 2,
            border:'1px solid #ddd',
          }}
        >
          <Typography variant="h6" fontWeight={600} sx={{mb:0.5}}>
            Report this {getEntityLabel()}
          </Typography>

          <form onSubmit={onSubmit}>
            <Stack spacing={2}>
              {/* Incident Date */}
              <Controller
                control={control}
                name="incidentDate"
                render={({ field }) => (
                  <CustomDatePicker
                    size='small'
                    label="Incident Date"
                    name="incidentDate"
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                  />
                )}
              />

              {/* File Upload */}
              <Box>
                <Controller
                  control={control}
                  name="file"
                  render={({ field }) => (
                    <input
                      id="report-file"
                      type="file"
                      style={{ display: "none" }}
                      onChange={(e) => field.onChange(e.target.files?.[0] || null)}
                    />
                  )}
                />
                <label htmlFor="report-file">
                  <Button sx={{borderRadius:0.5, mb:1}}
                    variant="outlined"
                    fullWidth
                    startIcon={<AttachFileIcon />}
                    component="span"
                  >
                    {(watch("file") as File | null)?.name ||
                      "Attach BOL / Rate Confirmation"}
                  </Button>
                </label>
              </Box>

              {/* Report Type */}
              <Controller
                control={control}
                name="type"
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField size='small'
                    select
                    fullWidth
                    label="Select a report type"
                    value={field.value}
                    onChange={field.onChange}
                    required
                    error={!!errors.type}
                    helperText={errors.type?.message as string}
                  >
                    {REPORT_TYPES.map((t) => (
                      <MenuItem key={t} value={t}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />

              {/* Text Area */}
              <TextField size='small'
                fullWidth
                label={`Why do you want to report this ${getEntityLabel()}?`}
                placeholder="Write details here..."
                multiline
                minRows={4}
                {...register("text", { required: true })}
                error={!!errors.text}
                helperText={errors.text?.message as string}
              />


              <Button style={{marginLeft:'auto'}}
                sx={{borderRadius:0.7, width:'fit-content'}}
                variant="contained"
                type="submit"
                disabled={!!addreportMutation.isPending || isSubmitting}
              >
                {addreportMutation.isPending || isSubmitting
                  ? "Submitting..."
                  : "Submit"}
              </Button>

              <ErrorHandlerAlert
                error={formerrors || addreportMutation.error}
              />
            </Stack>
          </form>
        </Paper>
      </Grid>
      {/* ---------- Left: Reports List ---------- */}
      <Grid item xs={12} md={6}>
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: 0.5,
            border:'1px solid #ddd',
            overflowY: "auto",
            maxHeight: "calc(100vh - 250px)",
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          {/* Header */}
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="center"
            sx={{ position: "sticky", top: 0, zIndex: 1 }}
          >
            <Stack direction="row" alignItems="center" spacing={1.5}>
              {getReportsQuery.data?.data?.length ? (
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Rating
                    value={calculatedReportScore}
                    precision={0.1}
                    size="medium"
                    readOnly
                    sx={{
                      "& .MuiRating-iconFilled": {
                        color: getRatingColor(calculatedReportScore),
                      },
                    }}
                  />
                  <Typography
                    variant="body2"
                    sx={{
                      color: getRatingColor(calculatedReportScore),
                      fontWeight: 600,
                      minWidth: 32,
                      textAlign: "center",
                    }}
                  >
                    {calculatedReportScore.toFixed(1)}/5
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {getReportsQuery.isLoading
                      ? "Loading..."
                      : `${getReportsQuery.data?.data.length ?? 0} total`}
                  </Typography>
                </Stack>
              ) : (
                //  give 5/5
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Rating
                    value={5}
                    precision={0.1}
                    size="small"
                    readOnly
                    sx={{
                      "& .MuiRating-iconFilled": {
                        color: getRatingColor(5),
                      },
                    }}
                  />
                  <Typography
                    variant="body2"
                    sx={{
                      color: getRatingColor(5),
                      fontWeight: 600,
                      minWidth: 32,
                      textAlign: "center",
                    }}
                  >
                    5/5
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {getReportsQuery.isLoading
                      ? "Loading..."
                      : `${getReportsQuery.data?.data.length ?? 0} total`}
                  </Typography>
                </Stack>
              )}

              <Tooltip title="Refresh">
                <span>
                  <IconButton
                    size="small"
                    onClick={() => getReportsQuery.refetch()}
                    disabled={getReportsQuery.isFetching}
                    sx={{ ml: 0.5 }}
                  >
                    {getReportsQuery.isFetching ? (
                      <CircularProgress size={18} />
                    ) : (
                      <RefreshIcon fontSize="small" color='primary' />
                    )}
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
          </Stack>

          {/* Report List */}
          {Array.isArray(getReportsQuery.data?.data) &&
            getReportsQuery.data.data.length === 0 ? (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ textAlign: "center", py: 2 }}
            >
              This {getEntityLabel()} has no reports.
            </Typography>
          ) : (
            <Stack spacing={1.25}>
              {getReportsQuery.data?.data?.map((r) => (
                <Stack
                  key={r._id}
                  direction="row"
                  alignItems="flex-start"
                  justifyContent="space-between"
                  sx={{
                    p: 1.5,
                    borderRadius: 0.5,
                    bgcolor: "grey.50",
                    border: "1px solid",
                    borderColor: "grey.200",
                  }}
                >
                  <Box sx={{ flex: 1, pr: 1 }}>
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      flexWrap="wrap"
                      sx={{ mb: 0.5 }}
                    >

                      <Typography variant="caption" color="text.secondary">
                        Incident:{" "}
                        {r.incidentDate ? formatDate(r.incidentDate) : "—"} |
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Reported: {formatDate(r.createdAt)}
                      </Typography>

                       <Chip
                        label={(r.type || "Report")
                        .toLowerCase()
                        .replace(/\b\w/g, c => c.toUpperCase())}
                        color={
                          r.type === "complaint"
                            ? "error"
                            : r.type === "issue" || r.type === "warning"
                              ? "warning"
                              : "default"
                        }
                        sx={{
                          height:'auto',
                          fontSize:'11px',
                          px:0,
                        }}
                      />
                    </Stack>
                    <Typography
                      variant="body2"
                      color="text.primary"
                      sx={{ whiteSpace: "pre-wrap" }}
                    >
                      {r.text}
                    </Typography>
                  </Box>

                  <Tooltip title="Delete report">
                    <span>
                      <IconButton
                        color="error"
                        onClick={() => OndeleteReport(r._id)}
                        disabled={deleteReportMutation.isPending}
                         sx={{
                              alignSelf: "flex-start",
                              "& svg": {
                                fontSize: 18
                              }
                            }}
                          >
                        {deleteReportMutation.isPending ? (
                          <CircularProgress size={16} />
                        ) : (
                           getIcon("delete")
                        )}
                      </IconButton>
                    </span>
                  </Tooltip>
                </Stack>
              ))}
            </Stack>
          )}
        </Paper>
      </Grid>


    </Grid>
  );
};

export default UnifiedReport;
