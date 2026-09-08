'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Letter, OCRRecord, fetchLetter } from '@/lib/api';
import LetterTracker from './LetterTracker';
import { 
  X, 
  ExternalLink, 
  FileText, 
  User, 
  Calendar, 
  Hash, 
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

interface TrackingModalProps {
  isOpen: boolean;
  letter: Letter | null;
  onClose: () => void;
}

export default function TrackingModal({ isOpen, letter, onClose }: TrackingModalProps) {
  const [ocrRecord, setOcrRecord] = useState<OCRRecord | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && letter) {
      let isMounted = true;
      setLoading(true);
      fetchLetter(letter.id)
        .then((details) => {
          if (isMounted) {
            setOcrRecord(details.ocrRecord);
          }
        })
        .catch((err) => {
          console.warn('Could not fetch detailed OCR for tracking modal:', err);
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });

      return () => {
        isMounted = false;
      };
    } else {
      setOcrRecord(null);
    }
  }, [isOpen, letter]);

  if (!isOpen || !letter) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-lg max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 shrink-0">
          <div className="flex items-center space-x-2.5">
            <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2.5 py-1 rounded-md border border-blue-200 dark:border-blue-900">
              {letter.referenceNumber}
            </span>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Letter Tracking
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Main Visual Stepper */}
          <LetterTracker letter={letter} ocrRecord={ocrRecord} />

          {/* Letter Info Summary Card */}
          <div className="bg-slate-50/70 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200/70 dark:border-slate-800 text-xs space-y-2.5">
            <div className="font-bold text-slate-900 dark:text-white text-sm">
              {letter.subject}
            </div>

            {letter.vemNumber && (
              <div className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-200/60 dark:border-emerald-900/60">
                <Hash className="w-3 h-3 text-emerald-500" />
                <span>VEM: {letter.vemNumber}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-slate-600 dark:text-slate-300">
              <div>
                <span className="text-slate-400 dark:text-slate-500 block">From (Sender):</span>
                <span className="font-medium text-slate-800 dark:text-slate-100">{letter.sender}</span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 block">To (Receiver):</span>
                <span className="font-medium text-slate-800 dark:text-slate-100">{letter.recipient}</span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 block">Date:</span>
                <span className="font-medium text-slate-800 dark:text-slate-100">{letter.letterDate}</span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 block">Priority:</span>
                <span className={`font-bold ${letter.priority === 'URGENT' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'}`}>
                  {letter.priority}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition"
          >
            Close
          </button>

          <Link
            href={`/letters/${letter.id}`}
            onClick={onClose}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition"
          >
            <span>Open Full Letter</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
