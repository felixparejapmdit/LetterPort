'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { UserProfile, loginUser, fetchCurrentUser, fetchPermissions, updatePermissions } from '../lib/api';
import { ALL_PERMISSIONS, getDefaultPermissionsMap } from '../lib/permissions';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  isAdmin: boolean;
  permissions: Record<string, Record<string, boolean>>;
  hasPermission: (permissionId: string) => boolean;
  savePermissions: (newPermissions: Record<string, Record<string, boolean>>) => Promise<void>;
  updateUserAvatar: (avatarKey?: string) => void;
  login: (credentials: { username: string; password: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [permissions, setPermissions] = useState<Record<string, Record<string, boolean>>>(getDefaultPermissionsMap);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const initAuth = async () => {
      try {
        // 1. Load local cached permissions first
        const cachedPerms = localStorage.getItem('letterport_permissions');
        if (cachedPerms) {
          try {
            setPermissions({ ...getDefaultPermissionsMap(), ...JSON.parse(cachedPerms) });
          } catch {}
        }

        // Fetch fresh permissions from backend
        fetchPermissions()
          .then((serverPerms) => {
            if (serverPerms) {
              const merged = { ...getDefaultPermissionsMap(), ...serverPerms };
              setPermissions(merged);
              localStorage.setItem('letterport_permissions', JSON.stringify(merged));
            }
          })
          .catch(() => {});

        // 2. Load auth credentials
        const storedAuth = localStorage.getItem('letterport_auth');
        if (storedAuth) {
          const parsed = JSON.parse(storedAuth);
          if (parsed?.token && parsed?.user) {
            setToken(parsed.token);
            setUser(parsed.user);
            // Verify in background
            fetchCurrentUser(parsed.token)
              .then((freshUser) => {
                if (freshUser && freshUser.id && freshUser.role) {
                  setUser(freshUser);
                  localStorage.setItem('letterport_auth', JSON.stringify({ token: parsed.token, user: freshUser }));
                }
              })
              .catch(() => {});
          }
        }
      } catch (err) {
        console.error('Error restoring auth session', err);
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      if (!user && pathname !== '/login') {
        router.push('/login');
      } else if (user && pathname === '/login') {
        router.push('/');
      }
    }
  }, [user, isLoading, pathname, router]);

  const login = async (credentials: { username: string; password: string }) => {
    const data = await loginUser(credentials);
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('letterport_auth', JSON.stringify(data));
    router.push('/');
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('letterport_auth');
    router.push('/login');
  };

  const isAdmin = user?.role === 'admin';

  const hasPermission = (permissionId: string): boolean => {
    if (!user) return false;
    const role = user.role || 'user';
    if (permissions[permissionId]?.[role] !== undefined) {
      return !!permissions[permissionId][role];
    }
    // Fallback based on default definitions
    const def = ALL_PERMISSIONS.find((p) => p.id === permissionId);
    if (!def) return role === 'admin';
    return role === 'admin' ? def.defaultAdmin : def.defaultUser;
  };

  const savePermissions = async (newPermissions: Record<string, Record<string, boolean>>) => {
    setPermissions(newPermissions);
    localStorage.setItem('letterport_permissions', JSON.stringify(newPermissions));
    try {
      await updatePermissions(newPermissions as any, token || undefined);
    } catch (err) {
      console.error('Failed to sync permissions with server:', err);
    }
  };

  const updateUserAvatar = (avatarKey?: string) => {
    if (!user) return;
    const updated = { ...user, avatar: avatarKey };
    setUser(updated);
    if (token) {
      localStorage.setItem('letterport_auth', JSON.stringify({ token, user: updated }));
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, isAdmin, permissions, hasPermission, savePermissions, updateUserAvatar, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
