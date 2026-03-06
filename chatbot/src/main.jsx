import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Read the session ID from the embedding <script> tag's data-session-id attribute.
// Therapists embed the widget as:
//   <script src="https://your-domain.com/widget.js" data-session-id="<session-id>"></script>
// We look for the script tag by src suffix since document.currentScript is null in ES modules.
const embedScript = document.querySelector('script[src*="widget.js"][data-session-id]');
if (embedScript && !window.__CHATBOT_SESSION_ID__) {
  window.__CHATBOT_SESSION_ID__ = embedScript.getAttribute('data-session-id') || '';
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
