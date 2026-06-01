import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import db, { initDb } from './database/db.js';
import { registerHandlers } from './ipc/handlers.js';
import { createTray } from './tray/trayManager.js';
import { initScheduler } from './scheduler/scheduler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 1. Silence Autofill and other noisy DevTools warnings
app.commandLine.appendSwitch('disable-features', 'AutofillServerCommunication');
app.commandLine.appendSwitch('ignore-certificate-errors');

let mainWindow = null;

// ... (keep deep link logic)

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  // ... (keep second-instance logic)

  app.whenReady().then(() => {
    initDb();
    registerHandlers();
    createWindow();
    createTray(mainWindow);
    initScheduler();

    // 2. Handle SSL Certificate errors (Fix for Sophos/Corporate Firewalls)
    app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
      // If the certificate is from a known security provider like Sophos, allow it
      if (certificate.issuerName.includes('Sophos') || url.includes('supabase.co')) {
        event.preventDefault();
        callback(true); // Trust the certificate
      } else {
        callback(false);
      }
    });

    // mainWindow.webContents.openDevTools(); // Optional: open by default

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
  
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, '../src/assets/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      devTools: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
    titleBarStyle: 'hidden',
    titleBarOverlay: process.platform !== 'darwin' ? {
    //color: 'var(--background)',          // cant use variables because it has to be prerendered and is in a different process (electron)
    //symbolColor: 'var(--background)', 
    //height: 40
    color: '#161617', // STILL FIGURING OUT THE COLOR
    symbolColor: '#dfdfe6', // SYMBOL COLOR IS FINE
    height: 34 // OG TO MATCH IS 36, REMOVED 2 FOR PADDING/WHITE GLOW EFFECT
    } : false    
  });


  const isAutostart = process.argv.includes('--autostart');
  
  const isDev = !app.isPackaged;

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/client/index.html'), { hash: '/' });
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
