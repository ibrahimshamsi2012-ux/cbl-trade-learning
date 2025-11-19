import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // Assumes your main component is in App.js or App.jsx
import './index.css'; // Assuming you have a CSS file

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
