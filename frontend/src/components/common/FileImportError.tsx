import { Close } from '@mui/icons-material';
import { Alert, AlertTitle, Collapse, IconButton, Box } from '@mui/material';
import { useState, useEffect, FC } from 'react';

export const FileImportError: FC<{ allerrors: Array<string>; message: string }> = ({ allerrors, message }) => {
  const [openErrorAlert, setOpenErrorAlert] = useState(true);

  useEffect(() => {
    if (Array.isArray(allerrors) && allerrors.length > 0) {
      setOpenErrorAlert(true);
    }
  }, [allerrors]);

  if (!Array.isArray(allerrors) || allerrors.length === 0) return null;

  return (
    <Collapse in={openErrorAlert}>
      <Alert
        severity="error"
        action={
          <IconButton
            aria-label="close"
            color="inherit"
            size="small"
            onClick={() => setOpenErrorAlert(false)}
          >
            <Close fontSize="inherit" />
          </IconButton>
        }
        sx={{ mb: 2, borderRadius: 2, alignItems: 'flex-start' }}
      >
        <AlertTitle sx={{ fontWeight: 700, fontSize: '0.875rem', mb: 0.5 }}>{message}</AlertTitle>
        <Box
          component="ul"
          sx={{ m: 0, pl: 2.5, '& li': { fontSize: '0.8rem', lineHeight: 1.6 } }}
        >
          {allerrors.map((err, i) => (
            <li key={i}>{err}</li>
          ))}
        </Box>
      </Alert>
    </Collapse>
  );
};
