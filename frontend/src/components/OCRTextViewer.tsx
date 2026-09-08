'use client';

import { useState } from 'react';
import { OCRRecord } from '@/lib/api';
import { 
  Sparkles, 
  Copy, 
  Check, 
  RefreshCw, 
  Search, 
  AlertCircle, 
  Clock, 
  CheckCircle2 
} from 'lucide-react';

interface OCRTextViewerProps {
  ocrRecord: OCRRecord | null;
  onReprocess: () => Promise<void>;
  isReprocessing: boolean;
}

export default function OCRTextViewer({
  ocrRecord,
  onReprocess,
  isReprocessing,
}: OCRTextViewerProps) {
  const [copied, setCopied] = useState(false);
  const [searchInText, setSearchInText] = useState('');

  const handleCopy = async () => {
    if (!ocrRecord?.extractedText) return;
    await navigator.clipboard.writeText(ocrRecord.extractedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const statusConfig = {
    PENDING: {
      color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800',
      icon: Clock,
      label: 'Waiting to read...',
    },
    PROCESSING: {
      color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-800',
      icon: RefreshCw,
      label: 'Reading text now...',
    },
    COMPLETED: {
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800',
      icon: CheckCircle2,
      label: 'Text reading complete',
    },
    FAILED: {
      color: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-800',
      icon: AlertCircle,
      label: 'Could not read text',
    },
  };

  const currentStatus = ocrRecord?.status || 'PENDING';
  const config = statusConfig[currentStatus];
  const StatusIcon = config.icon;

  const renderHighlightedText = (text: string) => {
    if (!searchInText.trim()) return text;

    const regex = new RegExp(`(${searchInText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-amber-200 dark:bg-amber-900/80 text-amber-950 dark:text-amber-200 px-0.5 rounded font-semibold">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              Text Read from Document
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${config.color}`}
              >
                <StatusIcon
                  className={`w-3 h-3 ${currentStatus === 'PROCESSING' ? 'animate-spin' : ''}`}
                />
                {config.label}
              </span>
            </h3>
            {ocrRecord?.status === 'COMPLETED' && (
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Reading accuracy: <strong className="text-emerald-700 dark:text-emerald-400">{ocrRecord.confidence}%</strong>
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            onClick={onReprocess}
            disabled={isReprocessing || currentStatus === 'PROCESSING'}
            className="flex items-center space-x-1 px-2.5 py-1.5 text-xs font-medium rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 transition"
            title="Read document text again"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isReprocessing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Read Again</span>
          </button>

          <button
            onClick={handleCopy}
            disabled={!ocrRecord?.extractedText}
            className="flex items-center space-x-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-50 transition"
            title="Copy text to clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy Text'}</span>
          </button>
        </div>
      </div>

      {/* Internal Text Search Filter */}
      {ocrRecord?.status === 'COMPLETED' && ocrRecord.extractedText && (
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200/80 dark:border-slate-800">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchInText}
              onChange={(e) => setSearchInText(e.target.value)}
              placeholder="Find words in this document..."
              className="w-full pl-8 pr-3 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
            />
          </div>
        </div>
      )}

      {/* OCR Text Area */}
      <div className="flex-1 p-4 overflow-y-auto max-h-[550px] bg-slate-50/30 dark:bg-slate-950/30">
        {currentStatus === 'PROCESSING' ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-500 dark:text-slate-400">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mb-2" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Reading document text...</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">This takes only a few seconds.</p>
          </div>
        ) : currentStatus === 'PENDING' ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-500 dark:text-slate-400">
            <Clock className="w-8 h-8 text-amber-500 mb-2" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Document is waiting to be read.</p>
            <button
              onClick={onReprocess}
              className="mt-3 text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold"
            >
              Start reading now
            </button>
          </div>
        ) : currentStatus === 'FAILED' ? (
          <div className="p-4 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs">
            <p className="font-semibold flex items-center gap-1.5 text-rose-900 dark:text-rose-100">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              Could Not Read Text
            </p>
            <p className="mt-1 text-rose-700 dark:text-rose-300">{ocrRecord?.errorMessage || 'Check image or document clarity.'}</p>
            <button
              onClick={onReprocess}
              className="mt-3 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-medium transition shadow-sm"
            >
              Try Reading Again
            </button>
          </div>
        ) : ocrRecord?.extractedText ? (
          <pre className="font-mono text-xs leading-relaxed text-slate-700 dark:text-slate-200 whitespace-pre-wrap select-text">
            {renderHighlightedText(ocrRecord.extractedText)}
          </pre>
        ) : (
          <p className="text-xs text-slate-400 dark:text-slate-500 italic text-center py-8">No readable text found in this document.</p>
        )}
      </div>
    </div>
  );
}
