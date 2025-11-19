import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // This imports the main App component

// IMPORTANT: The line 'import "./index.css";' was removed here. 
// This resolves the Vercel "Module not found" error, as your app uses Tailwind CSS, not a separate index.css file.

const rootElement = document.getElementById('root');

if (rootElement) {
  // Use createRoot from ReactDOM for modern React rendering
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  // Simple error logging if the required root element is missing
  console.error("The root element with ID 'root' was not found in the document. Cannot start the React application.");
}
