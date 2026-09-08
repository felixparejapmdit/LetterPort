'use client';

import React from 'react';
import { AVATAR_PRESETS } from './UserAvatar';
import { Check } from 'lucide-react';

interface AvatarPickerProps {
  selectedAvatar?: string;
  onSelect: (avatarId: string) => void;
  username?: string;
}

export default function AvatarPicker({
  selectedAvatar,
  onSelect,
  username = 'User',
}: AvatarPickerProps) {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
        Choose Account Avatar
      </label>
      <div className="grid grid-cols-5 sm:grid-cols-9 gap-2 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
        {/* Default Initials Option */}
        <button
          type="button"
          onClick={() => onSelect('')}
          className={`relative flex items-center justify-center w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition border-2 ${
            !selectedAvatar ? 'border-blue-600 ring-2 ring-blue-500/20 scale-105' : 'border-transparent hover:scale-105'
          }`}
          title="Use Initials"
        >
          <span>{username.charAt(0).toUpperCase() || 'U'}</span>
          {!selectedAvatar && (
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center">
              <Check className="w-2.5 h-2.5" />
            </div>
          )}
        </button>

        {/* Preset Options */}
        {AVATAR_PRESETS.map((preset) => {
          const isSelected = selectedAvatar === preset.id;
          const Icon = preset.icon;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelect(preset.id)}
              className={`relative flex items-center justify-center w-9 h-9 rounded-full ${preset.bgColor} ${preset.textColor} transition border-2 ${
                isSelected ? 'border-blue-600 ring-2 ring-blue-500/20 scale-105' : 'border-transparent hover:scale-105'
              }`}
              title={preset.name}
            >
              <Icon className="w-4 h-4" />
              {isSelected && (
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white text-blue-600 shadow-xs flex items-center justify-center">
                  <Check className="w-2.5 h-2.5" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
