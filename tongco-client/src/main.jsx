
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './assets/styles/index.css';
import App from './App.jsx';

sessionStorage.removeItem('token');
sessionStorage.removeItem('user');
localStorage.removeItem('token');
localStorage.removeItem('user');

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
