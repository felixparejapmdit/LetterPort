'use client';

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, User, ShieldCheck, UserCheck, AlertCircle, ArrowRight } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await login({ username, password });
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillCredentials = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center px-4 py-8 relative selection:bg-blue-500 selection:text-white">
      {/* Discreet Theme Switcher in top corner */}
      <div className="absolute top-5 right-5 z-20">
        <div className="p-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <ThemeToggle />
        </div>
      </div>

      <div className="w-full max-w-[380px] sm:max-w-[400px]">
        {/* Brand Icon & Heading */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 mb-3">
            <Mail className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            LetterPort
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Letter & Correspondence Management System
          </p>
        </div>

        {/* Minimalist Login Container */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-6 sm:p-7 shadow-xl shadow-slate-200/40 dark:shadow-none">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200/80 dark:border-red-900/60 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  autoFocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username (e.g. admin or user)"
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50/70 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none transition-all dark:text-white placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50/70 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none transition-all dark:text-white placeholder:text-slate-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs sm:text-sm transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 mt-4 cursor-pointer"
            >
              {isLoading ? (
                <span className="inline-block animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Quick Preset Buttons */}
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80">
            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 text-center mb-2.5">
              Quick Test Sign In:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillCredentials('admin', 'password')}
                className="p-2 text-left rounded-xl border border-slate-200/90 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-1 text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  <ShieldCheck className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Admin</span>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                  admin / password
                </div>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials('user', 'password')}
                className="p-2 text-left rounded-xl border border-slate-200/90 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-1 text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                  <UserCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Staff User</span>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                  user / password
                </div>
              </button>
            </div>
          </div>
        </div>

        <div className="text-center mt-4">
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            LetterPort LMS &bull; Self-Contained NAS Edition
          </span>
        </div>
      </div>
    </div>
  );
}
