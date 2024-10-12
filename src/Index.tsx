import { createRoot } from 'react-dom/client';
import App from './App';
import { MemoryRouter as Router } from 'react-router-dom';
import TitleBar from './components/TitleBar';

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <>
      <TitleBar />
      <Router>
        <App />
      </Router>
    </>
  );
} else {
  console.error('Root element not found');
}
