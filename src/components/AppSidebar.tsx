import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Quote as QuoteIcon, Palette, Settings as SettingsIcon, Sparkles, User, Cloud, LogIn, AlertCircle, Globe as GlobeIcon } from "lucide-react";
import { useAppStore } from "@/lib/electronStore";
import { useState } from "react";
import { signIn, signOut, isSupabaseConfigured } from "@/lib/supabase";

const items = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/quotes", label: "Library", icon: QuoteIcon },
  { to: "/explore", label: "Explore", icon: GlobeIcon },
  { to: "/appearance", label: "Appearance", icon: Palette },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, triggerOverlay } = useAppStore();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await signIn(email);
    setLoading(false);
    alert("Check your email for the login link!");
  };

  const handlePreviewOverlay = (e: React.MouseEvent) => {
    e.preventDefault();
    triggerOverlay();
  };

  return (
    <aside className="w-60 shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground flex flex-col">
      <div className="px-6 py-7 flex items-center gap-2.5">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary-glow grid place-items-center shadow-glow">
          <Sparkles className="h-4 w-4 text-primary-foreground" />
        </div>
        <div>
          <div className="font-serif text-lg leading-none">Muse</div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mt-1">
            gentle reminders
          </div>
        </div>
      </div>

      <nav className="px-3 py-2 flex-1 space-y-0.5">
        {items.map((it) => {
          const active = pathname === it.to;
          const Icon = it.icon;
          return (
            <Link
              key={it.to}
              to={it.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
              }`}
            >
              <Icon className="h-4 w-4" />
              {it.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 m-3 mt-0 rounded-xl glass">
        {!isSupabaseConfigured ? (
          <div className="text-[10px] text-muted-foreground leading-relaxed">
            <div className="flex items-center gap-1.5 text-amber-500/80 mb-1 font-medium uppercase tracking-wider">
              <AlertCircle className="h-3 w-3" /> Offline Mode
            </div>
            Cloud sync is disabled. Add your Supabase keys to <code className="bg-background/50 px-1 rounded">.env</code> to enable.
          </div>
        ) : user ? (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="h-3 w-3 text-primary" />
              </div>
              <div className="text-xs font-medium truncate flex-1">
                {user.user_metadata?.username || user.email}
              </div>
            </div>
            <button 
              onClick={() => signOut()}
              className="text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign out
            </button>
          </div>
        ) : (
          <div>
            <div className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
              <Cloud className="h-3 w-3" /> Sync your library
            </div>
            <Link
              to="/auth"
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-full py-2 text-xs font-medium hover:opacity-90 transition shadow-glow"
            >
              <LogIn className="h-3 w-3" /> Sign in or Join
            </Link>
            <p className="text-[10px] text-muted-foreground mt-3 text-center leading-tight">
              Create an account to backup and sync your quotes across devices.
            </p>
          </div>
        )}
      </div>

      <div className="p-4 m-3 mt-0 rounded-xl glass">
        <div className="text-xs text-muted-foreground mb-2">Preview</div>
        <a
          href="#"
          onClick={handlePreviewOverlay}
          className="text-sm font-medium hover:text-primary transition-colors"
        >
          See the overlay →
        </a>
      </div>
    </aside>
  );
}
