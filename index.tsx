
import './index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log('🚀 Starting app initialization...');

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

console.log('✅ Root element found');

// Initialize Firebase asynchronously to not block rendering
setTimeout(() => {
  console.log('🔥 Loading Firebase...');
  import('./firebaseConfig').catch(err => {
    console.warn('Firebase initialization warning:', err);
  });
}, 0);

const root = ReactDOM.createRoot(rootElement);
console.log('📦 Rendering App...');

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

console.log('✅ App rendered');