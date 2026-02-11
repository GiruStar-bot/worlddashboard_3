import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// The entry point for the React application.  It mounts the root
// component into the DOM and wraps it in StrictMode to help
// highlight potential issues during development.

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);