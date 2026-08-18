import React, { useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  Box,
  Button,
  Card,
  Container,
  Typography,
  Paper,
  useTheme,
  alpha,
  Breadcrumbs,
  Link,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import {
  Description as DescriptionIcon,
  Receipt as ReceiptIcon,
  AttachFile as AttachFileIcon
} from '@mui/icons-material';
import JournalEntryHeader from './JournalEntryHeader';
import JournalEntryTable from './JournalEntryTable';
import JournalEntryFooter from './JournalEntryFooter';
import apiService from '@/service/apiService';
import { toast } from 'react-toastify';
import { useQuery } from '@tanstack/react-query';
import { IJournalEntry, journalEntrySchema } from './Schema/JournalEntrySchema';
import { useParams } from 'react-router-dom';
import { todayDate } from '@/config/constant';
import { withPermission } from '@/hooks/authUtils';
import { useAppSelector } from '@/redux/store';
const JournalEntryPage: React.FC = () => {
  const currentCompany = useAppSelector((state) => state.user.currentCompany)
  const { JournalEntryId } = useParams<{ JournalEntryId?: string }>()
  const methods = useForm<IJournalEntry>({
    resolver: yupResolver(journalEntrySchema),
    mode: "all",
    defaultValues: {
      journalDate: todayDate,
      entries: [
        { account: '', debit: undefined, credit: undefined, description: '', nameId: '', nameModel: null },
        { account: '', debit: undefined, credit: undefined, description: '', nameId: '', nameModel: null },
      ],
      memo: 'Test',
    },
  });
  const { data: nextJournalNumber, refetch: refetchNextJournalNumber } = useQuery({
    queryKey: ['nextJournalNumber',currentCompany],
    queryFn: () => apiService.getNextJournalNumber(),
    enabled: !JournalEntryId

  });
  const { data: journalEntry, refetch: refetchJournalEntry } = useQuery({
    queryKey: ['journalEntry', JournalEntryId],
    queryFn: () => apiService.getJournalEntry(JournalEntryId as string),
    enabled: !!JournalEntryId

  });
  const onSubmit = async (data: IJournalEntry & { deleted?: string }) => {
    const formdata = new FormData()
    const { attachments, ...restdata } = data
    if (!attachments) {
      restdata.deleted = "1"
    }
    if (attachments instanceof File) {
      formdata.append("attachments", attachments)
    }
    formdata.append("journalEntryData", JSON.stringify(restdata))
    // API submission logic will be added here
    try {
      if (JournalEntryId) {
        await apiService.updateJournalEntry(JournalEntryId, formdata);
        refetchJournalEntry()
        toast.success("Journal Entry Updated Successfully")
      } else {
        await apiService.createJournalEntry(formdata);
        methods.reset();
        refetchNextJournalNumber()
        toast.success("Journal Entry Created Successfully")
      }


    } catch (error: any) {
      toast.error(error.message || "Something went wrong")
    }
  };
  useEffect(() => {
    !JournalEntryId && methods.setValue('journalNumber', nextJournalNumber?.journalNumber)
  }, [nextJournalNumber, currentCompany])
  useEffect(() => {
    if (journalEntry) {
      methods.reset(journalEntry)
    }
  }, [journalEntry])

  console.error(methods.formState.errors)
  const theme = useTheme();
  const steps = ['Journal Details', 'Entry Lines', 'Memo & Attachments'];

  return (
    <FormProvider {...methods}>
      <Container style={{ maxWidth: '100%', padding: '0px' }}>
        <form onSubmit={methods.handleSubmit(onSubmit)}>
          {/* Breadcrumbs */}
          {/* <Breadcrumbs sx={{ mb: 2 }}>
            <Link color="inherit" href="/accounting" sx={{ textDecoration: 'none' }}>
              Accounting
            </Link>
            <Typography color="text.primary" sx={{ fontWeight: 500 }}>
              Journal Entry
            </Typography>
          </Breadcrumbs> */}

          {/* Header */}
          {/* <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 2,
              borderRadius: 0.5,
              backgroundColor:'#fff',
              border: '1px solid #ddd',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box>
                  <ReceiptIcon sx={{ fontSize: 19 }} />
                </Box>
                <Box>
                  <Typography fontSize={16} sx={{ fontWeight:600, lineHeight: 1.2,}}>
                    Journal Entry
                  </Typography>
                  <Typography variant="subtitle2" color="text.secondary">
                    Create and manage journal entries with debit/credit lines
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="h6" color="primary" sx={{ fontWeight: 600 }}>
                  {methods.watch('journalNumber') ? `#${methods.watch('journalNumber')}` : 'Draft'}
                </Typography>
                <Typography variant="subtitle2" color="text.secondary">
                  {methods.watch('journalDate') ? new Date(methods.watch('journalDate')).toLocaleDateString() : 'No date'}
                </Typography>
              </Box>
            </Box>
          </Paper> */}

          {/* Stepper */}
          {/* <Paper elevation={0} sx={{ p: 0, mb: 1.5, borderRadius: 0, bgcolor: 'transparent'}}>
            <Stepper activeStep={0} alternativeLabel>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel
                    StepIconProps={{
                      sx: {
                        '& .MuiStepIcon-root': {
                          fontSize: 20,
                        },
                        '& .MuiStepIcon-text': {
                          fontSize: 12,
                          fontWeight: 600,
                        },
                      }
                    }}
                     sx={{
                      '& .MuiStepLabel-label': {
                        fontSize: '14px',
                        fontWeight: 500,
                        color: '#555',
                        marginTop:'6px',
                      },
                      '& .MuiStepLabel-label.Mui-active': {
                        fontWeight: 500,
                        color: '#111',
                      },
                      '& .MuiStepLabel-label.Mui-completed': {
                        fontWeight: 500,
                        color: '#2e7d32',
                      }
                    }}
                  >
                    {label}
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </Paper> */}

          {/* Main Card */}
          <Card
            elevation={0}
            sx={{
              p: 0,
              borderRadius: 0.5,
              border: '1px solid #ddd',
              overflow: 'hidden'
            }}
          >
            {/* Journal Details Section */}
            <Box
              sx={{
                p: 2,
                borderBottom: '1px solid #ddd',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                {/* <DescriptionIcon sx={{ fontSize: 18, color: theme.palette.primary.main }} /> */}
                <Typography fontSize={15} sx={{ fontWeight: 600 }}>
                  Journal Details
                </Typography>
              </Box>
              <JournalEntryHeader />
            </Box>

            {/* Entry Lines Section */}
            <Box sx={{ p: 2 }}>
              <JournalEntryTable />
            </Box>

            {/* Memo & Attachments Section */}
            <Box
              sx={{
                p: 2,
                borderTop: '1px solid #ddd',
              }}
            >
              {/* <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <AttachFileIcon sx={{ fontSize: 20, color: theme.palette.primary.main }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Memo & Attachments
                </Typography>
              </Box> */}
              <JournalEntryFooter />
            </Box>

            {/* Action Buttons */}
            <Box
              sx={{
                p: 2,
                borderTop: '1px solid #ddd',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 2,
                mt: 1,
              }}
            >
              <Box>
                <Typography fontSize={15.5} color="text.primary">
                  Total Debit: <strong>${methods.watch('entries')?.reduce((sum: number, entry: any) => sum + (Number(entry.debit) || 0), 0).toFixed(2)}</strong>
                </Typography>
                <Typography fontSize={15.5} color="text.primary">
                  Total Credit: <strong>${methods.watch('entries')?.reduce((sum: number, entry: any) => sum + (Number(entry.credit) || 0), 0).toFixed(2)}</strong>
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <Button
                  variant="outlined"
                  size="medium"
                  onClick={() => methods.reset()}
                >
                  Clear
                </Button>
                <Button
                  variant="contained"
                  size="medium"
                  type="submit"
                >
                  Save
                </Button>
              </Box>
            </Box>
          </Card>
        </form>
      </Container>
    </FormProvider>
  );
};

export default withPermission("view", ["accounting"])(JournalEntryPage);
