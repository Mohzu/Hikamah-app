// client/src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContexts';
import { PaymentDataProvider } from './contexts/PaymentDataContext';
import axios from 'axios';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Set base URL untuk semua request Axios
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000'; 
axios.defaults.withCredentials = true; 

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <PaymentDataProvider>
          <App />
        </PaymentDataProvider>
      </AuthProvider>
      <ToastContainer position="bottom-right" autoClose={3000} hideProgressBar newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
    </BrowserRouter>
  </React.StrictMode>,
);
