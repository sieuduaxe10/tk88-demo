import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  // StrictMode disabled for now - causes double-initialization of Babylon.js engine
  // TODO: Re-enable after adding init guards
  <App />,
);
