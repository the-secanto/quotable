import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ClientOnly, useQuotes, useSettings } from "@/lib/store";
import { QuoteOverlay } from "@/components/QuoteOverlay";

export const Route = createFileRoute("/preview")({
  component: () => (
    <ClientOnly>
      <PreviewPage />
    </ClientOnly>
  ),
});

function PreviewPage() {
  const { quotes } = useQuotes();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [currentQuote, setCurrentQuote] = useState<any>(null);
  
  const [i, setI] = useState(0);
  const localQuote = quotes[i % (quotes.length || 1)];
  const quote = currentQuote || localQuote;

  useEffect(() => {
    // @ts-ignore
    if (window.electron && window.electron.onDisplayQuote) {
      // @ts-ignore
      window.electron.onDisplayQuote((q: any) => {
        setCurrentQuote(q);
      });
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleDismiss();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

  const handleDismiss = () => {
    // @ts-ignore
    if (window.electron && window.electron.closeOverlay) {
      // @ts-ignore
      window.electron.closeOverlay();
    } else {
      navigate({ to: "/" });
    }
  };

  if (!quote) {
    if (!window.electron) navigate({ to: "/quotes" });
    return null;
  }

  return (
    <QuoteOverlay
      quote={quote}
      showAuthor={settings.showAuthor}
      onDismiss={handleDismiss}
      onStart={handleDismiss}
    />
  );
}
