import { Tray, Menu, app, nativeImage } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { showOverlay } from '../overlay/overlayWindow.js';
import db from '../database/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let tray = null;

export function createTray(mainWindow) {
  // Use a placeholder icon if one doesn't exist yet
  // In a real app, you'd have an icon file.
  // For now, I'll use a simple nativeImage if I can't find one.
  const iconPath = path.join(__dirname, '../../src/assets/quotable_logo.ico');
  // const icon = nativeImage.createEmpty(); // Fallback
  const icon = nativeImage.createFromPath(iconPath)
  tray = new Tray(icon);
  
  const contextMenu = Menu.buildFromTemplate([
    { 
      label: 'Show App', 
      click: () => {
        mainWindow.show();
      } 
    },
    { 
      label: 'Trigger Random Quote', 
      click: () => {
        const quote = db.prepare('SELECT * FROM quotes ORDER BY RANDOM() LIMIT 1').get();
        if (quote) {
          showOverlay(quote);
        }
      } 
    },
    { type: 'separator' },
    { 
      label: 'Settings', 
      click: () => {
        mainWindow.show();
        // We could send an IPC to navigate to settings
        mainWindow.webContents.send('navigate-to', '/settings');
      } 
    },
    { type: 'separator' },
    { 
      label: 'Quit', 
      click: () => {
        app.isQuitting = true;
        app.quit();
      } 
    }
  ]);

  tray.setToolTip('Quotable');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
  });

  return tray;
}
