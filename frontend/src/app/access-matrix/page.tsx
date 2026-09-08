'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  User, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  AlertTriangle, 
  Settings, 
  Lock, 
  Users, 
  FileText, 
  Download, 
  Trash2, 
  QrCode, 
  Activity, 
  Search,
  Key,
  Shield,
  ArrowRight,
  Info
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface PermissionItem {
  id: string;
  category: string;
  feature: string;
  description: string;
  adminAccess: 'full' | 'view' | 'none';
  userAccess: 'full' | 'view' | 'none';
  reason?: string;
}

const permissionsList: PermissionItem[] = [
  // 1. Correspondence & Daily Workflow
  {
    id: 'dashboard',
    category: 'Correspondence & Daily Workflow',
    feature: 'Dashboard Analytics & Overdue SLA',
    description: 'View metric counters (total, incoming, outgoing, OCR, urgent, overdue SLA) and recent letters list.',
    adminAccess: 'full',
    userAccess: 'full',
  },
  {
    id: 'search',
    category: 'Correspondence & Daily Workflow',
    feature: 'Live Search & Global Ctrl+K Modal',
    description: 'Instant full-text querying across letter titles, senders, recipients, VEM numbers, and scanned OCR text.',
    adminAccess: 'full',
    userAccess: 'full',
  },
  {
    id: 'view_letter',
    category: 'Correspondence & Daily Workflow',
    feature: 'Document Viewer & OCR Inspector',
    description: 'View scanned PDF/image documents with zoom, rotation, side-by-side OCR text and accuracy scores.',
    adminAccess: 'full',
    userAccess: 'full',
  },
  {
    id: 'tracking_drawer',
    category: 'Correspondence & Daily Workflow',
    feature: 'Full-Height Lateral Tracking Drawer',
    description: 'Inspect the 5-stage progress timeline, overdue SLA alerts, OCR confidence, and copy tracking URLs.',
    adminAccess: 'full',
    userAccess: 'full',
  },
  {
    id: 'download',
    category: 'Correspondence & Daily Workflow',
    feature: 'Download Document Files & Scans',
    description: 'Download high-resolution PDFs and scanned correspondence images.',
    adminAccess: 'full',
    userAccess: 'full',
  },
  {
    id: 'stickers',
    category: 'Correspondence & Daily Workflow',
    feature: 'Print QR Code Stickers & Routing Slips',
    description: 'Generate and print folder/envelope QR code stickers and 1-page official transmittal slips.',
    adminAccess: 'full',
    userAccess: 'full',
  },
  {
    id: 'encode_letter',
    category: 'Correspondence & Daily Workflow',
    feature: 'Add / Encode Letters (Incoming & Outgoing)',
    description: 'Register new correspondence, assign VEM number, set SLA due dates, and upload scanned files.',
    adminAccess: 'full',
    userAccess: 'full',
  },
  {
    id: 'edit_letter',
    category: 'Correspondence & Daily Workflow',
    feature: 'Edit Letter Metadata & Status',
    description: 'Modify subject, sender, recipient, tags, target due date, and transition workflow status.',
    adminAccess: 'full',
    userAccess: 'full',
  },
  {
    id: 'delete_letter',
    category: 'Correspondence & Daily Workflow',
    feature: 'Delete Letter Records',
    description: 'Permanently remove correspondence records and associated scanned documents from the repository.',
    adminAccess: 'full',
    userAccess: 'none',
    reason: 'Restricted to Administrators to prevent accidental document loss and maintain legal audit compliance.'
  },

  // 2. Administration & Security
  {
    id: 'user_management',
    category: 'System Administration & Security',
    feature: 'User Accounts Management',
    description: 'Create accounts, assign Administrator or Staff roles, and reset other staff passwords.',
    adminAccess: 'full',
    userAccess: 'none',
    reason: 'Restricted to Administrators to prevent unauthorized privilege escalation.'
  },
  {
    id: 'self_password',
    category: 'System Administration & Security',
    feature: 'Self Password Change',
    description: 'Allow staff members to safely change their own account password.',
    adminAccess: 'full',
    userAccess: 'full',
  },
  {
    id: 'ref_format',
    category: 'System Administration & Security',
    feature: 'Reference Number Format Customizer',
    description: 'Configure institutional prefix (e.g. LP, DOC), separator (- or /), and digit padding (4-6 digits).',
    adminAccess: 'full',
    userAccess: 'none',
    reason: 'System-wide numbering format must only be modified by system administrators.'
  },
  {
    id: 'nas_settings',
    category: 'System Administration & Security',
    feature: 'NAS Storage & System Maintenance',
    description: 'Configure network attached storage (Synology/QNAP) and check for system updates.',
    adminAccess: 'full',
    userAccess: 'none',
    reason: 'Host hardware and network mount configuration requires administrative credentials.'
  },
  {
    id: 'backup_restore',
    category: 'System Administration & Security',
    feature: 'Letters Backup & Disaster Recovery',
    description: 'Export all letters to JSON backup files and restore previous system snapshots.',
    adminAccess: 'full',
    userAccess: 'none',
    reason: 'Disaster recovery and database restoration are critical administrative procedures.'
  },
  {
    id: 'wipe_data',
    category: 'System Administration & Security',
    feature: 'Clear / Wipe Letters Database',
    description: 'Purge all letters or reload institutional demo letter fixtures.',
    adminAccess: 'full',
    userAccess: 'none',
    reason: 'Mass deletion and database reset are restricted to prevent catastrophic data loss.'
  },
];

