import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles, Mail, Lock, ArrowLeft, Loader2, User as UserIcon } from "lucide-react";
import { ClientOnly } from "@/lib/store";
import { useAppStore } from "@/lib/electronStore";
import {
  isSupabaseConfigured,
  signInWithPassword,
  signUpWithPassword,
} from "@/lib/supabase";

export const Route = createFileRoute("/auth")({
  component: () => (
    <ClientOnly>
      <AuthPage />
    </ClientOnly>
  ),
});

function AuthPage() {
  const navigate = useNavigate();
  const { user } = useAppStore();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    if (user) navigate({ to: "/explore" });
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!isSupabaseConfigured) {
      setError("Cloud sync is not configured. Please add your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to a .env file.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    const { error: err } =
      mode === "signin"
        ? await signInWithPassword(email, password)
        : await signUpWithPassword(email, password, username);
    setLoading(false);

    if (err) {
      setError(err.message);
      return;
    }
    if (mode === "signup") {
      setInfo("Check your email to confirm your account.");
    } else {
      navigate({ to: "/explore" });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-background">
      <div className="w-full max-w-md">
        <Link
          to="/explore"
          className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.25em] text-muted-foreground hover:text-foreground transition mb-8"
        >
          <ArrowLeft className="h-3 w-3" /> Back to Explore
        </Link>

        <div className="flex items-center gap-2.5 mb-8">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary to-primary-glow grid place-items-center shadow-glow">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <div className="font-serif text-xl leading-none">Muse</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-1">
              {mode === "signin" ? "Welcome back" : "Create your account"}
            </div>
          </div>
        </div>

        <h1 className="font-serif text-3xl mb-2">
          {mode === "signin" ? "Sign in to Muse" : "Join the community"}
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          {mode === "signin"
            ? "Sync your library across devices and discover community quotes."
            : "Create an account to save, sync, and share quotes you love."}
        </p>

        <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 space-y-4">
          {mode === "signup" && (
            <div>
              <label className="text-xs uppercase tracking-widest text-muted-foreground mb-2 block">
                Username
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="CoolMindset"
                  className="w-full bg-background/50 border border-border rounded-lg pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground mb-2 block">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-background/50 border border-border rounded-lg pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground mb-2 block">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="password"
                required
                minLength={6}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-background/50 border border-border rounded-lg pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          {error && (
            <div className="text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          {info && (
            <div className="text-xs text-primary bg-primary/10 border border-primary/30 rounded-lg px-3 py-2">
              {info}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-full py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition shadow-glow"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "signin" ? "Sign in" : "Create account"}
          </button>

          <button
            type="button"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError(null);
              setInfo(null);
            }}
            className="w-full text-xs text-muted-foreground hover:text-foreground transition pt-1"
          >
            {mode === "signin"
              ? "No account yet? Create one"
              : "Already have an account? Sign in"}
          </button>
        </form>

        {!isSupabaseConfigured && (
          <p className="text-[11px] text-muted-foreground mt-4 text-center">
            Cloud sync isn't configured in this build. You can still use Muse locally.
          </p>
        )}
      </div>
    </div>
  );
}
