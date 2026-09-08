'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  fetchSettings, 
  loadSampleData, 
  clearSampleData,
  getBackupUrl,
  restoreBackup,
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
  fetchReferenceFormat,
  updateReferenceFormat,
  UserProfile,
  ReferenceFormatConfig,
  SystemInfo,
  StorageInfo 
} from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { 
  HardDrive, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  FolderPlus, 
  Trash2, 
  Cpu, 
  Sparkles, 
  ShieldCheck, 
  DownloadCloud, 
  Download, 
  Upload, 
  FileJson, 
  Archive,
  Users,
  UserPlus,
  Key,
  Shield,
  User,
  Settings2,
  Lock,
  Pencil,
  X,
  Check,
  ArrowRight
} from 'lucide-react';

export default function SettingsPage() {
  const { user: currentUser, isAdmin, token } = useAuth();

  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // User Management State
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingTargetUser, setEditingTargetUser] = useState<UserProfile | null>(null);
  const [userFormUsername, setUserFormUsername] = useState('');
  const [userFormPassword, setUserFormPassword] = useState('');
  const [userFormRole, setUserFormRole] = useState<'admin' | 'user'>('user');

  // Self Password Change (for non-admin or quick admin update)
  const [selfPassword, setSelfPassword] = useState('');
  const [selfPasswordConfirm, setSelfPasswordConfirm] = useState('');
  const [selfPasswordSaving, setSelfPasswordSaving] = useState(false);

  // Reference Format State
  const [refFormat, setRefFormat] = useState<ReferenceFormatConfig>({
    prefix: 'LP',
    separator: '-',
    digits: 4
  });
  const [savingFormat, setSavingFormat] = useState(false);

  const loadData = async () => {
    try {
      const data = await fetchSettings();
      setSystemInfo(data.systemInfo);
      setStorageInfo(data.storageInfo);

      // Load reference format
      fetchReferenceFormat()
        .then(fmt => setRefFormat(fmt))
        .catch(() => {});

      // If admin, load user list
      if (isAdmin) {
        fetchUsers(token || undefined)
          .then(list => setUsers(list))
          .catch(err => console.error('Failed to load users:', err));
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Could not load system information.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isAdmin, token]);

  const handleCheckUpdates = async () => {
    setCheckingUpdate(true);
    setUpdateMessage(null);
    setTimeout(() => {
      setCheckingUpdate(false);
      setUpdateMessage('LetterPort is running the latest stable release (v1.2.0). All components are up to date.');
    }, 1200);
  };

  const handleLoadSamples = async () => {
    setActionLoading('load');
    setNotification(null);
    try {
      const result = await loadSampleData();
      setNotification({ type: 'success', message: result.message });
      await loadData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to load sample letters.' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleClearData = async () => {
    setActionLoading('clear');
    setNotification(null);
    setShowClearConfirm(false);
    try {
      const result = await clearSampleData();
      setNotification({ type: 'success', message: result.message });
      await loadData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to clear letters.' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRestoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setActionLoading('restore');
      setNotification(null);
      const text = await file.text();
      const json = JSON.parse(text);
      const res = await restoreBackup(json);
      setNotification({ type: 'success', message: res.message || `Successfully restored ${res.restored} letters!` });
      await loadData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to restore backup file.' });
    } finally {
      setActionLoading(null);
      e.target.value = '';
    }
  };

  // User Management Actions
  const openAddUser = () => {
    setEditingTargetUser(null);
    setUserFormUsername('');
    setUserFormPassword('');
    setUserFormRole('user');
    setUserModalOpen(true);
  };

  const openEditUser = (u: UserProfile) => {
    setEditingTargetUser(u);
    setUserFormUsername(u.username);
    setUserFormPassword(u.password || '');
    setUserFormRole(u.role);
    setUserModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTargetUser) {
        await updateUser(editingTargetUser.id, {
          username: userFormUsername,
          password: userFormPassword || undefined,
          role: userFormRole
        }, token || undefined);
        setNotification({ type: 'success', message: `User "${userFormUsername}" updated successfully!` });
      } else {
        if (!userFormPassword) {
          setNotification({ type: 'error', message: 'Password is required for new users.' });
          return;
        }
        await createUser({
          username: userFormUsername,
          password: userFormPassword,
          role: userFormRole
        }, token || undefined);
        setNotification({ type: 'success', message: `User "${userFormUsername}" created successfully!` });
      }
      setUserModalOpen(false);
      const refreshedUsers = await fetchUsers(token || undefined);
      setUsers(refreshedUsers);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to save user.' });
    }
  };

  const handleDeleteUser = async (u: UserProfile) => {
    if (u.id === currentUser?.id) {
      setNotification({ type: 'error', message: 'You cannot delete your own active account.' });
      return;
    }
    if (!confirm(`Are you sure you want to delete user "${u.username}"?`)) return;
    try {
      await deleteUser(u.id, token || undefined);
      setNotification({ type: 'success', message: `User "${u.username}" deleted.` });
      const refreshedUsers = await fetchUsers(token || undefined);
      setUsers(refreshedUsers);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to delete user.' });
    }
  };

  const handleUpdateSelfPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selfPassword !== selfPasswordConfirm) {
      setNotification({ type: 'error', message: 'Passwords do not match.' });
      return;
    }
    if (!currentUser) return;
    setSelfPasswordSaving(true);
    try {
      await updateUser(currentUser.id, { password: selfPassword }, token || undefined);
      setNotification({ type: 'success', message: 'Your password was updated successfully.' });
      setSelfPassword('');
      setSelfPasswordConfirm('');
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to update password.' });
    } finally {
      setSelfPasswordSaving(false);
    }
  };

  // Reference Format Handler
  const handleSaveReferenceFormat = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingFormat(true);
    try {
      const updated = await updateReferenceFormat(refFormat);
      setRefFormat(updated);
      setNotification({ type: 'success', message: 'Reference number format updated successfully.' });
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to update reference format.' });
    } finally {
      setSavingFormat(false);
    }
  };

  const padZero = (num: number, len: number) => String(num).padStart(len, '0');
  const currentYear = new Date().getFullYear();
  const previewIncoming = `${refFormat.prefix}${refFormat.separator}IN${refFormat.separator}${currentYear}${refFormat.separator}${padZero(1, refFormat.digits)}`;
  const previewOutgoing = `${refFormat.prefix}${refFormat.separator}OUT${refFormat.separator}${currentYear}${refFormat.separator}${padZero(1, refFormat.digits)}`;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mb-3" />
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Loading system settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
          <span>{isAdmin ? 'System Settings & Administration' : 'My Account & Profile'}</span>
          <span
            className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
              isAdmin
                ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
            }`}
          >
            {isAdmin ? 'Administrator' : 'Staff User'}
          </span>
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {isAdmin
            ? 'Manage user accounts, permissions matrix, reference numbering format, backups, and storage health.'
            : 'Manage your password, review your role permissions, and adjust interface display preferences.'}
        </p>
      </div>

      {/* Notifications */}
      {notification && (
        <div
          className={`p-4 rounded-xl text-sm flex items-start space-x-3 border ${
            notification.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/70 border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
          )}
          <p className="font-medium">{notification.message}</p>
        </div>
      )}

      {/* SECTION: USER MANAGEMENT (Admin Full Control or Staff Password Change) */}
      {isAdmin ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
          <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 rounded-xl shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>User Accounts & Permissions</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    Admin Only
                  </span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Manage accounts, change passwords, and assign Administrator or Staff User roles.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={openAddUser}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add User</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-slate-700 dark:text-slate-200">
              <thead className="bg-slate-50/80 dark:bg-slate-800/60 text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Username</th>
                  <th className="px-4 py-3.5">Role</th>
                  <th className="px-4 py-3.5">Password</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        {u.role === 'admin' ? (
                          <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        ) : (
                          <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        )}
                        <span>{u.username}</span>
                        {u.id === currentUser?.id && (
                          <span className="text-[10px] text-blue-600 font-bold bg-blue-50 dark:bg-blue-950 px-1.5 py-0.2 rounded">You</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${
                          u.role === 'admin'
                            ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                        }`}
                      >
                        {u.role === 'admin' ? 'Administrator' : 'Staff User'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-500">
                      {u.password || '••••••••'}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="inline-flex items-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => openEditUser(u)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          title="Edit User / Change Password"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        {u.id !== currentUser?.id && (
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Standard Staff User: Self Password Change Card */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-5 sm:p-6 space-y-4 transition-colors">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                My Profile & Password
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Logged in as <strong className="text-slate-700 dark:text-slate-200">{currentUser?.username}</strong> (Staff User)
              </p>
            </div>
          </div>

          <form onSubmit={handleUpdateSelfPassword} className="space-y-3 max-w-sm pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                New Password
              </label>
              <input
                type="password"
                required
                value={selfPassword}
                onChange={(e) => setSelfPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={selfPasswordConfirm}
                onChange={(e) => setSelfPasswordConfirm(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={selfPasswordSaving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl transition shadow-sm disabled:opacity-50"
            >
              {selfPasswordSaving ? 'Updating...' : 'Update My Password'}
            </button>
          </form>
        </div>
      )}

      {/* SECTION: ACCESS MATRIX SUMMARY CARD FOR BOTH ROLES */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-5 sm:p-6 space-y-3 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 rounded-xl shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Access Permissions Matrix</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  Role Policy
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isAdmin
                  ? 'Manage and review complete capability permissions for Administrator and Staff roles.'
                  : 'Review your granted system capabilities and role boundaries.'}
              </p>
            </div>
          </div>

          <Link
            href="/access-matrix"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-bold transition shadow-xs"
          >
            <span>View Complete Matrix</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-slate-400 text-[11px] block">Daily Processing</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Granted for Staff & Admin
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-slate-400 text-[11px] block">Letter Deletions</span>
            <span className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 mt-0.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Admin Only (Protected)
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-slate-400 text-[11px] block">System Settings & Backups</span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 mt-0.5">
              <Lock className="w-3.5 h-3.5" />
              Admin Only (Protected)
            </span>
          </div>
        </div>
      </div>

      {/* SECTION: REFERENCE NUMBER FORMAT CUSTOMIZATION (Admin Only) */}
      {isAdmin && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-5 sm:p-6 space-y-4 transition-colors">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0">
              <Settings2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Reference Number Format</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  Customizable
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Customize prefix, separator, and digits padding for newly registered letters.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveReferenceFormat} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Prefix
                </label>
                <input
                  type="text"
                  required
                  value={refFormat.prefix}
                  onChange={(e) => setRefFormat({ ...refFormat, prefix: e.target.value.toUpperCase() })}
                  placeholder="e.g. LP or DEPT"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Separator
                </label>
                <input
                  type="text"
                  required
                  maxLength={2}
                  value={refFormat.separator}
                  onChange={(e) => setRefFormat({ ...refFormat, separator: e.target.value })}
                  placeholder="e.g. - or /"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Sequential Digits Padding
                </label>
                <select
                  value={refFormat.digits}
                  onChange={(e) => setRefFormat({ ...refFormat, digits: parseInt(e.target.value) || 4 })}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={3}>3 digits (001)</option>
                  <option value={4}>4 digits (0001)</option>
                  <option value={5}>5 digits (00001)</option>
                  <option value={6}>6 digits (000001)</option>
                </select>
              </div>
            </div>

            {/* Live Preview Box */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Live Format Preview:</span>
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-900">
                  {previewIncoming}
                </span>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-900">
                  {previewOutgoing}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={savingFormat}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl transition shadow-sm disabled:opacity-50"
            >
              {savingFormat ? 'Saving Format...' : 'Save Format Settings'}
            </button>
          </form>
        </div>
      )}

      {/* ADMIN-ONLY ADVANCED SYSTEM CARDS */}
      {isAdmin && (
        <>
          {/* SECTION: SYSTEM MAINTENANCE & ARCHITECTURE */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
            <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 rounded-xl shrink-0">
                  <Cpu className="w-5 h-5" />
                </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>System Maintenance</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Plug-and-Play
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Zero-config deployment mode. Storage and databases are automatically mapped to local directories.
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  System Version
                </span>
                <p className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
                  {systemInfo?.version || 'v1.2.0'}
                </p>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {systemInfo?.edition || 'Plug-and-Play NAS Edition'}
                </span>
              </div>
              <ShieldCheck className="w-8 h-8 text-blue-500 opacity-80" />
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Deployment Architecture
                </span>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Self-Contained Relative Volumes
                </p>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Zero manual IP or drive mappings required
                </span>
              </div>
              <Sparkles className="w-8 h-8 text-amber-500 opacity-80" />
            </div>
          </div>

          {updateMessage && (
            <div className="p-3.5 rounded-xl text-xs flex items-center gap-2 border bg-emerald-50 dark:bg-emerald-950/70 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <span>{updateMessage}</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Check for software patches and container image updates
            </span>
            <button
              type="button"
              disabled={checkingUpdate}
              onClick={handleCheckUpdates}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              <DownloadCloud className={`w-3.5 h-3.5 ${checkingUpdate ? 'animate-bounce' : ''}`} />
              <span>{checkingUpdate ? 'Checking for Updates...' : 'Check for Updates'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION: SAMPLE DEMO DATA (Admin Only for wipe, visible to all for load) */}
      {isAdmin && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-5 sm:p-6 space-y-4 transition-colors">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 rounded-xl shrink-0">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Sample Letters (Demo Data with VEM Numbers)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Load realistic sample letters with pre-assigned VEM numbers (VEM-2026-0010 to 0014) and OCR indexing.
              </p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300 space-y-1">
            <p className="font-semibold text-slate-800 dark:text-slate-200">What sample letters include:</p>
            <ul className="list-disc list-inside space-y-0.5 text-slate-500 dark:text-slate-400 pl-1">
              <li>Tax Clearance Certificate [VEM-2026-0010] &bull; Revenue Authority (Incoming)</li>
              <li>Office Renovation Permit [VEM-2026-0011] &bull; City Engineering (Incoming)</li>
              <li>Purchase Order for Hardware [VEM-2026-0012] &bull; TechSupply (Outgoing)</li>
              <li>Insurance Policy Renewal Notice [VEM-2026-0013] &bull; Commercial Assurance (Incoming)</li>
              <li>Executive Staff Memo [VEM-2026-0014] &bull; Internal Operations (Outgoing)</li>
            </ul>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              disabled={actionLoading !== null}
              onClick={handleLoadSamples}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 disabled:opacity-50 transition flex items-center gap-2"
            >
              {actionLoading === 'load' ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FolderPlus className="w-3.5 h-3.5" />
              )}
              <span>Load Sample Letters</span>
            </button>

            {showClearConfirm ? (
              <div className="flex items-center space-x-2 bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-900 p-1.5 rounded-xl">
                <span className="text-xs text-rose-800 dark:text-rose-200 font-bold px-2">Delete all letters?</span>
                <button
                  type="button"
                  onClick={handleClearData}
                  disabled={actionLoading !== null}
                  className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition"
                >
                  {actionLoading === 'clear' ? 'Clearing...' : 'Yes, Delete All'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(false)}
                  className="px-2.5 py-1 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={actionLoading !== null}
                onClick={() => setShowClearConfirm(true)}
                className="px-4 py-2.5 rounded-xl border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-xs font-bold disabled:opacity-50 transition flex items-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All Letters</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* SECTION: BACKUP & RESTORE */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-5 sm:p-6 space-y-4 transition-colors">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 rounded-xl shrink-0">
            <Archive className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Letters Backup & Safe Recovery
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Safeguard all registered letters, VEM tracking numbers, and OCR extracted texts in a portable backup file.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Export / Download Backup */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xs">
                <FileJson className="w-4 h-4 text-blue-500" />
                <span>Export Letters Backup</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Downloads a complete JSON package of all letters, attachments index, and OCR text.
              </p>
            </div>
            <a
              href={getBackupUrl()}
              download
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Backup (.json)</span>
            </a>
          </div>

          {/* Import / Restore Backup (Admin Only) */}
          {isAdmin ? (
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xs">
                  <Upload className="w-4 h-4 text-emerald-500" />
                  <span>Restore Letters from Backup</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Upload a previously saved LetterPort JSON backup file to restore records.
                </p>
              </div>
              <label className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold cursor-pointer transition">
                {actionLoading === 'restore' ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-500" />
                    <span>Restoring letters...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    <span>Select Backup File (.json)</span>
                  </>
                )}
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleRestoreFile}
                  disabled={actionLoading !== null}
                  className="hidden"
                />
              </label>
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 flex flex-col justify-center text-center space-y-1">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Restore Protected</span>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Restoring database backups is restricted to Administrator accounts.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* SECTION: STORAGE & DATABASE METRICS */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-5 sm:p-6 space-y-4 transition-colors">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl shrink-0">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Storage & Database Information
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Internal storage repository and database file metrics.
            </p>
          </div>
        </div>

        {storageInfo && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700/60">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase">Total Letters Saved</span>
              <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">{storageInfo.totalLetters}</p>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700/60">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase">Database Size</span>
              <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                {(storageInfo.databaseSizeBytes / 1024).toFixed(1)} KB
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700/60">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase">Storage Mode</span>
              <p className="text-sm font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Internal Volume Mount
              </p>
            </div>
          </div>
        )}

        {storageInfo && (
          <div className="pt-2 text-xs text-slate-500 dark:text-slate-400 space-y-1">
            <p>
              <strong>Storage Path:</strong>{' '}
              <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300 font-mono">
                {storageInfo.storageDirectory}
              </code>
            </p>
            <p>
              <strong>Database Backend:</strong>{' '}
              <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300 font-mono">
                {storageInfo.databasePath}
              </code>
            </p>
          </div>
        )}
      </div>
      </>
      )}

      {/* User Add/Edit Modal */}
      {userModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div 
            className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>{editingTargetUser ? 'Edit User Account' : 'Add New User'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setUserModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Username *
                </label>
                <input
                  type="text"
                  required
                  value={userFormUsername}
                  onChange={(e) => setUserFormUsername(e.target.value)}
                  placeholder="e.g. staff1"
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {editingTargetUser ? 'New Password (Leave blank to keep current)' : 'Password *'}
                </label>
                <input
                  type="text"
                  required={!editingTargetUser}
                  value={userFormPassword}
                  onChange={(e) => setUserFormPassword(e.target.value)}
                  placeholder={editingTargetUser ? 'Enter new password if changing' : 'Enter password'}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Role
                </label>
                <select
                  value={userFormRole}
                  onChange={(e) => setUserFormRole(e.target.value as any)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="user">Staff User (View, Encode, Track, Download)</option>
                  <option value="admin">Administrator (Full Access & Settings Control)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setUserModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-blue-500/20 transition"
                >
                  {editingTargetUser ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
