'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  BookOpen, 
  Printer, 
  Download, 
  Trash2, 
  ArrowLeft, 
  PlusCircle, 
  Eye, 
  QrCode, 
  FileText, 
  Send, 
  Inbox, 
  AlertTriangle, 
  Hash
} from 'lucide-react';
import { useResumen } from '@/context/ResumenContext';
import { useAuth } from '@/context/AuthContext';
import { StatusBadge, PriorityBadge, TypeBadge, PriorityIcon } from '@/components/StatusBadge';

export default function ResumenPage() {
  const { 
    resumenLetters, 
    remarks, 
    updateRemark, 
    removeFromResumen, 
    clearResumen 
  } = useResumen();
  const { user } = useAuth();

  const [docketTitle, setDocketTitle] = useState('Letters Summary');
  const [docketOffice, setDocketOffice] = useState('Executive Office');
  const [editingHeader, setEditingHeader] = useState(false);

  const incomingCount = resumenLetters.filter((l) => l.type === 'INCOMING').length;
  const outgoingCount = resumenLetters.filter((l) => l.type === 'OUTGOING').length;
  const urgentCount = resumenLetters.filter((l) => l.priority === 'URGENT').length;
  const overdueCount = resumenLetters.filter((l) => 
    l.dueDate && new Date().toISOString().split('T')[0] > l.dueDate && l.status !== 'PROCESSED' && l.status !== 'ARCHIVED'
  ).length;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (resumenLetters.length === 0) return;

    const headers = [
      '#', 
      'Reference No', 
      'VEM No', 
      'Type', 
      'Subject', 
      'Priority', 
      'Status', 
      'Sender', 
      'Recipient', 
      'Letter Date', 
      'Due Date', 
      'Remarks'
    ];

    const rows = resumenLetters.map((l, index) => [
      index + 1,
      `"${l.referenceNumber}"`,
      `"${l.vemNumber || ''}"`,
      `"${l.type}"`,
      `"${l.subject.replace(/"/g, '""')}"`,
      `"${l.priority}"`,
      `"${l.status}"`,
      `"${l.sender.replace(/"/g, '""')}"`,
      `"${l.recipient.replace(/"/g, '""')}"`,
      `"${l.letterDate}"`,
      `"${l.dueDate || ''}"`,
      `"${(remarks[l.id] || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `resumen_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  return (
    <div className="space-y-4">
      {/* Top Header & Actions */}
      <div className="print:hidden space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/letters"
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Back to All Letters"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                  <span>Resumen</span>
                </h1>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                  {resumenLetters.length} {resumenLetters.length === 1 ? 'letter' : 'letters'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Summary of letters ready for review and routing.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/letters"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs shadow-2xs transition cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 text-blue-500" />
              <span>Add Letters</span>
            </Link>

            {resumenLetters.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs shadow-2xs transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Export CSV</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-sm shadow-teal-500/20 transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Clear all letters from Resumen?')) {
                      clearResumen();
                    }
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                  title="Clear Resumen"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Quick Summary Cards */}
        {resumenLetters.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-3">
              <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total</div>
                <div className="text-lg font-bold text-slate-900 dark:text-white">{resumenLetters.length}</div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                <Inbox className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Incoming</div>
                <div className="text-lg font-bold text-slate-900 dark:text-white">{incomingCount}</div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                <Send className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Outgoing</div>
                <div className="text-lg font-bold text-slate-900 dark:text-white">{outgoingCount}</div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-3">
              <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Urgent / Due</div>
                <div className="text-lg font-bold text-rose-600 dark:text-rose-400">
                  {urgentCount} <span className="text-xs font-normal text-slate-400">/ {overdueCount}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Table Container */}
      {resumenLetters.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-12 text-center shadow-2xs">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 dark:bg-teal-950/50 border border-teal-200/60 dark:border-teal-800/60 flex items-center justify-center mx-auto mb-4 text-teal-600 dark:text-teal-400">
            <BookOpen className="w-8 h-8" />
          </div>
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
            No Letters in Resumen
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
            Add letters from the All Letters page or click "Add to Resumen" in any letter’s action menu.
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <Link
              href="/letters"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm shadow-blue-500/20 transition"
            >
              <FileText className="w-4 h-4" />
              <span>Go to All Letters</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden transition-colors print:border-none print:shadow-none print:m-0 print:p-0">
          {/* Printable Header */}
          <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 print:bg-white print:border-b-2 print:border-slate-900 print:p-2 print:mb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400 dark:text-slate-500 print:text-black font-semibold">
                  CORRESPONDENCE SUMMARY
                </div>
                {editingHeader ? (
                  <div className="mt-1 space-y-1 print:hidden">
                    <input
                      type="text"
                      value={docketTitle}
                      onChange={(e) => setDocketTitle(e.target.value)}
                      className="text-base font-bold px-2 py-1 border rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white w-full max-w-md"
                    />
                    <input
                      type="text"
                      value={docketOffice}
                      onChange={(e) => setDocketOffice(e.target.value)}
                      className="text-xs px-2 py-1 border rounded bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 w-full max-w-md"
                    />
                    <button
                      type="button"
                      onClick={() => setEditingHeader(false)}
                      className="text-[11px] font-semibold text-blue-600 hover:underline"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <div>
                    <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white print:text-black tracking-tight mt-0.5">
                      {docketTitle}
                    </h2>
                    <p className="text-xs text-slate-600 dark:text-slate-300 print:text-black font-medium">
                      {docketOffice}
                    </p>
                  </div>
                )}
              </div>

              <div className="text-left sm:text-right text-xs text-slate-500 dark:text-slate-400 print:text-black space-y-0.5">
                <div>
                  <span className="font-semibold text-slate-700 dark:text-slate-300 print:text-black">Date:</span> {todayFormatted}
                </div>
                <div>
                  <span className="font-semibold text-slate-700 dark:text-slate-300 print:text-black">Prepared By:</span> {user?.username || 'Staff'}
                </div>
                <button
                  type="button"
                  onClick={() => setEditingHeader(!editingHeader)}
                  className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline print:hidden"
                >
                  {editingHeader ? 'Done' : 'Edit Header'}
                </button>
              </div>
            </div>
          </div>

          {/* Letters Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-200 print:text-black print:text-[10px]">
              <thead className="bg-slate-50/80 dark:bg-slate-800/60 print:bg-slate-100 text-[10px] text-slate-500 dark:text-slate-400 print:text-black uppercase font-semibold border-b border-slate-200 dark:border-slate-800 print:border-black">
                <tr>
                  <th className="px-2.5 py-2 w-8 text-center text-slate-400 print:text-black">#</th>
                  <th className="px-3 py-2 text-left w-20 print:hidden">Actions</th>
                  <th className="px-3.5 py-2 whitespace-nowrap">Reference No</th>
                  <th className="px-2.5 py-2 whitespace-nowrap">VEM No</th>
                  <th className="px-2.5 py-2 whitespace-nowrap">Type</th>
                  <th className="px-3.5 py-2">Subject</th>
                  <th className="px-2.5 py-2 hidden sm:table-cell">From / To</th>
                  <th className="px-2.5 py-2 whitespace-nowrap">Status</th>
                  <th className="px-3.5 py-2 min-w-[200px]">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 print:divide-black">
                {resumenLetters.map((l, index) => {
                  const isOverdue = l.dueDate && new Date().toISOString().split('T')[0] > l.dueDate && l.status !== 'PROCESSED' && l.status !== 'ARCHIVED';
                  const remark = remarks[l.id] || '';

                  return (
                    <tr 
                      key={l.id} 
                      className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors ${
                        l.priority === 'URGENT' ? 'bg-rose-50/20 dark:bg-rose-950/20' : ''
                      }`}
                    >
                      {/* # Column */}
                      <td className="px-2.5 py-2.5 text-center text-slate-400 print:text-black font-mono text-xs whitespace-nowrap">
                        {index + 1}
                      </td>

                      {/* Actions Column */}
                      <td className="px-3 py-2.5 text-left whitespace-nowrap print:hidden">
                        <div className="flex items-center gap-1">
                          <Link
                            href={`/letters/${l.id}`}
                            className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition"
                            title="View"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                          <Link
                            href={`/letters/${l.id}?sticker=true`}
                            className="p-1 rounded text-slate-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition"
                            title="Routing Slip"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => removeFromResumen(l.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                            title="Remove"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Reference No */}
                      <td className="px-3.5 py-2.5 font-mono font-semibold text-xs whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <PriorityIcon priority={l.priority} />
                          <span className="text-slate-900 dark:text-slate-100 print:text-black">
                            {l.referenceNumber}
                          </span>
                        </div>
                      </td>

                      {/* VEM No */}
                      <td className="px-2.5 py-2.5 whitespace-nowrap">
                        {l.vemNumber ? (
                          <span className="font-mono text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-200/60 dark:border-emerald-900/60 print:border-black print:text-black">
                            {l.vemNumber}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>

                      {/* Type */}
                      <td className="px-2.5 py-2.5 whitespace-nowrap">
                        <TypeBadge type={l.type} />
                      </td>

                      {/* Subject */}
                      <td className="px-3.5 py-2.5 font-medium text-slate-900 dark:text-slate-100 print:text-black max-w-xs">
                        <div>{l.subject}</div>
                        <div className="text-[10px] text-slate-400 print:text-slate-600 mt-0.5">
                          Dated: {l.letterDate} {l.dueDate ? `| Due: ${l.dueDate}` : ''}
                        </div>
                      </td>

                      {/* Sender / Recipient */}
                      <td className="px-2.5 py-2.5 text-[11px] text-slate-600 dark:text-slate-300 print:text-black hidden sm:table-cell">
                        <div><span className="font-semibold text-slate-400">From:</span> {l.sender}</div>
                        <div><span className="font-semibold text-slate-400">To:</span> {l.recipient}</div>
                      </td>

                      {/* Status */}
                      <td className="px-2.5 py-2.5 whitespace-nowrap">
                        <StatusBadge status={l.status} />
                      </td>

                      {/* Remarks */}
                      <td className="px-3.5 py-2.5">
                        <div className="print:hidden">
                          <input
                            type="text"
                            value={remark}
                            onChange={(e) => updateRemark(l.id, e.target.value)}
                            placeholder="Add remark or note..."
                            className="w-full px-2 py-1 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded focus:outline-none focus:ring-1 focus:ring-teal-500 text-slate-900 dark:text-slate-100"
                          />
                        </div>
                        <div className="hidden print:block text-[11px] font-medium text-black italic">
                          {remark || '________________________________________________'}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Sign-off Section */}
          <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20 print:bg-white print:border-t-2 print:border-slate-900 print:p-4 print:mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs text-slate-600 dark:text-slate-300 print:text-black">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 print:text-black mb-1">
                  Prepared By
                </div>
                <div className="border-b border-slate-300 dark:border-slate-700 print:border-black pt-6 pb-1 font-semibold text-slate-800 dark:text-slate-200 print:text-black">
                  {user?.username ? user.username.toUpperCase() : 'RECORDS OFFICER'}
                </div>
                <div className="text-[10px] text-slate-400 print:text-slate-600 mt-1">
                  Records Section
                </div>
              </div>

              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 print:text-black mb-1">
                  Endorsed By
                </div>
                <div className="border-b border-slate-300 dark:border-slate-700 print:border-black pt-6 pb-1 font-semibold text-slate-800 dark:text-slate-200 print:text-black">
                  &nbsp;
                </div>
                <div className="text-[10px] text-slate-400 print:text-slate-600 mt-1">
                  Office Head
                </div>
              </div>

              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 print:text-black mb-1">
                  Received By
                </div>
                <div className="border-b border-slate-300 dark:border-slate-700 print:border-black pt-6 pb-1 font-semibold text-slate-800 dark:text-slate-200 print:text-black">
                  &nbsp;
                </div>
                <div className="text-[10px] text-slate-400 print:text-slate-600 mt-1">
                  Signature / Date
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
