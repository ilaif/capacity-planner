import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import CapacityPlanner from '../components/CapacityPlanner';
import { SupabaseProvider } from '../components/providers/SupabaseProvider';
import { Toaster } from '@/components/ui/toaster';
import MagicLinkErrorHandler from '@/components/MagicLinkErrorHandler';
import '../app/globals.css';
import '../app/styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <SupabaseProvider>
        <CapacityPlanner />
        <Toaster />
        <MagicLinkErrorHandler />
      </SupabaseProvider>
    </BrowserRouter>
  </React.StrictMode>
);
