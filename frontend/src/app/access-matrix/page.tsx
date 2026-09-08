'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  User, 
  Settings, 
  Users, 
  Shield, 
  Info,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import AccessMatrixEditor from '@/components/AccessMatrixEditor';

export default function AccessMatrixPage() {
  const { isAdmin } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/settings"
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white transition mr-1"
              title="Back to Settings"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <span className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60">
              <Shield className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Access Control & Permissions Matrix
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {isAdmin 
              ? 'Modify the capability access view for Administrator and Staff User roles across every page, button, and action icon.'
              : 'Review your granted system capabilities and role boundaries.'}
          </p>
        </div>

        {/* Current User Role Notice & Settings Link */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Your Active Role:</span>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                isAdmin
                  ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
              }`}
            >
              {isAdmin ? <ShieldCheck className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
              {isAdmin ? 'Administrator (Full Access)' : 'Staff User (Standard Access)'}
            </span>
          </div>

          <Link
            href="/settings?tab=general"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-bold shadow-sm transition"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Settings Hub</span>
          </Link>
        </div>
      </div>

      {/* Role Summary Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Administrator Role Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-blue-200/80 dark:border-blue-900/60 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-600 text-white">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Administrator</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">System Operator & Records Custodian</p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              Full Governance
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
            Full authority over letter deletions, custom reference numbering schemes, user accounts, disaster recovery backups, and system maintenance.
          </p>
          <div className="flex flex-wrap gap-1.5 text-[11px]">
            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">Letter CRUD</span>
            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">User Accounts</span>
            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">Format Customization</span>
            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">Backup & Restore</span>
            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">Permissions Toggle</span>
          </div>
        </div>

        {/* Staff User Role Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200/80 dark:border-emerald-900/60 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-600 text-white">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Staff User</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Office Clerk & Daily Processor</p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Standard Processing
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
            Day-to-day workflow access: encode incoming/outgoing correspondence, search documents, track progress drawer, download PDFs, and print routing slips.
          </p>
          <div className="flex flex-wrap gap-1.5 text-[11px]">
            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">Add & Edit Letters</span>
            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">Live Search & OCR</span>
            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">Track Progress</span>
            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">QR Stickers & Slips</span>
            <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300">Deletions Restricted</span>
          </div>
        </div>
      </div>

      {/* Editable Interactive Access Matrix Component */}
      <AccessMatrixEditor />

      {/* Security Best Practices & Governance Note */}
      <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
          <p className="font-semibold text-blue-900 dark:text-blue-200">
            Dynamic Permissions Enforcement Policy
          </p>
          <p>
            When an Administrator toggles and saves changes to the Access Matrix above, the modifications take effect immediately across all active sessions. Action buttons, icons, and menus adapt dynamically to match the updated permission map.
          </p>
        </div>
      </div>
    </div>
  );
}
