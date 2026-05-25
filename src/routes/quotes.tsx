import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Pencil, Plus, Trash2, X, Download, Upload, Share2, Globe as GlobeIcon, Lock, Heart } from "lucide-react";
import { ClientOnly, useQuotes, type Quote } from "@/lib/store";
import { useAppStore } from "@/lib/electronStore";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export const Route = createFileRoute("/quotes")({
  component: () => (
    <ClientOnly>
      <QuotesPage />
    </ClientOnly>
  ),
});

const categories = ["Discipline", "Focus", "Love", "Calm", "Personal"];

function QuotesPage() {
  const { quotes, addQuote, updateQuote, deleteQuote } = useQuotes();
  const init = useAppStore((s) => s.init);
  const { user } = useAppStore();
  const [editing, setEditing] = useState<Quote | null>(null);
  const [open, setOpen] = useState(false);

  const handleExport = async () => {
    // @ts-ignore
    if (window.electron) await window.electron.exportQuotes();
  };

  const handleImport = async () => {
    // @ts-ignore
    if (window.electron) {
      // @ts-ignore
      const res = await window.electron.importQuotes();
      if (res.success) await init();
    }
  };

  const handleShare = async (quote: Quote) => {
    if (!isSupabaseConfigured || !user) {
      alert("Please log in and configure Supabase to share quotes publicly.");
      return;
    }

    try {
      const isCurrentlyPublic = !!quote.is_public;
      const nextPublicState = !isCurrentlyPublic;
      const username = user.user_metadata?.username;

      if (nextPublicState) {
        // Enforce username for public quotes
        const finalAuthor = username || quote.author;
        
        const { error } = await supabase!
          .from('public_quotes')
          .upsert([{ 
            id: quote.id, 
            text: quote.text, 
            author: finalAuthor, 
            category: quote.category,
            user_id: user.id
          }]);
        
        if (error) throw error;
        
        // Update local state too
        updateQuote(quote.id, { is_public: true, author: finalAuthor });
        alert("Quote shared successfully to the community!");
      } else {
        const { error } = await supabase!
          .from('public_quotes')
          .delete()
          .eq('id', quote.id);
        
        if (error) throw error;
        updateQuote(quote.id, { is_public: false });
        alert("Quote removed from community.");
      }
    } catch (e: any) {
      alert("Error updating sharing status: " + e.message);
    }
  };

  return (
    <div className="px-10 py-12 max-w-5xl mx-auto pb-32">
      <header className="flex items-end justify-between mb-10">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-3">
            Library
          </p>
          <h1 className="font-serif text-4xl">Your quotes</h1>
          <p className="text-muted-foreground mt-2">
            {quotes.length} {quotes.length === 1 ? "quote" : "quotes"} ready to greet you.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleImport}
            title="Import from JSON/TXT"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-secondary text-secondary-foreground text-sm font-medium hover:bg-accent transition"
          >
            <Upload className="h-4 w-4" /> Import
          </button>
          <button
            onClick={handleExport}
            title="Export to JSON"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-secondary text-secondary-foreground text-sm font-medium hover:bg-accent transition"
          >
            <Download className="h-4 w-4" /> Export
          </button>
          <button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition shadow-glow"
          >
            <Plus className="h-4 w-4" /> Add quote
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {quotes.map((q) => (
          <article
            key={q.id}
            className="group relative glass rounded-2xl p-6 hover:border-primary/30 transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] uppercase tracking-[0.25em] text-primary/80">
                  {q.category}
                </span>
                <div className="flex items-center gap-2">
                  {q.is_public ? (
                    <span className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      <Heart className="h-2.5 w-2.5 fill-current" /> {q.likes_count || 0}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-muted-foreground font-bold bg-secondary px-2 py-0.5 rounded-full">
                      <Lock className="h-2.5 w-2.5" /> Private
                    </span>
                  )}
                </div>
              </div>
              <p className="font-serif text-xl leading-snug text-balance">
                &ldquo;{q.text}&rdquo;
              </p>
              <p className="text-xs uppercase tracking-widest text-muted-foreground mt-4">
                — {q.author}
              </p>
            </div>
            
            <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition bg-background/80 backdrop-blur-sm p-1 rounded-lg">
              <button
                onClick={() => handleShare(q)}
                className={`p-2 rounded-md transition ${q.is_public ? 'text-emerald-500 hover:bg-emerald-500/10' : 'text-muted-foreground hover:bg-accent'}`}
                aria-label={q.is_public ? "Make Private" : "Make Public"}
                title={q.is_public ? "Make Private" : "Make Public"}
              >
                <Share2 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => {
                  setEditing(q);
                  setOpen(true);
                }}
                className="p-2 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground"
                aria-label="Edit"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => {
                  if (confirm("Are you sure you want to delete this quote?")) {
                    deleteQuote(q.id);
                  }
                }}
                className="p-2 rounded-md hover:bg-destructive/15 text-muted-foreground hover:text-destructive"
                aria-label="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </article>
        ))}
        {quotes.length === 0 && (
          <div className="col-span-full py-20 text-center glass rounded-2xl border-dashed">
            <p className="text-muted-foreground">Your library is empty. Add your first quote!</p>
          </div>
        )}
      </div>

      {open && (
        <QuoteModal
          initial={editing}
          onClose={() => setOpen(false)}
          onSave={(data) => {
            if (editing) updateQuote(editing.id, data);
            else addQuote(data);
            setOpen(false);
          }}
        />
      )}
    </div>
  );
}

function QuoteModal({
  initial,
  onClose,
  onSave,
}: {
  initial: Quote | null;
  onClose: () => void;
  onSave: (q: Omit<Quote, "id">) => void;
}) {
  const [text, setText] = useState(initial?.text ?? "");
  const [author, setAuthor] = useState(initial?.author ?? "You");
  const [category, setCategory] = useState(initial?.category ?? categories[0]);
  const [isPublic, setIsPublic] = useState(!!initial?.is_public);

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-6 animate-fade-in-up"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-card border border-border p-7 shadow-soft"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-2xl">
            {initial ? "Edit quote" : "New quote"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-accent text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground">
              Quote
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              className="mt-2 w-full rounded-lg bg-input/40 border border-border px-3 py-2.5 font-serif text-lg leading-snug focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              placeholder="Words that move you…"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs uppercase tracking-widest text-muted-foreground">
                Author
              </label>
              <input
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="mt-2 w-full rounded-lg bg-input/40 border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-muted-foreground">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-2 w-full rounded-lg bg-input/40 border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="pt-2">
            <button 
              type="button"
              onClick={() => setIsPublic(!isPublic)}
              className="flex items-center gap-2 text-sm"
            >
              <div className={`h-5 w-9 rounded-full transition-colors relative ${isPublic ? 'bg-emerald-500' : 'bg-secondary'}`}>
                <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${isPublic ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
              </div>
              <span className={isPublic ? 'text-emerald-500 font-medium' : 'text-muted-foreground'}>
                {isPublic ? 'Publicly shared' : 'Private (local only)'}
              </span>
            </button>
            <p className="text-[10px] text-muted-foreground mt-1 ml-11">
              Public quotes can be seen and liked by others in the Explore tab.
            </p>
          </div>
        </div>

        <div className="mt-7 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full text-sm text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
          <button
            disabled={!text.trim()}
            onClick={() => onSave({ text: text.trim(), author: author.trim() || "You", category, is_public: isPublic })}
            className="px-5 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-40 shadow-glow"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
