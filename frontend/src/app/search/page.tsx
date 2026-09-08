'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { searchLetters, SearchResultItem } from '@/lib/api';
import { StatusBadge, PriorityBadge, TypeBadge } from '@/components/StatusBadge';
import { 
  Search, 
  Sparkles, 
  FileText, 
  ArrowRight, 
  Calendar, 
  Clock, 
  Layers, 
  HelpCircle,
  RefreshCw,
  X,
  Hash
} from 'lucide-react';

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams?.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const executeSearch = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setResults([]);
      setHasSearched(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setHasSearched(true);

    try {
      const data = await searchLetters(searchTerm.trim());
      setResults(data.results || []);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-trigger search while typing (debounced by 250ms)
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!query.trim()) {
      setResults([]);
      setHasSearched(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(() => {
      executeSearch(query);
    }, 250);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, executeSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    executeSearch(query);
  };

  const highlightKeyword = (text: string, term: string) => {
    if (!term.trim()) return text;
    const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-amber-200 dark:bg-amber-900/80 text-amber-950 dark:text-amber-200 font-bold px-1 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Banner */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Live Search Letters
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Search in real-time as you type. Finds letters by VEM-Number, reference, sender, or text inside scanned documents.
        </p>
      </div>

      {/* Main Search Input */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          <Search className="w-5 h-5 text-slate-400 dark:text-slate-500 absolute left-4 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type any VEM number, reference code, sender name, or word inside documents..."
            className="w-full pl-12 pr-24 py-3.5 text-base bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm focus:outline-none focus:border-blue-600 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition"
          />
          <div className="absolute right-3 flex items-center gap-2">
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            {loading && (
              <RefreshCw className="w-4 h-4 text-blue-500 animate-spin mr-1" />
            )}
          </div>
        </div>
      </form>

      {/* Results Section */}
      <div className="space-y-4">
        {loading && results.length === 0 ? (
          <div className="p-16 text-center text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Searching letters and documents...</p>
          </div>
        ) : hasSearched && results.length === 0 ? (
          <div className="p-16 text-center text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <FileText className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <h3 className="text-base font-bold text-slate-700 dark:text-slate-200">No letters found</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
              We couldn&apos;t find any letters matching &quot;{query}&quot;. Try typing a VEM number or broader keyword.
            </p>
          </div>
        ) : (
          results.map((res) => {
            const isOcr = res.matchType === 'OCR';
            return (
              <div
                key={`${res.letter.id}-${res.matchType}`}
                className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/80 px-2 py-0.5 rounded border border-blue-200/60 dark:border-blue-900/60">
                      {res.letter.referenceNumber}
                    </span>
                    {res.letter.vemNumber && (
                      <span className="font-mono text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-200/60 dark:border-emerald-900/60 inline-flex items-center gap-1">
                        <Hash className="w-3 h-3 text-emerald-500" />
                        {res.letter.vemNumber}
                      </span>
                    )}
                    <TypeBadge type={res.letter.type} />
                    <PriorityBadge priority={res.letter.priority} />
                    <StatusBadge status={res.letter.status} />
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                      isOcr
                        ? 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/80 dark:text-purple-300 dark:border-purple-800'
                        : 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-800'
                    }`}
                  >
                    {isOcr ? <Sparkles className="w-3 h-3 text-purple-600 dark:text-purple-400" /> : <Layers className="w-3 h-3 text-blue-600 dark:text-blue-400" />}
                    {isOcr ? 'Found Inside Document Text' : 'Found in Title / Sender'}
                  </span>
                </div>

                <div>
                  <Link
                    href={`/letters/${res.letter.id}`}
                    className="text-base font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition"
                  >
                    {res.letter.subject}
                  </Link>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
                    <span>
                      <strong className="text-slate-700 dark:text-slate-300">From:</strong> {res.letter.sender}
                    </span>
                    <span>&bull;</span>
                    <span>
                      <strong className="text-slate-700 dark:text-slate-300">To:</strong> {res.letter.recipient}
                    </span>
                    <span>&bull;</span>
                    <span>{res.letter.letterDate}</span>
                  </div>
                </div>

                {/* Match Snippet */}
                {res.matchSnippet && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-100 dark:border-slate-800 font-mono text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {highlightKeyword(res.matchSnippet, query)}
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">
                    {res.ocrRecord && res.ocrRecord.status === 'COMPLETED'
                      ? `Text reading quality: ${res.ocrRecord.confidence}%`
                      : 'Saved letter'}
                  </span>

                  <Link
                    href={`/letters/${res.letter.id}`}
                    className="inline-flex items-center space-x-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    <span>Open Letter</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Helpful Search Tips Widget */}
      {!hasSearched && (
        <div className="bg-slate-50 dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-2">
          <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-sm">
            <HelpCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Helpful Search Tips
          </h4>
          <ul className="list-disc list-inside space-y-1 text-slate-500 dark:text-slate-400 pl-1">
            <li>Type any reference number (like <code>LP-IN-2026</code>) or VEM Number.</li>
            <li>Results appear automatically as you type without having to press enter.</li>
            <li>Every document scan is indexed by automated OCR, letting you locate letters using any word inside the PDF or image.</li>
          </ul>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-5xl mx-auto p-16 text-center text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Loading search...</p>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
