import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Global reset
const style = document.createElement('style');
style.textContent = `*, *::before, *::after { box-sizing: border-box; } body { margin: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }`;
document.head.appendChild(style);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<React.StrictMode><App /></React.StrictMode>);
