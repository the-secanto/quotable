import { powerMonitor, app } from 'electron';
import db from '../database/db.js';
import { showOverlay } from '../overlay/overlayWindow.js';

let lastIdleState = false;
let lastCheckTime = Date.now();

export function initScheduler() {
  // 1. Startup trigger
  app.on('ready', () => {
    setTimeout(() => {
      const startupTrigger = db.prepare('SELECT value FROM settings WHERE key = ?').get('startupTrigger');
      if (startupTrigger?.value === '1') {
        triggerRandomQuote();
      }
    }, 2000); // Small delay to ensure everything is ready
  });

  // 2. Wake from sleep
  powerMonitor.on('resume', () => {
    const wakeTrigger = db.prepare('SELECT value FROM settings WHERE key = ?').get('wakeTrigger');
    if (wakeTrigger?.value === '1') {
      triggerRandomQuote();
    }
  });

  // 3. Inactivity trigger
  setInterval(() => {
    const idleTime = powerMonitor.getSystemIdleTime();
    const inactivityHours = parseFloat(db.prepare('SELECT value FROM settings WHERE key = ?').get('inactivityHours')?.value || '6');
    const inactivitySeconds = inactivityHours * 3600;

    if (idleTime >= inactivitySeconds) {
      if (!lastIdleState) {
        lastIdleState = true;
      }
    } else {
      if (lastIdleState) {
        lastIdleState = false;
        triggerRandomQuote();
      }
    }
  }, 30000); // Check every 30 seconds

  // 4. Periodic Triggers (Specific Time & Interval)
  setInterval(() => {
    checkPeriodicTriggers();
  }, 60000); // Check every minute
}

function triggerRandomQuote() {
  const quote = db.prepare('SELECT * FROM quotes ORDER BY RANDOM() LIMIT 1').get();
  if (quote) {
    showOverlay(quote);
    // Log history
    db.prepare('INSERT INTO quote_display_history (quote_id) VALUES (?)').run(quote.id);
  }
}

function checkPeriodicTriggers() {
  const rules = db.prepare('SELECT * FROM quote_rules WHERE enabled = 1').all();
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTimeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;

  rules.forEach(rule => {
    try {
      const config = JSON.parse(rule.trigger_config_json);
      
      if (rule.trigger_type === 'specific_time') {
        if (config.times && config.times.includes(currentTimeStr)) {
          triggerRandomQuote();
        }
      }
      
      if (rule.trigger_type === 'interval') {
        const intervalHours = parseFloat(config.hours || '0');
        if (intervalHours > 0) {
          // Check last display time for this rule or globally
          const lastDisplay = db.prepare('SELECT displayed_at FROM quote_display_history ORDER BY displayed_at DESC LIMIT 1').get();
          if (lastDisplay) {
            const lastTime = new Date(lastDisplay.displayed_at + ' Z').getTime(); // Assume UTC
            const diff = (now.getTime() - lastTime) / (1000 * 3600);
            if (diff >= intervalHours) {
              triggerRandomQuote();
            }
          } else {
            // No history, trigger now
            triggerRandomQuote();
          }
        }
      }
    } catch (e) {
      console.error('Error parsing rule config', e);
    }
  });
}
