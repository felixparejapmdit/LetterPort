'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  pageContext?: 'dashboard' | 'letters';
}

export default function ActionDropdown({
  letter,
  onTrack,
  onEdit,
  onDelete,
  downloadUrl,
  pageContext = 'dashboard',
}: ActionDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; placeAbove: boolean }>({
    top: 0,
    left: 0,
    placeAbove: false
  });

  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { isAdmin, hasPermission } = useAuth();

  const isDashboard = pageContext === 'dashboard';
  const canTrack = hasPermission(isDashboard ? 'dashboard_track' : 'letters_track');
  const canView = hasPermission(isDashboard ? 'dashboard_view' : 'letters_view');
  const canEdit = hasPermission(isDashboard ? 'dashboard_edit' : 'letters_edit');
  const canDownload = hasPermission(isDashboard ? 'dashboard_download' : 'letters_download');
  const canSticker = isDashboard ? true : hasPermission('letters_sticker');
  const canDelete = hasPermission(isDashboard ? 'dashboard_delete' : 'letters_delete');

  const hasAnyAction = canTrack || canView || canEdit || canDownload || canSticker || (isAdmin && canDelete);

  useEffect(() => {
    setMounted(true);
  }, []);

  const computeCoords = () => {
    if (!buttonRef.current) return null;
    const rect = buttonRef.current.getBoundingClientRect();
    const menuEstimatedHeight = 220;
    const spaceBelow = window.innerHeight - rect.bottom;
    const placeAbove = spaceBelow < menuEstimatedHeight && rect.top > menuEstimatedHeight;

    const width = 176; // w-44 = 11rem = 176px
    const left = Math.min(window.innerWidth - width - 12, Math.max(12, rect.right - width));

    return {
      top: placeAbove ? rect.top - 6 : rect.bottom + 6,
      left,
      placeAbove
    };
  };

  const updateCoords = () => {
    const c = computeCoords();
    if (c) setCoords(c);
  };

  useEffect(() => {
    if (!isOpen) return;

    updateCoords();

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        buttonRef.current && buttonRef.current.contains(target)
      ) {
        return;
      }
      if (menuRef.current && !menuRef.current.contains(target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    const handleScrollOrResize = () => {
      updateCoords();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen]);

  const handleAction = (action: () => void) => {
    setIsOpen(false);
    action();
  };

  if (!hasAnyAction) {
    return (
      <span className="text-slate-300 dark:text-slate-700 text-xs italic">
        No actions
      </span>
    );
  }

  const menuContent = isOpen && mounted && (coords.top > 0 || coords.left > 0) ? (
    <div
      ref={menuRef}
      role="menu"
      style={{
        position: 'fixed',
        top: coords.top,
        left: coords.left,
        zIndex: 9999,
        transform: coords.placeAbove ? 'translateY(-100%)' : 'none'
      }}
      className="w-44 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl py-1 divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in zoom-in-95 duration-100"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Primary View & Track Actions */}
      {(canTrack || canView || canEdit) && (
        <div className="py-1">
          {canTrack && (
            <button
              type="button"
              onClick={() => handleAction(() => onTrack(letter))}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-amber-950/30 hover:text-amber-700 dark:hover:text-amber-400 transition text-left cursor-pointer"
            >
              <Activity className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Track Progress</span>
            </button>
          )}

          {canView && (
            <Link
              href={`/letters/${letter.id}`}
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:text-indigo-700 dark:hover:text-indigo-400 transition text-left cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span>View Document</span>
            </Link>
          )}

          {canEdit && (
            <button
              type="button"
              onClick={() => handleAction(() => onEdit(letter))}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-700 dark:hover:text-blue-400 transition text-left cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span>Edit Details</span>
            </button>
          )}
        </div>
      )}

      {/* Download & Sticker Actions */}
      {(canDownload || canSticker) && (
        <div className="py-1">
          {canDownload && (
            <a
              href={downloadUrl}
              download
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-700 dark:hover:text-emerald-400 transition text-left cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Download PDF</span>
            </a>
          )}

          {canSticker && (
            <Link
              href={`/letters/${letter.id}?sticker=true`}
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-950/30 hover:text-purple-700 dark:hover:text-purple-400 transition text-left cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5 text-purple-500 shrink-0" />
              <span>Sticker & Slip</span>
            </Link>
          )}
        </div>
      )}

      {/* Delete Action */}
      {canDelete && onDelete && (
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
  ) : null;

  return (
    <div className="relative inline-block text-left">
      {/* Compact 3-Dots / Hamburger Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (isOpen) {
            setIsOpen(false);
          } else {
            const calculated = computeCoords();
            if (calculated) setCoords(calculated);
            setIsOpen(true);
          }
        }}
        className={`inline-flex items-center justify-center w-7 h-7 rounded-md transition shadow-2xs cursor-pointer ${
          isOpen
            ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/30'
            : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
        }`}
        title="Letter Actions"
        aria-label={`Actions for ${letter.referenceNumber}`}
        aria-expanded={isOpen}
      >
        <MoreVertical className="w-3.5 h-3.5" />
      </button>

      {/* Render menu portal in document.body to prevent any container clipping */}
      {mounted && typeof document !== 'undefined' && createPortal(menuContent, document.body)}
    </div>
  );
}
