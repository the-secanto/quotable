import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Clock, Quote as QuoteIcon, Sparkles } from "lucide-react";

import { ClientOnly, useQuotes, useSettings } from "@/lib/store";
import { QuoteOverlay } from "@/components/QuoteOverlay";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

function Dashboard() {
  return (
    <ClientOnly>
      <DashboardInner />
    </ClientOnly>
  );
}

function DashboardInner() {
  const { quotes } = useQuotes();
  const { settings } = useSettings();
  const featured = quotes[0];

  const stats = [
    { label: "Quotes saved", value: quotes.length, icon: QuoteIcon },
    { label: "Threshold", value: `${settings.inactivityHours}h`, icon: Clock },
    { label: "Theme", value: settings.theme, icon: Sparkles },
  ];

  return (
    <div className="px-10 py-12 max-w-6xl mx-auto">
      <header className="mb-10">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-3">
          Dashboard
        </p>
        <h1 className="font-serif text-4xl">Good to see you again.</h1>
        <p className="text-muted-foreground mt-2 max-w-lg">
          Muse waits patiently in the background. When you return after a long break,
          it greets you with what matters.
        </p>
      </header>

      <div className="grid grid-cols-3 gap-4 mb-10">
        {stats.map((s) => (
          <div key={s.label} className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs uppercase tracking-widest">{s.label}</span>
              <s.icon className="h-4 w-4" />
            </div>
            <div className="font-serif text-3xl mt-3 capitalize">{s.value}</div>
          </div>
        ))}
      </div>

      {featured && (
        <div className="relative h-[420px] rounded-2xl overflow-hidden shadow-soft border border-border">
          <QuoteOverlay quote={featured} embedded showAuthor={settings.showAuthor} />
        </div>
      )}

      <div className="mt-10 grid grid-cols-2 gap-4">
        <Link
          to="/quotes"
          className="group glass rounded-2xl p-6 hover:border-primary/40 transition"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-xl">Curate your quotes</h3>
            <ArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition" />
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Add the words that move you. Tag them by mood and moment.
          </p>
        </Link>
        <Link
          to="/appearance"
          className="group glass rounded-2xl p-6 hover:border-primary/40 transition"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-xl">Choose a vibe</h3>
            <ArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition" />
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Dark Focus, Warm Calm, Soft Pastel, or Minimal Light.
          </p>
        </Link>
      </div>
    </div>
  );
}
