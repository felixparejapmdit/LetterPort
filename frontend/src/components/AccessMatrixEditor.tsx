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
  MousePointerClick
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ALL_PERMISSIONS, PermissionItem, getDefaultPermissionsMap } from '@/lib/permissions';

export default function AccessMatrixEditor() {
  const { isAdmin, permissions, savePermissions } = useAuth();
  const [localPermissions, setLocalPermissions] = useState<Record<string, { admin: boolean; user: boolean }>>(permissions);
  const [selectedPage, setSelectedPage] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sync with context permissions on load
  useEffect(() => {
    setLocalPermissions(permissions);
  }, [permissions]);

  const pages = ['all', 'Dashboard', 'All Letters', 'Letter Details', 'Encode Letter', 'Live Search', 'Settings'];

  const filteredItems = ALL_PERMISSIONS.filter((item) => {
    const matchesPage = selectedPage === 'all' || item.page === selectedPage;
    const matchesSearch = 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.page.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPage && matchesSearch;
  });

  const handleToggle = (id: string, role: 'admin' | 'user') => {
    if (!isAdmin) return;
    setLocalPermissions((prev) => {
      const current = prev[id] || { admin: true, user: false };
      return {
        ...prev,
        [id]: {
          ...current,
          [role]: !current[role],
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
      case 'Dashboard': return <LayoutDashboard className="w-4 h-4 text-blue-500" />;
      case 'All Letters': return <FileText className="w-4 h-4 text-indigo-500" />;
      case 'Letter Details': return <FileSearch className="w-4 h-4 text-purple-500" />;
      case 'Encode Letter': return <PlusCircle className="w-4 h-4 text-emerald-500" />;
      case 'Live Search': return <Search className="w-4 h-4 text-amber-500" />;
      case 'Settings': return <Settings className="w-4 h-4 text-slate-500" />;
      default: return <MousePointerClick className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Controls & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex-1 max-w-sm relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search action button, icon, or page..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200"
          />
        </div>

        {/* Action Buttons for Admin */}
        {isAdmin ? (
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !hasUnsavedChanges}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
                hasUnsavedChanges
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 animate-pulse'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
              }`}
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save Matrix Changes'}</span>
            </button>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-400 font-medium">
            <Lock className="w-3.5 h-3.5" />
            <span>Read-Only View (Admin can modify)</span>
          </div>
        )}
      </div>

      {/* Notifications */}
      {savedSuccess && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Access permissions updated successfully! Changes are active immediately across all pages.</span>
        </div>
      )}

      {hasUnsavedChanges && isAdmin && (
        <div className="p-3.5 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 rounded-xl text-xs flex items-center justify-between gap-2 animate-fade-in">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <span>You have unsaved permission modifications. Click <strong>Save Matrix Changes</strong> to apply.</span>
          </div>
          <button
            onClick={handleSave}
            className="px-3 py-1 bg-amber-600 text-white rounded-lg font-bold text-xs hover:bg-amber-700 transition"
          >
            Save Now
          </button>
        </div>
      )}

      {/* Category Page Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2">
        {pages.map((p) => {
          const isActive = selectedPage === p;
          return (
            <button
              key={p}
              type="button"
              onClick={() => setSelectedPage(p)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/20'
                  : 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {p !== 'all' && getPageIcon(p)}
              <span>{p === 'all' ? 'All Pages' : p}</span>
            </button>
          );
        })}
      </div>

      {/* Permissions Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50/80 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase text-[11px] font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3.5 w-1/4">Action / Button</th>
                <th className="px-4 py-3.5 w-1/6">Page Location</th>
                <th className="px-4 py-3.5 w-2/5">Function & Description</th>
                <th className="px-4 py-3.5 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-blue-600 dark:text-blue-400">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Administrator</span>
                  </div>
                </th>
                <th className="px-4 py-3.5 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                    <User className="w-4 h-4" />
                    <span>Staff User</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredItems.map((item) => {
                const adminGranted = localPermissions[item.id]?.admin ?? item.defaultAdmin;
                const userGranted = localPermissions[item.id]?.user ?? item.defaultUser;

                return (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    {/* Action Name */}
                    <td className="px-5 py-3.5 font-semibold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <span className={`p-1.5 rounded-lg text-xs ${
                          item.targetType === 'action_icon' 
                            ? 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400' 
                            : item.targetType === 'button'
                            ? 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {item.targetType === 'action_icon' ? 'Icon' : item.targetType === 'button' ? 'Button' : 'Feature'}
                        </span>
                        <span>{item.name}</span>
                      </div>
                    </td>

                    {/* Page Location */}
                    <td className="px-4 py-3.5 text-xs text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        {getPageIcon(item.page)}
                        <span className="font-medium">{item.page}</span>
                      </div>
                    </td>

                    {/* Description */}
                    <td className="px-4 py-3.5 text-xs text-slate-500 dark:text-slate-400">
                      {item.description}
                    </td>

                    {/* Admin Toggle */}
                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      <button
                        type="button"
                        disabled={!isAdmin}
                        onClick={() => handleToggle(item.id, 'admin')}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition ${
                          adminGranted
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700 opacity-60'
                        } ${isAdmin ? 'cursor-pointer hover:scale-105' : 'cursor-default'}`}
                      >
                        {adminGranted ? <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /> : <XCircle className="w-3.5 h-3.5 text-slate-400" />}
                        <span>{adminGranted ? 'Granted' : 'Hidden'}</span>
                      </button>
                    </td>

                    {/* Staff User Toggle */}
                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      <button
                        type="button"
                        disabled={!isAdmin}
                        onClick={() => handleToggle(item.id, 'user')}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition ${
                          userGranted
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                        } ${isAdmin ? 'cursor-pointer hover:scale-105' : 'cursor-default'}`}
                      >
                        {userGranted ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5 text-rose-600" />}
                        <span>{userGranted ? 'Granted' : 'Restricted'}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
