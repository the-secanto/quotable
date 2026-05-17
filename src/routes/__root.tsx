import { Outlet, Link, createRootRoute, HeadContent, Scripts, useRouterState, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import appCss from "../styles.css?url";
import { AppSidebar } from "@/components/AppSidebar";
import { useAppStore } from "@/lib/electronStore";
import { supabase } from "@/lib/supabase";
import { applyTheme } from "@/lib/store";

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

function RootComponent() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { init, setUser, settings } = useAppStore();
  const navigate = useNavigate();

  // Apply theme whenever it changes
  useEffect(() => {
    if (settings.theme) {
      applyTheme(settings.theme as any);
    }
  }, [settings.theme]);

  useEffect(() => {
    init();
    
    let subscription: any = null;
    if (supabase) {
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
      });
      subscription = data.subscription;
    }

    // @ts-ignore
    if (window.electron && window.electron.onNavigateTo) {
      // @ts-ignore
      window.electron.onNavigateTo((path: string) => {
        navigate({ to: path });
      });
    }

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, [init, navigate, setUser]);

  // The /preview route renders fullscreen without chrome
  if (pathname === "/preview") return <Outlet />;
  return (
    <div className="min-h-screen flex w-full bg-background text-foreground">
      <AppSidebar />
      <main className="flex-1 min-w-0 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}
