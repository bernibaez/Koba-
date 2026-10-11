import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { DynamicIslandToaster } from './components/DynamicIslandToaster';
import { AuthProvider } from './context/AuthContext';
import App from './App';
import './styles/tailwind.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <DynamicIslandToaster />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
