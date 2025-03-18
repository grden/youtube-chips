import React from 'react';
import { createRoot } from 'react-dom/client';
import './options.css';
import App from './app/app';

const container = document.createElement('div');
document.body.appendChild(container);
createRoot(container).render(<App />);
