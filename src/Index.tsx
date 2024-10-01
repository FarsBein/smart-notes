import React from 'react';
import { createRoot } from 'react-dom/client';
import Application from './components/Application';
import { MemoryRouter as Router } from 'react-router-dom';
import '@/styles/index.scss';

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(<Router><Application /></Router>);
} else {
  console.error('Root element not found');
}


