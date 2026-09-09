'use client';

import React, { useState, useEffect } from 'react';
import { 
  fetchStatuses, 
  createStatus, 
  updateStatus, 
  deleteStatus, 
  ClassificationItem 
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
  Layers,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

const PAGE_SIZE = 15;

export default function StatusesManagementPage() {
  const [statuses, setStatuses] = useState<ClassificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ClassificationItem | null>(null);
  const [formCode, setFormCode] = useState('');
  const [formLabel, setFormLabel] = useState('');
  const [formColor, setFormColor] = useState('blue');
  const [formDescription, setFormDescription] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchStatuses();
      setStatuses(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load statuses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingItem(null);
    setFormCode('');
    setFormLabel('');
    setFormColor('blue');
    setFormDescription('');
    setFormIsActive(true);
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: ClassificationItem) => {
    setEditingItem(item);
    setFormCode(item.code);
    setFormLabel(item.label);
    setFormColor(item.color || 'blue');
    setFormDescription(item.description || '');
    setFormIsActive(item.isActive !== false);
    setError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCode.trim() || !formLabel.trim()) {
      setError('Code and Label are required');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      if (editingItem) {
        await updateStatus(editingItem.id, {
          code: formCode.trim().toUpperCase(),
          label: formLabel.trim(),
          color: formColor,
          description: formDescription.trim(),
          isActive: formIsActive
        });
        setSuccess('Status updated successfully');
      } else {
        await createStatus({
          code: formCode.trim().toUpperCase(),
          label: formLabel.trim(),
          color: formColor,
          description: formDescription.trim(),
          isActive: formIsActive
        });
        setSuccess('Status created successfully');
      }
      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to save status');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: ClassificationItem) => {
    if (!confirm(`Are you sure you want to delete status "${item.label}"?`)) return;
    try {
      setError(null);
      await deleteStatus(item.id);
      setSuccess(`Status "${item.label}" deleted`);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete status');
    }
  };

  // 15-item Pagination
  const totalPages = Math.max(1, Math.ceil(statuses.length / PAGE_SIZE));
  const paginatedStatuses = statuses.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
            <span className="text-slate-700 dark:text-slate-300 font-medium">Classifications</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Document Statuses Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage lifecycle statuses for tracking document progression across LetterPort.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Status</span>
        </button>
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
                <th className="py-2.5 px-3">Status Code</th>
                <th className="py-2.5 px-3">Label</th>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3">Color Badge</th>
                <th className="py-2.5 px-3">State</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400 text-xs">
                    Loading statuses...
                  </td>
                </tr>
              ) : paginatedStatuses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400 text-xs">
                    No document statuses found. Click "New Status" to create one.
                  </td>
                </tr>
              ) : (
                paginatedStatuses.map((s) => (
                  <tr key={s.id || s.code} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                    <td className="py-2 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                      {s.code}
                    </td>
                    <td className="py-2 px-3 font-medium text-slate-900 dark:text-white">
                      {s.label}
                    </td>
                    <td className="py-2 px-3 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                      {s.description || '—'}
                    </td>
                    <td className="py-2 px-3">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                        {s.color || 'blue'}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        s.isActive !== false
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {s.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right space-x-1">
                      <button
                        onClick={() => openEditModal(s)}
                        className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded transition cursor-pointer"
                        title="Edit Status"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(s)}
                        className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded transition cursor-pointer"
                        title="Delete Status"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 15-item Pagination Bar */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs text-slate-500 dark:text-slate-400">
          <div>
            Showing {statuses.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, statuses.length)} of {statuses.length} items (15 / page)
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
                {editingItem ? 'Edit Status' : 'Create New Status'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Status Code *
                </label>
                <input
                  type="text"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  placeholder="e.g. IN_TRANSIT, APPROVED"
                  required
                  className="w-full px-2.5 py-1.5 font-mono text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Display Label *
                </label>
                <input
                  type="text"
                  value={formLabel}
                  onChange={(e) => setFormLabel(e.target.value)}
                  placeholder="e.g. In Transit, Approved"
                  required
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Color Accent
                  </label>
                  <select
                    value={formColor}
                    onChange={(e) => setFormColor(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="blue">Blue</option>
                    <option value="emerald">Emerald Green</option>
                    <option value="amber">Amber Yellow</option>
                    <option value="rose">Rose Red</option>
                    <option value="indigo">Indigo</option>
                    <option value="purple">Purple</option>
                    <option value="slate">Slate Gray</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Status
                  </label>
                  <select
                    value={formIsActive ? 'active' : 'inactive'}
                    onChange={(e) => setFormIsActive(e.target.value === 'active')}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Optional notes or lifecycle purpose..."
                  rows={2}
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
                  <span>{saving ? 'Saving...' : 'Save Status'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
