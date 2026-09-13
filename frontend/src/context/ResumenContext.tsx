'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Letter } from '@/lib/api';

interface ResumenContextType {
  resumenLetters: Letter[];
  remarks: Record<string, string>;
  resumenCount: number;
  addToResumen: (letter: Letter, remark?: string) => void;
  addMultipleToResumen: (letters: Letter[]) => void;
  removeFromResumen: (letterId: string) => void;
  toggleResumen: (letter: Letter) => void;
  updateRemark: (letterId: string, remark: string) => void;
  clearResumen: () => void;
  isInResumen: (letterId: string) => boolean;
  notification: string | null;
  clearNotification: () => void;
}

const ResumenContext = createContext<ResumenContextType | undefined>(undefined);

export function ResumenProvider({ children }: { children: React.ReactNode }) {
  const [resumenLetters, setResumenLetters] = useState<Letter[]>([]);
  const [remarks, setRemarks] = useState<Record<string, string>>({});
  const [notification, setNotification] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const storedLetters = localStorage.getItem('letterport_resumen_items');
      const storedRemarks = localStorage.getItem('letterport_resumen_remarks');
      if (storedLetters) {
        setResumenLetters(JSON.parse(storedLetters));
      }
      if (storedRemarks) {
        setRemarks(JSON.parse(storedRemarks));
      }
    } catch (err) {
      console.error('Failed to load Resumen from storage:', err);
    }
  }, []);

  // Save to localStorage when state updates
  const persist = (newLetters: Letter[], newRemarks: Record<string, string>) => {
    try {
      localStorage.setItem('letterport_resumen_items', JSON.stringify(newLetters));
      localStorage.setItem('letterport_resumen_remarks', JSON.stringify(newRemarks));
    } catch (err) {
      console.error('Failed to save Resumen to storage:', err);
    }
  };

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((curr) => (curr === msg ? null : curr));
    }, 3500);
  };

  const addToResumen = (letter: Letter, remark?: string) => {
    setResumenLetters((prev) => {
      if (prev.some((l) => l.id === letter.id)) return prev;
      const updated = [...prev, letter];
      const updatedRemarks = remark ? { ...remarks, [letter.id]: remark } : remarks;
      persist(updated, updatedRemarks);
      showToast(`Added "${letter.referenceNumber}" to Resumen`);
      return updated;
    });
    if (remark) {
      setRemarks((prev) => ({ ...prev, [letter.id]: remark }));
    }
  };

  const addMultipleToResumen = (newLettersToAdd: Letter[]) => {
    setResumenLetters((prev) => {
      const existingIds = new Set(prev.map((l) => l.id));
      const newlyAdded = newLettersToAdd.filter((l) => !existingIds.has(l.id));
      if (newlyAdded.length === 0) {
        showToast('Selected letters are already in Resumen');
        return prev;
      }
      const updated = [...prev, ...newlyAdded];
      persist(updated, remarks);
      showToast(`Added ${newlyAdded.length} letter${newlyAdded.length > 1 ? 's' : ''} to Resumen`);
      return updated;
    });
  };

  const removeFromResumen = (letterId: string) => {
    setResumenLetters((prev) => {
      const target = prev.find((l) => l.id === letterId);
      const updated = prev.filter((l) => l.id !== letterId);
      const updatedRemarks = { ...remarks };
      delete updatedRemarks[letterId];
      setRemarks(updatedRemarks);
      persist(updated, updatedRemarks);
      if (target) {
        showToast(`Removed "${target.referenceNumber}" from Resumen`);
      }
      return updated;
    });
  };

  const toggleResumen = (letter: Letter) => {
    if (isInResumen(letter.id)) {
      removeFromResumen(letter.id);
    } else {
      addToResumen(letter);
    }
  };

  const updateRemark = (letterId: string, remark: string) => {
    setRemarks((prev) => {
      const updated = { ...prev, [letterId]: remark };
      persist(resumenLetters, updated);
      return updated;
    });
  };

  const clearResumen = () => {
    setResumenLetters([]);
    setRemarks({});
    persist([], {});
    showToast('Resumen cleared');
  };

  const isInResumen = (letterId: string) => {
    return resumenLetters.some((l) => l.id === letterId);
  };

  return (
    <ResumenContext.Provider
      value={{
        resumenLetters,
        remarks,
        resumenCount: resumenLetters.length,
        addToResumen,
        addMultipleToResumen,
        removeFromResumen,
        toggleResumen,
        updateRemark,
        clearResumen,
        isInResumen,
        notification,
        clearNotification: () => setNotification(null)
      }}
    >
      {children}
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-2.5 rounded-xl shadow-2xl border border-slate-700 dark:border-slate-300 text-xs font-medium flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{notification}</span>
          </div>
        </div>
      )}
    </ResumenContext.Provider>
  );
}

export function useResumen() {
  const context = useContext(ResumenContext);
  if (!context) {
    throw new Error('useResumen must be used within a ResumenProvider');
  }
  return context;
}
