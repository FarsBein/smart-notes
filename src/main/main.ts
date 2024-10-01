import { app, globalShortcut, BrowserWindow, Menu, screen, ipcMain, protocol } from 'electron';
import './ipc';

import { productName } from '../../package.json';

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
    minWidth: 550,
    minHeight: 750,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: true,
    }
  });

  mainWindow.webContents.openDevTools();

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


  // Set up context menu
  popupWindow.webContents.on('context-menu', (event, params) => {
    const { misspelledWord, dictionarySuggestions } = params;

    // Build a dynamic menu based on the context
    const menuTemplate = [
      ...(misspelledWord ? [
        ...dictionarySuggestions.map(suggestion => ({
          label: suggestion,
          click: () => popupWindow.webContents.replaceMisspelling(suggestion),
        })),
        { type: 'separator' } // This is correctly typed as a separator
      ] : []),
      { role: 'copy' },
      { role: 'paste' },
      { role: 'cut' },
      { role: 'selectAll' }
    ];
    // Build menu from template
    const menu = Menu.buildFromTemplate(menuTemplate as (Electron.MenuItemConstructorOptions | Electron.MenuItem)[]);

    // Popup the menu at the right-click location
    menu.popup({
      window: popupWindow,
      x: params.x, // Get the X coordinate of the click
      y: params.y  // Get the Y coordinate of the click
    });
  });

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

// Close popup
ipcMain.on('close-popup', () => {
  if (popupWindow) {
    popupWindow.close();
  }
});

