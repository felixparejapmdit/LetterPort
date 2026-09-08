'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  fetchStats, 
  fetchLetters, 
  DashboardStats, 
  Letter 
} from '@/lib/api';
import { StatusBadge, PriorityBadge, TypeBadge } from '@/components/StatusBadge';
import { 
  Inbox, 
  Send, 
  FileText, 
  Clock, 
  AlertTriangle, 
  PlusCircle, 
  Search, 
  ArrowRight,
  RefreshCw,
  FolderOpen,
  Eye,
  Hash
} from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentLetters, setRecentLetters] = useState<Letter[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [statsData, lettersData] = await Promise.all([
        fetchStats().catch(() => ({
          totalLetters: 0,
          incomingLetters: 0,
          outgoingLetters: 0,
          pendingOCR: 0,
          urgentLetters: 0,
          recentActivity: []
        })),
        fetchLetters({ limit: 8 }).catch(() => ({ letters: [], pagination: { total: 0, totalPages: 0, page: 1 } })),
      ]);
      setStats(statsData);
      setRecentLetters(lettersData.letters);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Top Banner with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Letters Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track and search all incoming and outgoing correspondence in one place.
          </p>
        </div>

        <div className="flex items-center space-x-2.5 sm:space-x-3">
          <button
            onClick={handleRefresh}
            className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition"
            title="Refresh dashboard"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          <Link
            href="/encode"
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/20 transition transform active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Letter</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="glass-card p-4 sm:p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total</span>
            <div className="p-2 bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 rounded-xl">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-3">
            {loading ? '-' : stats?.totalLetters ?? 0}
          </p>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 inline-block">All saved letters</span>
        </div>

        <div className="glass-card p-4 sm:p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Incoming</span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Inbox className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-900 dark:text-emerald-300 mt-3">
            {loading ? '-' : stats?.incomingLetters ?? 0}
          </p>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 inline-block">Letters received</span>
        </div>

        <div className="glass-card p-4 sm:p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Outgoing</span>
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Send className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-indigo-900 dark:text-indigo-300 mt-3">
            {loading ? '-' : stats?.outgoingLetters ?? 0}
          </p>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 inline-block">Letters sent</span>
        </div>

        <div className="glass-card p-4 sm:p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Reading</span>
            <div className="p-2 bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 rounded-xl">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-amber-900 dark:text-amber-300 mt-3">
            {loading ? '-' : stats?.pendingOCR ?? 0}
          </p>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 inline-block">OCR scanning</span>
        </div>

        <div className="glass-card p-4 sm:p-5 rounded-2xl col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Urgent</span>
            <div className="p-2 bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 rounded-xl">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-rose-900 dark:text-rose-300 mt-3">
            {loading ? '-' : stats?.urgentLetters ?? 0}
          </p>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 inline-block">Needs fast reply</span>
        </div>
      </div>

      {/* Quick Launchpad */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/encode"
          className="p-5 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-500/10 hover:shadow-xl hover:shadow-blue-500/20 transition group flex flex-col justify-between"
        >
          <div>
            <div className="p-2.5 bg-white/20 w-fit rounded-xl backdrop-blur-md mb-3">
              <PlusCircle className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-base font-bold text-white">Add a New Letter</h2>
            <p className="text-xs text-blue-100 mt-1">
              Upload a scanned photo or PDF. We will automatically read and index the text for you.
            </p>
          </div>
          <div className="flex items-center text-xs font-bold text-blue-100 mt-4 group-hover:translate-x-1 transition-transform">
            <span>Add Letter</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </div>
        </Link>

        <Link
          href="/search"
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition group flex flex-col justify-between"
        >
          <div>
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 w-fit rounded-xl mb-3">
              <Search className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Live Search</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Search by VEM-Number, subject, or any scanned text as you type in real-time.
            </p>
          </div>
          <div className="flex items-center text-xs font-bold text-blue-600 dark:text-blue-400 mt-4 group-hover:translate-x-1 transition-transform">
            <span>Search Letters</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </div>
        </Link>

        <Link
          href="/letters"
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition group flex flex-col justify-between"
        >
          <div>
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-400 w-fit rounded-xl mb-3">
              <FolderOpen className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">View All Letters</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Browse all letters, filter by sender or date, and view document scans side-by-side.
            </p>
          </div>
          <div className="flex items-center text-xs font-bold text-blue-600 dark:text-blue-400 mt-4 group-hover:translate-x-1 transition-transform">
            <span>Open All Letters</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </div>
        </Link>
      </div>

      {/* Recent Letters Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        <div className="px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Recent Letters</h2>
          </div>
          <Link
            href="/letters"
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1"
          >
            <span>See All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 dark:text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
            <p className="text-sm">Loading letters...</p>
          </div>
        ) : recentLetters.length === 0 ? (
          <div className="p-12 text-center text-slate-400 dark:text-slate-500">
            <FileText className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200">No letters added yet</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Add your first letter to get started. You can also load sample letters from Settings.
            </p>
            <div className="mt-4 flex items-center justify-center gap-3">
              <Link
                href="/encode"
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-medium text-xs hover:bg-blue-700 transition"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Add First Letter</span>
              </Link>
              <Link
                href="/settings"
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                <span>Load Sample Letters</span>
              </Link>
            </div>
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
                  <th className="px-4 py-3.5 hidden md:table-cell">From / To</th>
                  <th className="px-4 py-3.5 hidden sm:table-cell">Date</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 sm:px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {recentLetters.map((l) => (
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
                      <div><strong className="text-slate-700 dark:text-slate-300 font-medium">From:</strong> {l.sender}</div>
                      <div><strong className="text-slate-700 dark:text-slate-300 font-medium">To:</strong> {l.recipient}</div>
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
      </div>
    </div>
  );
}
