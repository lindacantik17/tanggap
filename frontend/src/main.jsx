// ============================================================================
// main.jsx — Titik masuk frontend.
// ReactDOM me-render komponen <App/> ke dalam <div id="root"> di index.html.
// StrictMode membantu menemukan bug saat development (double-render).
// ============================================================================

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
