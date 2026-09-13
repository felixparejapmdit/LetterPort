'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { 
  fetchLetters, 
  deleteLetter, 
  getDownloadUrl, 
  fetchLetterTypes,
  Letter, 
  ClassificationItem 
} from '@/lib/api';
import { StatusBadge, PriorityBadge, TypeBadge, PriorityIcon } from '@/components/StatusBadge';
import EditLetterModal from '@/components/EditLetterModal';
import TrackingModal from '@/components/TrackingModal';
import ActionDropdown from '@/components/ActionDropdown';
import { useResumen } from '@/context/ResumenContext';
import { useAuth } from '@/context/AuthContext';
import { 
  FileText, 
  PlusCircle, 
  Search, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight, 
  Hash,
  AlertTriangle,
  AlertCircle,
  Activity,
  X,
  Inbox,
  Send,
  BookOpen,
  BookmarkPlus,
  CheckSquare,
  Square,
  Download,
  FolderTree,
  Filter,
  Check
} from 'lucide-react';

const PAGE_SIZE = 15;

export default function LettersPage() {
  const { addMultipleToResumen, resumenLetters, resumenCount } = useResumen();
  const { hasPermission } = useAuth();

  const canBulkSelect = hasPermission('letters_bulk_select');
  const canAddSelectedToResumen = hasPermission('letters_add_to_resumen');
  const canExportLetters = hasPermission('letters_export_csv');
  const canViewResumen = hasPermission('resumen_view');
  const canAddLetter = hasPermission('letters_add_letter');

  const [letters, setLetters] = useState<Letter[]>([]);
  const [types, setTypes] = useState<ClassificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters (initialized synchronously, updated via URL and popstate)
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [ocrStatusFilter, setOcrStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [overdueFilter, setOverdueFilter] = useState(false);
  
  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals
  const [editingLetter, setEditingLetter] = useState<Letter | null>(null);
  const [trackingLetter, setTrackingLetter] = useState<Letter | null>(null);
  const navigatingRef = useRef<string | null>(null);

  const handleNavigate = (e: React.MouseEvent, href: string) => {
    const currentUrl = typeof window !== 'undefined'
      ? (window.location.pathname + window.location.search)
      : '';
    if (currentUrl === href) {
      e.preventDefault();
      return;
    }
    if (navigatingRef.current) {
      e.preventDefault();
      window.location.href = href;
      return;
    }
    navigatingRef.current = href;
    setTimeout(() => {
      if (navigatingRef.current === href) {
        const afterUrl = typeof window !== 'undefined'
          ? (window.location.pathname + window.location.search)
          : '';
        if (afterUrl !== href) {
          window.location.href = href;
        }
      }
    }, 750);
  };

  // Sync state from URL query parameters on mount and browser navigation
  useEffect(() => {
    const syncFromUrl = () => {
      if (typeof window === 'undefined') return;
      const params = new URLSearchParams(window.location.search);
      setTypeFilter(params.get('type') || '');
      setStatusFilter(params.get('status') || '');
      setPriorityFilter(params.get('priority') || '');
      setOcrStatusFilter(params.get('ocrStatus') || '');
      setSearchTerm(params.get('search') || '');
      setOverdueFilter(params.get('overdue') === 'true');
    };

    syncFromUrl();
    window.addEventListener('popstate', syncFromUrl);
    return () => window.removeEventListener('popstate', syncFromUrl);
  }, []);

  // Load custom classification types
  useEffect(() => {
    let isMounted = true;
    async function loadTypes() {
      try {
        const data = await fetchLetterTypes();
        if (isMounted) setTypes(data);
      } catch (err) {
        console.error('Failed to load letter types:', err);
      }
    }
    loadTypes();
    return () => { isMounted = false; };
  }, []);

  const loadLetters = async () => {
    setLoading(true);
    try {
      const data = await fetchLetters({
        type: typeFilter || undefined,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        ocrStatus: ocrStatusFilter || undefined,
        search: searchTerm.trim() || undefined,
        page,
        limit: PAGE_SIZE,
      });
      setLetters(data?.letters || []);
      setTotalPages(data?.pagination?.totalPages || 1);
      setTotalCount(data?.pagination?.total || 0);
    } catch (err) {
      console.error('Failed to load letters:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetchLetters({
      type: typeFilter || undefined,
      status: statusFilter || undefined,
      priority: priorityFilter || undefined,
      ocrStatus: ocrStatusFilter || undefined,
      search: searchTerm.trim() || undefined,
      page,
      limit: PAGE_SIZE,
    })
      .then((data) => {
        if (isMounted) {
          setLetters(data?.letters || []);
          setTotalPages(data?.pagination?.totalPages || 1);
          setTotalCount(data?.pagination?.total || 0);
        }
      })
      .catch((err) => {
        if (isMounted) console.error('Failed to load letters:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    setSelectedIds(new Set());
    return () => {
      isMounted = false;
    };
  }, [typeFilter, statusFilter, priorityFilter, ocrStatusFilter, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadLetters();
  };

  const resetAllFilters = () => {
    setTypeFilter('');
    setStatusFilter('');
    setPriorityFilter('');
    setOcrStatusFilter('');
    setSearchTerm('');
    setOverdueFilter(false);
    setPage(1);
  };

  const hasActiveFilters = Boolean(typeFilter || statusFilter || priorityFilter || ocrStatusFilter || searchTerm || overdueFilter);

  const displayedLetters = overdueFilter
    ? letters.filter((l) => l.dueDate && new Date().toISOString().split('T')[0] > l.dueDate && l.status !== 'PROCESSED' && l.status !== 'ARCHIVED')
    : letters;

  // Multi-select actions
  const toggleSelectAll = () => {
    if (selectedIds.size === displayedLetters.length && displayedLetters.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(displayedLetters.map((l) => l.id)));
    }
  };

  const toggleSelectRow = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleAddSelectedToResumen = () => {
    const selectedLetters = displayedLetters.filter((l) => selectedIds.has(l.id));
    if (selectedLetters.length > 0) {
      addMultipleToResumen(selectedLetters);
      setSelectedIds(new Set());
    }
  };

  const exportSelectedToCSV = () => {
    const lettersToExport = selectedIds.size > 0 
      ? displayedLetters.filter((l) => selectedIds.has(l.id))
      : displayedLetters;
    
    if (lettersToExport.length === 0) return;

    const headers = ['Reference No', 'VEM No', 'Type', 'Subject', 'Status', 'Priority', 'Sender', 'Recipient', 'Letter Date', 'Due Date'];
    const rows = lettersToExport.map((l) => [
      `"${l.referenceNumber}"`,
      `"${l.vemNumber || ''}"`,
      `"${l.type}"`,
      `"${l.subject.replace(/"/g, '""')}"`,
      `"${l.status}"`,
      `"${l.priority}"`,
      `"${l.sender.replace(/"/g, '""')}"`,
      `"${l.recipient.replace(/"/g, '""')}"`,
      `"${l.letterDate}"`,
      `"${l.dueDate || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `letterport_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Types list for the sidebar
  const customTypes = types.filter(t => t.code !== 'INCOMING' && t.code !== 'OUTGOING' && t.isActive);

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            All Letters
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Find, filter, categorize, and compile correspondence dockets.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {canViewResumen && (
            <Link
              href="/resumen"
              prefetch={false}
              onClick={(e) => handleNavigate(e, '/resumen')}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/50 border border-teal-200/80 dark:border-teal-800 font-semibold text-xs transition shadow-2xs"
            >
              <BookOpen className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>Resumen</span>
              {resumenCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-teal-600 text-white">
                  {resumenCount}
                </span>
              )}
            </Link>
          )}

          {canAddLetter && (
            <Link
              href="/encode"
              prefetch={false}
              onClick={(e) => handleNavigate(e, '/encode')}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm shadow-blue-500/20 transition cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Upload Letter</span>
            </Link>
          )}
        </div>
      </div>

      {/* Main Content Layout with Types Sidebar */}
      <div className="flex flex-col lg:flex-row gap-4 items-start">
        {/* Left Sidebar: Letter Types & Quick Views */}
        <aside className="w-full lg:w-60 xl:w-64 shrink-0 space-y-3">
          {/* Types Navigation Card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-3 shadow-2xs">
            <div className="flex items-center justify-between px-1 pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <FolderTree className="w-3.5 h-3.5 text-blue-500" />
                <span>Letter Types</span>
              </span>
              {typeFilter && (
                <button
                  onClick={() => { setTypeFilter(''); setPage(1); }}
                  className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="space-y-1">
              {/* All Types Button */}
              <button
                type="button"
                onClick={() => { setTypeFilter(''); setPage(1); }}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-semibold transition text-left cursor-pointer ${
                  typeFilter === ''
                    ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/30'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5" />
                  <span>All Letters</span>
                </div>
                {typeFilter === '' && <span className="text-[10px] opacity-80">{totalCount}</span>}
              </button>

              {/* Incoming */}
              <button
                type="button"
                onClick={() => { setTypeFilter('INCOMING'); setPage(1); }}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-semibold transition text-left cursor-pointer ${
                  typeFilter === 'INCOMING'
                    ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/30'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Inbox className={`w-3.5 h-3.5 ${typeFilter === 'INCOMING' ? 'text-white' : 'text-blue-500'}`} />
                  <span>Incoming</span>
                </div>
                {typeFilter === 'INCOMING' && <span className="text-[10px] opacity-80">{totalCount}</span>}
              </button>

              {/* Outgoing */}
              <button
                type="button"
                onClick={() => { setTypeFilter('OUTGOING'); setPage(1); }}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-semibold transition text-left cursor-pointer ${
                  typeFilter === 'OUTGOING'
                    ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-500/30'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Send className={`w-3.5 h-3.5 ${typeFilter === 'OUTGOING' ? 'text-white' : 'text-emerald-500'}`} />
                  <span>Outgoing</span>
                </div>
                {typeFilter === 'OUTGOING' && <span className="text-[10px] opacity-80">{totalCount}</span>}
              </button>

              {/* Custom Types */}
              {customTypes.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => { setTypeFilter(t.code); setPage(1); }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-semibold transition text-left cursor-pointer ${
                    typeFilter === t.code
                      ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-500/30'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    <span>{t.label}</span>
                  </div>
                  {typeFilter === t.code && <span className="text-[10px] opacity-80">{totalCount}</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Views Card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-3 shadow-2xs">
            <div className="px-1 pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-amber-500" />
                <span>Quick Views</span>
              </span>
            </div>

            <div className="space-y-1">
              {/* Overdue */}
              <button
                type="button"
                onClick={() => { setOverdueFilter(!overdueFilter); setPage(1); }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition text-left cursor-pointer ${
                  overdueFilter
                    ? 'bg-red-500 text-white font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className={`w-3.5 h-3.5 ${overdueFilter ? 'text-white' : 'text-red-500'}`} />
                  <span>Overdue Letters</span>
                </div>
                {overdueFilter && <Check className="w-3 h-3" />}
              </button>

              {/* Urgent Priority */}
              <button
                type="button"
                onClick={() => {
                  setPriorityFilter(priorityFilter === 'URGENT' ? '' : 'URGENT');
                  setPage(1);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition text-left cursor-pointer ${
                  priorityFilter === 'URGENT'
                    ? 'bg-rose-500 text-white font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className={`w-3.5 h-3.5 ${priorityFilter === 'URGENT' ? 'text-white' : 'text-rose-500'}`} />
                  <span>Urgent Letters</span>
                </div>
                {priorityFilter === 'URGENT' && <Check className="w-3 h-3" />}
              </button>

              {/* In Review */}
              <button
                type="button"
                onClick={() => {
                  setStatusFilter(statusFilter === 'UNDER_REVIEW' ? '' : 'UNDER_REVIEW');
                  setPage(1);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition text-left cursor-pointer ${
                  statusFilter === 'UNDER_REVIEW'
                    ? 'bg-amber-500 text-white font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Activity className={`w-3.5 h-3.5 ${statusFilter === 'UNDER_REVIEW' ? 'text-white' : 'text-amber-500'}`} />
                  <span>Under Review</span>
                </div>
                {statusFilter === 'UNDER_REVIEW' && <Check className="w-3 h-3" />}
              </button>
            </div>
          </div>

          {/* Resumen Quick Card */}
          {canViewResumen && (
            <div className="bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/40 dark:to-emerald-950/30 rounded-xl border border-teal-200/80 dark:border-teal-900/60 p-3 shadow-2xs">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <span className="text-xs font-bold text-teal-900 dark:text-teal-200">Resumen</span>
                </div>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-600 text-white">
                  {resumenCount}
                </span>
              </div>
              <p className="text-[11px] text-teal-800/80 dark:text-teal-300/80 leading-relaxed mb-2.5">
                {resumenCount === 0 
                  ? 'Select letters or use the action menu to add them here.'
                  : `${resumenCount} letter${resumenCount > 1 ? 's' : ''} ready for summary.`}
              </p>
              <Link
                href="/resumen"
                prefetch={false}
                onClick={(e) => handleNavigate(e, '/resumen')}
                className="block w-full text-center py-1.5 px-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs transition"
              >
                Open Resumen
              </Link>
            </div>
          )}
        </aside>

        {/* Right Main Table & Controls Area */}
        <div className="flex-1 min-w-0 space-y-3 w-full">
          {/* Top Filter and Search Bar */}
          <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-colors">
            {/* Search */}
            <form onSubmit={handleSearchSubmit} className="flex-1 relative max-w-md" suppressHydrationWarning>
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search subject, sender, recipient, VEM no..."
                suppressHydrationWarning
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-slate-100"
              />
            </form>

            {/* Dropdown Filters Group */}
            <div className="flex flex-wrap items-center gap-1.5">
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="px-2 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none"
              >
                <option value="">All Statuses</option>
                <option value="RECEIVED">Received</option>
                <option value="DRAFT">Draft</option>
                <option value="UNDER_REVIEW">In Review</option>
                <option value="PROCESSED">Completed</option>
                <option value="ARCHIVED">Archived</option>
              </select>

              {/* Priority Filter */}
              <select
                value={priorityFilter}
                onChange={(e) => {
                  setPriorityFilter(e.target.value);
                  setPage(1);
                }}
                className="px-2 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none"
              >
                <option value="">All Priorities</option>
                <option value="URGENT">⚠️ Urgent</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Normal</option>
                <option value="LOW">Low</option>
              </select>

              {/* Export CSV Button */}
              {canExportLetters && (
                <button
                  type="button"
                  onClick={exportSelectedToCSV}
                  title="Export list to CSV"
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center space-x-1 text-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="hidden sm:inline font-medium">Export</span>
                </button>
              )}

              {/* Reset Filters Button */}
              {hasActiveFilters && (
                <button
                  onClick={resetAllFilters}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center space-x-1 text-xs cursor-pointer"
                  title="Reset all filters"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span className="hidden sm:inline">Reset</span>
                </button>
              )}
            </div>
          </div>

          {/* Active Filter Pills Bar */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-1.5 px-1 text-xs">
              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold">Active filters:</span>
              {typeFilter && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 text-[11px] font-semibold">
                  Type: {typeFilter}
                  <button onClick={() => setTypeFilter('')} className="hover:opacity-75"><X className="w-3 h-3" /></button>
                </span>
              )}
              {statusFilter && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-900 text-indigo-700 dark:text-indigo-300 text-[11px] font-semibold">
                  Status: {statusFilter}
                  <button onClick={() => setStatusFilter('')} className="hover:opacity-75"><X className="w-3 h-3" /></button>
                </span>
              )}
              {priorityFilter && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-[11px] font-semibold">
                  Priority: {priorityFilter}
                  <button onClick={() => setPriorityFilter('')} className="hover:opacity-75"><X className="w-3 h-3" /></button>
                </span>
              )}
              {overdueFilter && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-[11px] font-semibold">
                  Overdue
                  <button onClick={() => setOverdueFilter(false)} className="hover:opacity-75"><X className="w-3 h-3" /></button>
                </span>
              )}
              {searchTerm && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-semibold">
                  Search: "{searchTerm}"
                  <button onClick={() => setSearchTerm('')} className="hover:opacity-75"><X className="w-3 h-3" /></button>
                </span>
              )}
            </div>
          )}

          {/* Bulk Action Bar (when rows are selected) */}
          {canBulkSelect && selectedIds.size > 0 && (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/80 animate-in fade-in duration-150">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-600 text-white">
                  {selectedIds.size}
                </span>
                <span className="text-xs font-semibold text-blue-900 dark:text-blue-200">
                  letter{selectedIds.size > 1 ? 's' : ''} selected
                </span>
              </div>
              <div className="flex items-center gap-2">
                {canAddSelectedToResumen && (
                  <button
                    type="button"
                    onClick={handleAddSelectedToResumen}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                  >
                    <BookmarkPlus className="w-3.5 h-3.5" />
                    <span>Add to Resumen</span>
                  </button>
                )}
                {canExportLetters && (
                  <button
                    type="button"
                    onClick={exportSelectedToCSV}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-semibold transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Export ({selectedIds.size})</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedIds(new Set())}
                  className="px-2 py-1 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                >
                  Deselect
                </button>
              </div>
            </div>
          )}

          {/* Letters Table Card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden transition-colors">
            {loading ? (
              <div className="p-8 text-center text-slate-400 dark:text-slate-500">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                <p className="text-xs">Loading letters...</p>
              </div>
            ) : displayedLetters.length === 0 ? (
              <div className="p-8 text-center text-slate-400 dark:text-slate-500">
                <FileText className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">No matching letters</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-sm mx-auto">
                  Try changing your selected type or filters.
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={resetAllFilters}
                    className="mt-3 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition cursor-pointer"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700 dark:text-slate-200">
                  <thead className="bg-slate-50/80 dark:bg-slate-800/60 text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      {canBulkSelect && (
                        <th className="px-2 py-2 w-7 text-center">
                          <input
                            type="checkbox"
                            checked={selectedIds.size === displayedLetters.length && displayedLetters.length > 0}
                            onChange={toggleSelectAll}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            aria-label="Select all rows"
                          />
                        </th>
                      )}
                      <th className="px-2 py-2 w-9 text-center text-slate-400">#</th>
                      <th className="px-3.5 py-2 text-left w-20">Actions</th>
                      <th className="px-3.5 py-2">Reference No</th>
                      <th className="px-2.5 py-2">VEM No</th>
                      <th className="px-2.5 py-2">Type</th>
                      <th className="px-3.5 py-2">Subject</th>
                      <th className="px-2.5 py-2">Status</th>
                      <th className="px-2.5 py-2 hidden md:table-cell">From</th>
                      <th className="px-2.5 py-2 hidden lg:table-cell">To</th>
                      <th className="px-2.5 py-2 hidden sm:table-cell">Dates & Due</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {displayedLetters.map((l, index) => {
                      const isOverdue = l.dueDate && new Date().toISOString().split('T')[0] > l.dueDate && l.status !== 'PROCESSED' && l.status !== 'ARCHIVED';
                      const isSelected = selectedIds.has(l.id);

                      return (
                        <tr 
                          key={l.id} 
                          className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors ${
                            isSelected 
                              ? 'bg-blue-50/40 dark:bg-blue-950/20' 
                              : l.priority === 'URGENT' 
                                ? 'bg-rose-50/30 dark:bg-rose-950/20' 
                                : ''
                          }`}
                        >
                          {canBulkSelect && (
                            <td className="px-2 py-2 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelectRow(l.id)}
                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                aria-label={`Select letter ${l.referenceNumber}`}
                              />
                            </td>
                          )}
                          <td className="px-2 py-2 text-center text-slate-400 font-mono text-xs whitespace-nowrap">
                            {(page - 1) * PAGE_SIZE + index + 1}
                          </td>
                          <td className="px-3.5 py-2 text-left whitespace-nowrap">
                            <ActionDropdown
                              letter={l}
                              pageContext="letters"
                              onTrack={(letter) => setTrackingLetter(letter)}
                              onEdit={(letter) => setEditingLetter(letter)}
                              onDelete={async (letter) => {
                                try {
                                  await deleteLetter(letter.id);
                                  loadLetters();
                                } catch (err) {
                                  console.error('Failed to delete letter:', err);
                                }
                              }}
                              downloadUrl={getDownloadUrl(l.id)}
                            />
                          </td>
                          <td className="px-3.5 py-2 font-mono font-semibold text-xs whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <PriorityIcon priority={l.priority} />
                              <Link
                                href={`/letters/${l.id}`}
                                prefetch={false}
                                onClick={(e) => handleNavigate(e, `/letters/${l.id}`)}
                                className="text-blue-600 dark:text-blue-400 hover:underline"
                                title="View details"
                              >
                                {l.referenceNumber}
                              </Link>
                            </div>
                          </td>
                          <td className="px-2.5 py-2 whitespace-nowrap">
                            {l.vemNumber ? (
                              <span className="font-mono text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-200/60 dark:border-emerald-900/60 inline-flex items-center gap-1">
                                <Hash className="w-2.5 h-2.5 text-emerald-500" />
                                {l.vemNumber}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs">—</span>
                            )}
                          </td>
                          <td className="px-2.5 py-2 whitespace-nowrap">
                            <TypeBadge type={l.type} />
                          </td>
                          <td className="px-3.5 py-2 font-medium text-slate-900 dark:text-slate-100 max-w-xs truncate" title={l.subject}>
                            {l.subject}
                          </td>
                          <td className="px-2.5 py-2 whitespace-nowrap">
                            <StatusBadge status={l.status} />
                          </td>
                          <td className="px-2.5 py-2 text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap hidden md:table-cell">
                            {l.sender}
                          </td>
                          <td className="px-2.5 py-2 text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap hidden lg:table-cell">
                            {l.recipient}
                          </td>
                          <td className="px-2.5 py-2 text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap hidden sm:table-cell">
                            <div>{l.letterDate}</div>
                            {l.dueDate && (
                              <div className="flex items-center gap-1 text-[10px] mt-0.5">
                                <span className="text-slate-400">Due:</span>
                                <span className={isOverdue ? 'font-bold text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-300'}>{l.dueDate}</span>
                                {isOverdue && (
                                  <span className="text-[9px] font-extrabold px-1 rounded bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 uppercase">
                                    Overdue
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* 15-item Pagination Bar */}
            <div className="flex items-center justify-between px-3 py-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs text-slate-500 dark:text-slate-400">
              <div>
                Showing {totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, totalCount)} of {totalCount} items (15 / page)
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-1 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="px-2 font-medium">Page {page} of {totalPages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-1 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingLetter && (
        <EditLetterModal
          isOpen={!!editingLetter}
          letter={editingLetter}
          onClose={() => setEditingLetter(null)}
          onSaved={(updated) => {
            setLetters((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
            setEditingLetter(null);
          }}
        />
      )}

      {/* Tracking Modal */}
      <TrackingModal
        isOpen={!!trackingLetter}
        letter={trackingLetter}
        onClose={() => setTrackingLetter(null)}
      />
    </div>
  );
}
