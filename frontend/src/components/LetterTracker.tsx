'use client';

import React from 'react';
import { Letter, OCRRecord } from '@/lib/api';
import { 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  FileCheck, 
  Archive, 
  AlertTriangle,
  ArrowRight
} from 'lucide-react';

interface LetterTrackerProps {
  letter: Letter;
  ocrRecord: OCRRecord | null;
}

export default function LetterTracker({ letter, ocrRecord }: LetterTrackerProps) {
  // Determine current progression
  const isReceived = true;
  const isOCRDone = ocrRecord?.status === 'COMPLETED';
  const isOCRScanning = ocrRecord?.status === 'PENDING' || ocrRecord?.status === 'PROCESSING';
  const isReview = letter.status === 'UNDER_REVIEW' || letter.status === 'PROCESSED' || letter.status === 'ARCHIVED';
  const isCompleted = letter.status === 'PROCESSED' || letter.status === 'ARCHIVED';
  const isArchived = letter.status === 'ARCHIVED';

  const steps = [
    {
      id: 'receive',
      label: letter.type === 'INCOMING' ? 'Received' : 'Drafted',
      desc: letter.letterDate || 'Letter Created',
      done: isReceived,
      active: letter.status === 'RECEIVED' || letter.status === 'DRAFT',
      icon: CheckCircle2,
    },
    {
      id: 'ocr',
      label: 'Scanned',
      desc: isOCRDone ? `${ocrRecord?.confidence || 99}% match` : isOCRScanning ? 'Scanning...' : 'Text indexed',
      done: isOCRDone,
      active: isOCRScanning,
      icon: Sparkles,
    },
    {
      id: 'review',
      label: 'In Review',
      desc: letter.status === 'UNDER_REVIEW' ? 'Under staff review' : 'Reviewed',
      done: isReview && letter.status !== 'UNDER_REVIEW',
      active: letter.status === 'UNDER_REVIEW',
      icon: Clock,
    },
    {
      id: 'completed',
      label: 'Completed',
      desc: isCompleted ? 'Approved & filed' : 'Pending completion',
      done: isCompleted,
      active: letter.status === 'PROCESSED',
      icon: FileCheck,
    },
    {
      id: 'archived',
      label: 'Archived',
      desc: isArchived ? 'Safely archived' : 'Storage',
      done: isArchived,
      active: letter.status === 'ARCHIVED',
      icon: Archive,
    },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <span>Letter Tracking</span>
            <span className="text-xs font-mono font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-900">
              {letter.referenceNumber}
            </span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Current stage: <strong className="text-slate-800 dark:text-slate-200">{letter.status.replace('_', ' ')}</strong>
          </p>
        </div>

        {letter.priority === 'URGENT' && (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-bold animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>URGENT</span>
          </span>
        )}
      </div>

      {/* Stepper Timeline Bar */}
      <div className="relative pt-2 pb-1">
        <div className="grid grid-cols-5 gap-1 text-center">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div key={step.id} className="flex flex-col items-center group">
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all ${
                    step.done
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/30'
                      : step.active
                      ? 'bg-blue-600 text-white ring-4 ring-blue-500/20 shadow-sm shadow-blue-500/30 animate-pulse'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <span
                  className={`text-[11px] sm:text-xs font-bold mt-2 truncate w-full px-0.5 ${
                    step.done
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : step.active
                      ? 'text-blue-600 dark:text-blue-400 font-extrabold'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {step.label}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 hidden sm:block truncate w-full mt-0.5">
                  {step.desc}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
