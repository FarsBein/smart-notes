import { ipcMain } from 'electron';
import WebSocket from 'ws';
import { mainWindow } from '../main';

// Interfaces
interface UrlResponse {
    type: 'urlResponse';
    url: string;
    title: string;
    error?: string;
}

interface SelectionResponse {
    type: 'selectionResponse';
    selectedText: string;
    error?: string;
}

interface PageInfoResponse {
    type: 'pageInfoResponse';
    url: string;
    title: string;
    selectedText: string;
    error?: string;
}

// Create WebSocket server
const wss = new WebSocket.Server({ port: 8887 });
let activeConnection: WebSocket | null = null;

wss.on('connection', (ws) => {
    console.log('Chrome extension connected');
    activeConnection = ws;

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message.toString());
            console.log('Received from extension:', data);
            
            switch (data.type) {
                case 'urlResponse':
                    handleUrlResponse(data as UrlResponse);
                    break;
                case 'selectionResponse':
                    handleSelectionResponse(data as SelectionResponse);
                    break;
                case 'pageInfoResponse':
                    handlePageInfoResponse(data as PageInfoResponse);
                    break;
            }
        } catch (error) {
            console.error('Error processing message:', error);
        }
    });

    ws.on('close', () => {
        console.log('Chrome extension disconnected');
        if (activeConnection === ws) {
            activeConnection = null;
        }
    });
});

// Handler functions
function handleUrlResponse(response: UrlResponse) {
    if (mainWindow) {
        mainWindow.webContents.send('browser-url-received', {
            url: response.url,
            title: response.title
        });
    }
}

function handleSelectionResponse(response: SelectionResponse) {
    if (mainWindow) {
        mainWindow.webContents.send('browser-selection-received', {
            selectedText: response.selectedText
        });
    }
}

function handlePageInfoResponse(response: PageInfoResponse) {
    if (mainWindow) {
        mainWindow.webContents.send('browser-pageinfo-received', {
            url: response.url,
            title: response.title,
            selectedText: response.selectedText
        });
    }
}

// IPC handlers
ipcMain.handle('get-url-from-webpage', async () => {
    return new Promise((resolve) => {
        if (!activeConnection) {
            resolve({ url: '', title: '' });
            return;
        }

        const handler = (message: WebSocket.Data) => {
            try {
                const response = JSON.parse(message.toString()) as UrlResponse;
                if (response.type === 'urlResponse') {
                    resolve({ url: response.url, title: response.title });
                }
            } catch (error) {
                console.error('Error parsing URL response:', error);
                resolve({ url: '', title: '' });
            }
        };

        activeConnection.once('message', handler);
        activeConnection.send(JSON.stringify({ action: 'getUrl' }));

        setTimeout(() => {
            if (activeConnection) {
                activeConnection.removeListener('message', handler);
            }
            resolve({ url: '', title: '' });
        }, 5000);
    });
});

ipcMain.handle('get-selection-from-webpage', async () => {
    return new Promise((resolve) => {
        if (!activeConnection) {
            resolve('');
            return;
        }

        const handler = (message: WebSocket.Data) => {
            try {
                const response = JSON.parse(message.toString()) as SelectionResponse;
                if (response.type === 'selectionResponse') {
                    resolve(response.selectedText);
                }
            } catch (error) {
                console.error('Error parsing selection response:', error);
                resolve('');
            }
        };

        activeConnection.once('message', handler);
        activeConnection.send(JSON.stringify({ action: 'getSelection' }));

        setTimeout(() => {
            if (activeConnection) {
                activeConnection.removeListener('message', handler);
            }
            resolve('');
        }, 5000);
    });
});

ipcMain.handle('get-page-info-from-webpage', async () => {
    return new Promise((resolve) => {
        if (!activeConnection) {
            resolve({ url: '', title: '', selectedText: '' });
            return;
        }

        const handler = (message: WebSocket.Data) => {
            try {
                const response = JSON.parse(message.toString()) as PageInfoResponse;
                if (response.type === 'pageInfoResponse') {
                    resolve({
                        url: response.url,
                        title: response.title,
                        selectedText: response.selectedText
                    });
                }
            } catch (error) {
                console.error('Error parsing page info response:', error);
                resolve({ url: '', title: '', selectedText: '' });
            }
        };

        activeConnection.once('message', handler);
        activeConnection.send(JSON.stringify({ action: 'getPageInfo' }));

        setTimeout(() => {
            if (activeConnection) {
                activeConnection.removeListener('message', handler);
            }
            resolve({ url: '', title: '', selectedText: '' });
        }, 5000);
    });
});

export function cleanup() {
    wss.close();
}