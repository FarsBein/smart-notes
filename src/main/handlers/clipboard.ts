import { clipboard, ipcMain } from 'electron';

// Clipboard recent history
interface ClipboardItem {
    type: 'url' | 'image' | 'text' | 'none';
    content: string;
    timestamp: number;
}

let clipboardHistory: ClipboardItem[] = [];
const CLIPBOARD_TIMEOUT = 5000; // 15 seconds

function checkClipboard() {
    const formats = clipboard.availableFormats();
    let content: string | null = null;
    let type: 'url' | 'image' | 'text' | 'none' = 'none';

    if (formats.includes('text/plain')) {
        const text = clipboard.readText();
        if (text.startsWith('http://') || text.startsWith('https://')) {
            type = 'url';
            content = text;
        } else {
            type = 'text';
            content = text;
        }
    } else if (formats.some(format => format.startsWith('image/'))) {
        const image = clipboard.readImage();
        if (!image.isEmpty()) {
            type = 'image';
            content = image.toPNG().toString('base64');
        }
    }

    if (content !== null && type !== 'none') {
        const newItem: ClipboardItem = { type, content, timestamp: Date.now() };
        if (!clipboardHistory.some(item => item.content === content)) {
            clipboardHistory.push(newItem);
        }
    }

    // Remove old items
    const now = Date.now();
    clipboardHistory = clipboardHistory.filter(item => now - item.timestamp <= CLIPBOARD_TIMEOUT);
}

// Check clipboard every second
// setInterval(checkClipboard, 1000);

ipcMain.on('get-recent-clipboard', (event) => {
    const recentItems = clipboardHistory.filter(item => Date.now() - item.timestamp <= CLIPBOARD_TIMEOUT);
    event.reply('recent-clipboard-content', recentItems);
});