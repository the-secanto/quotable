import { useEffect, useState } from "react";
import type { Quote } from "@/lib/store";
import { useAppStore } from "@/lib/electronStore";

type Props = {
  quote: Quote;
  onDismiss?: () => void;
  onStart?: () => void;
  showAuthor?: boolean;
  embedded?: boolean;
};

export function QuoteOverlay({
  quote,
  onDismiss,
  onStart,
  showAuthor = true,
  embedded,
}: Props) {
  const [key, setKey] = useState(0);
  const { settings } = useAppStore();
  
  useEffect(() => {
    setKey((k) => k + 1);
  }, [quote.id]);

  // SIMPLE REVERSED LOGIC: 
  // User slider at 0% (0.0)   -> displayOpacity 1.0 (100% Solid)
  // User slider at 100% (1.0) -> displayOpacity 0.0 (0% Opaque / 100% Transparent)
  const inputOpacity = parseFloat(settings.opacity || "0.0");
  const displayOpacity = 1 - (inputOpacity * 0.6);; 

  
  const fontSize = settings.fontSize || "48";

  return (
    <div
      className={`${embedded ? "absolute" : "fixed"} inset-0 overflow-hidden ${embedded ? "rounded-2xl" : ""} cursor-pointer flex items-center justify-center`}
      onClick={onDismiss}
      style={{ transform: 'translateZ(0)' }}
    >
      {/* 
          Background color layer - MATCHES THEME ACCURATELY 
          Uses var(--background) which is set by applyTheme()
      */}
      {/* 
          Aggressive Layered Blur - More pronounced frosted glass effect
      */}
      <div
        className="absolute inset-0 transition-all duration-500"
        style={{ 
          backgroundColor: `color-mix(in oklab, var(--background) ${displayOpacity * 100}%, transparent)`,
          transform: 'translateZ(0)',
         // backdropFilter dosent work here
        }}
      />
      <div
        className="absolute inset-0"
        style={{ 
          backgroundColor: `color-mix(in oklab, var(--background) ${displayOpacity * 30}%, transparent)`
        }}
      />
      
      {/* 
          Optimized Gradient Layer 
          Replacing expensive Blur filter with a simple gradient for 300+ FPS 
      */}
      <div
        className="absolute inset-0"
        // gradient 
        style={{
          background: "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.3) 100%)",
          opacity: 1,
          transform: 'translateZ(0)'
        }}
        aria-hidden
      />

      {/* aurora effect - extremely low opacity and NO SHIMMER to save memory/render time */}
      {/* basically the shiny blue effect (middle top down) thats all */}
      {!embedded && (
        <div 
          className="absolute inset-0 bg-aurora" 
          style={{ 
            opacity: 0.4,
            transform: 'translateZ(0)'
          }}
          aria-hidden 
        />
      )}


      {/* content - remains fully opaque */}
      <div
        key={key}
        className="relative z-10 w-full max-w-5xl px-10 text-center"
      >
        <div className="text-[10px] uppercase tracking-[0.5em] text-foreground/40 mb-12 animate-fade-in-up">
          reminding you
        </div>

        <blockquote className="mb-16">
          <p
            className="font-serif text-balance text-foreground leading-[1.15] animate-float-up"
            style={{ 
              textShadow: "0 4px 40px var(--border)",
              fontSize: `${fontSize}px` // Reactive font size
            }}
          >
            &ldquo;{quote.text}&rdquo;
          </p>
          {showAuthor && (
            <footer className="mt-10 text-sm md:text-base tracking-[0.3em] uppercase text-foreground/50 animate-fade-in-up delay-400">
              — {quote.author}
            </footer>
          )}
        </blockquote>

        <div 
          className="flex items-center justify-center gap-4 animate-fade-in-up delay-600"
          onClick={(e) => e.stopPropagation()} // Keep buttons from dismissing when clicked
        >
          <button
            onClick={(e) => { e.stopPropagation(); onStart?.(); }}
            className="px-8 py-3.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition shadow-glow active:scale-95"
          >
            Start now
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDismiss?.(); }}
            className="px-6 py-3.5 rounded-full text-sm text-foreground/60 hover:text-foreground hover:bg-foreground/5 transition active:scale-95 border border-foreground/10"
          >
            Dismiss
          </button>
        </div>

        <div className="mt-20 text-[10px] tracking-[0.4em] uppercase text-foreground/20 animate-fade-in-up delay-800">
          click anywhere or press esc to continue
        </div>
      </div>
    </div>
  );
}
