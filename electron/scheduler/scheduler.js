import { powerMonitor, app } from 'electron';
import db from '../database/db.js';
import { showOverlay } from '../overlay/overlayWindow.js';

let lastIdleState = false;
let lastCheckTime = Date.now();
let lastSuspendTime = null;

export function initScheduler() {
  try {
    const isAutostart = process.argv.includes('--autostart') || app.getLoginItemSettings().wasOpenedAtLogin;

    // 1. Startup trigger - only run if autostarted
    setTimeout(() => {
      try {
        const startupTrigger = db.prepare('SELECT value FROM settings WHERE key = ?').get('startupTrigger');
        if (startupTrigger?.value === '1' && isAutostart) {
          console.log('Scheduler: Triggering startup quote');
          triggerRandomQuote();
        }
      } catch (err) {
        console.error('Scheduler: Startup trigger failed:', err);
      }
    }, 3000); // Slight delay to ensure UI is ready

    // 2. Wake from sleep / Unlock screen
    const handleWake = () => {
      try {
        // Calculate total away time
        const now = Date.now();
        const wakeTrigger = db.prepare('SELECT value FROM settings WHERE key = ?').get('wakeTrigger');
        
        // Handle Inactivity across sleep
        const inactivityHoursSetting = db.prepare('SELECT value FROM settings WHERE key = ?').get('inactivityHours');
        const inactivityHours = parseFloat(inactivityHoursSetting?.value || '6');
        const inactivityMs = inactivityHours * 3600 * 1000;

        let awayTimeMs = 0;
        if (lastSuspendTime) {
          awayTimeMs = now - lastSuspendTime;
          lastSuspendTime = null;
        }

        if (awayTimeMs >= inactivityMs) {
          console.log('Scheduler: Total away time exceeded inactivity threshold, triggering quote');
          triggerRandomQuote();
        } else if (wakeTrigger?.value === '1') {
          console.log('Scheduler: Triggering wake quote');
          triggerRandomQuote();
        }
      } catch (err) {
        console.error('Scheduler: Wake trigger failed:', err);
      }
    };

    powerMonitor.on('suspend', () => {
      lastSuspendTime = Date.now();
    });
    powerMonitor.on('resume', handleWake);
    powerMonitor.on('unlock-screen', handleWake);

    // 3. Inactivity trigger
    setInterval(() => {
      try {
        const idleTime = powerMonitor.getSystemIdleTime();
        const inactivityHoursSetting = db.prepare('SELECT value FROM settings WHERE key = ?').get('inactivityHours');
        const inactivityHours = parseFloat(inactivityHoursSetting?.value || '6');
        const inactivitySeconds = inactivityHours * 3600;

        if (idleTime >= inactivitySeconds) {
          if (!lastIdleState) {
            lastIdleState = true;
            console.log(`Scheduler: System became idle (threshold: ${inactivitySeconds}s), triggering quote`);
            triggerRandomQuote();
          }
        } else {
          if (lastIdleState) {
            lastIdleState = false;
            console.log('Scheduler: System no longer idle');
          }
        }
      } catch (err) {
        console.error('Scheduler: Inactivity check failed:', err);
      }
    }, 10000); // Check more frequently (every 10 seconds)

    // 4. Periodic Triggers (Specific Time & Interval)
    setInterval(() => {
      try {
        checkPeriodicTriggers();
      } catch (err) {
        console.error('Scheduler: Periodic triggers failed:', err);
      }
    }, 60000); // Check every minute
  } catch (err) {
    console.error('Scheduler: Initialization failed:', err);
  }
}

function triggerRandomQuote(userId = null) {
  try {
    let quote;
    if (userId) {
      quote = db.prepare('SELECT * FROM quotes WHERE user_id = ? OR user_id IS NULL ORDER BY RANDOM() LIMIT 1').get(userId);
    } else {
      quote = db.prepare('SELECT * FROM quotes WHERE user_id IS NULL ORDER BY RANDOM() LIMIT 1').get();
    }
    
    if (quote) {
      showOverlay(quote);
      // Log history
      db.prepare('INSERT INTO quote_display_history (quote_id) VALUES (?)').run(quote.id);
    }
  } catch (err) {
    console.error('Scheduler: triggerRandomQuote failed:', err);
  }
}

function checkPeriodicTriggers() {
  try {
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
            triggerRandomQuote(rule.user_id);
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
                triggerRandomQuote(rule.user_id);
              }
            } else {
              // No history, trigger now
              triggerRandomQuote(rule.user_id);
            }
          }
        }
      } catch (e) {
        console.error('Error parsing rule config', e);
      }
    });
  } catch (err) {
    console.error('Scheduler: checkPeriodicTriggers failed:', err);
  }
}
