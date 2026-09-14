import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sileo';
import { AuthProvider } from './context/AuthContext';
import App from './App';
import './styles/tailwind.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster position="top-right" theme="light" />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
