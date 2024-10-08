declare module '*.css';
declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';

interface Window {
    electron: {
        ipcRenderer: {
            removeListener(arg0: string, handleSaveResult: (event: any, result: any) => void): unknown;
            on(arg0: string, handleSaveResult: (event: any, result: any) => void): unknown;
            once(channel: string, func: (...args: any[]) => void): void;
            send(channel: string, ...args: any[]): void;
        };
    };
}


interface NoteMetadata {
    fileName: string;
    title: string;
    createdAt: string;
    updatedAt: string;
    highlight: string | null;
    highlightColor: string | null;
    tags: string[];
    replies: any[]; // define a more specific type for replies
    attachments: string[];
    isReply: boolean;
    isAI: boolean;
    filePath: string;
}


interface Attachment {
    type: 'url' | 'image' | 'text' | 'none';
    content: string;
}


interface Note {
    fileName: string;
    content: string;
    tags: string[];
    createdAt: string;
    updatedAt: string;
    attachments: string[];
}