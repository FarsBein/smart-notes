import { app, globalShortcut, BrowserWindow, Menu, screen, ipcMain, clipboard  } from 'electron';
import { join } from 'path'
import path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';

import { productName } from '../package.json';

// This allows TypeScript to pick up the magic constants that's auto-generated by Forge's Webpack
// plugin that tells the Electron app where to look for the Webpack-bundled app code (depending on
// whether you're running in development or production).
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = (): void => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    title: `${productName} ${app.getVersion()}`,
    minWidth: 1080,
    minHeight: 720,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: true,
    }
  });

  // mainWindow.webContents.openDevTools();

  Menu.setApplicationMenu(null);

  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);


  // Register the global shortcut
  globalShortcut.register('CommandOrControl+Shift+N', () => {
    console.log('Shortcut triggered');
    createPopup();
  });
};

let popupWindow: BrowserWindow | null = null;
function createPopup() {
  if (popupWindow) {
    popupWindow.focus();
    return;
  }

  const cursor = screen.getCursorScreenPoint();
  const currentDisplay = screen.getDisplayNearestPoint(cursor);

  const width = 600;
  const height = 400;

  const x = currentDisplay.bounds.x + Math.round((currentDisplay.bounds.width - width) / 2);
  const y = currentDisplay.bounds.y + Math.round((currentDisplay.bounds.height - height) / 2);

  popupWindow = new BrowserWindow({
    width,
    height,
    x,
    y,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      nodeIntegrationInWorker: false,
      nodeIntegrationInSubFrames: false,
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      sandbox: false,
      spellcheck: true,
    },
  });

  popupWindow.webContents.session.setSpellCheckerLanguages(['en-US', 'en-CA']);

  // popupWindow.webContents.openDevTools();

  // Load the correct URL for the popup
  const popupUrl = new URL(MAIN_WINDOW_WEBPACK_ENTRY);
  popupUrl.searchParams.set('view', 'popup'); // Use a query parameter instead of hash
  console.log(`Navigating to http://localhost:3000/popup`);
  console.log(`> ${MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY}`);
  popupWindow.loadURL('http://localhost:3000/popup');

  // Wait for the window to be ready before showing it
  popupWindow.once('ready-to-show', () => {
    popupWindow.show();
  });

  popupWindow.on('blur', () => {
    if (popupWindow) {
      popupWindow.close();
    }
  });

  popupWindow.on('closed', () => {
    popupWindow = null;
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

// Clipboard recent history
// todo: move to a global interface file
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
setInterval(checkClipboard, 1000);

ipcMain.on('get-recent-clipboard', (event) => {
  const recentItems = clipboardHistory.filter(item => Date.now() - item.timestamp <= CLIPBOARD_TIMEOUT);
  event.reply('recent-clipboard-content', recentItems);
});


// todo: move to a global interface file
interface Attachment {
  type: 'url' | 'image' | 'text' | 'none';
  content: string;
}

// Save note to file
ipcMain.on('save-note', (event, noteContent, attachments) => {
  const date = new Date();
  const fileName = `note-${date.toISOString().replace(/:/g, '-')}.md`;
  const notesDir = path.join(app.getPath('documents'), 'MyNotes');
  const filePath = path.join(notesDir, fileName);
  const attachmentsDir = path.join(notesDir, 'attachments');
  console.log('Saving note to notesDir:', notesDir);
  // Ensure directories exist
  fs.mkdirSync(notesDir, { recursive: true });
  fs.mkdirSync(attachmentsDir, { recursive: true });

  let fullNoteContent = noteContent + '\n\n';

  // Process attachments
  attachments.forEach((attachment: Attachment, index: number) => {
    switch (attachment.type) {
      case 'url':
        fullNoteContent += `[Attachment ${index + 1}](${attachment.content})\n`;
        break;
      case 'text':
        fullNoteContent += `Attachment ${index + 1}:\n\`\`\`\n${attachment.content}\n\`\`\`\n`;
        break;
      case 'image':
        const imgFileName = `image-${crypto.randomBytes(4).toString('hex')}.png`;
        const imgFilePath = path.join(attachmentsDir, imgFileName);
        fs.writeFileSync(imgFilePath, Buffer.from(attachment.content, 'base64'));
        fullNoteContent += `![Image ${index + 1}](${notesDir}\\attachments\\${imgFileName})\n`;
        break;
      // Add cases for other file types as needed
    }
  });

  // Write the full note content to the file
  fs.writeFile(filePath, fullNoteContent, (err) => {
    if (err) {
      console.error('Failed to save note:', err);
      event.reply('save-note-result', { success: false, error: err.message });
    } else {
      console.log('Note saved successfully:', filePath);
      event.reply('save-note-result', { success: true, filePath });
    }
  });
});

// Close popup
ipcMain.on('close-popup', () => {
  if (popupWindow) {
    popupWindow.close();
  }
});