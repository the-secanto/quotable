import { ipcMain, dialog, app, BrowserWindow } from 'electron';
import db from '../database/db.js';
import { showOverlay, closeOverlay } from '../overlay/overlayWindow.js';
import fs from 'fs';
import crypto from 'crypto';

export function registerHandlers() {
  // Quotes
  ipcMain.handle('get-quotes', async () => {
    return db.prepare(`
      SELECT q.*, (SELECT COUNT(*) FROM favorites WHERE quote_id = q.id) as likes_count 
      FROM quotes q 
      ORDER BY q.created_at DESC
    `).all();
  });

  ipcMain.handle('add-quote', async (event, quote) => {
    const { id, text, author, category, user_id, is_public, local_only } = quote;
    const stmt = db.prepare(`
      INSERT INTO quotes (id, text, author, category, user_id, is_public, local_only, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    stmt.run(id, text, author, category, user_id || null, is_public ? 1 : 0, local_only ? 1 : 0);
    return { success: true };
  });

  ipcMain.handle('update-quote', async (event, id, patch) => {
    const keys = Object.keys(patch);
    if (keys.length === 0) return { success: true };

    const setClause = keys.map(key => `${key} = ?`).join(', ');
    const values = keys.map(key => {
      const val = patch[key];
      if (typeof val === 'boolean') return val ? 1 : 0;
      if (typeof val === 'object' && val !== null) return JSON.stringify(val);
      return val;
    });

    const stmt = db.prepare(`UPDATE quotes SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`);
    stmt.run(...values, id);
    return { success: true };
  });

  ipcMain.handle('delete-quote', async (event, id) => {
    db.prepare('DELETE FROM quotes WHERE id = ?').run(id);
    return { success: true };
  });

  // Settings
  ipcMain.handle('get-settings', async () => {
    const rows = db.prepare('SELECT key, value FROM settings').all();
    const settings = {};
    rows.forEach(row => {
      settings[row.key] = row.value;
    });
    return settings;
  });

  ipcMain.handle('update-setting', async (event, key, value) => {
    db.prepare('INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)').run(key, value.toString());
    
    if (key === 'launchAtStartup') {
      const openAtLogin = value === '1' || value === true || value === 'true';
      app.setLoginItemSettings({
        openAtLogin: openAtLogin,
        path: app.getPath('exe'),
      });
    }

    // Broadcast to all windows
    BrowserWindow.getAllWindows().forEach(win => {
      win.webContents.send('setting-updated', { key, value });
    });
    
    return { success: true };
  });

  // Overlay control
  ipcMain.handle('trigger-overlay', async () => {
    // Select a random quote
    const quote = db.prepare('SELECT * FROM quotes ORDER BY RANDOM() LIMIT 1').get();
    if (quote) {
      showOverlay(quote);
    }
    return { success: !!quote };
  });

  ipcMain.handle('close-overlay', async () => {
    closeOverlay();
  });

  // Quote Rules
  ipcMain.handle('get-rules', async () => {
    return db.prepare('SELECT * FROM quote_rules').all();
  });

  ipcMain.handle('add-rule', async (event, rule) => {
    const { id, trigger_type, trigger_config_json, enabled } = rule;
    const stmt = db.prepare(`
      INSERT INTO quote_rules (id, trigger_type, trigger_config_json, enabled, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    stmt.run(id || crypto.randomUUID(), trigger_type, trigger_config_json, enabled ? 1 : 0);
    return { success: true };
  });

  ipcMain.handle('update-rule', async (event, id, patch) => {
    const keys = Object.keys(patch);
    if (keys.length === 0) return { success: true };

    const setClause = keys.map(key => `${key} = ?`).join(', ');
    const values = keys.map(key => {
      const val = patch[key];
      if (typeof val === 'boolean') return val ? 1 : 0;
      if (typeof val === 'object' && val !== null) return JSON.stringify(val);
      return val;
    });
    
    const stmt = db.prepare(`UPDATE quote_rules SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`);
    stmt.run(...values, id);
    return { success: true };
  });

  ipcMain.handle('delete-rule', async (event, id) => {
    db.prepare('DELETE FROM quote_rules WHERE id = ?').run(id);
    return { success: true };
  });

  // Import / Export
  ipcMain.handle('export-quotes', async () => {
    const quotes = db.prepare('SELECT * FROM quotes').all();
    const { filePath } = await dialog.showSaveDialog({
      title: 'Export Quotes',
      defaultPath: 'quotes.json',
      filters: [{ name: 'JSON', extensions: ['json'] }]
    });
    
    if (filePath) {
      fs.writeFileSync(filePath, JSON.stringify(quotes, null, 2));
      return { success: true };
    }
    return { success: false };
  });

  ipcMain.handle('import-quotes', async () => {
    const { filePaths } = await dialog.showOpenDialog({
      title: 'Import Quotes',
      filters: [
        { name: 'Quote Files', extensions: ['json', 'txt', 'csv'] }
      ],
      properties: ['openFile']
    });

    if (filePaths && filePaths.length > 0) {
      const content = fs.readFileSync(filePaths[0], 'utf-8');
      const ext = filePaths[0].split('.').pop().toLowerCase();
      
      let quotes = [];
      if (ext === 'json') {
        quotes = JSON.parse(content);
      } else if (ext === 'txt') {
        quotes = content.split('\n').filter(line => line.trim()).map(line => ({
          id: crypto.randomUUID(),
          text: line.trim(),
          author: 'Unknown',
          category: 'Imported'
        }));
      }
      
      const insert = db.prepare(`
        INSERT OR IGNORE INTO quotes (id, text, author, category)
        VALUES (?, ?, ?, ?)
      `);
      
      const transaction = db.transaction((qs) => {
        for (const q of qs) {
          insert.run(q.id || crypto.randomUUID(), q.text, q.author || 'Unknown', q.category || 'Imported');
        }
      });
      
      transaction(quotes);
      return { success: true, count: quotes.length };
    }
    return { success: false };
  });
}
