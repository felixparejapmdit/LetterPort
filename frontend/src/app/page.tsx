'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  fetchStats, 
  fetchLetters, 
  deleteLetter,
  getDownloadUrl,
  DashboardStats, 
  Letter 
} from '@/lib/api';
import { StatusBadge, PriorityBadge, TypeBadge, PriorityIcon } from '@/components/StatusBadge';
import EditLetterModal from '@/components/EditLetterModal';
import TrackingModal from '@/components/TrackingModal';
import ActionDropdown from '@/components/ActionDropdown';
import { 
  Inbox, 
  Send, 
  FileText, 
  Clock, 
  AlertTriangle, 
  AlertCircle,
  PlusCircle, 
  Search, 
  ArrowRight,
  RefreshCw,
  FolderOpen,
  Hash,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const PAGE_SIZE = 15;

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentLetters, setRecentLetters] = useState<Letter[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editingLetter, setEditingLetter] = useState<Letter | null>(null);
  const [trackingLetter, setTrackingLetter] = useState<Letter | null>(null);

  const loadData = async (currentPage = page) => {
    try {
      const [statsData, lettersData] = await Promise.all([
        fetchStats().catch(() => ({
          totalLetters: 0,
          incomingLetters: 0,
          outgoingLetters: 0,
          pendingOCR: 0,
          urgentLetters: 0,
          overdueLetters: 0,
          recentActivity: []
        })),
        fetchLetters({ page: currentPage, limit: PAGE_SIZE }).catch(() => ({ letters: [], pagination: { total: 0, totalPages: 0, page: 1 } })),
      ]);
      setStats(statsData);
      setRecentLetters(lettersData.letters);
      setTotalCount(lettersData.pagination?.total ?? lettersData.letters.length);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData(page);
  }, [page]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData(page);
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div className="space-y-4">
      {/* Top Banner with Actions - Compact */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Letter Dashboard
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Track, search, and manage all your letters.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleRefresh}
            className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 shadow-2xs transition cursor-pointer"
            title="Refresh dashboard"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          <Link
            href="/encode"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm shadow-blue-500/20 transition cursor-pointer active:scale-95"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Upload Letter</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid - 6 columns - Compact */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {/* Total */}
        <Link 
          href="/letters"
          className="group glass-card p-3 rounded-xl hover:border-blue-500/50 hover:shadow-2xs transition-all block cursor-pointer"
          title="View all letters"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider group-hover:text-blue-600 dark:group-hover:text-blue-400">Total</span>
            <div className="p-1.5 bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 rounded-lg">
              <FileText className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-1.5 group-hover:text-blue-600 transition-colors">
            {loading ? '-' : stats?.totalLetters ?? 0}
          </p>
          <span className="text-[10px] text-slate-400 dark:text-slate-500">All letters</span>
        </Link>

        {/* Incoming */}
        <Link 
          href="/letters?type=INCOMING"
          className="group glass-card p-3 rounded-xl hover:border-emerald-500/50 hover:shadow-2xs transition-all block cursor-pointer"
          title="View incoming letters"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Incoming</span>
            <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <Inbox className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl font-bold text-emerald-900 dark:text-emerald-300 mt-1.5 group-hover:text-emerald-600 transition-colors">
            {loading ? '-' : stats?.incomingLetters ?? 0}
          </p>
          <span className="text-[10px] text-slate-400 dark:text-slate-500">Received letters</span>
        </Link>

        {/* Outgoing */}
        <Link 
          href="/letters?type=OUTGOING"
          className="group glass-card p-3 rounded-xl hover:border-indigo-500/50 hover:shadow-2xs transition-all block cursor-pointer"
          title="View outgoing letters"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Outgoing</span>
            <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 rounded-lg">
              <Send className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl font-bold text-indigo-900 dark:text-indigo-300 mt-1.5 group-hover:text-indigo-600 transition-colors">
            {loading ? '-' : stats?.outgoingLetters ?? 0}
          </p>
          <span className="text-[10px] text-slate-400 dark:text-slate-500">Sent letters</span>
        </Link>

        {/* Urgent */}
        <Link 
          href="/letters?priority=URGENT"
          className="group glass-card p-3 rounded-xl hover:border-rose-500/50 hover:shadow-2xs transition-all block cursor-pointer"
          title="View urgent letters"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Urgent</span>
            <div className="p-1.5 bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 rounded-lg">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl font-bold text-rose-900 dark:text-rose-300 mt-1.5 group-hover:text-rose-600 transition-colors">
            {loading ? '-' : stats?.urgentLetters ?? 0}
          </p>
          <span className="text-[10px] text-slate-400 dark:text-slate-500">Needs fast reply</span>
        </Link>

        {/* Overdue */}
        <Link 
          href="/letters?status=OVERDUE"
          className="group glass-card p-3 rounded-xl hover:border-red-500/50 hover:shadow-2xs transition-all block cursor-pointer"
          title="View overdue letters"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">Overdue</span>
            <div className="p-1.5 bg-red-50 dark:bg-red-950/80 text-red-600 dark:text-red-400 rounded-lg">
              <AlertCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl font-bold text-red-900 dark:text-red-300 mt-1.5 group-hover:text-red-600 transition-colors">
            {loading ? '-' : stats?.overdueLetters ?? 0}
          </p>
          <span className="text-[10px] text-slate-400 dark:text-slate-500">Past due date</span>
        </Link>

        {/* Reading (OCR Scanning) */}
        <Link 
          href="/letters?ocrStatus=PENDING"
          className="group glass-card p-3 rounded-xl hover:border-amber-500/50 hover:shadow-2xs transition-all block cursor-pointer"
          title="View letters currently reading/scanning"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Scanning</span>
            <div className="p-1.5 bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 rounded-lg">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl font-bold text-amber-900 dark:text-amber-300 mt-1.5 group-hover:text-amber-600 transition-colors">
            {loading ? '-' : stats?.pendingOCR ?? 0}
          </p>
          <span className="text-[10px] text-slate-400 dark:text-slate-500">Reading document text</span>
        </Link>
      </div>

      {/* Quick Launchpad - Compact */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Link
          href="/encode"
          className="p-3.5 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-sm hover:shadow-md transition group flex flex-col justify-between cursor-pointer"
        >
          <div>
            <div className="p-2 bg-white/20 w-fit rounded-lg backdrop-blur-md mb-2">
              <PlusCircle className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-sm font-bold text-white">Add a New Letter</h2>
            <p className="text-[11px] text-blue-100 mt-0.5">
              Upload scans or PDF files. Text inside is read automatically.
            </p>
          </div>
          <div className="flex items-center text-[11px] font-bold text-blue-100 mt-3 group-hover:translate-x-1 transition-transform">
            <span>Add Letter</span>
            <ArrowRight className="w-3 h-3 ml-1" />
          </div>
        </Link>

        <Link
          href="/search"
          className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-xs transition group flex flex-col justify-between cursor-pointer"
        >
          <div>
            <div className="p-2 bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 w-fit rounded-lg mb-2">
              <Search className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Live Search</h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Search by reference number, sender, receiver, or words inside any document.
            </p>
          </div>
          <div className="flex items-center text-[11px] font-bold text-blue-600 dark:text-blue-400 mt-3 group-hover:translate-x-1 transition-transform">
            <span>Search Letters</span>
            <ArrowRight className="w-3 h-3 ml-1" />
          </div>
        </Link>

        <Link
          href="/letters"
          className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-xs transition group flex flex-col justify-between cursor-pointer"
        >
          <div>
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-400 w-fit rounded-lg mb-2">
              <FolderOpen className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">View All Letters</h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Browse, filter by date or sender, and preview letters.
            </p>
          </div>
          <div className="flex items-center text-[11px] font-bold text-blue-600 dark:text-blue-400 mt-3 group-hover:translate-x-1 transition-transform">
            <span>Open All Letters</span>
            <ArrowRight className="w-3 h-3 ml-1" />
          </div>
        </Link>
      </div>

      {/* Recent Letters Section - Exact 15-Item Pagination & Compact Rows */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden transition-colors">
        <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Recent Letters</h2>
          </div>
          <Link
            href="/letters"
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1"
          >
            <span>See All</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 dark:text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
            <p className="text-xs">Loading letters...</p>
          </div>
        ) : recentLetters.length === 0 ? (
          <div className="p-8 text-center text-slate-400 dark:text-slate-500">
            <FileText className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">No letters added yet</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-sm mx-auto">
              Add your first letter to get started. You can also load sample letters from Settings.
            </p>
            <div className="mt-3 flex items-center justify-center gap-2">
              <Link
                href="/encode"
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white font-medium text-xs hover:bg-blue-700 transition"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Add First Letter</span>
              </Link>
              <Link
                href="/settings"
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                <span>Load Sample Letters</span>
              </Link>
            </div>
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-200">
                <thead className="bg-slate-50/80 dark:bg-slate-800/60 text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-2.5 py-2 w-10 text-center text-slate-400">#</th>
                    <th className="px-3.5 py-2">Reference No</th>
                    <th className="px-2.5 py-2">VEM No</th>
                    <th className="px-2.5 py-2">Type</th>
                    <th className="px-3.5 py-2">Subject</th>
                    <th className="px-2.5 py-2">Status</th>
                    <th className="px-2.5 py-2 hidden md:table-cell">From / To</th>
                    <th className="px-2.5 py-2 hidden sm:table-cell">Dates & Due</th>
                    <th className="px-3.5 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {recentLetters.map((l, index) => {
                    const isOverdue = l.dueDate && new Date().toISOString().split('T')[0] > l.dueDate && l.status !== 'PROCESSED' && l.status !== 'ARCHIVED';
                    return (
                      <tr key={l.id} className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors ${l.priority === 'URGENT' ? 'bg-rose-50/30 dark:bg-rose-950/20' : ''}`}>
                        <td className="px-2.5 py-2 text-center text-slate-400 font-mono text-xs whitespace-nowrap">
                          {(page - 1) * PAGE_SIZE + index + 1}
                        </td>
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
                          <div><strong className="text-slate-700 dark:text-slate-300 font-medium">From:</strong> {l.sender}</div>
                          <div><strong className="text-slate-700 dark:text-slate-300 font-medium">To:</strong> {l.recipient}</div>
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
                            pageContext="dashboard"
                            onTrack={(letter) => setTrackingLetter(letter)}
                            onEdit={(letter) => setEditingLetter(letter)}
                            onDelete={async (letter) => {
                              try {
                                await deleteLetter(letter.id);
                                loadData(page);
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

            {/* 15-item Pagination Bar */}
            <div className="flex items-center justify-between px-3 py-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs text-slate-500 dark:text-slate-400">
              <div>
                Showing {totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, totalCount)} of {totalCount} items (15 / page)
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-1 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="px-2 font-medium">Page {page} of {totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-1 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Letter Modal */}
      <EditLetterModal
        isOpen={!!editingLetter}
        letter={editingLetter}
        onClose={() => setEditingLetter(null)}
        onSaved={() => {
          setEditingLetter(null);
          loadData(page);
        }}
      />

      {/* Tracking Modal */}
      <TrackingModal
        isOpen={!!trackingLetter}
        letter={trackingLetter}
        onClose={() => setTrackingLetter(null)}
      />
    </div>
  );
}
