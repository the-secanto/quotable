import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import db, { initDb } from './database/db.js';
import { registerHandlers } from './ipc/handlers.js';
import { createTray } from './tray/trayManager.js';
import { initScheduler } from './scheduler/scheduler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let mainWindow = null;

// Deep linking protocol
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('muse-app', process.execPath, [path.resolve(process.argv[1])]);
  }
} else {
  app.setAsDefaultProtocolClient('muse-app');
}

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
      
      // Protocol handler for Windows/Linux
      const url = commandLine.pop();
      if (url && url.includes('muse-app://')) {
        mainWindow.webContents.send('navigate-to', url);
      }
    }
  });

  app.whenReady().then(() => {
    initDb();
    registerHandlers();
    createWindow();
    createTray(mainWindow);
    initScheduler();
    mainWindow.webContents.openDevTools();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      } else if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
      }
    });
  });
}

// Protocol handler for macOS
app.on('open-url', (event, url) => {
  event.preventDefault();
  if (mainWindow) {
    mainWindow.webContents.send('navigate-to', url);
  } else {
    // If window not yet created, store the URL or wait
    app.once('browser-window-created', () => {
      mainWindow.webContents.send('navigate-to', url);
    });
  }
});

function createWindow() {
  const isDev = !app.isPackaged;
  
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
    titleBarStyle: 'default',
  });

  const isAutostart = process.argv.includes('--autostart');
  
  if (isDev) {
    mainWindow.loadURL('http://localhost:8080');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  if (!isAutostart) {
    mainWindow.show();
    mainWindow.focus();
  }

  mainWindow.on('close', (event) => {
    const minimizeToTray = db.prepare('SELECT value FROM settings WHERE key = ?').get('minimizeToTray');
    
    if (!app.isQuitting && minimizeToTray?.value === '1') {
      event.preventDefault();
      mainWindow.hide();
    }
    return false;
  });
}

app.on('before-quit', () => {
  app.isQuitting = true;
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
