"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Loader2, MessageCircle, ArrowRight, Sparkles } from "lucide-react";

interface SearchResult {
  id: string;
  title: string;
  summary: string;
  sources: Array<{ name: string; url: string }>;
  cover_image_url?: string | null;
  similarity: number;
}

export default function MagicSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Debouncing query
  useEffect(() => {
    if (query.trim().length < 3) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        } else {
          setResults([]);
        }
        setHasSearched(true);
      } catch (err) {
        console.error("Search failed:", err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 450); // 450ms debounce

    return () => clearTimeout(delayDebounce);
  }, [query]);

  // Close search results on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={searchContainerRef} className="relative mx-auto mb-8 w-full max-w-2xl z-40">
      {/* Search Input Box */}
      <div
        className={`relative flex items-center rounded-2xl bg-white/5 border transition-all duration-300 ${
          isFocused
            ? "border-neon-pink/50 shadow-[0_0_15px_rgba(255,0,255,0.15)] bg-white/8"
            : "border-white/10"
        }`}
      >
        <div className="pl-4 text-text-muted">
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin text-neon-pink" />
          ) : (
            <Search className="h-5 w-5" />
          )}
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder="Ask anything about GTA 6 (e.g., 'vice city map features', 'trailer 2 release')..."
          className="w-full bg-transparent py-4 pl-3 pr-4 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-4 text-xs font-semibold uppercase tracking-wider text-text-muted hover:text-neon-pink"
          >
            Clear
          </button>
        )}
      </div>

      {/* Floating Search Results */}
      {isFocused && query.trim().length >= 3 && (
        <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl bg-[#0e0e0e]/95 border border-white/10 p-4 shadow-2xl backdrop-blur-xl max-h-[480px] overflow-y-auto">
          {loading && results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-text-secondary">
              <Loader2 className="h-8 w-8 animate-spin text-neon-pink mb-2" />
              <p className="text-xs">Thinking semantically with Gemini...</p>
            </div>
          )}

          {/* Results List */}
          {!loading && results.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-neon-cyan neon-text-cyan">
                <Sparkles className="h-3.5 w-3.5" />
                Semantic Matches Found
              </div>
              <div className="divide-y divide-white/5">
                {results.map((item) => (
                  <div key={item.id} className="py-3 first:pt-0 last:pb-0">
                    <a
                      href={`#news-${item.id}`}
                      onClick={() => setIsFocused(false)}
                      className="group block"
                    >
                      <h4 className="text-sm font-semibold text-text-primary group-hover:text-neon-pink transition-colors line-clamp-1">
                        {item.title}
                      </h4>
                      <p className="text-xs text-text-secondary mt-1 line-clamp-2 leading-relaxed">
                        {item.summary}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] text-text-muted">
                          Similarity: {Math.round(item.similarity * 100)}%
                        </span>
                        <span className="text-[10px] text-neon-pink font-semibold flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          View details <ArrowRight className="h-2.5 w-2.5" />
                        </span>
                      </div>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Results Discord CTA */}
          {!loading && hasSearched && results.length === 0 && (
            <div className="text-center py-8 px-4 border border-dashed border-neon-pink/20 rounded-xl bg-neon-pink/5 animate-fade-in-up">
              <MessageCircle className="h-10 w-10 text-neon-pink mx-auto mb-3 animate-bounce" />
              <h4 className="text-base font-bold text-text-primary mb-1">
                We couldn&apos;t find any specific news on that topic
              </h4>
              <p className="text-xs text-text-secondary max-w-md mx-auto mb-4 leading-relaxed">
                But don&apos;t worry! Our vibrant Zuzu RP Discord community is always sharing early GTA 6 leaks, rumors, and chat logs. Join us to discuss it live!
              </p>
              <a
                href="https://discord.gg/zuzurp"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-neon-pink px-5 py-2.5 text-xs font-bold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:bg-neon-pink-soft animate-pulse-glow"
              >
                Join Zuzu RP Discord
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
