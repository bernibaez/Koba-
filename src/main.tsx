import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import App from './App';
import './styles/tailwind.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="bottom-right"
        richColors
        toastOptions={{
          duration: 3000,
          style: { fontFamily: 'var(--font-dm-sans)' },
        }}
      />
    </BrowserRouter>
  </StrictMode>
);
