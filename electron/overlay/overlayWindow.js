import { BrowserWindow, screen, app } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let overlayWin = null;

export function createOverlayWindow() {
  if (overlayWin) {
    return overlayWin;
  }

  const { width, height } = screen.getPrimaryDisplay().bounds;

  overlayWin = new BrowserWindow({
    width,
    height,
    x: 0,
    y: 0,
    show: false,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    alwaysOnTop: true,
    skipTaskbar: true,
    fullscreen: true,
    resizable: false,
    movable: false,
    webPreferences: {
      devTools: false,
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../preload.cjs'),
    },
  });

  // Set as top-level window for all workspaces on macOS
  if (process.platform === 'darwin') {
    overlayWin.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    overlayWin.setAlwaysOnTop(true, 'screen-saver');
  } else {
    overlayWin.setAlwaysOnTop(true, 'screen-saver');
  }

  const isDev = !app.isPackaged;
  if (isDev) {
    overlayWin.loadURL('http://localhost:8080/preview'); 
  } else {
    overlayWin.loadFile(path.join(__dirname, '../../dist/client/index.html'), { hash: '/preview' });
  }

  overlayWin.once('ready-to-show', () => {
    // We'll show it when triggered
  });

  overlayWin.on('closed', () => {
    overlayWin = null;
  });

  return overlayWin;
}

export function showOverlay(quote) {
  if (!overlayWin) {
    createOverlayWindow();
    // Wait for the window to finish loading before sending the quote
    overlayWin.webContents.once('did-finish-load', () => {
      overlayWin.webContents.send('display-quote', quote);
      overlayWin.show();
      overlayWin.focus();
    });
  } else {
    overlayWin.webContents.send('display-quote', quote);
    overlayWin.show();
    overlayWin.focus();
  }
}

export function closeOverlay() {
  if (overlayWin) {
    overlayWin.hide();
  }
}
