'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, FileText, ArrowRight, Loader2, Sparkles, Hash, Calendar } from 'lucide-react';
import { searchLetters, SearchResultItem } from '@/lib/api';
import StatusBadge from '@/components/StatusBadge';

export default function SearchModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Keyboard shortcut listener (Ctrl+K / Cmd+K) and custom event listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    const handleCustomOpen = () => {
      setIsOpen(true);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-search-modal', handleCustomOpen);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-search-modal', handleCustomOpen);
    };
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    } else {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (!isOpen) return;
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const data = await searchLetters(query.trim());
        setResults(data.results || []);
        setSelectedIndex(0);
      } catch (err) {
        console.error('Modal search error:', err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  // Keyboard navigation within results
  const handleKeyNavigation = (e: React.KeyboardEvent) => {
    if (results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        navigateToLetter(results[selectedIndex].letter.id);
      }
    }
  };

  // Scroll selected item into view
  useEffect(() => {
    if (resultsContainerRef.current) {
      const activeEl = resultsContainerRef.current.children[selectedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  const navigateToLetter = (id: string) => {
    setIsOpen(false);
    router.push(`/letters/${id}`);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 md:p-20 overflow-y-auto bg-slate-900/60 backdrop-blur-sm transition-all"
      onClick={() => setIsOpen(false)}
    >
      <div 
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyNavigation}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <Search className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search letters, VEM-Numbers, subjects, or scanned text..."
            className="w-full px-3 py-1 bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-base focus:outline-none"
          />
          {loading && (
            <Loader2 className="w-4 h-4 text-blue-500 animate-spin shrink-0 mr-2" />
          )}
          {query && !loading && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 mr-2 px-1 py-0.5 rounded"
            >
              Clear
            </button>
          )}
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results List */}
        <div 
          ref={resultsContainerRef}
          className="max-h-[60vh] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-2"
        >
          {query.trim() === '' && (
            <div className="p-8 text-center text-slate-400 dark:text-slate-500">
              <Sparkles className="w-8 h-8 mx-auto mb-2 text-blue-500/60" />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Quick Global Search</p>
              <p className="text-xs mt-1">Type reference number, VEM-Number, sender, or any word scanned from documents</p>
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-400">
                <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono">↑</kbd>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono">↓</kbd>
                <span>to navigate</span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono ml-2">↵</kbd>
                <span>to select</span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono ml-2">Esc</kbd>
                <span>to close</span>
              </div>
            </div>
          )}

          {query.trim() !== '' && !loading && results.length === 0 && (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400">
              <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-medium">No matching letters found</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Try searching by VEM-Number or general keyword
              </p>
            </div>
          )}

          {results.map((item, index) => {
            const isSelected = index === selectedIndex;
            return (
              <div
                key={item.letter.id}
                onClick={() => navigateToLetter(item.letter.id)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`p-3 rounded-xl cursor-pointer transition-all flex items-start justify-between gap-3 ${
                  isSelected
                    ? 'bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/50'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/80 px-2 py-0.5 rounded border border-blue-200/60 dark:border-blue-900/60">
                      {item.letter.referenceNumber}
                    </span>
                    {item.letter.vemNumber && (
                      <span className="font-mono text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-200/60 dark:border-emerald-900/60 flex items-center gap-1">
                        <Hash className="w-3 h-3" />
                        {item.letter.vemNumber}
                      </span>
                    )}
                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                      item.letter.type === 'INCOMING'
                        ? 'bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300'
                        : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300'
                    }`}>
                      {item.letter.type}
                    </span>
                    <StatusBadge status={item.letter.status} />
                  </div>

                  <p className="font-medium text-sm text-slate-800 dark:text-slate-100 truncate">
                    {item.letter.subject}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-1">
                    <span>From: <strong className="font-normal text-slate-700 dark:text-slate-300">{item.letter.sender}</strong></span>
                    <span>To: <strong className="font-normal text-slate-700 dark:text-slate-300">{item.letter.recipient}</strong></span>
                    <span className="hidden sm:inline flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {item.letter.letterDate}
                    </span>
                  </div>

                  {item.matchSnippet && (
                    <div className="mt-2 text-xs bg-slate-100 dark:bg-slate-800/80 p-2 rounded-lg text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50 font-mono">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block mb-0.5">
                        Matched in {item.matchType === 'OCR' ? 'Scanned Document' : 'Letter Details'}:
                      </span>
                      &ldquo;...{item.matchSnippet}...&rdquo;
                    </div>
                  )}
                </div>

                <div className="shrink-0 flex items-center text-slate-400 dark:text-slate-500 pt-2">
                  <ArrowRight className={`w-4 h-4 transition-transform ${isSelected ? 'translate-x-0.5 text-blue-600 dark:text-blue-400' : ''}`} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400 dark:text-slate-500 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>LetterPort Global Finder</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>Press</span>
            <kbd className="px-1.5 py-0.5 text-[10px] rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-slate-600 dark:text-slate-300">ESC</kbd>
            <span>to close</span>
          </div>
        </div>
      </div>
    </div>
  );
}
