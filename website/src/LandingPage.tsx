import { Apple, Download, Monitor, Terminal, Quote as QuoteIcon, Clock, Palette, Sparkles, Cloud, ArrowRight } from "lucide-react";

const DOWNLOAD_BASE = "https://github.com/your-org/Quotable/releases/latest/download";

const downloads = [
  { os: "macOS", icon: Apple, file: "Quotable.dmg", note: "Universal · Apple Silicon & Intel" },
  { os: "Windows", icon: Monitor, file: "Quotable-Setup.exe", note: "Windows 10 & 11 · x64" },
  { os: "Linux", icon: Terminal, file: "Quotable.AppImage", note: "AppImage · x86_64" },
];

const features = [
  {
    icon: QuoteIcon,
    title: "Your words, your way",
    body: "Curate a private library of quotes, anything that moves you.",
  },
  {
    icon: Clock,
    title: "Perfectly timed pauses",
    body: "Quotable waits patiently. After inactivity, on wake, or on a schedule, it appears.",
  },
  {
    icon: Palette,
    title: "Calming themes",
    body: "From Dark Focus to Synthwave to Mono Code. Adjust opacity so your desktop quietly shows through.",
  },
  {
    icon: Cloud,
    title: "Syncs across devices",
    body: "Sign in to keep your library in sync between your Mac, PC, and Linux machine. Or stay fully offline.",
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#09090b] text-[#fafafa] font-sans">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-[#27272a] bg-[#09090b]/70 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#7c3aed] to-[#a78bfa] shadow-[0_0_20px_rgba(124,58,237,0.3)]" />
            <span className="font-serif text-xl">Quotable</span>
          </a>
          <nav className="hidden md:flex items-center gap-8 text-sm text-[#a1a1aa]">
            <a href="#features" className="hover:text-[#fafafa] transition">Features</a>
            <a href="#themes" className="hover:text-[#fafafa] transition">Themes</a>
            <a href="#download" className="hover:text-[#fafafa] transition">Download</a>
          </nav>
          <a
            href="#download"
            className="inline-flex items-center gap-1.5 rounded-full bg-[#7c3aed] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition"
          >
            <Download className="h-3.5 w-3.5" /> Download
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 pt-20 pb-16 md:pt-28 md:pb-24 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-[#a1a1aa] mb-5">
            Calm tech for your desk
          </p>
          <h1 className="font-serif text-5xl md:text-7xl leading-[1.05] text-balance">
            A gentle pause,<br />
            <span className="italic text-[#7c3aed]">when you need it most.</span>
          </h1>
          <p className="mt-6 text-lg text-[#a1a1aa] max-w-2xl mx-auto">
            Quotable waits in the background of your laptop. When you return after a long break,
            it greets you with a beautiful, fullscreen quote then quietly steps aside.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#download"
              className="inline-flex items-center gap-2 rounded-full bg-[#7c3aed] px-6 py-3 text-sm font-medium text-white hover:opacity-90 transition shadow-[0_0_20px_rgba(124,58,237,0.3)]"
            >
              <Download className="h-4 w-4" /> Download for free
            </a>
            <a
              href="#features"
              className="inline-flex items-center gap-2 rounded-full border border-[#27272a] px-6 py-3 text-sm font-medium hover:bg-white/5 transition"
            >
              Learn more <ArrowRight className="h-4 w-4" />
            </a>
          </div>
          <p className="mt-4 text-xs text-[#a1a1aa]">Free · Open source · macOS · Windows · Linux</p>
        </div>

        <div className="max-w-5xl mx-auto px-6 pb-20">
          <div className="rounded-2xl overflow-hidden border border-[#27272a] shadow-xl bg-white/5 aspect-video flex items-center justify-center">
            <div className="text-center p-8">
               <p className="text-[#a1a1aa] mb-2 font-serif italic text-xl">Overlay Preview</p>
               <p className="text-[#a1a1aa]/60 text-sm">Replace this with your Quotable-hero.jpg screenshot</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 border-t border-[#27272a]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-2xl mb-5">
            <p className="text-xs uppercase tracking-[0.3em] text-[#a1a1aa] mb-3">Features</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {features.map((f) => (
              <div key={f.title} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-7">
                <div className="h-10 w-10 rounded-xl bg-[#7c3aed]/10 text-[#7c3aed] flex items-center justify-center mb-4">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-serif text-2xl mb-2">{f.title}</h3>
                <p className="text-[#a1a1aa] leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard screenshot */}
      <section className="py-24 border-t border-[#27272a]">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[#a1a1aa] mb-3">The dashboard</p>
            <h2 className="font-serif text-4xl mb-4">A quiet place to curate.</h2>
            <p className="text-[#a1a1aa] leading-relaxed">
              Add quotes one at a time, or import a collection. See your library at a glance,
              and preview any theme in a single click.
            </p>
          </div>
          <div className="rounded-2xl overflow-hidden border border-[#27272a] shadow-xl bg-white/5 aspect-square flex items-center justify-center">
            <div className="text-center p-8">
               <p className="text-[#a1a1aa] mb-2 font-serif italic text-xl">Dashboard Preview</p>
               <p className="text-[#a1a1aa]/60 text-sm">Replace this with your Quotable-dashboard.jpg screenshot</p>
            </div>
          </div>
        </div>
      </section>

      {/* Themes */}
      <section id="themes" className="py-24 border-t border-[#27272a]">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <div className="rounded-2xl overflow-hidden border border-[#27272a] shadow-xl bg-white/5 aspect-square flex items-center justify-center md:order-1 order-2">
            <div className="text-center p-8">
               <p className="text-[#a1a1aa] mb-2 font-serif italic text-xl">Themes Preview</p>
               <p className="text-[#a1a1aa]/60 text-sm">Replace this with your Quotable-themes.jpg screenshot</p>
            </div>
          </div>
          <div className="md:order-2 order-1">
            <p className="text-xs uppercase tracking-[0.3em] text-[#a1a1aa] mb-3">Themes</p>
            <h2 className="font-serif text-4xl mb-4">Eight moods.</h2>
            <p className="text-[#a1a1aa] leading-relaxed mb-6">
              Dark Focus, Warm Calm, Soft Pastel, Minimal Light, Sage Mist, Synthwave,
              Sunset Drive, and Mono Code. Adjust opacity to let your desktop softly peek through.
            </p>
            <div className="flex flex-wrap gap-2">
              {["dark","warm","pastel","light","sage","synthwave","sunset","mono"].map((t) => (
                <span key={t} className="px-3 py-1 rounded-full bg-[#27272a] text-[#fafafa] text-xs capitalize">{t}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Download */}
      <section id="download" className="py-24 border-t border-[#27272a]">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <Sparkles className="h-6 w-6 text-[#7c3aed] mx-auto mb-4" />
          <h2 className="font-serif text-4xl md:text-5xl mb-3">Download Quotable</h2>
          <p className="text-[#a1a1aa] mb-12 max-w-xl mx-auto">
            Pick your platform. Quotable is free and works offline — sign in only if you want sync.
          </p>
          <div className="grid md:grid-cols-3 gap-4 text-left">
            {downloads.map((d) => (
              <a
                key={d.os}
                href={`${DOWNLOAD_BASE}/${d.file}`}
                className="group bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-7 hover:border-[#7c3aed]/50 transition"
              >
                <div className="flex items-center justify-between mb-4">
                  <d.icon className="h-7 w-7" />
                  <Download className="h-4 w-4 text-[#a1a1aa] group-hover:text-[#7c3aed] transition" />
                </div>
                <div className="font-serif text-2xl mb-1">Download for {d.os}</div>
                <p className="text-xs text-[#a1a1aa]">{d.note}</p>
                <p className="mt-4 text-xs text-[#7c3aed] font-medium">{d.file}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#27272a] py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-wrap items-center justify-between gap-4 text-sm text-[#a1a1aa]">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-gradient-to-br from-[#7c3aed] to-[#a78bfa]" />
            <span className="font-serif text-base text-[#fafafa]">Quotable</span>
            <span>· Calm tech for what matters.</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#features" className="hover:text-[#fafafa]">Features</a>
            <a href="#download" className="hover:text-[#fafafa]">Download</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
