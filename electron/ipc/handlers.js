import { ipcMain, dialog, app, BrowserWindow } from 'electron';
import db from '../database/db.js';
import { showOverlay, closeOverlay } from '../overlay/overlayWindow.js';
import fs from 'fs';
import crypto from 'crypto';

export function registerHandlers() {
  // Quotes
  ipcMain.handle('get-quotes', async (event, userId) => {
    try {
      if (userId) {
        return db.prepare(`
          SELECT q.*, (SELECT COUNT(*) FROM favorites WHERE quote_id = q.id) as likes_count 
          FROM quotes q 
          WHERE q.user_id = ? OR q.user_id IS NULL
          ORDER BY q.created_at DESC
        `).all(userId);
      }
      // If no userId, return everything so local quotes don't "disappear" at startup
      return db.prepare(`
        SELECT q.*, (SELECT COUNT(*) FROM favorites WHERE quote_id = q.id) as likes_count 
        FROM quotes q 
        ORDER BY q.created_at DESC
      `).all();
    } catch (error) {
      console.error('IPC: get-quotes error:', error);
      return [];
    }
  });

  ipcMain.handle('add-quote', async (event, quote) => {
    try {
      const { id, text, author, category, user_id, is_public, local_only, likes_count } = quote;
      
      if (user_id) {
        db.prepare('INSERT OR IGNORE INTO users (id) VALUES (?)').run(user_id);
      }

      const stmt = db.prepare(`
        INSERT INTO quotes (id, text, author, category, user_id, is_public, local_only, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET
          text = excluded.text,
          author = excluded.author,
          category = excluded.category,
          is_public = excluded.is_public,
          updated_at = CURRENT_TIMESTAMP
      `);
      stmt.run(id, text, author, category, user_id || null, is_public ? 1 : 0, local_only ? 1 : 0);
      
      // Update display-only likes count if provided
      if (likes_count !== undefined) {
        // We don't have a likes_count column in the main quotes table (it's calculated),
        // but we can store it in a way that the get-quotes query can use it or just ignore it
        // since get-quotes calculates it from the favorites table.
        // For now, let's ensure favorites table is synced too if we want perfect local accuracy.
      }

      return { success: true };
    } catch (error) {
      console.error('IPC: add-quote error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('update-quote', async (event, id, patch) => {
    try {
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
    } catch (error) {
      console.error('IPC: update-quote error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('delete-quote', async (event, id) => {
    try {
      db.prepare('DELETE FROM quotes WHERE id = ?').run(id);
      return { success: true };
    } catch (error) {
      console.error('IPC: delete-quote error:', error);
      return { success: false, error: error.message };
    }
  });

  // Settings
  ipcMain.handle('get-settings', async () => {
    try {
      const rows = db.prepare('SELECT key, value FROM settings').all();
      const settings = {};
      rows.forEach(row => {
        settings[row.key] = row.value;
      });
      return settings;
    } catch (error) {
      console.error('IPC: get-settings error:', error);
      return {};
    }
  });

  ipcMain.handle('update-setting', async (event, key, value) => {
    try {
      db.prepare('INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)').run(key, value.toString());
      
      if (key === 'launchAtStartup') {
        const openAtLogin = value === '1' || value === true || value === 'true';
        app.setLoginItemSettings({
          openAtLogin: openAtLogin,
          path: app.getPath('exe'),
          args: ['--autostart']
        });
      }

      BrowserWindow.getAllWindows().forEach(win => {
        win.webContents.send('setting-updated', { key, value });
      });
      
      return { success: true };
    } catch (error) {
      console.error('IPC: update-setting error:', error);
      return { success: false, error: error.message };
    }
  });

  // Overlay control
  ipcMain.handle('trigger-overlay', async (event, userId) => {
    try {
      let quote;
      if (userId) {
        quote = db.prepare('SELECT * FROM quotes WHERE user_id = ? OR user_id IS NULL ORDER BY RANDOM() LIMIT 1').get(userId);
      } else {
        quote = db.prepare('SELECT * FROM quotes WHERE user_id IS NULL ORDER BY RANDOM() LIMIT 1').get();
      }
      
      if (quote) {
        showOverlay(quote);
      }
      return { success: !!quote };
    } catch (error) {
      console.error('IPC: trigger-overlay error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('close-overlay', async () => {
    try {
      closeOverlay();
      return { success: true };
    } catch (error) {
      console.error('IPC: close-overlay error:', error);
      return { success: false, error: error.message };
    }
  });

  // Quote Rules
  ipcMain.handle('get-rules', async (event, userId) => {
    try {
      if (userId) {
        return db.prepare('SELECT * FROM quote_rules WHERE user_id = ? OR user_id IS NULL').all(userId);
      }
      return db.prepare('SELECT * FROM quote_rules WHERE user_id IS NULL').all();
    } catch (error) {
      console.error('IPC: get-rules error:', error);
      return [];
    }
  });

  ipcMain.handle('add-rule', async (event, rule) => {
    try {
      const { id, trigger_type, trigger_config_json, enabled, user_id } = rule;
      
      if (user_id) {
        db.prepare('INSERT OR IGNORE INTO users (id) VALUES (?)').run(user_id);
      }

      const stmt = db.prepare(`
        INSERT INTO quote_rules (id, trigger_type, trigger_config_json, enabled, user_id, updated_at)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `);
      stmt.run(id || crypto.randomUUID(), trigger_type, trigger_config_json, enabled ? 1 : 0, user_id || null);
      return { success: true };
    } catch (error) {
      console.error('IPC: add-rule error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('update-rule', async (event, id, patch) => {
    try {
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
    } catch (error) {
      console.error('IPC: update-rule error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('delete-rule', async (event, id) => {
    try {
      db.prepare('DELETE FROM quote_rules WHERE id = ?').run(id);
      return { success: true };
    } catch (error) {
      console.error('IPC: delete-rule error:', error);
      return { success: false, error: error.message };
    }
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
