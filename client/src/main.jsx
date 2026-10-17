import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import AdminUploads from './components/AdminUploads.jsx';
import './index.css';
import './uploads.css';

const isUploadsRoute = window.location.pathname.replace(/\/+$/, '') === '/uploads';
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>{isUploadsRoute ? <AdminUploads /> : <App />}</React.StrictMode>
);
