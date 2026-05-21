import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from './supabase';

declare global {
  interface Window {
    electron?: any;
  }
}

export type ThemeId =
  | 'dark'
  | 'warm'
  | 'pastel'
  | 'light'
  | 'sage'
  | 'synthwave'
  | 'sunset'
  | 'mono';

export type Quote = {
  id: string;
  text: string;
  author: string;
  category: string;
  user_id?: string;
  is_public?: boolean;
  local_only?: boolean;
  synced?: boolean;
  likes_count?: number;
  updated_at?: string;
};

export type QuoteRule = {
  id: string;
  trigger_type: 'startup' | 'wake_from_sleep' | 'inactivity' | 'interval' | 'specific_time';
  trigger_config_json: string;
  enabled: boolean;
  updated_at?: string;
};

export type Settings = {
  theme: string;
  opacity: string;
  fontSize: string;
  overlayDuration: string;
  inactivityHours: string;
  startupTrigger: string;
  wakeTrigger: string;
  launchAtStartup: string;
  minimizeToTray: string;
  showAuthor?: boolean;
  updated_at?: string;
};

const STORAGE_KEY = 'muse_state_v1'; // figure out what this is - change this

function loadFromStorage() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveToStorage(state: { quotes: Quote[]; rules: QuoteRule[]; settings: Settings }) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

interface AppState {
  quotes: Quote[];
  rules: QuoteRule[];
  settings: Settings;
  initialized: boolean;
  user: any | null;
  syncing: boolean;
  lastSynced: Date | null;
  overlayOpen: boolean;

  init: () => Promise<void>;
  setUser: (user: any) => void;
  setOverlayOpen: (open: boolean) => void;

  addQuote: (quote: Omit<Quote, 'id'>) => Promise<void>;
  updateQuote: (id: string, patch: Partial<Quote>) => Promise<void>;
  deleteQuote: (id: string) => Promise<void>;

  addRule: (rule: Omit<QuoteRule, 'id'>) => Promise<void>;
  updateRule: (id: string, patch: Partial<QuoteRule>) => Promise<void>;
  deleteRule: (id: string) => Promise<void>;

  updateSetting: (key: string, value: any) => Promise<void>;
  triggerOverlay: () => Promise<void>;

  sync: () => Promise<void>;
}

/**
 * APP DEFAULTS - Change these to test different initial states
 */
export const APP_DEFAULTS = {
  SETTINGS: {
    theme: 'dark' as ThemeId,
    opacity: '0.0', // Changed to 0% as requested
    fontSize: '48',
    overlayDuration: '10',
    inactivityHours: '6',
    startupTrigger: '1',
    wakeTrigger: '1',
    launchAtStartup: '0',
    minimizeToTray: '1',
    showAuthor: true,
  },
  QUOTES: [
    {
      id: 'default-1',
      text: "The mind is everything. What you think you become.",
      author: "Buddha",
      category: "Wisdom",
      updated_at: new Date().toISOString(),
    },
    {
      id: 'default-2',
      text: "Discipline equals freedom.",
      author: "Jocko Willink",
      category: "Discipline",
      updated_at: new Date().toISOString(),
    }
  ]
};

const defaultSettings: Settings = {
  theme: APP_DEFAULTS.SETTINGS.theme,
  opacity: APP_DEFAULTS.SETTINGS.opacity,
  fontSize: APP_DEFAULTS.SETTINGS.fontSize,
  overlayDuration: APP_DEFAULTS.SETTINGS.overlayDuration,
  inactivityHours: APP_DEFAULTS.SETTINGS.inactivityHours,
  startupTrigger: APP_DEFAULTS.SETTINGS.startupTrigger,
  wakeTrigger: APP_DEFAULTS.SETTINGS.wakeTrigger,
  launchAtStartup: APP_DEFAULTS.SETTINGS.launchAtStartup,
  minimizeToTray: APP_DEFAULTS.SETTINGS.minimizeToTray,
  showAuthor: APP_DEFAULTS.SETTINGS.showAuthor,
};

