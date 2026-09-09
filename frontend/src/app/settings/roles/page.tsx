'use client';

import React, { useState, useEffect } from 'react';
import { 
  fetchRoles, 
  createRole, 
  updateRole, 
  deleteRole, 
  RoleItem 
} from '@/lib/api';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  X, 
  Save, 
  AlertCircle, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck,
  Shield,
  ArrowLeft,
  Key
} from 'lucide-react';
import Link from 'next/link';

const PAGE_SIZE = 15;

export default function RolesManagementPage() {
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RoleItem | null>(null);
  const [formName, setFormName] = useState('');
  const [formLabel, setFormLabel] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchRoles();
      setRoles(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingItem(null);
    setFormName('');
    setFormLabel('');
    setFormDescription('');
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: RoleItem) => {
    setEditingItem(item);
    setFormName(item.code || item.name);
    setFormLabel(item.label || item.name);
    setFormDescription(item.description || '');
    setError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formLabel.trim() || (!editingItem && !formName.trim())) {
      setError('Role identifier and label are required');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      if (editingItem) {
        await updateRole(editingItem.id, {
          code: editingItem.code || editingItem.name,
          name: formLabel.trim(),
          label: formLabel.trim(),
          description: formDescription.trim()
        });
        setSuccess(`Role "${formLabel}" updated successfully`);
      } else {
        await createRole({
          code: formName.trim().toLowerCase().replace(/\s+/g, '_'),
          name: formLabel.trim(),
          label: formLabel.trim(),
          description: formDescription.trim()
        });
        setSuccess('Role created successfully');
      }
      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to save role');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: RoleItem) => {
    const isSys = item.isSystem || item.code === 'admin' || item.name === 'admin' || item.code === 'user' || item.name === 'user';
    if (isSys) {
      alert('System roles (admin, user) cannot be deleted.');
      return;
    }
    const displayName = item.label || item.name;
    if (!confirm(`Are you sure you want to delete role "${displayName}"?`)) return;
    try {
      setError(null);
      await deleteRole(item.id);
      setSuccess(`Role "${displayName}" deleted`);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete role');
    }
  };

  const totalPages = Math.max(1, Math.ceil(roles.length / PAGE_SIZE));
  const paginatedRoles = roles.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
            <Link href="/settings" className="hover:text-blue-600 flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" />
              Settings
            </Link>
            <span>/</span>
            <span className="text-slate-700 dark:text-slate-300 font-medium">Access Control</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            User Roles
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Create and manage user roles to control what each person can do in the system.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            href="/settings/access-matrix"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold shadow-2xs transition cursor-pointer"
          >
            <Key className="w-3.5 h-3.5 text-purple-500" />
            <span>Access Matrix</span>
          </Link>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Role</span>
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Table Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-2.5 px-3 w-12 text-center text-slate-400">#</th>
                <th className="py-2.5 px-3">Role Identifier</th>
                <th className="py-2.5 px-3">Display Label</th>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3">Classification</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400 text-xs">
                    Loading roles...
                  </td>
                </tr>
              ) : paginatedRoles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400 text-xs">
                    No roles found. Click "New Role" to add one.
                  </td>
                </tr>
              ) : (
                paginatedRoles.map((r, idx) => {
                  const isSys = Boolean(r.isSystem || r.code === 'admin' || r.code === 'user' || r.name === 'admin' || r.name === 'user');
                  const roleCode = r.code || r.name;
                  const roleLabel = r.label || r.name;
                  return (
                    <tr key={r.id || roleCode} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                      <td className="py-2 px-3 text-center text-slate-400 font-mono text-xs whitespace-nowrap">
                        {(page - 1) * PAGE_SIZE + idx + 1}
                      </td>
                      <td className="py-2 px-3 font-mono font-bold text-purple-600 dark:text-purple-400">
                        {roleCode}
                      </td>
                      <td className="py-2 px-3 font-medium text-slate-900 dark:text-white">
                        {roleLabel}
                      </td>
                      <td className="py-2 px-3 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                        {r.description || '—'}
                      </td>
                      <td className="py-2 px-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          isSys
                            ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                        }`}>
                          <Shield className="w-3 h-3" />
                          <span>{isSys ? 'System Builtin' : 'Custom'}</span>
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right space-x-1">
                        <button
                          onClick={() => openEditModal(r)}
                          className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded transition cursor-pointer"
                          title="Edit Role"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        {!isSys ? (
                          <button
                            onClick={() => handleDelete(r)}
                            className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded transition cursor-pointer"
                            title="Delete Role"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span className="inline-block w-6 text-center text-slate-300 dark:text-slate-600 select-none">
                            —
                          </span>
                        )}
                      </td>
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
            Showing {roles.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, roles.length)} of {roles.length} items (15 / page)
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

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                {editingItem ? `Edit Role (${editingItem.name})` : 'Create New Role'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              {!editingItem && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Role Identifier *
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. auditor, clerk, supervisor"
                    required
                    className="w-full px-2.5 py-1.5 font-mono text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Unique system code (letters, numbers, underscore only)</p>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Display Label *
                </label>
                <input
                  type="text"
                  value={formLabel}
                  onChange={(e) => setFormLabel(e.target.value)}
                  placeholder="e.g. Internal Auditor, Records Clerk"
                  required
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Permissions scope or organizational function..."
                  rows={3}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={saving}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs transition cursor-pointer"
                >
                  <Save className="w-3 h-3" />
                  <span>{saving ? 'Saving...' : 'Save Role'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
