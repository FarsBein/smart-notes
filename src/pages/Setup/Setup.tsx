import { useState } from 'react';
import styles from './Setup.module.scss';

export function Setup({ onComplete }: { onComplete: () => void }) {
    const [path, setPath] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [error, setError] = useState('');

    const handleSelectDirectory = async () => {
        const result = await window.electron.ipcRenderer.invoke('show-directory-picker');
        if (result) {
            setPath(result);
        }
    };

    const handleSubmit = async () => {
        try {
            if (!path) {
                setError('Please select a directory for your notes');
                return;
            }
            if (!apiKey) {
                setError('Please enter your OpenAI API key');
                return;
            }

            await window.electron.ipcRenderer.invoke('set-initial-config', {
                notesPath: path,
                openAiKey: apiKey
            });
            onComplete();
        } catch (err) {
            setError('Failed to save configuration');
        }
    };

    return (
        <div className={styles.setupContainer}>
            <h2>Welcome to MyNotes</h2>
            
            <div className={styles.setupSection}>
                <h3>Notes Location</h3>
                <p>Please select where you'd like to store your notes:</p>
                <div className={styles.pathSelector}>
                    <input 
                        type="text" 
                        value={path} 
                        onChange={(e) => setPath(e.target.value)}
                        placeholder="Notes directory path"
                    />
                    <button onClick={handleSelectDirectory}>Browse</button>
                </div>
            </div>

            <div className={styles.setupSection}>
                <h3>OpenAI Configuration</h3>
                <p>Enter your OpenAI API key for note embeddings:</p>
                <input 
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="OpenAI API Key"
                    className={styles.apiKeyInput}
                />
            </div>

            {error && <p className={styles.error}>{error}</p>}
            
            <button 
                onClick={handleSubmit} 
                disabled={!path || !apiKey}
                className={styles.submitButton}
            >
                Complete Setup
            </button>
        </div>
    );
}