export const useAppStore = create<AppState>((set, get) => ({
  quotes: [],
  rules: [],
  settings: defaultSettings,
  initialized: false,
  user: null,
  syncing: false,
  lastSynced: null,
  overlayOpen: false,

  setUser: (user) => {
    set({ user });
    if (user) {
      get().sync();
      // Re-initialize with user-specific data
      get().init();
    }
  },

  setOverlayOpen: (open) => set({ overlayOpen: open }),

  init: async () => {
    if (typeof window === 'undefined') return;

    // Set a safety timeout to ensure the app eventually shows something
    const timeout = setTimeout(() => {
      if (!get().initialized) {
        console.warn('Initialization timeout reached, forcing state to initialized');
        set({ initialized: true });
      }
    }, 5000);

    const { user } = get();
    const userId = user?.id || null;

    // Electron path
    if (window.electron && window.electron.getQuotes) {
      try {
        console.log('Initializing app state from Electron...');
        const [quotes, settings, rules] = await Promise.all([
          window.electron.getQuotes(userId),
          window.electron.getSettings(),
          window.electron.getRules(userId),
        ]);
        
        const fullSettings = {
          ...get().settings,
          ...settings,
          showAuthor:
            settings?.showAuthor === '1' ||
            settings?.showAuthor === true ||
            settings?.showAuthor === undefined,
        };
        
        set({ quotes: quotes || [], settings: fullSettings, rules: rules || [], initialized: true });
        clearTimeout(timeout);

        window.electron.onSettingUpdated?.(
          ({ key, value }: { key: string; value: any }) => {
            set({ settings: { ...get().settings, [key]: value.toString() } });
          }
        );
      } catch (e) {
        console.error('Electron init failed, falling back to local', e);
        set({ initialized: true });
        clearTimeout(timeout);
      }
    } else {
      // Browser fallback: localStorage
      console.log('Initializing app state from LocalStorage...');
      const stored = loadFromStorage();
      if (stored) {
        set({
          quotes: stored.quotes || [],
          rules: stored.rules || [],
          settings: { ...defaultSettings, ...(stored.settings || {}) },
          initialized: true,
        });
      } else {
        // Seed with example quotes from defaults
        const seed = APP_DEFAULTS.QUOTES;
        set({ quotes: seed, initialized: true });
        saveToStorage({ quotes: seed, rules: [], settings: get().settings });
      }
      clearTimeout(timeout);
    }

    setInterval(() => {
      get().sync();
    }, 1000 * 60 * 5);
  },

  addQuote: async (quote) => {
    const id = crypto.randomUUID();
    const user_id = get().user?.id;
    const newQuote = { ...quote, id, user_id, updated_at: new Date().toISOString() };
    await window.electron?.addQuote?.(newQuote);
    const next = [newQuote, ...get().quotes];
    set({ quotes: next });
    saveToStorage({ quotes: next, rules: get().rules, settings: get().settings });
    get().sync();
  },

  updateQuote: async (id, patch) => {
    const updated_at = new Date().toISOString();
    await window.electron?.updateQuote?.(id, { ...patch, updated_at });
    const next = get().quotes.map((q) => (q.id === id ? { ...q, ...patch, updated_at } : q));
    set({ quotes: next });
    saveToStorage({ quotes: next, rules: get().rules, settings: get().settings });
    get().sync();
  },

  deleteQuote: async (id) => {
    await window.electron?.deleteQuote?.(id);
    const next = get().quotes.filter((q) => q.id !== id);
    set({ quotes: next });
    saveToStorage({ quotes: next, rules: get().rules, settings: get().settings });
    if (isSupabaseConfigured && get().user) {
      await supabase!.from('quotes').delete().eq('id', id);
    }
  },

  addRule: async (rule) => {
    const id = crypto.randomUUID();
    const user_id = get().user?.id;
    const updated_at = new Date().toISOString();
    const newRule = { ...rule, id, user_id, updated_at };
    await window.electron?.addRule?.(newRule);
    const next = [...get().rules, newRule];
    set({ rules: next });
    saveToStorage({ quotes: get().quotes, rules: next, settings: get().settings });
    get().sync();
  },

  updateRule: async (id, patch) => {
    const updated_at = new Date().toISOString();
    await window.electron?.updateRule?.(id, { ...patch, updated_at });
    const next = get().rules.map((r) => (r.id === id ? { ...r, ...patch, updated_at } : r));
    set({ rules: next });
    saveToStorage({ quotes: get().quotes, rules: next, settings: get().settings });
    get().sync();
  },

  deleteRule: async (id) => {
    await window.electron?.deleteRule?.(id);
    const next = get().rules.filter((r) => r.id !== id);
    set({ rules: next });
    saveToStorage({ quotes: get().quotes, rules: next, settings: get().settings });
    if (isSupabaseConfigured && get().user) {
      await supabase!.from('quote_rules').delete().eq('id', id);
    }
  },

  updateSetting: async (key, value) => {
    await window.electron?.updateSetting?.(key, value);
    const nextSettings = {
      ...get().settings,
      [key]: typeof value === 'boolean' ? value : value.toString(),
      updated_at: new Date().toISOString(),
    } as Settings;
    set({ settings: nextSettings });
    saveToStorage({ quotes: get().quotes, rules: get().rules, settings: nextSettings });
    get().sync();
  },

  triggerOverlay: async () => {
    const userId = get().user?.id || null;
    if (window.electron?.triggerOverlay) {
      await window.electron.triggerOverlay(userId);
    } else {
      set({ overlayOpen: true });
    }
  },

  sync: async () => {
    const { user, syncing } = get();
    if (syncing || !user || !isSupabaseConfigured || !navigator.onLine) return;

    set({ syncing: true });
    try {
      const { quotes: localQuotes } = get();
      const { data: remoteQuotes, error: qError } = await supabase!
        .from('quotes')
        .select('*')
        .eq('user_id', user.id);

      if (!qError && remoteQuotes) {
        for (const remote of remoteQuotes) {
          const local = localQuotes.find((l) => l.id === remote.id);
          if (!local || new Date(remote.updated_at) > new Date(local.updated_at || 0)) {
            await window.electron?.addQuote?.({ ...remote, synced: true });
          } else if (new Date(local.updated_at || 0) > new Date(remote.updated_at)) {
            await supabase!.from('quotes').upsert([{ ...local, user_id: user.id, synced: true }]);
          }
        }
        for (const local of localQuotes) {
          if (!remoteQuotes.find((r) => r.id === local.id)) {
            await supabase!.from('quotes').upsert([{ ...local, user_id: user.id, synced: true }]);
          }
        }
      }

      set({ lastSynced: new Date() });
    } catch (e) {
      console.error('Sync failed', e);
    } finally {
      set({ syncing: false });
    }
  },
}));
