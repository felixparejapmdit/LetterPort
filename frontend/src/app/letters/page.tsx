'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { fetchLetters, getDownloadUrl, Letter } from '@/lib/api';
import { StatusBadge, PriorityBadge, TypeBadge, PriorityIcon } from '@/components/StatusBadge';
import EditLetterModal from '@/components/EditLetterModal';
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
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            All Letters
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Find and manage all letters.
          </p>
        </div>

        <Link
          href="/encode"
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/20 transition self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Upload Letter</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-colors">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex-1 relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by subject, sender, receiver, VEM#..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </form>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Type Filter */}
          <div className="flex items-center space-x-1.5 text-xs text-slate-600 dark:text-slate-300">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="INCOMING">Incoming</option>
              <option value="OUTGOING">Outgoing</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-1.5 text-xs text-slate-600 dark:text-slate-300">
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="RECEIVED">Received</option>
              <option value="DRAFT">Draft</option>
              <option value="UNDER_REVIEW">In Review</option>
              <option value="PROCESSED">Completed</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div className="flex items-center space-x-1.5 text-xs text-slate-600 dark:text-slate-300">
            <span>Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setPage(1);
              }}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Priorities</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          {/* Overdue Quick Filter Button */}
          <button
            type="button"
            onClick={() => {
              setOverdueFilter(!overdueFilter);
              setPage(1);
            }}
            className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition ${
              overdueFilter
                ? 'bg-red-500 text-white border-red-600 shadow-xs'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Overdue Only</span>
          </button>

          {/* Active OCR Reading Tag if present */}
          {ocrStatusFilter && (
            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900/60 text-amber-700 dark:text-amber-300 text-xs font-semibold">
              <span>OCR Reading: Pending</span>
              <button
                onClick={() => {
                  setOcrStatusFilter('');
                  setPage(1);
                }}
                className="hover:text-amber-900 dark:hover:text-amber-100 ml-1"
                title="Clear OCR filter"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {/* Reset Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={resetAllFilters}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center space-x-1 text-xs"
              title="Reset all filters"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Letters Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        {loading ? (
          <div className="p-12 text-center text-slate-400 dark:text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
            <p className="text-sm">Loading letters...</p>
          </div>
        ) : displayedLetters.length === 0 ? (
          <div className="p-12 text-center text-slate-400 dark:text-slate-500">
            <FileText className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200">No matching letters</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Try changing your search terms or filters.
            </p>
            {hasActiveFilters && (
              <button
                onClick={resetAllFilters}
                className="mt-4 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700 dark:text-slate-200">
              <thead className="bg-slate-50/80 dark:bg-slate-800/60 text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 sm:px-6 py-3.5">Reference No</th>
                  <th className="px-4 py-3.5">VEM No</th>
                  <th className="px-4 py-3.5">Type</th>
                  <th className="px-4 sm:px-6 py-3.5">Subject</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 hidden md:table-cell">From</th>
                  <th className="px-4 py-3.5 hidden lg:table-cell">To</th>
                  <th className="px-4 py-3.5 hidden sm:table-cell">Date & SLA</th>
                  <th className="px-4 sm:px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {displayedLetters.map((l) => {
                  const isOverdue = l.dueDate && new Date().toISOString().split('T')[0] > l.dueDate && l.status !== 'PROCESSED' && l.status !== 'ARCHIVED';
                  return (
                    <tr key={l.id} className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors ${l.priority === 'URGENT' ? 'bg-rose-50/30 dark:bg-rose-950/20' : ''}`}>
                      <td className="px-4 sm:px-6 py-4 font-mono font-semibold text-xs whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <PriorityIcon priority={l.priority} />
                          <Link href={`/letters/${l.id}`} className="text-blue-600 dark:text-blue-400 hover:underline" title="View details">
                            {l.referenceNumber}
                          </Link>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {l.vemNumber ? (
                          <span className="font-mono text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-200/60 dark:border-emerald-900/60 inline-flex items-center gap-1">
                            <Hash className="w-3 h-3 text-emerald-500" />
                            {l.vemNumber}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <TypeBadge type={l.type} />
                      </td>
                      <td className="px-4 sm:px-6 py-4 font-medium text-slate-900 dark:text-slate-100 max-w-xs truncate" title={l.subject}>
                        {l.subject}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <StatusBadge status={l.status} />
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap hidden md:table-cell">
                        {l.sender}
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap hidden lg:table-cell">
                        {l.recipient}
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap hidden sm:table-cell">
                        <div>{l.letterDate}</div>
                        {l.dueDate && (
                          <div className="flex items-center gap-1 text-[11px] mt-0.5">
                            <span className="text-slate-400">Due:</span>
                            <span className={isOverdue ? 'font-bold text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-300'}>{l.dueDate}</span>
                            {isOverdue && (
                              <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 uppercase">
                                Overdue
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center space-x-1.5">
                          {/* Track Letter Status */}
                          <button
                            onClick={() => setTrackingLetter(l)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-amber-500 hover:text-white dark:hover:bg-amber-500 dark:hover:text-white transition shadow-2xs"
                            title={`Track status for ${l.referenceNumber}`}
                            aria-label={`Track status for ${l.referenceNumber}`}
                          >
                            <Activity className="w-3.5 h-3.5" />
                          </button>

                          {/* Download File */}
                          <a
                            href={getDownloadUrl(l.id)}
                            download
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 dark:hover:text-white transition shadow-2xs"
                            title="Download document"
                            aria-label={`Download document for ${l.referenceNumber}`}
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>

                          {/* Edit */}
                          <button
                            onClick={() => setEditingLetter(l)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white transition shadow-2xs"
                            title={`Edit letter ${l.referenceNumber}`}
                            aria-label={`Edit letter ${l.referenceNumber}`}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          {/* View Details */}
                          <Link
                            href={`/letters/${l.id}`}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 dark:hover:text-white transition shadow-2xs"
                            title={`View details for ${l.referenceNumber}`}
                            aria-label={`View details for ${l.referenceNumber}`}
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 sm:px-6 py-3.5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <span>
              Page <strong>{page}</strong> of <strong>{totalPages}</strong> ({totalCount} total letters)
            </span>
            <div className="flex items-center space-x-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
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
