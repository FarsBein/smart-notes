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