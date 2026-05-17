import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from './supabase';

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

interface AppState {
  quotes: Quote[];
  rules: QuoteRule[];
  settings: Settings;
  initialized: boolean;
  user: any | null;
  syncing: boolean;
  lastSynced: Date | null;
  
  init: () => Promise<void>;
  setUser: (user: any) => void;
  
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

export const useAppStore = create<AppState>((set, get) => ({
  quotes: [],
  rules: [],
  settings: {
    theme: 'dark',
    opacity: '0.9',
    fontSize: '24',
    overlayDuration: '10',
    inactivityHours: '6',
    startupTrigger: '1',
    wakeTrigger: '1',
    launchAtStartup: '0',
    minimizeToTray: '1',
    showAuthor: true,
  },
  initialized: false,
  user: null,
  syncing: false,
  lastSynced: null,

  setUser: (user) => {
    set({ user });
    if (user) get().sync();
  },

  init: async () => {
    if (typeof window === 'undefined' || !window.electron) return;
    
    const [quotes, settings, rules] = await Promise.all([
      window.electron.getQuotes(),
      window.electron.getSettings(),
      window.electron.getRules()
    ]);
    
    const fullSettings = { 
      ...get().settings, 
      ...settings,
      showAuthor: settings.showAuthor === '1' || settings.showAuthor === true || settings.showAuthor === undefined
    };

    set({ quotes, settings: fullSettings, rules, initialized: true });

    // Listen for broadcasted setting updates
    window.electron.onSettingUpdated(({ key, value }: { key: string, value: any }) => {
      set({
        settings: { ...get().settings, [key]: value.toString() }
      });
    });

    // Start background sync every 5 minutes if online and logged in
    setInterval(() => {
      get().sync();
    }, 1000 * 60 * 5);
  },

  addQuote: async (quote) => {
    const id = crypto.randomUUID();
    const newQuote = { ...quote, id, updated_at: new Date().toISOString() };
    await window.electron.addQuote(newQuote);
    set({ quotes: [newQuote, ...get().quotes] });
    get().sync(); // Attempt sync
  },

  updateQuote: async (id, patch) => {
    const updated_at = new Date().toISOString();
    await window.electron.updateQuote(id, { ...patch, updated_at });
    set({
      quotes: get().quotes.map(q => q.id === id ? { ...q, ...patch, updated_at } : q)
    });
    get().sync(); // Attempt sync
  },

  deleteQuote: async (id) => {
    await window.electron.deleteQuote(id);
    set({
      quotes: get().quotes.filter(q => q.id !== id)
    });
    // For sync deletion, we might need a tombstone table or just delete from remote
    if (isSupabaseConfigured && get().user) {
      await supabase!.from('quotes').delete().eq('id', id);
    }
  },

  addRule: async (rule) => {
    const id = crypto.randomUUID();
    const updated_at = new Date().toISOString();
    const newRule = { ...rule, id, updated_at };
    await window.electron.addRule(newRule);
    set({ rules: [...get().rules, newRule] });
    get().sync();
  },

  updateRule: async (id, patch) => {
    const updated_at = new Date().toISOString();
    await window.electron.updateRule(id, { ...patch, updated_at });
    set({
      rules: get().rules.map(r => r.id === id ? { ...r, ...patch, updated_at } : r)
    });
    get().sync();
  },

  deleteRule: async (id) => {
    await window.electron.deleteRule(id);
    set({
      rules: get().rules.filter(r => r.id !== id)
    });
    if (isSupabaseConfigured && get().user) {
      await supabase!.from('quote_rules').delete().eq('id', id);
    }
  },

  updateSetting: async (key, value) => {
    await window.electron.updateSetting(key, value);
    set({
      settings: { ...get().settings, [key]: value.toString(), updated_at: new Date().toISOString() }
    });
    get().sync();
  },

  triggerOverlay: async () => {
    await window.electron.triggerOverlay();
  },

  sync: async () => {
    const { user, syncing } = get();
    if (syncing || !user || !isSupabaseConfigured || !navigator.onLine) return;

    set({ syncing: true });
    console.log("Starting sync...");

    try {
      // 1. Sync Quotes
      const { quotes: localQuotes } = get();
      
      // Pull remote quotes
      const { data: remoteQuotes, error: qError } = await supabase!
        .from('quotes')
        .select('*')
        .eq('user_id', user.id);

      if (!qError && remoteQuotes) {
        for (const remote of remoteQuotes) {
          const local = localQuotes.find(l => l.id === remote.id);
          if (!local || new Date(remote.updated_at) > new Date(local.updated_at || 0)) {
            // Remote is newer or missing locally
            await window.electron.addQuote({ ...remote, synced: true });
          } else if (new Date(local.updated_at || 0) > new Date(remote.updated_at)) {
            // Local is newer, push to remote
            await supabase!.from('quotes').upsert([{ ...local, user_id: user.id, synced: true }]);
          }
        }
        
        // Push local-only quotes or newer local quotes not in remote
        for (const local of localQuotes) {
          if (!remoteQuotes.find(r => r.id === local.id)) {
             await supabase!.from('quotes').upsert([{ ...local, user_id: user.id, synced: true }]);
          }
        }
      }

      // 2. Sync Rules
      const { rules: localRules } = get();
      const { data: remoteRules } = await supabase!
        .from('quote_rules')
        .select('*')
        .eq('user_id', user.id);

      if (remoteRules) {
        for (const remote of remoteRules) {
          const local = localRules.find(l => l.id === remote.id);
          if (!local || new Date(remote.updated_at) > new Date(local.updated_at || 0)) {
            await window.electron.addRule(remote);
          } else if (new Date(local.updated_at || 0) > new Date(remote.updated_at)) {
            await supabase!.from('quote_rules').upsert([{ ...local, user_id: user.id }]);
          }
        }
        for (const local of localRules) {
          if (!remoteRules.find(r => r.id === local.id)) {
            await supabase!.from('quote_rules').upsert([{ ...local, user_id: user.id }]);
          }
        }
      }

      set({ lastSynced: new Date() });
      
      // Refresh local state after sync
      const [newQuotes, newRules] = await Promise.all([
        window.electron.getQuotes(),
        window.electron.getRules()
      ]);
      set({ quotes: newQuotes, rules: newRules });

    } catch (e) {
      console.error("Sync failed", e);
    } finally {
      set({ syncing: false });
    }
  }
}));
