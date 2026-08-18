import { FC, useEffect, useState, useRef } from 'react'
import { Alert, Collapse, IconButton } from '@mui/material'
import { Close } from '@mui/icons-material';
import { extractFormErrors, formatFieldName } from '@/utils/extractFormErrors';

interface ErrorHandlerAlertProps {
  error: any;
  excludedFields?: string[]
}

const ErrorHandlerAlert: FC<ErrorHandlerAlertProps> = ({ error,excludedFields=[] }) => {
  const [open, setOpen] = useState(false)
  const alertRef = useRef<HTMLDivElement>(null)

  const isApiError = !!error?.response || typeof error?.status === 'number'
  const status = error?.status ?? (isApiError ? 400 : undefined)
  const message = error?.response?.data?.message || error?.message
  const required: string[] = Array.isArray(error?.response?.data?.required) ? error?.response?.data?.required : []


  // react-hook-form/Yup errors detection and collection
  const isYupError = !isApiError && error && typeof error === 'object'
  const fieldErrors = isYupError ? extractFormErrors(error, excludedFields) : []
  const severity: 'error' | 'warning'| 'success' = isApiError && status >= 400 ? 'error' : fieldErrors.length > 0 ? 'warning' : 'success'
  const headerText = isYupError && fieldErrors.length > 0
    ? 'Please fix the following validation errors:'
    : message
  useEffect(() => {
    console.log("error",error)
    if(severity!=="success"){
      setOpen(true)
      // Scroll to alert when error appears
      setTimeout(() => {
        alertRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 100)
      return
    }else{
      setOpen(false)
      return
    }
  }, [error])



  return (
    <Collapse in={open}>
      <Alert
        ref={alertRef}
        severity={severity}
        action={
          <IconButton
            aria-label="close"
            color="inherit"
            size="small"
            onClick={() => setOpen(false)}
          >
            <Close fontSize="inherit" />
          </IconButton>
        }
        sx={{ mb: 1, borderRadius: 2, fontSize: '0.875rem', alignItems: 'flex-start', mt:2, ml:3}}
      >
        {headerText && <strong>{headerText}</strong>}
        {required.length > 0 && (
          <ul style={{ margin: '4px 0 0', paddingLeft: 20 }}>
            {required.map((item: any, index: number) => (
              <li key={index} style={{ fontSize: '0.8rem' }}>
                {typeof item === 'object' ? JSON.stringify(item) : item}
              </li>
            ))}
          </ul>
        )}
        {fieldErrors.length > 0 && (
          <ul style={{ margin: '4px 0 0', paddingLeft: 20 }}>
            {fieldErrors.map((e, i) => (
              <li key={i} style={{ fontSize: '0.8rem' }}>
                <strong>{formatFieldName(e.field)}:</strong> {e.message}
              </li>
            ))}
          </ul>
        )}
      </Alert>
    </Collapse>
  )
}

export default ErrorHandlerAlert