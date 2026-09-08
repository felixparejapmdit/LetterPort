'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchLetters, Letter } from '@/lib/api';
import { StatusBadge, PriorityBadge, TypeBadge } from '@/components/StatusBadge';
import { 
  FileText, 
  PlusCircle, 
  Search, 
  Filter, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight,
  Eye,
  Hash
} from 'lucide-react';

export default function LettersPage() {
  const [letters, setLetters] = useState<Letter[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const loadLetters = async () => {
    setLoading(true);
    try {
      const data = await fetchLetters({
        type: typeFilter || undefined,
        status: statusFilter || undefined,
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
  }, [typeFilter, statusFilter, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadLetters();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            All Letters
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Browse, filter, and view all {totalCount} saved incoming and outgoing letters.
          </p>
        </div>

        <Link
          href="/encode"
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/20 transition self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Letter</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex-1 relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by subject, VEM#, sender..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </form>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center space-x-1.5 text-xs text-slate-600 dark:text-slate-300">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Direction:</span>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Letters</option>
              <option value="INCOMING">Incoming Only</option>
              <option value="OUTGOING">Outgoing Only</option>
            </select>
          </div>

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

          <button
            onClick={() => {
              setTypeFilter('');
              setStatusFilter('');
              setSearchTerm('');
              setPage(1);
              loadLetters();
            }}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Reset filters"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Letters Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        {loading ? (
          <div className="p-12 text-center text-slate-400 dark:text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
            <p className="text-sm">Loading letters...</p>
          </div>
        ) : letters.length === 0 ? (
          <div className="p-12 text-center text-slate-400 dark:text-slate-500">
            <FileText className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200">No matching letters</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Try changing your search terms or filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700 dark:text-slate-200">
              <thead className="bg-slate-50/80 dark:bg-slate-800/60 text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 sm:px-6 py-3.5">Reference No</th>
                  <th className="px-4 py-3.5">VEM No</th>
                  <th className="px-4 py-3.5">Direction</th>
                  <th className="px-4 sm:px-6 py-3.5">Subject</th>
                  <th className="px-4 py-3.5 hidden md:table-cell">Sender</th>
                  <th className="px-4 py-3.5 hidden md:table-cell">Recipient</th>
                  <th className="px-4 py-3.5 hidden sm:table-cell">Date</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 sm:px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {letters.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 sm:px-6 py-4 font-mono font-semibold text-xs text-blue-600 dark:text-blue-400 whitespace-nowrap">
                      <Link href={`/letters/${l.id}`} className="hover:underline">
                        {l.referenceNumber}
                      </Link>
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
                    <td className="px-4 py-4 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap hidden md:table-cell">
                      {l.sender}
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap hidden md:table-cell">
                      {l.recipient}
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap hidden sm:table-cell">
                      {l.letterDate}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <StatusBadge status={l.status} />
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-right whitespace-nowrap">
                      <Link
                        href={`/letters/${l.id}`}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white transition shadow-2xs"
                        title={`View letter ${l.referenceNumber}`}
                        aria-label={`View letter ${l.referenceNumber}`}
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
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
    </div>
  );
}
