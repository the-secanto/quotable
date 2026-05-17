import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import fs from 'fs';

const dbPath = path.join(app.getPath('userData'), 'quotable.db');

// Ensure directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT,
      email TEXT,
      first_name TEXT,
      last_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS quotes (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      text TEXT NOT NULL,
      author TEXT,
      category TEXT,
      is_public BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      local_only BOOLEAN DEFAULT 1,
      synced BOOLEAN DEFAULT 0,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS favorites (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      quote_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(quote_id) REFERENCES quotes(id)
    );

    CREATE TABLE IF NOT EXISTS quote_display_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quote_id TEXT,
      displayed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(quote_id) REFERENCES quotes(id)
    );

    CREATE TABLE IF NOT EXISTS quote_rules (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      trigger_type TEXT NOT NULL,
      trigger_config_json TEXT,
      enabled BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Migration: Add updated_at to settings if it doesn't exist
  try {
    db.prepare('SELECT updated_at FROM settings LIMIT 1').get();
  } catch (e) {
    if (e.message.includes('no such column')) {
      db.exec('ALTER TABLE settings ADD COLUMN updated_at DATETIME');
      db.exec('UPDATE settings SET updated_at = CURRENT_TIMESTAMP');
    }
  }

  // Migration: Add updated_at to quote_rules if it doesn't exist
  try {
    db.prepare('SELECT updated_at FROM quote_rules LIMIT 1').get();
  } catch (e) {
    if (e.message.includes('no such column')) {
      db.exec('ALTER TABLE quote_rules ADD COLUMN updated_at DATETIME');
      db.exec('UPDATE quote_rules SET updated_at = CURRENT_TIMESTAMP');
    }
  }
  
  // Initialize default settings if empty
  const count = db.prepare('SELECT count(*) as count FROM settings').get().count;
  if (count === 0) {
    const defaultSettings = [
      ['theme', 'dark'],
      ['opacity', '0.9'],
      ['fontSize', '24'],
      ['overlayDuration', '10'],
      ['inactivityHours', '6'],
      ['startupTrigger', '1'],
      ['wakeTrigger', '1'],
      ['launchAtStartup', '0'],
      ['minimizeToTray', '1']
    ];
    
    const insert = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
    for (const [key, value] of defaultSettings) {
      insert.run(key, value);
    }
  }
  // Initialize default quotes if empty
  const quoteCount = db.prepare('SELECT count(*) as count FROM quotes').get().count;
  if (quoteCount === 0) {
    const defaultQuotes = [
      ['q1', "You don't rise to the level of your goals. You fall to the level of your systems.", 'James Clear', 'Discipline'],
      ['q2', "What we do every day matters more than what we do once in a while.", 'Gretchen Rubin', 'Focus'],
      ['q3', "You are loved. More than you know, more than you'll ever feel.", 'A reminder', 'Love'],
      ['q4', "Discipline is choosing between what you want now and what you want most.", 'Abraham Lincoln', 'Discipline'],
    ];
    
    const insertQuote = db.prepare('INSERT INTO quotes (id, text, author, category) VALUES (?, ?, ?, ?)');
    for (const [id, text, author, category] of defaultQuotes) {
      insertQuote.run(id, text, author, category);
    }
  }
}

export default db;
