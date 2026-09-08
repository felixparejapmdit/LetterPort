'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { 
  MoreVertical, 
  Activity, 
  Eye, 
  Pencil, 
  Download, 
  QrCode, 
  Trash2 
} from 'lucide-react';
import { Letter } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface ActionDropdownProps {
  letter: Letter;
  onTrack: (letter: Letter) => void;
  onEdit: (letter: Letter) => void;
  onDelete?: (letter: Letter) => void;
  downloadUrl: string;
}

export default function ActionDropdown({
  letter,
  onTrack,
  onEdit,
  onDelete,
  downloadUrl,
}: ActionDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { isAdmin } = useAuth();

  // Close on outside click or escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleAction = (action: () => void) => {
    setIsOpen(false);
    action();
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Compact 3-Dots / Hamburger Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`inline-flex items-center justify-center w-8 h-8 rounded-lg transition shadow-2xs cursor-pointer ${
          isOpen
            ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/30'
            : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
        }`}
        title="Letter Actions"
        aria-label={`Actions for ${letter.referenceNumber}`}
        aria-expanded={isOpen}
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {/* Floating Action Menu Popover */}
      {isOpen && (
        <div 
          className="absolute right-0 top-full mt-1.5 z-50 w-44 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-1 divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in zoom-in-95 duration-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Primary View & Track Actions */}
          <div className="py-1">
            <button
              type="button"
              onClick={() => handleAction(() => onTrack(letter))}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-amber-950/30 hover:text-amber-700 dark:hover:text-amber-400 transition text-left cursor-pointer"
            >
              <Activity className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Track Progress</span>
            </button>

            <Link
              href={`/letters/${letter.id}`}
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:text-indigo-700 dark:hover:text-indigo-400 transition text-left cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span>View Document</span>
            </Link>

            <button
              type="button"
              onClick={() => handleAction(() => onEdit(letter))}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-700 dark:hover:text-blue-400 transition text-left cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span>Edit Details</span>
            </button>
          </div>

          {/* Download & Sticker Actions */}
          <div className="py-1">
            <a
              href={downloadUrl}
              download
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-700 dark:hover:text-emerald-400 transition text-left cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Download PDF</span>
            </a>

            <Link
              href={`/letters/${letter.id}?sticker=true`}
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-950/30 hover:text-purple-700 dark:hover:text-purple-400 transition text-left cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5 text-purple-500 shrink-0" />
              <span>Sticker & Slip</span>
            </Link>
          </div>

          {/* Delete Action (Admin Only) */}
          {isAdmin && onDelete && (
            <div className="py-1">
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Are you sure you want to delete letter "${letter.referenceNumber}"?`)) {
                    handleAction(() => onDelete(letter));
                  }
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition text-left cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span>Delete Letter</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
