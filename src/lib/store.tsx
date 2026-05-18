import { useEffect, useState, type ReactNode } from "react";
import { useAppStore, type Quote, type Settings, type ThemeId } from "./electronStore";

export type { Quote, ThemeId };

export function useQuotes() {
  const { quotes, addQuote, updateQuote, deleteQuote } = useAppStore();
  return {
    quotes,
    addQuote,
    updateQuote,
    deleteQuote,
  };
}

export function useSettings() {
  const { settings, updateSetting } = useAppStore();
  
  // Adapt to the expected interface, ensuring all keys are present
  const adaptedSettings = {
    ...settings,
    theme: settings.theme as ThemeId,
    inactivityHours: parseFloat(settings.inactivityHours || "6"),
    showAuthor: settings.showAuthor !== false,
    ambientSound: false, 
  };

  return { 
    settings: adaptedSettings, 
    update: (patch: any) => {
      Object.entries(patch).forEach(([key, value]) => {
        updateSetting(key, value);
      });
    } 
  };
}

export function applyTheme(theme: ThemeId) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = theme;
}

export function ClientOnly({ children }: { children: ReactNode }) {
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  if (!m) return null;
  return <>{children}</>;
}
