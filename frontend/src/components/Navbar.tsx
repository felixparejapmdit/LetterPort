'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  FileText, 
  PlusCircle, 
  Search, 
  Settings, 
  Menu, 
  X, 
  LogOut, 
  ShieldCheck, 
  User as UserIcon, 
  Mail,
  ChevronDown,
  LayoutDashboard,
  HardDrive,
  Users,
  Shield,
  SlidersHorizontal,
  FileJson,
  Key,
  Palette,
  AlertTriangle,
  Layers,
  FolderTree
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import ThemeToggle from '@/components/ThemeToggle';
import UserAvatar from '@/components/UserAvatar';

export default function Navbar() {
  const pathname = usePathname();
  const { user, isAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settingsDropdownOpen, setSettingsDropdownOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setSettingsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (pathname === '/login') {
    return null;
  }

  const navLinks = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/letters', label: 'All Letters', icon: FileText },
    { href: '/encode', label: 'Add Letter', icon: PlusCircle },
    { href: '/search', label: 'Search', icon: Search },
  ];

  const adminSettingsCategories = [
    {
      title: 'Classifications',
      items: [
        { href: '/settings/statuses', label: 'Statuses', icon: Layers, desc: 'Statuses for your letters' },
        { href: '/settings/priorities', label: 'Priorities', icon: AlertTriangle, desc: 'Urgency and priority levels' },
        { href: '/settings/types', label: 'Letter Types', icon: FolderTree, desc: 'Incoming, outgoing, and other types' },
      ]
    },
    {
      title: 'Access Control',
      items: [
        { href: '/settings/access-matrix', label: 'Access Matrix', icon: Shield, desc: 'Who can see and use buttons' },
        { href: '/settings/roles', label: 'Roles Management', icon: ShieldCheck, desc: 'User roles and permissions' },
        { href: '/settings?tab=users', label: 'User Accounts', icon: Users, desc: 'Manage user accounts' },
      ]
    },
    {
      title: 'System & Design',
      items: [
        { href: '/settings?tab=appearance', label: 'Theme & Design', icon: Palette, desc: 'Theme and layout style' },
        { href: '/settings?tab=format', label: 'Reference Format', icon: SlidersHorizontal, desc: 'Letter reference number format' },
        { href: '/settings?tab=general', label: 'Storage & Hardware', icon: HardDrive, desc: 'Disk space and system info' },
        { href: '/settings?tab=backup', label: 'Backup & Recovery', icon: FileJson, desc: 'Backup and restore your data' },
      ]
    }
  ];

  const staffSettingsCategories = [
    {
      title: 'My Account',
      items: [
        { href: '/settings?tab=profile', label: 'My Profile & Avatar', icon: Key, desc: 'Change password and photo' },
        { href: '/settings?tab=appearance', label: 'Theme & Design', icon: Palette, desc: 'Theme and layout style' },
        { href: '/settings/access-matrix', label: 'Access Matrix', icon: Shield, desc: 'See features you can access' },
      ]
    }
  ];

  const categories = isAdmin ? adminSettingsCategories : staffSettingsCategories;
  const isSettingsActive = pathname.startsWith('/settings') || pathname.startsWith('/access-matrix');

  return (
    <header className="sticky top-0 z-40 glass-panel border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2.5 group">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <Mail className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                  LetterPort
                  <span className="text-[9px] uppercase font-extrabold px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 tracking-wider">
                    LMS
                  </span>
                </span>
              </div>
            </Link>
          </div>

          <div className="hidden md:flex items-center max-w-[200px] lg:max-w-[240px] mx-3">
            <button
              type="button"
              onClick={() => {
                const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true });
                window.dispatchEvent(event);
              }}
              className="w-full h-8 flex items-center justify-between px-2.5 text-xs bg-slate-100/90 dark:bg-slate-800/80 hover:bg-slate-200/70 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-400 dark:text-slate-400 transition-all group cursor-pointer"
            >
              <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200">
                <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                <span>Search...</span>
              </span>
              <kbd className="text-[10px] font-mono px-1.5 py-0.2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-slate-400">
                Ctrl K
              </kbd>
            </button>
          </div>

          <div className="flex items-center space-x-1 sm:space-x-2">
            <nav className="hidden lg:flex items-center space-x-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/30'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}

              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setSettingsDropdownOpen(!settingsDropdownOpen)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isSettingsActive || settingsDropdownOpen
                      ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/30'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  {isAdmin ? <Settings className="w-3.5 h-3.5" /> : <UserIcon className="w-3.5 h-3.5" />}
                  <span>{isAdmin ? 'Settings' : 'My Account'}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform duration-150 ${settingsDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {settingsDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-2.5 z-50 animate-in fade-in zoom-in-95 duration-100 divide-y divide-slate-100 dark:divide-slate-800">
                    {categories.map((cat, catIdx) => (
                      <div key={cat.title} className={catIdx > 0 ? 'pt-2 mt-2' : ''}>
                        <div className="px-2 py-1 text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">
                          {cat.title}
                        </div>
                        <div className="space-y-0.5 mt-0.5">
                          {cat.items.map((tab) => {
                            const TabIcon = tab.icon;
                            return (
                              <Link
                                key={tab.href}
                                href={tab.href}
                                onClick={() => setSettingsDropdownOpen(false)}
                                className="flex items-start gap-2.5 p-1.5 rounded-xl text-xs hover:bg-slate-50 dark:hover:bg-slate-800/80 transition group"
                              >
                                <div className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/40 transition">
                                  <TabIcon className="w-3.5 h-3.5" />
                                </div>
                                <div>
                                  <div className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                                    {tab.label}
                                  </div>
                                  <div className="text-[10px] text-slate-400 dark:text-slate-500">
                                    {tab.desc}
                                  </div>
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </nav>

            <button
              onClick={() => {
                const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true });
                window.dispatchEvent(event);
              }}
              type="button"
              className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              aria-label="Open search"
            >
              <Search className="w-5 h-5" />
            </button>

            <ThemeToggle />

            {user && (
              <div className="hidden sm:flex items-center pl-2 ml-1 border-l border-slate-200 dark:border-slate-800 gap-2">
                <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
                  <UserAvatar user={user} size="sm" showBadge />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 max-w-[90px] truncate">
                    {user.username}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                      isAdmin
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300'
                    }`}
                  >
                    {isAdmin ? 'Admin' : 'Staff'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setLogoutConfirmOpen(true)}
                  title="Sign Out"
                  className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              type="button"
              className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 cursor-pointer"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 pt-2 pb-4 space-y-1 animate-in slide-in-from-top-2 duration-150">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-base font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                <span>{link.label}</span>
              </Link>
            );
          })}

          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
            {categories.map((cat) => (
              <div key={cat.title} className="space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 px-3 uppercase tracking-wider block">
                  {cat.title}
                </span>
                {cat.items.map((tab) => {
                  const TabIcon = tab.icon;
                  return (
                    <Link
                      key={tab.href}
                      href={tab.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center space-x-2.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                      <TabIcon className="w-3.5 h-3.5 text-slate-500" />
                      <span>{tab.label}</span>
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>

          {user && (
            <div className="pt-3 mt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <UserAvatar user={user} size="sm" showBadge />
                <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {user.username}{' '}
                  <span className="text-xs font-normal text-slate-500">
                    ({isAdmin ? 'Administrator' : 'Staff User'})
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setLogoutConfirmOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      )}

      {mounted && logoutConfirmOpen && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in"
          onClick={() => setLogoutConfirmOpen(false)}
        >
          <div
            className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 shrink-0">
                <LogOut className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Sign Out Confirmation
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Are you sure you want to sign out of LetterPort? Any unsaved edits may be lost.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setLogoutConfirmOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setLogoutConfirmOpen(false);
                  logout();
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md shadow-rose-500/20 transition cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
}
