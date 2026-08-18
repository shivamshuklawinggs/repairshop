import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Chip,
  Stack,
  IconButton
} from '@mui/material';
import { IFile } from '@/types';
import { toast } from 'react-toastify';
import apiService from '@/service/apiService';
import { getIcon } from '@/components/common/icons/getIcon';
import AppDialog from '@/components/ui/AppDialog';

interface SendEmailProps {
  selectedDocuments: IFile[];
  setSelectedDocuments: React.Dispatch<React.SetStateAction<IFile[]>>;
  emailDialogOpen: boolean;
  setEmailDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const SendEmail: React.FC<SendEmailProps> = ({
  selectedDocuments,
  setSelectedDocuments,
  emailDialogOpen,
  setEmailDialogOpen
}) => {
  const [emailDetails, setEmailDetails] = React.useState({
    recipientEmail: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = React.useState(false);

  const handleEmailDialogClose = () => {
    setEmailDialogOpen(false);
    setEmailDetails({
      recipientEmail: '',
      subject: '',
      message: ''
    });
  };

  const handleSendEmail = async () => {
    try {
      setLoading(true);
      const { recipientEmail, subject, message } = emailDetails;

      if (!recipientEmail || !subject) {
        toast.error('Email and subject are required');
        return;
      }

      const documentPaths = selectedDocuments.map(doc => ({
        filename: doc.filename,
        path: doc.url
      }));

      await apiService.sendDocumentByEmail({
        documentPaths,
        recipientEmail,
        subject,
        message
      });

      toast.success('Documents sent successfully');
      handleEmailDialogClose();
      setSelectedDocuments([]);
    } catch (error) {
      console.warn('Error sending email:', error);
      toast.error('Failed to send email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppDialog
      open={emailDialogOpen}
      onClose={handleEmailDialogClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogActions className='dialog-close'>
        <IconButton onClick={handleEmailDialogClose} sx={{ color: '#333' }}>
          {getIcon('CloseIcon')}
        </IconButton>
      </DialogActions>

      <DialogTitle className='dialog-title'>Send Documents via Email</DialogTitle>

      <DialogContent>
        <Box sx={{ pt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField size='small'
            label="Recipient Email"
            fullWidth
            value={emailDetails.recipientEmail}
            onChange={(e) => setEmailDetails(prev => ({ ...prev, recipientEmail: e.target.value }))}
          />
          <TextField size='small'
            label="Subject"
            fullWidth
            value={emailDetails.subject}
            onChange={(e) => setEmailDetails(prev => ({ ...prev, subject: e.target.value }))}
          />
          <TextField size='small'
            label="Message (Optional)"
            fullWidth
            multiline
            rows={3}
            value={emailDetails.message}
            onChange={(e) => setEmailDetails(prev => ({ ...prev, message: e.target.value }))}
          />
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {selectedDocuments.map((doc, index) => (
              <Chip
                key={index}
                label={doc.filename}
                onDelete={() => {
                  setSelectedDocuments(prev => prev.filter(d => d.filename !== doc.filename));
                }}
                sx={{
                  backgroundColor:'#fff',
                  border:'1px solid #bdbdbd'
                }}
              />
            ))}
          </Stack>
        </Box>
      </DialogContent>

      <DialogActions className='dialog-action' sx={{gap:0.5}}>
        <Button variant='outlined' onClick={handleEmailDialogClose} disabled={loading}>Cancel</Button>
        <Button
          onClick={handleSendEmail}
          variant="contained"
          disabled={loading || !emailDetails.recipientEmail || !emailDetails.subject}
        >
          {loading ? 'Sending...' : 'Send'}
        </Button>
      </DialogActions>
    </AppDialog>
  );
};

export default SendEmail;