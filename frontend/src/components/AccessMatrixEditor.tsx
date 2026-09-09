'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  User, 
  CheckCircle2, 
  XCircle, 
  Search, 
  RotateCcw, 
  Save, 
  Info, 
  Lock,
  Sparkles,
  LayoutDashboard,
  FileText,
  FileSearch,
  PlusCircle,
  Settings,
  MousePointerClick,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ALL_PERMISSIONS, PermissionItem, getDefaultPermissionsMap } from '@/lib/permissions';
import { fetchRoles, RoleItem } from '@/lib/api';

export default function AccessMatrixEditor() {
  const { isAdmin, permissions, savePermissions } = useAuth();
  const [localPermissions, setLocalPermissions] = useState<Record<string, Record<string, boolean>>>(permissions);
  const [roles, setRoles] = useState<RoleItem[]>([
    { id: 'admin', code: 'admin', name: 'Admin', description: '', isSystem: true },
    { id: 'user', code: 'user', name: 'Staff', description: '', isSystem: true },
  ]);
  const [selectedPage, setSelectedPage] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;

  // Sync with context permissions on load
  useEffect(() => {
    setLocalPermissions(permissions);
  }, [permissions]);

  // Load dynamic roles from API
  useEffect(() => {
    fetchRoles()
      .then((serverRoles) => {
        if (serverRoles && serverRoles.length > 0) {
          const hasAdmin = serverRoles.some((r) => r.code === 'admin');
          const hasUser = serverRoles.some((r) => r.code === 'user');
          const ordered: RoleItem[] = [];
          if (hasAdmin) ordered.push(serverRoles.find((r) => r.code === 'admin')!);
          else ordered.push({ id: 'admin', code: 'admin', name: 'Admin', description: '', isSystem: true });

          if (hasUser) ordered.push(serverRoles.find((r) => r.code === 'user')!);
          else ordered.push({ id: 'user', code: 'user', name: 'Staff', description: '', isSystem: true });

          const custom = serverRoles.filter((r) => r.code !== 'admin' && r.code !== 'user');
          ordered.push(...custom);
          setRoles(ordered);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setPage(1);
  }, [selectedPage, searchQuery]);

  const pages = ['all', 'Dashboard', 'All Letters', 'Letter Details', 'Encode Letter', 'Live Search', 'Settings'];

  const filteredItems = ALL_PERMISSIONS.filter((item) => {
    const matchesPage = selectedPage === 'all' || item.page === selectedPage;
    const matchesSearch = 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.page.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPage && matchesSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const paginatedItems = filteredItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleToggle = (id: string, roleCode: string) => {
    if (!isAdmin) return;
    setLocalPermissions((prev) => {
      const current = prev[id] || { admin: true, user: false };
      const currentVal = current[roleCode] !== undefined 
        ? !!current[roleCode] 
        : (roleCode === 'admin' ? true : false);
      return {
        ...prev,
        [id]: {
          ...current,
          [roleCode]: !currentVal,
        },
      };
    });
    setSavedSuccess(false);
  };

  const hasUnsavedChanges = JSON.stringify(localPermissions) !== JSON.stringify(permissions);

  const handleSave = async () => {
    setSaving(true);
    try {
      await savePermissions(localPermissions);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save permissions:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (!confirm('Reset all button and action permissions to recommended defaults?')) return;
    const defaults = getDefaultPermissionsMap();
    setLocalPermissions(defaults);
    setSavedSuccess(false);
  };

  const getPageIcon = (page: string) => {
    switch (page) {
      case 'Dashboard': return <LayoutDashboard className="w-3.5 h-3.5 text-blue-500" />;
      case 'All Letters': return <FileText className="w-3.5 h-3.5 text-indigo-500" />;
      case 'Letter Details': return <FileSearch className="w-3.5 h-3.5 text-purple-500" />;
      case 'Encode Letter': return <PlusCircle className="w-3.5 h-3.5 text-emerald-500" />;
      case 'Live Search': return <Search className="w-3.5 h-3.5 text-amber-500" />;
      case 'Settings': return <Settings className="w-3.5 h-3.5 text-slate-500" />;
      default: return <MousePointerClick className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Controls & Filter Bar - Compact */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div className="flex-1 max-w-sm relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search action, button, or page..."
            className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200"
          />
        </div>

        {/* Action Buttons for Admin */}
        {isAdmin ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium transition cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Defaults</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !hasUnsavedChanges}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-2xs ${
                hasUnsavedChanges
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 cursor-pointer animate-pulse'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
              }`}
            >
              <Save className="w-3 h-3" />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-400 font-medium">
            <Lock className="w-3 h-3" />
            <span>Read-Only View</span>
          </div>
        )}
      </div>

      {/* Notifications */}
      {savedSuccess && (
        <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-lg text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Permissions saved! Changes take effect immediately.</span>
        </div>
      )}

      {hasUnsavedChanges && isAdmin && (
        <div className="p-2.5 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 rounded-lg text-xs flex items-center justify-between gap-2 animate-fade-in">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>You have unsaved changes.</span>
          </div>
          <button
            onClick={handleSave}
            className="px-2.5 py-1 bg-amber-600 text-white rounded font-bold text-xs hover:bg-amber-700 transition cursor-pointer"
          >
            Save Now
          </button>
        </div>
      )}

      {/* Category Page Tabs - Compact */}
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 dark:border-slate-800 pb-2">
        {pages.map((p) => {
          const isActive = selectedPage === p;
          return (
            <button
              key={p}
              type="button"
              onClick={() => setSelectedPage(p)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1 cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {p !== 'all' && getPageIcon(p)}
              <span>{p === 'all' ? 'All Pages' : p}</span>
            </button>
          );
        })}
      </div>

      {/* Permissions Table - Compact */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-2.5 py-2.5 w-12 text-center text-slate-400">#</th>
                <th className="px-3.5 py-2.5 min-w-[200px]">Action / Button</th>
                <th className="px-3 py-2.5 min-w-[120px]">Page</th>
                <th className="px-3 py-2.5 min-w-[220px]">Function & Description</th>
                {roles.map((r) => {
                  const rCode = r.code || r.id;
                  const isAdm = rCode === 'admin';
                  const isUsr = rCode === 'user';
                  return (
                    <th key={rCode} className="px-3 py-2.5 text-center min-w-[100px]">
                      <div className={`flex items-center justify-center gap-1 ${
                        isAdm 
                          ? 'text-blue-600 dark:text-blue-400' 
                          : isUsr 
                          ? 'text-emerald-600 dark:text-emerald-400' 
                          : 'text-purple-600 dark:text-purple-400'
                      }`}>
                        {isAdm ? (
                          <ShieldCheck className="w-3.5 h-3.5" />
                        ) : (
                          <User className="w-3.5 h-3.5" />
                        )}
                        <span className="truncate max-w-[100px]">{r.label || r.name || rCode}</span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={4 + roles.length} className="py-6 text-center text-slate-400 text-xs">
                    No matching actions found.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item, idx) => {
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-2.5 py-2 text-center text-slate-400 font-mono text-xs whitespace-nowrap">
                        {(page - 1) * PAGE_SIZE + idx + 1}
                      </td>
                      {/* Action Name */}
                      <td className="px-3.5 py-2 font-semibold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            item.targetType === 'action_icon' 
                              ? 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400' 
                              : item.targetType === 'button'
                              ? 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}>
                            {item.targetType === 'action_icon' ? 'Icon' : item.targetType === 'button' ? 'Button' : 'System'}
                          </span>
                          <span className="truncate">{item.name}</span>
                        </div>
                      </td>

                      {/* Page Location */}
                      <td className="px-3 py-2 text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-1">
                          {getPageIcon(item.page)}
                          <span className="font-medium text-xs">{item.page}</span>
                        </div>
                      </td>

                      {/* Description */}
                      <td className="px-3 py-2 text-[11px] text-slate-500 dark:text-slate-400 max-w-sm truncate">
                        {item.description}
                      </td>

                      {/* Dynamic Role Toggles */}
                      {roles.map((r) => {
                        const rCode = r.code || r.id;
                        const isAdm = rCode === 'admin';
                        const isGranted = localPermissions[item.id]?.[rCode] !== undefined
                          ? !!localPermissions[item.id][rCode]
                          : (isAdm ? item.defaultAdmin : rCode === 'user' ? item.defaultUser : false);

                        return (
                          <td key={rCode} className="px-3 py-2 text-center whitespace-nowrap">
                            <button
                              type="button"
                              disabled={!isAdmin}
                              onClick={() => handleToggle(item.id, rCode)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition ${
                                isGranted
                                  ? isAdm
                                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                                    : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                  : 'bg-rose-50 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                              } ${isAdmin ? 'cursor-pointer hover:scale-105' : 'cursor-default'}`}
                              title={`${isGranted ? 'Granted' : 'Restricted'} for ${r.label || r.name || rCode}`}
                            >
                              {isGranted ? (
                                <CheckCircle2 className={`w-3 h-3 ${isAdm ? 'text-blue-600' : 'text-emerald-600'}`} />
                              ) : (
                                <XCircle className="w-3 h-3 text-rose-600" />
                              )}
                              <span>{isGranted ? 'Granted' : 'Hidden'}</span>
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 15-item Pagination Bar */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs text-slate-500 dark:text-slate-400">
          <div>
            Showing {filteredItems.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, filteredItems.length)} of {filteredItems.length} items (15 / page)
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
    </div>
  );
}
