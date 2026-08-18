import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import RouterConfig from './routes/RouterConfig';
import { useGlobalNumericInputPrevention } from './hooks/useGlobalNumericInputPrevention';
import { useErrorLogger } from './hooks/useErrorLogger';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import createAppTheme from './data/theme';
// Create a client
const queryClient = new QueryClient()
const App: React.FC = () => {
  useGlobalNumericInputPrevention({
    allowNegative: false,
    preventArrows: true
  });
  useErrorLogger(); // Enable global error logging
   const newTheme = createAppTheme();

  return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={newTheme}>
      <CssBaseline />
      <Router future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}>
        <RouterConfig />
      </Router>
      </ThemeProvider>
      </QueryClientProvider>


  );
};

export default App;
