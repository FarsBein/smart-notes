import { createRoot } from 'react-dom/client';
import { useState, useEffect } from 'react';
import App from './App';
import { Setup } from './pages/Setup/Setup';
import { MemoryRouter as Router } from 'react-router-dom';
import { ActionButtonsProvider } from './contexts/ActionButtons';
import { NotesProvider } from './contexts/NotesContext';

function Root() {
    const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
    console.log('Root location:', window.location.pathname);
    useEffect(() => {
        const checkConfiguration = async () => {
            // Skip config check in development
            if (process.env.NODE_ENV === 'development') {
                setIsConfigured(true);
                return;
            }
            const configured = await window.electron.ipcRenderer.invoke('check-is-configured');
            setIsConfigured(configured);
        };

        checkConfiguration();
    }, []);

    if (isConfigured === null) {
        return <div>Loading...</div>;
    }

    // Show setup only in production when not configured
    if (process.env.NODE_ENV !== 'development' && !isConfigured) {
        return <Setup onComplete={() => setIsConfigured(true)} />;
    }

    return (
        <ActionButtonsProvider>
            <NotesProvider>
                <Router>
                    <App />
                </Router>
            </NotesProvider>
        </ActionButtonsProvider>
    );
}

const rootElement = document.getElementById('root');
if (rootElement) {
    createRoot(rootElement).render(<Root />);
} else {
    console.error('Root element not found');
}
