
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import CustomToastContainer from '@/components/common/ToastContainer';
import { Provider } from 'react-redux';
import { store, persistor } from '@/redux/store';
import { PersistGate } from 'redux-persist/integration/react';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import 'recharts';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import moment from 'moment-timezone';
import './style.css';
import { DEFAULT_TIMEZONE } from './config/constant';
// Set global timezone
moment.tz.setDefault(DEFAULT_TIMEZONE);
const LoadingFallback = () => (
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    zIndex: 9999
  }}>
    <LoadingSpinner size={50} />
  </div>
);

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  console.group('🔄 Vite Preload Error Handling');
  console.warn('Vite preload error detected:', event);
  
  // Try to recover without full reload first
  const error = event.payload;
  if (error && error.message && error.message.includes('chunk')) {
    console.log('📦 Chunk error detected, attempting soft recovery...');
    // Clear module cache and attempt soft recovery
    const chunks = document.querySelectorAll('script[src*="chunk"]');
    console.log(`Found ${chunks.length} chunk scripts to reload`);
    chunks.forEach((chunk, index) => {
      const src = chunk.getAttribute('src');
      if (src) {
        console.log(`Reloading chunk ${index + 1}:`, src);
        const newScript = document.createElement('script');
        newScript.src = src + '?t=' + Date.now();
        newScript.onload = () => {
          console.log(`✅ Chunk ${index + 1} reloaded successfully`);
        };
        newScript.onerror = () => {
          // If soft recovery fails, do hard reload
          console.error(`❌ Chunk ${index + 1} reload failed, performing hard reload`);
          window.location.reload();
        };
        chunk.parentNode?.replaceChild(newScript, chunk);
      }
    });
  } else {
    console.log('⚡ Non-chunk error, performing immediate reload');
    // For non-chunk errors, do immediate reload
    window.location.reload();
  }
  console.groupEnd();
});
const root = createRoot(rootElement);

root.render(
  <StrictMode>
    <ErrorBoundary>
      <Provider store={store}>
        <PersistGate loading={<LoadingFallback />} persistor={persistor}>
          <App />
          <CustomToastContainer />
        </PersistGate>
      </Provider>
    </ErrorBoundary>
  </StrictMode>
);