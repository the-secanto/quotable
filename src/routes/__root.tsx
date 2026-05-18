import { Outlet, Link, createRootRoute, HeadContent, Scripts, useRouterState, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Cloud, CloudOff, Loader2, CheckCircle2, Sparkles } from "lucide-react";
import appCss from "../styles.css?url";
import { AppSidebar } from "@/components/AppSidebar";
import { useAppStore } from "@/lib/electronStore";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { applyTheme, useSettings, useQuotes } from "@/lib/store";
import { QuoteOverlay } from "@/components/QuoteOverlay";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-serif text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Muse — Gentle reminders for what matters" },
      {
        name: "description",
        content:
          "Muse shows you a beautiful, calm overlay with the quotes that matter to you, every time you return to your laptop.",
      },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function SyncStatusBar() {
  const { user, syncing, lastSynced } = useAppStore();

  let icon = <CloudOff className="h-3.5 w-3.5" />;
  let label = "Not logged in";
  let tone = "text-muted-foreground";

  const displayName = user?.user_metadata?.username || user?.email;

  if (!isSupabaseConfigured) {
    icon = <CloudOff className="h-3.5 w-3.5" />;
    label = "Offline mode — cloud sync not configured";
    tone = "text-amber-500/80";
  } else if (user && syncing) {
    icon = <Loader2 className="h-3.5 w-3.5 animate-spin" />;
    label = `Syncing as ${displayName}`;
    tone = "text-primary";
  } else if (user) {
    icon = <CheckCircle2 className="h-3.5 w-3.5" />;
    label = `Logged in as ${displayName}${lastSynced ? " · synced" : ""}`;
    tone = "text-primary";
  }

  return (
    <div className="h-9 shrink-0 border-b border-border bg-background/80 backdrop-blur flex items-center justify-between px-5 text-[11px]">
      <div className={`flex items-center gap-1.5 ${tone}`}>
        {icon}
        <span className="tracking-wide">{label}</span>
      </div>
      {!user && isSupabaseConfigured && (
        <Link
          to="/auth"
          className="text-[11px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition"
        >
          Sign in
        </Link>
      )}
    </div>
  );
}

function WebHandoff() {
  const isBrowser = !window.electron;
  const [hasHash, setHasHash] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && (window.location.hash.includes("access_token") || window.location.search.includes("code"))) {
      setHasHash(true);
    }
  }, []);

  if (!isBrowser || !hasHash) return null;

  const handleOpenDesktop = () => {
    // We send the entire hash/search to the desktop app via the custom protocol
    const data = window.location.hash || window.location.search;
    window.location.href = `muse-app://auth-callback${data}`;
    
    // Optional: close the window after a delay
    setTimeout(() => {
      setHasHash(false);
    }, 5000);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-background flex items-center justify-center p-6 text-center animate-fade-in-up">
      <div className="max-w-sm">
        <div className="h-20 w-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-8 shadow-glow animate-float-up">
          <Sparkles className="h-10 w-10 text-primary" />
        </div>
        <h2 className="font-serif text-3xl mb-4">Account Verified</h2>
        <p className="text-muted-foreground text-sm mb-10 leading-relaxed">
          Your email has been successfully confirmed. Click below to return to the Muse desktop application.
        </p>
        <button
          onClick={handleOpenDesktop}
          className="w-full inline-flex items-center justify-center rounded-full bg-primary px-8 py-4 text-sm font-medium text-primary-foreground hover:opacity-90 transition shadow-glow active:scale-95"
        >
          Open Muse App
        </button>
        <div className="mt-8 pt-8 border-t border-border">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-4">
            Having trouble?
          </p>
          <Link
            to="/explore"
            className="text-xs text-primary hover:underline transition"
          >
            Continue in browser instead
          </Link>
        </div>
      </div>
    </div>
  );
}

function GlobalOverlay() {
  const { overlayOpen, setOverlayOpen } = useAppStore();
  const { quotes } = useQuotes();
  const { settings } = useSettings();

  useEffect(() => {
    if (!overlayOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOverlayOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [overlayOpen, setOverlayOpen]);

  if (!overlayOpen) return null;
  const quote = quotes[0] || {
    id: "demo",
    text: "The mind is everything. What you think you become.",
    author: "Buddha",
    category: "Wisdom",
  };

  return (
    <div 
      className="fixed inset-0 z-[100] cursor-pointer"
      onClick={() => setOverlayOpen(false)}
    >
      <QuoteOverlay
        quote={quote}
        showAuthor={settings.showAuthor}
        onDismiss={() => setOverlayOpen(false)}
        onStart={() => setOverlayOpen(false)}
      />
    </div>
  );
}

function RootComponent() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { init, setUser, settings, initialized } = useAppStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (settings.theme) {
      applyTheme(settings.theme as any);
    }
  }, [settings.theme]);

  useEffect(() => {
    init();

    let subscription: any = null;
    if (supabase) {
      supabase.auth.getSession().then(({ data }) => {
        if (data.session?.user) setUser(data.session.user);
      });
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
      });
      subscription = data.subscription;
    }

    if (window.electron && window.electron.onNavigateTo) {
      window.electron.onNavigateTo((path: string) => {
        if (path.startsWith('muse-app://')) {
          // Handle Supabase deep link
          const url = new URL(path.replace('muse-app://', 'https://placeholder.com/'));
          const hash = url.hash;
          if (hash && hash.includes('access_token')) {
            // This is an implicit flow hash
            const params = new URLSearchParams(hash.substring(1));
            const accessToken = params.get('access_token');
            const refreshToken = params.get('refresh_token');
            if (accessToken && refreshToken && supabase) {
              supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              }).then(() => {
                navigate({ to: '/explore' });
              });
            }
          }
        } else {
          navigate({ to: path });
        }
      });
    }

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, [init, navigate, setUser]);

  // Startup Loading Screen
  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-primary-glow grid place-items-center shadow-glow mb-8 animate-pulse">
            <Sparkles className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="font-serif text-4xl mb-3 tracking-tight">Muse</h1>
          <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
            Waking up...
          </p>
          <div className="mt-10 flex gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce delay-100" />
            <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce delay-200" />
            <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce delay-300" />
          </div>
        </div>
      </div>
    );
  }

  // /preview and /auth render fullscreen without chrome
  if (pathname === "/preview" || pathname === "/auth") {
    return (
      <>
        <WebHandoff />
        <Outlet />
        <GlobalOverlay />
      </>
    );
  }

  return (
    <div className="min-h-screen flex w-full bg-background text-foreground">
      <WebHandoff />
      <AppSidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <SyncStatusBar />
        <main className="flex-1 min-w-0 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
      <GlobalOverlay />
    </div>
  );
}
