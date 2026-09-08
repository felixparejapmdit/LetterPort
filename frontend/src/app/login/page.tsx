'use client';

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, User, ShieldCheck, UserCheck, AlertCircle, ArrowRight } from 'lucide-react';

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
    <div className="w-full min-h-screen flex flex-col justify-center items-center px-4 py-8 bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 selection:bg-blue-500 selection:text-white transition-colors">
      <div className="w-full max-w-[390px]">
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
        <div className="bg-white dark:bg-[#0f172a] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xl dark:shadow-2xl transition-colors">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/80 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  autoFocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username (e.g. admin or user)"
                  className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs sm:text-sm transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 mt-4 cursor-pointer"
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
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 text-center mb-2.5">
              Quick Test Sign In:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillCredentials('admin', 'password')}
                className="p-2 text-left rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-700 bg-slate-50 dark:bg-slate-900/60 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">
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
                className="p-2 text-left rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-700 bg-slate-50 dark:bg-slate-900/60 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
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
            LetterPort LMS &bull; Plug & Play NAS Edition
          </span>
        </div>
      </div>
    </div>
  );
}
