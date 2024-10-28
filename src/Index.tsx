import { createRoot } from 'react-dom/client';
import App from './App';
import { MemoryRouter as Router } from 'react-router-dom';
import { ActionButtonsProvider } from './contexts/ActionButtons';
import { NotesProvider } from './contexts/NotesContext';

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <ActionButtonsProvider>
      <NotesProvider>
        <Router>
          <App />
        </Router>
      </NotesProvider>
    </ActionButtonsProvider>
  );
} else {
  console.error('Root element not found');
}
