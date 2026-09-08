'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { 
  Mail, 
  PlusCircle, 
  Search, 
  LayoutDashboard, 
  FileText, 
  Settings,
  Menu,
  X,
  Command,
  LogOut,
  ShieldCheck, 
  User as UserIcon,
  ShieldAlert,
  Shield
} from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout, isAdmin } = useAuth();

  // Completely remove navbar on login page as requested by user
  if (pathname === '/login') {
    return null;
  }

  const openSearch = () => {
    window.dispatchEvent(new CustomEvent('open-search-modal'));
  };

  const navLinks = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/letters', label: 'All Letters', icon: FileText },
    { href: '/encode', label: 'Add Letter', icon: PlusCircle },
    { href: '/search', label: 'Search', icon: Search },
    { href: '/access-matrix', label: 'Access Matrix', icon: Shield },
    { href: '/settings', label: isAdmin ? 'Settings' : 'My Profile', icon: isAdmin ? Settings : UserIcon },
  ];

  return (
    <header className="sticky top-0 z-40 glass-panel border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
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

          {/* Quick Search Trigger (Desktop - Compact & Shortened) */}
          <div className="hidden md:flex items-center max-w-[200px] lg:max-w-[240px] mx-3">
            <button
              type="button"
              onClick={openSearch}
              className="w-full h-8 flex items-center justify-between px-2.5 text-xs bg-slate-100/90 dark:bg-slate-800/80 hover:bg-slate-200/70 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-400 dark:text-slate-400 transition-all group"
            >
              <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200">
                <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                <span>Search...</span>
              </span>
              <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium font-mono text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded shadow-2xs">
                Ctrl K
              </kbd>
            </button>
          </div>

          {/* Right Navigation & Actions */}
          <div className="flex items-center space-x-1 sm:space-x-1.5">
            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center space-x-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs shadow-blue-600/30'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>

                {/* Mobile Search Icon Button */}
                <button
                  onClick={openSearch}
                  type="button"
                  className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  aria-label="Open search"
                >
                  <Search className="w-5 h-5" />
                </button>

                {/* Dark Mode Switcher */}
                <ThemeToggle />

                {/* User Info & Logout Button (Desktop) */}
                {user && (
                  <div className="hidden sm:flex items-center pl-2 ml-1 border-l border-slate-200 dark:border-slate-800 gap-2">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80">
                      {isAdmin ? (
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <UserIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      )}
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
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
                      onClick={logout}
                      title="Sign Out"
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Mobile Hamburger Button */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  type="button"
                  className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80"
                  aria-label="Toggle mobile menu"
                >
                  {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
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

          {user && (
            <div className="pt-3 mt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isAdmin ? (
                  <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                ) : (
                  <UserIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                )}
                <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {user.username}{' '}
                  <span className="text-xs font-normal text-slate-500">
                    ({isAdmin ? 'Administrator' : 'Staff User'})
                  </span>
                </div>
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
