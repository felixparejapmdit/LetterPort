'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { fetchLetters, deleteLetter, getDownloadUrl, Letter } from '@/lib/api';
import { StatusBadge, PriorityBadge, TypeBadge, PriorityIcon } from '@/components/StatusBadge';
import EditLetterModal from '@/components/EditLetterModal';
import ActionDropdown from '@/components/ActionDropdown';
import { 
  FileText, 
  PlusCircle, 
  Search, 
  Filter, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  Hash,
  Pencil,
  Download,
  AlertTriangle,
  AlertCircle,
  Activity,
  X
} from 'lucide-react';
import TrackingModal from '@/components/TrackingModal';

const PAGE_SIZE = 15;

function LettersContent() {
  const searchParams = useSearchParams();

  const [letters, setLetters] = useState<Letter[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [typeFilter, setTypeFilter] = useState(searchParams.get('type') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [priorityFilter, setPriorityFilter] = useState(searchParams.get('priority') || '');
  const [ocrStatusFilter, setOcrStatusFilter] = useState(searchParams.get('ocrStatus') || '');
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [overdueFilter, setOverdueFilter] = useState(searchParams.get('overdue') === 'true');
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modal States
  const [editingLetter, setEditingLetter] = useState<Letter | null>(null);
  const [trackingLetter, setTrackingLetter] = useState<Letter | null>(null);

  // Sync state when URL query changes (e.g. clicking dashboard links)
  useEffect(() => {
    setTypeFilter(searchParams.get('type') || '');
    setStatusFilter(searchParams.get('status') || '');
    setPriorityFilter(searchParams.get('priority') || '');
    setOcrStatusFilter(searchParams.get('ocrStatus') || '');
    setSearchTerm(searchParams.get('search') || '');
    setOverdueFilter(searchParams.get('overdue') === 'true');
    setPage(1);
  }, [searchParams]);

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
        limit: 15,
      });
      setLetters(data.letters);
      setTotalPages(data.pagination.totalPages || 1);
      setTotalCount(data.pagination.total || 0);
    } catch (err) {
      console.error('Failed to load letters:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLetters();
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

  return (
    <div className="space-y-4">
      {/* Top Header - Compact */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            All Letters
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Find, filter, and manage correspondence archive.
          </p>
        </div>

        <Link
          href="/encode"
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm shadow-blue-500/20 transition self-start sm:self-auto cursor-pointer"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Upload Letter</span>
        </Link>
      </div>

      {/* Filter and Search Bar - Compact */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 transition-colors">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex-1 relative max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search subject, sender, receiver, VEM#..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-slate-100"
          />
        </form>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="px-2 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="">All Types</option>
            <option value="INCOMING">Incoming</option>
            <option value="OUTGOING">Outgoing</option>
          </select>

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

          {/* Overdue Quick Filter Button */}
          <button
            type="button"
            onClick={() => {
              setOverdueFilter(!overdueFilter);
              setPage(1);
            }}
            className={`flex items-center space-x-1 px-2 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
              overdueFilter
                ? 'bg-red-500 text-white border-red-600 shadow-2xs'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <AlertCircle className="w-3 h-3" />
            <span>Overdue</span>
          </button>

          {/* Active OCR Reading Tag if present */}
          {ocrStatusFilter && (
            <span className="inline-flex items-center space-x-1 px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900/60 text-amber-700 dark:text-amber-300 text-xs font-semibold">
              <span>OCR: Pending</span>
              <button
                onClick={() => {
                  setOcrStatusFilter('');
                  setPage(1);
                }}
                className="hover:text-amber-900 dark:hover:text-amber-100 ml-1"
                title="Clear OCR filter"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
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

      {/* Letters Table - Compact Rows */}
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
              Try changing your search terms or filters.
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
                  <th className="px-3.5 py-2">Reference No</th>
                  <th className="px-2.5 py-2">VEM No</th>
                  <th className="px-2.5 py-2">Type</th>
                  <th className="px-3.5 py-2">Subject</th>
                  <th className="px-2.5 py-2">Status</th>
                  <th className="px-2.5 py-2 hidden md:table-cell">From</th>
                  <th className="px-2.5 py-2 hidden lg:table-cell">To</th>
                  <th className="px-2.5 py-2 hidden sm:table-cell">Date & SLA</th>
                  <th className="px-3.5 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {displayedLetters.map((l) => {
                  const isOverdue = l.dueDate && new Date().toISOString().split('T')[0] > l.dueDate && l.status !== 'PROCESSED' && l.status !== 'ARCHIVED';
                  return (
                    <tr key={l.id} className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors ${l.priority === 'URGENT' ? 'bg-rose-50/30 dark:bg-rose-950/20' : ''}`}>
                      <td className="px-3.5 py-2 font-mono font-semibold text-xs whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <PriorityIcon priority={l.priority} />
                          <Link href={`/letters/${l.id}`} className="text-blue-600 dark:text-blue-400 hover:underline" title="View details">
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
                      <td className="px-3.5 py-2 text-right whitespace-nowrap">
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

export default function LettersPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-slate-400 dark:text-slate-500">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
          <p className="text-sm">Loading letters page...</p>
        </div>
      }
    >
      <LettersContent />
    </Suspense>
  );
}
