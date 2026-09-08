import React from 'react';
import { AlertTriangle, AlertCircle, Clock, ArrowDown } from 'lucide-react';

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; label: string }> = {
    RECEIVED: { 
      bg: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-800', 
      label: 'Received' 
    },
    DRAFT: { 
      bg: 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700', 
      label: 'Draft' 
    },
    UNDER_REVIEW: { 
      bg: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800', 
      label: 'In Review' 
    },
    PROCESSED: { 
      bg: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800', 
      label: 'Completed' 
    },
    ARCHIVED: { 
      bg: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/80 dark:text-purple-300 dark:border-purple-800', 
      label: 'Archived' 
    },
  };

  const item = styles[status] || { 
    bg: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700', 
    label: status 
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${item.bg}`}>
      {item.label}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const styles: Record<string, { bg: string; label: string }> = {
    LOW: { 
      bg: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700', 
      label: 'Low' 
    },
    MEDIUM: { 
      bg: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/70 dark:text-blue-300 dark:border-blue-800', 
      label: 'Normal' 
    },
    HIGH: { 
      bg: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800', 
      label: 'High' 
    },
    URGENT: { 
      bg: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-800 animate-pulse', 
      label: 'Urgent' 
    },
  };

  const item = styles[priority] || { 
    bg: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700', 
    label: priority 
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold border ${item.bg}`}>
      {item.label}
    </span>
  );
}

export function PriorityIcon({ priority }: { priority: string }) {
  if (priority === 'URGENT') {
    return (
      <span title="Priority: Urgent" className="inline-flex items-center justify-center p-1 rounded-md bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 shrink-0 animate-pulse border border-rose-200 dark:border-rose-900">
        <AlertTriangle className="w-3.5 h-3.5" />
      </span>
    );
  }
  if (priority === 'HIGH') {
    return (
      <span title="Priority: High" className="inline-flex items-center justify-center p-1 rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 shrink-0 border border-amber-200 dark:border-amber-900">
        <AlertCircle className="w-3.5 h-3.5" />
      </span>
    );
  }
  if (priority === 'MEDIUM') {
    return (
      <span title="Priority: Normal / Medium" className="inline-flex items-center justify-center p-1 rounded-md bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 shrink-0 border border-blue-200 dark:border-blue-900">
        <Clock className="w-3.5 h-3.5" />
      </span>
    );
  }
  return (
    <span title="Priority: Low" className="inline-flex items-center justify-center p-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shrink-0 border border-slate-200 dark:border-slate-700">
      <ArrowDown className="w-3.5 h-3.5" />
    </span>
  );
}

export function TypeBadge({ type }: { type: 'INCOMING' | 'OUTGOING' }) {
  const isIncoming = type === 'INCOMING';

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold border ${
        isIncoming
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800'
          : 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/70 dark:text-indigo-300 dark:border-indigo-800'
      }`}
    >
      {isIncoming ? '↓ Incoming' : '↑ Outgoing'}
    </span>
  );
}

export default StatusBadge;
