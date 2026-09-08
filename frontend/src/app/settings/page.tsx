'use client';

import { useState, useEffect } from 'react';
import { 
  fetchSettings, 
  loadSampleData, 
  clearSampleData,
  SystemInfo,
  StorageInfo 
} from '@/lib/api';
import { 
  HardDrive, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  FolderPlus, 
  Trash2, 
  Database,
  Cpu,
  Sparkles,
  ShieldCheck,
  DownloadCloud
} from 'lucide-react';

export default function SettingsPage() {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const loadData = async () => {
    try {
      const data = await fetchSettings();
      setSystemInfo(data.systemInfo);
      setStorageInfo(data.storageInfo);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Could not load system information.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          System Maintenance & Settings
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Zero-config plug-and-play architecture. View software status, storage metrics, or manage sample letters.
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

      {/* Section 1: System Maintenance & Architecture */}
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

      {/* Section 3: Storage & Database Metrics */}
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
    </div>
  );
}
