'use client';

import React from 'react';
import { 
  ShieldCheck, 
  Briefcase, 
  GraduationCap, 
  Crown, 
  Sparkles, 
  Feather, 
  Compass, 
  Rocket, 
  User as UserIcon,
  Shield,
  Star
} from 'lucide-react';

export interface AvatarPreset {
  id: string;
  name: string;
  bgColor: string;
  textColor: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  { id: 'avatar-shield', name: 'Security Shield', bgColor: 'bg-blue-600', textColor: 'text-white', icon: ShieldCheck },
  { id: 'avatar-briefcase', name: 'Executive', bgColor: 'bg-indigo-600', textColor: 'text-white', icon: Briefcase },
  { id: 'avatar-crown', name: 'Administrator', bgColor: 'bg-amber-500', textColor: 'text-white', icon: Crown },
  { id: 'avatar-scholar', name: 'Scholar', bgColor: 'bg-emerald-600', textColor: 'text-white', icon: GraduationCap },
  { id: 'avatar-star', name: 'Star Clerk', bgColor: 'bg-purple-600', textColor: 'text-white', icon: Star },
  { id: 'avatar-pen', name: 'Registrar', bgColor: 'bg-rose-500', textColor: 'text-white', icon: Feather },
  { id: 'avatar-compass', name: 'Navigator', bgColor: 'bg-cyan-600', textColor: 'text-white', icon: Compass },
  { id: 'avatar-rocket', name: 'Expediter', bgColor: 'bg-orange-500', textColor: 'text-white', icon: Rocket },
];

interface UserAvatarProps {
  user?: {
    username?: string;
    role?: 'admin' | 'user';
    avatar?: string;
  } | null;
  avatarId?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showBadge?: boolean;
  className?: string;
}

export default function UserAvatar({
  user,
  avatarId,
  size = 'md',
  showBadge = false,
  className = '',
}: UserAvatarProps) {
  const activeAvatarId = avatarId || user?.avatar;
  const username = user?.username || 'User';
  const isAdmin = user?.role === 'admin';

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl',
  }[size];

  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8',
  }[size];

  // Check if active avatar matches one of the presets
  const preset = AVATAR_PRESETS.find((p) => p.id === activeAvatarId);

  return (
    <div className="relative inline-flex items-center justify-center shrink-0">
      <div
        className={`rounded-full flex items-center justify-center font-bold tracking-tight shadow-2xs select-none transition-transform ${sizeClasses} ${
          preset
            ? `${preset.bgColor} ${preset.textColor}`
            : isAdmin
            ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white'
            : 'bg-gradient-to-tr from-emerald-600 to-teal-600 text-white'
        } ${className}`}
        title={username}
      >
        {preset ? (
          <preset.icon className={iconSizes} />
        ) : (
          <span>{username.charAt(0).toUpperCase()}</span>
        )}
      </div>

      {showBadge && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-slate-900 ${
            isAdmin ? 'bg-blue-500' : 'bg-emerald-500'
          }`}
          title={isAdmin ? 'Administrator' : 'Staff User'}
        />
      )}
    </div>
  );
}
