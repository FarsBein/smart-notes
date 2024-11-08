import { app } from 'electron';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

interface Config {
    notesPath: string;
    openAiKey?: string;
}

const CONFIG_FILE = path.join(app.getPath('userData'), 'config.json');
const DEFAULT_NOTES_PATH = path.join(app.getPath('documents'), 'MyNotes');

export async function loadConfig(): Promise<Config> {

    console.log('Loading default notes path:', DEFAULT_NOTES_PATH);
    // In development, use .env and default paths
    if (process.env.NODE_ENV === 'development') {
        dotenv.config();
        return {
            notesPath: DEFAULT_NOTES_PATH,
            openAiKey: process.env.OPENAI_API_KEY
        };
    }

    // In production, use stored config or fallback to defaults
    try {
        const configData = await fs.readFile(CONFIG_FILE, 'utf-8');
        const config = JSON.parse(configData);
        return {
            notesPath: config.notesPath || DEFAULT_NOTES_PATH,
            openAiKey: config.openAiKey
        };
    } catch {
        // Return default config if file doesn't exist
        return {
            notesPath: DEFAULT_NOTES_PATH,
            openAiKey: undefined
        };
    }
}

export async function saveConfig(config: Config): Promise<void> {
    // Only save config in production
    if (process.env.NODE_ENV !== 'development') {
        await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2));
    }
}

export async function isConfigured(): Promise<boolean> {
    // In development, always return true
    if (process.env.NODE_ENV === 'development') {
        return true;
    }

    // In production, check for config file
    try {
        await fs.access(CONFIG_FILE);
        return true;
    } catch {
        return false;
    }
}