export default function AccessMatrixPage() {
  const { user, isAdmin } = useAuth();
  const [selectedRole, setSelectedRole] = useState<'all' | 'admin' | 'user'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = Array.from(new Set(permissionsList.map((p) => p.category)));

  const filteredPermissions = permissionsList.filter((p) => {
    const matchesSearch = 
      p.feature.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const renderBadge = (access: 'full' | 'view' | 'none') => {
    switch (access) {
      case 'full':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Full Access</span>
          </span>
        );
      case 'view':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <Eye className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>View Only</span>
          </span>
        );
      case 'none':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            <span>Restricted</span>
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60">
              <Shield className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Access Control & Permissions Matrix
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Complete permission matrix comparing <strong>Administrator</strong> and <strong>Staff User</strong> roles.
          </p>
        </div>

        {/* Current User Role Notice */}
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

          {isAdmin && (
            <Link
              href="/settings"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-500/20 transition"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Manage Users</span>
            </Link>
          )}
        </div>
      </div>

      {/* Role Summary Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Administrator Role Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-blue-200/80 dark:border-blue-900/60 shadow-xs">
          <div className="flex items-center justify-between mb-3">
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
              15 / 15 Granted
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
            Full governance authority. Can delete correspondence, configure institutional reference numbering, manage user accounts, execute backups, and wipe data.
          </p>
          <div className="flex flex-wrap gap-1.5 text-[11px]">
            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">Letter CRUD</span>
            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">User Management</span>
            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">Format Customization</span>
            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">Backup & Restore</span>
            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">Record Deletions</span>
          </div>
        </div>

        {/* Staff User Role Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200/80 dark:border-emerald-900/60 shadow-xs">
          <div className="flex items-center justify-between mb-3">
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
              9 / 15 Granted
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
            Standard workflow access. Can encode incoming/outgoing correspondence, search documents, track progress drawer, download PDFs, and print routing slips. Restricted from deletions and system settings.
          </p>
          <div className="flex flex-wrap gap-1.5 text-[11px]">
            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">Add & Edit Letters</span>
            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">Live Search & OCR</span>
            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">Track Progress</span>
            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">QR Stickers & Slips</span>
            <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300">No Deletions</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter permissions..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200"
          />
        </div>

        {/* Role View Filter */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/80">
          <button
            type="button"
            onClick={() => setSelectedRole('all')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
              selectedRole === 'all'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Compare Both Roles
          </button>
          <button
            type="button"
            onClick={() => setSelectedRole('admin')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
              selectedRole === 'admin'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Administrator View
          </button>
          <button
            type="button"
            onClick={() => setSelectedRole('user')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
              selectedRole === 'user'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Staff User View
          </button>
        </div>
      </div>

      {/* Permissions Matrix Table */}
      <div className="space-y-6">
        {categories.map((category) => {
          const items = filteredPermissions.filter((p) => p.category === category);
          if (items.length === 0) return null;

          return (
            <div 
              key={category}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden"
            >
              <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <h2 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  {category}
                </h2>
                <span className="text-xs text-slate-400 font-medium">
                  {items.length} capability {items.length === 1 ? '' : 'rules'}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-500 dark:text-slate-400 uppercase text-[11px] font-semibold border-b border-slate-100 dark:border-slate-800">
                    <tr>
                      <th className="px-5 py-3 w-1/3">Feature / Capability</th>
                      <th className="px-4 py-3 w-1/2">Access Scope & Description</th>
                      {(selectedRole === 'all' || selectedRole === 'admin') && (
                        <th className="px-4 py-3 text-center">Administrator</th>
                      )}
                      {(selectedRole === 'all' || selectedRole === 'user') && (
                        <th className="px-4 py-3 text-center">Staff User</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {items.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {p.feature}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-slate-600 dark:text-slate-400">
                          <div>{p.description}</div>
                          {p.reason && (
                            <div className="mt-1 text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1 font-medium">
                              <Info className="w-3 h-3 shrink-0" />
                              <span>{p.reason}</span>
                            </div>
                          )}
                        </td>
                        {(selectedRole === 'all' || selectedRole === 'admin') && (
                          <td className="px-4 py-3.5 text-center whitespace-nowrap">
                            {renderBadge(p.adminAccess)}
                          </td>
                        )}
                        {(selectedRole === 'all' || selectedRole === 'user') && (
                          <td className="px-4 py-3.5 text-center whitespace-nowrap">
                            {renderBadge(p.userAccess)}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      {/* Security Best Practices & Governance Note */}
      <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
          <p className="font-semibold text-blue-900 dark:text-blue-200">
            Institutional Audit & Role Segregation Policy
          </p>
          <p>
            In government, educational, and enterprise settings, Staff Users are intentionally restricted from deleting records or altering reference numbering schemes. This prevents accidental archival loss and guarantees a tamper-resistant correspondence ledger.
          </p>
        </div>
      </div>
    </div>
  );
}
