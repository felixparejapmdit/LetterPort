'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Letter, OCRRecord, fetchLetter } from '@/lib/api';
import LetterTracker from './LetterTracker';
import { 
  X, 
  ExternalLink, 
  FileText, 
  Calendar, 
  Hash, 
  Clock,
  AlertTriangle,
  Copy,
  Check
} from 'lucide-react';

interface TrackingModalProps {
  isOpen: boolean;
  letter: Letter | null;
  onClose: () => void;
}

export default function TrackingModal({ isOpen, letter, onClose }: TrackingModalProps) {
  const [ocrRecord, setOcrRecord] = useState<OCRRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

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

  const isOverdue = letter.dueDate && new Date().toISOString().split('T')[0] > letter.dueDate && letter.status !== 'PROCESSED' && letter.status !== 'ARCHIVED';

  const copyTrackingUrl = () => {
    const url = `${window.location.origin}/letters/${letter.id}?track=true`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div 
        className="absolute inset-0"
        onClick={onClose}
      />

      {/* Right Slide-Over Panel */}
      <div 
        className="fixed inset-y-0 right-0 z-50 flex h-full w-full sm:w-[420px] md:w-[28vw] min-w-[340px] max-w-full flex-col bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/60 shrink-0">
          <div className="flex items-center space-x-2.5">
            <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/80 px-2.5 py-1 rounded-md border border-blue-200 dark:border-blue-900">
              {letter.referenceNumber}
            </span>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Letter Tracking
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Due Date / SLA Alert if applicable */}
          {isOverdue && (
            <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 rounded-xl flex items-center gap-2.5 text-xs text-red-700 dark:text-red-400 animate-pulse">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <div>
                <span className="font-bold">Overdue Alert:</span> Target resolution date ({letter.dueDate}) has passed!
              </div>
            </div>
          )}

          {/* Visual Tracking Stepper */}
          <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
            <LetterTracker letter={letter} ocrRecord={ocrRecord} />
          </div>

          {/* Letter Info Summary Card */}
          <div className="bg-white dark:bg-slate-850 rounded-xl p-4 border border-slate-200 dark:border-slate-800 text-xs space-y-3 shadow-xs">
            <div className="font-bold text-slate-900 dark:text-white text-sm">
              {letter.subject}
            </div>

            {letter.vemNumber && (
              <div className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-200/60 dark:border-emerald-900/60">
                <Hash className="w-3 h-3 text-emerald-500" />
                <span>VEM: {letter.vemNumber}</span>
              </div>
            )}

            <div className="space-y-2 pt-1 text-slate-600 dark:text-slate-300">
              <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 dark:text-slate-500">From (Sender):</span>
                <span className="font-medium text-slate-800 dark:text-slate-100 text-right">{letter.sender}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 dark:text-slate-500">To (Receiver):</span>
                <span className="font-medium text-slate-800 dark:text-slate-100 text-right">{letter.recipient}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 dark:text-slate-500">Letter Date:</span>
                <span className="font-medium text-slate-800 dark:text-slate-100">{letter.letterDate}</span>
              </div>
              {letter.dueDate && (
                <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 dark:text-slate-500">Due / SLA Date:</span>
                  <span className={`font-semibold ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-slate-100'}`}>
                    {letter.dueDate}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400 dark:text-slate-500">Priority:</span>
                <span className={`font-bold ${letter.priority === 'URGENT' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'}`}>
                  {letter.priority}
                </span>
              </div>
            </div>
          </div>

          {/* Copy Tracking URL Shortcut */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
              Direct Tracking Link
            </span>
            <button
              type="button"
              onClick={copyTrackingUrl}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy URL</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Drawer Footer Actions */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/60 shrink-0">
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
