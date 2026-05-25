import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart, Search, Sparkles, TrendingUp, Clock, LogIn, Plus, Globe as GlobeIcon } from "lucide-react";
import { ClientOnly } from "@/lib/store";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useAppStore } from "@/lib/electronStore";

export const Route = createFileRoute("/explore")({
  component: () => (
    <ClientOnly>
      <ExplorePage />
    </ClientOnly>
  ),
});

const categories = ["All", "Discipline", "Focus", "Love", "Calm", "Wisdom"];

function ExplorePage() {
  const { user, addQuote } = useAppStore();
  const [quotes, setQuotes] = useState<any[]>([]);
  const [userLikes, setUserLikes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("trending");

  useEffect(() => {
    if (user) {
      fetchUserLikes();
    }
    fetchPublicQuotes();
  }, [filter, sortBy, user]);

  const fetchUserLikes = async () => {
    if (!isSupabaseConfigured || !user) return;
    const { data } = await supabase!
      .from('favorites')
      .select('quote_id')
      .eq('user_id', user.id);
    if (data) setUserLikes(data.map(d => d.quote_id));
  };

  const fetchPublicQuotes = async () => {
    setLoading(true);
    
    if (!isSupabaseConfigured) {
      setQuotes([]);
      setLoading(false);
      return;
    }

    try {
      let query = supabase!
        .from('public_quotes')
        .select(`
          *,
          likes_count: favorites(count)
        `);
      
      if (filter !== 'All') {
        query = query.eq('category', filter);
      }
      
      if (sortBy === 'newest') {
        query = query.order('created_at', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query.limit(50);
      if (data) {
        setQuotes(data.map(q => ({
          ...q,
          likes: q.likes_count?.[0]?.count || 0
        })));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleLike = async (quoteId: string) => {
    if (!user) return;
    if (!isSupabaseConfigured) return;

    const isLiked = userLikes.includes(quoteId);

    if (isLiked) {
      const { error } = await supabase!
        .from('favorites')
        .delete()
        .eq('quote_id', quoteId)
        .eq('user_id', user.id);
      
      if (!error) {
        setUserLikes(prev => prev.filter(id => id !== quoteId));
        setQuotes(prev => prev.map(q => q.id === quoteId ? { ...q, likes: q.likes - 1 } : q));
      }
    } else {
      const { error } = await supabase!
        .from('favorites')
        .insert([{ quote_id: quoteId, user_id: user.id }]);
      
      if (!error) {
        setUserLikes(prev => [...prev, quoteId]);
        setQuotes(prev => prev.map(q => q.id === quoteId ? { ...q, likes: q.likes + 1 } : q));
      }
    }
  };

  const handleReport = async (quoteId: string) => {
    if (!user) return;
    const reason = prompt("Why are you reporting this quote?");
    if (reason) {
      const { error } = await supabase!
        .from('reports')
        .insert([{ quote_id: quoteId, user_id: user.id, reason }]);
      if (!error) alert("Thank you for your report. Our moderators will review it.");
    }
  };

  const handleAddToLibrary = async (quote: any) => {
    const { quotes: localQuotes } = useAppStore.getState();
    const isDuplicate = localQuotes.some(q => q.text === quote.text && q.author === quote.author);
    
    if (isDuplicate) {
      alert("This quote is already in your library!");
      return;
    }

    await addQuote({
      text: quote.text,
      author: quote.author,
      category: quote.category,
      local_only: false,
      is_public: false
    });
    alert("Added to your library!");
  };

  const filteredQuotes = quotes.filter(q => 
    q.text.toLowerCase().includes(search.toLowerCase()) || 
    q.author.toLowerCase().includes(search.toLowerCase())
  );

  const localQuotes = useAppStore(s => s.quotes);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-10 text-center">
        <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <GlobeIcon className="h-10 w-10 text-primary" />
        </div>
        <h1 className="font-serif text-3xl mb-4">Connect with the Community</h1>
        <p className="text-muted-foreground max-w-md mb-8">
          Sign in to explore quotes shared by others, save them to your library, and sync your collection across devices.
        </p>
        <div className="flex gap-4">
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium hover:opacity-90 transition"
          >
            <LogIn className="h-4 w-4" /> Sign in to start
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-10 py-12 max-w-6xl mx-auto pb-32">
      <header className="mb-10">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-primary mb-3">
          <Sparkles className="h-3 w-3" /> Community
        </div>
        <h1 className="font-serif text-4xl">Explore Quotes</h1>
        <p className="text-muted-foreground mt-2">
          Discover words that move others and add them to your collection.
        </p>
      </header>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input 
            type="text"
            placeholder="Search by text or author..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-secondary/50 border border-border rounded-full pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-2 rounded-full text-xs font-medium transition whitespace-nowrap ${
                filter === cat 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-secondary text-secondary-foreground hover:bg-accent"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between mb-6 border-b border-border pb-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setSortBy('trending')}
            className={`flex items-center gap-1.5 text-xs font-medium transition ${sortBy === 'trending' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <TrendingUp className="h-3.5 w-3.5" /> Trending
          </button>
          <button 
            onClick={() => setSortBy('newest')}
            className={`flex items-center gap-1.5 text-xs font-medium transition ${sortBy === 'newest' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Clock className="h-3.5 w-3.5" /> Newest
          </button>
        </div>
        <div className="text-xs text-muted-foreground">
          {filteredQuotes.length} quotes found
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-48 rounded-2xl bg-secondary/30" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuotes.map((q) => (
            <article
              key={q.id}
              className="group glass rounded-2xl p-6 flex flex-col justify-between hover:border-primary/30 transition shadow-sm hover:shadow-md"
            >
              <div>
                <span className="text-[10px] uppercase tracking-[0.25em] text-primary/70">
                  {q.category}
                </span>
                <p className="font-serif text-lg mt-3 leading-snug">
                  &ldquo;{q.text}&rdquo;
                </p>
                <p className="text-xs uppercase tracking-widest text-muted-foreground mt-4">
                  — {q.author}
                </p>
              </div>
              
              <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
                <button 
                  onClick={() => toggleLike(q.id)}
                  className={`flex items-center gap-1.5 text-xs transition-colors ${userLikes.includes(q.id) ? 'text-rose-500' : 'text-muted-foreground hover:text-rose-500'}`}
                >
                  <Heart className={`h-4 w-4 ${userLikes.includes(q.id) ? 'fill-current' : ''}`} />
                  {q.likes || 0}
                </button>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleReport(q.id)}
                    className="text-[10px] uppercase tracking-wider text-muted-foreground hover:text-destructive transition"
                  >
                    Report
                  </button>
                  <button 
                    onClick={() => handleAddToLibrary(q)}
                    className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold text-primary hover:opacity-80 transition"
                  >
                    <Plus className="h-3 w-3" /> Add to Library
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {!loading && filteredQuotes.length === 0 && (
        <div className="text-center py-20">
          <p className="text-muted-foreground">
            {isSupabaseConfigured ? "No quotes matched your search." : "Supabase is not configured yet."}
          </p>
        </div>
      )}
    </div>
  );
}
