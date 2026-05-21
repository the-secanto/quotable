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

const themes: { id: ThemeId; name: string; description: string; group: string; swatch: string[] }[] = [
  // Calm (4)
  { id: "dark", name: "Dark Focus", description: "Deep navy. Quiet amber. Late-night clarity.", group: "Calm",
    swatch: ["#1a1f2e", "#e8b86b", "#5a6f9b"] },
  { id: "warm", name: "Warm Calm", description: "Lamp-lit room. Slow evenings. Gentle warmth.", group: "Calm",
    swatch: ["#2a1f15", "#d99964", "#7a5b3f"] },
  { id: "pastel", name: "Soft Pastel", description: "Morning haze. Pale sky. Soft starts.", group: "Calm",
    swatch: ["#f7eaf3", "#c285c7", "#aedce6"] },
  { id: "sage", name: "Sage Mist", description: "Quiet forest. Cool moss. Steady breath.", group: "Calm",
    swatch: ["#2b3a32", "#a8c8b0", "#6b8a78"] },
  // Retro / Funky (2)
  { id: "synthwave", name: "Synthwave", description: "Neon pink. Cyber blue. Midnight arcade.", group: "Retro",
    swatch: ["#1a0d2e", "#ff4fcb", "#3ad6ff"] },
  { id: "sunset", name: "Sunset Drive", description: "Hot orange. Magenta sky. Warm asphalt.", group: "Retro",
    swatch: ["#2a1410", "#ff8a3d", "#e64976"] },
  // Minimal / Coding (2)
  { id: "light", name: "Minimal Light", description: "Pure white. Sharp ink. Nothing extra.", group: "Minimal",
    swatch: ["#ffffff", "#1a1a1f", "#9a9aa2"] },
  { id: "mono", name: "Mono Code", description: "Terminal black. Phosphor green. Pure focus.", group: "Minimal",
    swatch: ["#111111", "#5cf28a", "#3a3a3a"] },
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
          min="0" 
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
