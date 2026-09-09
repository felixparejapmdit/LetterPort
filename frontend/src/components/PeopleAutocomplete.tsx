'use client';

import React, { useState, useEffect, useRef } from 'react';
import { User, Check } from 'lucide-react';

interface Person {
  id: string;
  name: string;
  type: string;
}

interface PeopleAutocompleteProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  required?: boolean;
  label?: string;
  className?: string;
  inputClassName?: string;
  id?: string;
}

export default function PeopleAutocomplete({
  value,
  onChange,
  placeholder = 'Type name...',
  required = false,
  label,
  className = '',
  inputClassName = '',
  id
}: PeopleAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Person[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!value || value.trim().length < 1) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/people?search=${encodeURIComponent(value.trim())}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            setSuggestions(json.data);
            setIsOpen(json.data.length > 0);
          }
        }
      } catch (err) {
        console.error('Error fetching people suggestions:', err);
      } finally {
        setLoading(false);
      }
    }, 180);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (personName: string) => {
    onChange(personName);
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        e.preventDefault();
        handleSelect(suggestions[selectedIndex].name);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      {label && (
        <label htmlFor={id} className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          id={id}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setSelectedIndex(-1);
          }}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          autoComplete="off"
          className={`w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-2xs ${inputClassName}`}
        />
        {loading && (
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
            <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 max-h-48 overflow-y-auto rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-1 text-xs">
          <div className="px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500">
            Suggested Contacts
          </div>
          {suggestions.map((p, idx) => {
            const isMatchExact = p.name.toLowerCase() === value.trim().toLowerCase();
            const isSelected = idx === selectedIndex;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelect(p.name)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 text-left cursor-pointer transition ${
                  isSelected
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate font-medium">{p.name}</span>
                </div>
                {isMatchExact && (
                  <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 ml-1" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
