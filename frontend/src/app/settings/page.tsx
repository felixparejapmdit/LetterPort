'use client';

import { useState, useEffect } from 'react';
import { 
  fetchSettings, 
  saveNasSettings, 
  testNasConnection, 
  loadSampleData, 
  clearSampleData,
  NasConfig, 
  StorageInfo 
} from '@/lib/api';
import { 
  HardDrive, 
  Server, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Save, 
  FolderPlus, 
  Trash2, 
  HelpCircle,
  Database,
  ExternalLink
} from 'lucide-react';

export default function SettingsPage() {
  const [nas, setNas] = useState<NasConfig>({
    enabled: false,
    protocol: 'MOUNTED_PATH',
    host: '',
    sharePath: 'Z:\\LetterPort_Archive',
    username: '',
    password: '',
    autoSync: false,
    testStatus: 'UNTESTED',
    testMessage: '',
  });

  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const loadData = async () => {
    try {
      const data = await fetchSettings();
      setNas(data.nas);
      setStorageInfo(data.storageInfo);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Could not load settings.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setNotification(null);
    try {
      const saved = await saveNasSettings(nas);
      setNas(saved);
      setNotification({ type: 'success', message: 'Network storage settings saved successfully!' });
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to save settings.' });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setNotification(null);
    try {
      const result = await testNasConnection(nas);
      if (result.success) {
        setNotification({ type: 'success', message: result.message });
        setNas({ ...nas, testStatus: 'OK', testMessage: result.message });
      } else {
        setNotification({ type: 'error', message: result.message });
        setNas({ ...nas, testStatus: 'FAILED', testMessage: result.message });
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Connection test failed.' });
      setNas({ ...nas, testStatus: 'FAILED', testMessage: err.message });
    } finally {
      setTesting(false);
    }
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mb-3" />
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          System Settings
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Configure office network storage (NAS), view PocketBase/SQLite database status, or manage demo letters.
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

      {/* Section 1: Network Storage (NAS) Configuration */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 rounded-xl shrink-0">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Network Storage Server (NAS)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Save or back up your letter documents to an office storage server (Synology, QNAP, TrueNAS, or Windows Share).
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={nas.enabled}
              onChange={(e) => setNas({ ...nas, enabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Connection Type
              </label>
              <select
                value={nas.protocol}
                disabled={!nas.enabled}
                onChange={(e) => setNas({ ...nas, protocol: e.target.value as any })}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
              >
                <option value="MOUNTED_PATH">Shared Folder or Mapped Drive (e.g. Z:\Letters)</option>
                <option value="SMB">Windows Network Share (SMB / CIFS)</option>
                <option value="NFS">NFS Share (Linux / Proxmox NAS)</option>
                <option value="WEBDAV">WebDAV Storage</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Server IP or Host (Optional)
              </label>
              <input
                type="text"
                value={nas.host}
                disabled={!nas.enabled}
                onChange={(e) => setNas({ ...nas, host: e.target.value })}
                placeholder="e.g. 192.168.1.100 or synology-nas"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Storage Folder Path on Server *
            </label>
            <input
              type="text"
              value={nas.sharePath}
              disabled={!nas.enabled}
              onChange={(e) => setNas({ ...nas, sharePath: e.target.value })}
              placeholder="e.g. \\192.168.1.100\Letters or Z:\LetterPort_Archive or /mnt/nas/letters"
              required={nas.enabled}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono disabled:opacity-50"
            />
            <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 block">
              Tip: In Windows, you can map your NAS to a drive letter like <code>Z:</code> or type the network path.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                NAS Username (If required)
              </label>
              <input
                type="text"
                value={nas.username || ''}
                disabled={!nas.enabled}
                onChange={(e) => setNas({ ...nas, username: e.target.value })}
                placeholder="e.g. admin or letterport_user"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                NAS Password (If required)
              </label>
              <input
                type="password"
                value={nas.password || ''}
                disabled={!nas.enabled}
                onChange={(e) => setNas({ ...nas, password: e.target.value })}
                placeholder="••••••••"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="autoSync"
              checked={nas.autoSync}
              disabled={!nas.enabled}
              onChange={(e) => setNas({ ...nas, autoSync: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded border-slate-300 dark:border-slate-700 focus:ring-blue-500"
            />
            <label htmlFor="autoSync" className="text-xs font-medium text-slate-700 dark:text-slate-300 select-none">
              Automatically keep a backup copy of every uploaded letter on the NAS server
            </label>
          </div>

          {/* Test Status Banner */}
          {nas.testStatus && nas.testStatus !== 'UNTESTED' && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                nas.testStatus === 'OK'
                  ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-200'
                  : 'bg-amber-50 dark:bg-amber-950/70 border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-200'
              }`}
            >
              {nas.testStatus === 'OK' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              )}
              <span>{nas.testMessage || 'Status recorded.'}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              disabled={!nas.enabled || testing}
              onClick={handleTestConnection}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold disabled:opacity-50 transition flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
              <span>{testing ? 'Checking Connection...' : 'Test Connection'}</span>
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 disabled:opacity-50 transition flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Section 2: Sample Demo Data (Load & Clear) */}
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
            <li>Purchase Order for Synology NAS [VEM-2026-0012] &bull; TechSupply (Outgoing)</li>
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

      {/* Section 3: Current Storage & Database Info */}
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
              Current database engine (PocketBase / SQLite) and file repository details.
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
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase">NAS Backup Status</span>
              <p className="text-sm font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    storageInfo.nasConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                  }`}
                ></span>
                {storageInfo.nasConfigured ? 'Active & Synced' : 'Not Enabled'}
              </p>
            </div>
          </div>
        )}

        {storageInfo && (
          <div className="pt-2 text-xs text-slate-500 dark:text-slate-400 space-y-1">
            <p>
              <strong>Storage Directory:</strong>{' '}
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
    </div>
  );
}
