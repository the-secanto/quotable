import { createFileRoute } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { ClientOnly, useSettings, type ThemeId } from "@/lib/store";

export const Route = createFileRoute("/appearance")({
  component: () => (
    <ClientOnly>
      <AppearancePage />
    </ClientOnly>
  ),
});

const themes: { id: ThemeId; name: string; description: string; swatch: string[] }[] = [
  {
    id: "dark",
    name: "Dark Focus",
    description: "Deep navy. Quiet amber. Late-night clarity.",
    swatch: ["#1a1f2e", "#e8b86b", "#5a6f9b"],
  },
  {
    id: "warm",
    name: "Warm Calm",
    description: "Lamp-lit room. Slow evenings. Gentle warmth.",
    swatch: ["#2a1f15", "#d99964", "#7a5b3f"],
  },
  {
    id: "pastel",
    name: "Soft Pastel",
    description: "Morning haze. Pale sky. Soft starts.",
    swatch: ["#f7eaf3", "#c285c7", "#aedce6"],
  },
  {
    id: "light",
    name: "Minimal Light",
    description: "Pure white. Sharp ink. Nothing extra.",
    swatch: ["#ffffff", "#1a1a1f", "#9a9aa2"],
  },
];

function AppearancePage() {
  const { settings, update } = useSettings();
  return (
    <div className="px-10 py-12 max-w-5xl mx-auto">
      <header className="mb-10">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-3">
          Appearance
        </p>
        <h1 className="font-serif text-4xl">Choose your vibe</h1>
        <p className="text-muted-foreground mt-2">
          Themes change colors, typography weight, and overlay opacity.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-4 mb-8">
        {themes.map((t) => {
          const active = settings.theme === t.id;
          return (
            <button
              key={t.id}
              onClick={() => update({ theme: t.id })}
              className={`text-left glass rounded-2xl p-6 transition relative ${
                active ? "ring-2 ring-primary border-primary/50" : "hover:border-primary/30"
              }`}
            >
              <div className="flex items-center gap-2 mb-4">
                {t.swatch.map((c, i) => (
                  <div
                    key={i}
                    className="h-7 w-7 rounded-full border border-border"
                    style={{ backgroundColor: c }}
                  />
                ))}
                {active && (
                  <span className="ml-auto inline-flex items-center gap-1 text-xs text-primary">
                    <Check className="h-3.5 w-3.5" /> Active
                  </span>
                )}
              </div>
              <h3 className="font-serif text-xl">{t.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">{t.description}</p>
            </button>
          );
        })}
      </div>

      <section className="glass rounded-2xl p-6 mb-4">
        <h2 className="font-serif text-xl mb-1">Overlay Opacity</h2>
        <p className="text-sm text-muted-foreground mb-5">
          Adjust how transparent the quote overlay appears.
        </p>
        <input 
          type="range" 
          min="0.1" 
          max="1" 
          step="0.05" 
          // @ts-ignore
          value={settings.opacity || "0.9"} 
          // @ts-ignore
          onChange={(e) => update({ opacity: e.target.value })}
          className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>10%</span>
          {/* @ts-ignore */}
          <span>{Math.round(parseFloat(settings.opacity || "0.9") * 100)}%</span>
          <span>100%</span>
        </div>
      </section>

      <section className="glass rounded-2xl p-6">
        <h2 className="font-serif text-xl mb-1">Font Size</h2>
        <p className="text-sm text-muted-foreground mb-5">
          Adjust the size of the quote text in the overlay.
        </p>
        <input 
          type="range" 
          min="16" 
          max="72" 
          step="2" 
          // @ts-ignore
          value={settings.fontSize || "32"} 
          // @ts-ignore
          onChange={(e) => update({ fontSize: e.target.value })}
          className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>16px</span>
          {/* @ts-ignore */}
          <span>{settings.fontSize || "32"}px</span>
          <span>72px</span>
        </div>
      </section>
    </div>
  );
}
