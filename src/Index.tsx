import { createRoot } from 'react-dom/client';
import App from './App';
import { MemoryRouter as Router } from 'react-router-dom';
import { ActionButtonsProvider } from './contexts/ActionButtons';

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <ActionButtonsProvider>
      <Router>
        <App />
      </Router>
    </ActionButtonsProvider>
  );
} else {
  console.error('Root element not found');
}
