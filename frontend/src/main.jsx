import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3500,
          style: { borderRadius: '10px', fontWeight: '600', fontSize: '0.88rem' },
          success: { style: { background: '#16a34a', color: 'white' } },
          error: { style: { background: '#e11d48', color: 'white' } },
        }}
      />
    </QueryClientProvider>
  </React.StrictMode>
);
