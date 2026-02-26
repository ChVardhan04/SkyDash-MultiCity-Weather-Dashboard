'use client';

import { useState } from 'react';
import { X, User, Mail, Calendar, Edit2, Check, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { authAPI } from '@/lib/api';

interface Props {
  onClose: () => void;
}

export default function ProfileModal({ onClose }: Props) {
  const { user, updatePreferences } = useAuth();
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSaveName = async () => {
    if (!name.trim() || name.trim().length < 2) {
      setNameError('Name must be at least 2 characters');
      return;
    }
    setSavingName(true);
    setNameError('');
    try {
      // Update via preferences endpoint — we'll just store in localStorage for now
      // since a full name-update endpoint isn't wired; easily extendable
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      stored.name = name.trim();
      localStorage.setItem('user', JSON.stringify(stored));
      window.location.reload(); // refresh to pick up new name
    } catch {
      setNameError('Failed to update name');
    } finally {
      setSavingName(false);
      setEditingName(false);
    }
  };

  const initials = user?.name
    ?.split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const joinDate = (() => {
    try {
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      return stored.createdAt
        ? new Date(stored.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        : 'Recently';
    } catch {
      return 'Recently';
    }
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md glass rounded-2xl shadow-2xl animate-slide-up overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <User size={18} className="text-blue-400" /> My Profile
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              {initials}
            </div>
            <div className="text-center">
              <p className="text-white font-semibold text-lg">{user?.name}</p>
              <p className="text-gray-400 text-sm">{user?.email}</p>
            </div>
          </div>

          {successMsg && (
            <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm text-center">
              {successMsg}
            </div>
          )}

          {/* Fields */}
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">Display Name</label>
              {editingName ? (
                <div className="flex gap-2">
                  <input
                    autoFocus
                    className="input-field text-sm py-2 flex-1"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                    maxLength={50}
                  />
                  <button
                    onClick={handleSaveName}
                    disabled={savingName}
                    className="btn-primary px-3 py-2"
                  >
                    {savingName ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  </button>
                  <button
                    onClick={() => { setEditingName(false); setName(user?.name || ''); setNameError(''); }}
                    className="btn-secondary px-3 py-2"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                  <span className="text-white text-sm">{user?.name}</span>
                  <button
                    onClick={() => setEditingName(true)}
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <Edit2 size={14} />
                  </button>
                </div>
              )}
              {nameError && <p className="text-red-400 text-xs mt-1">{nameError}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">Email Address</label>
              <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                <Mail size={14} className="text-gray-400 shrink-0" />
                <span className="text-white text-sm">{user?.email}</span>
              </div>
            </div>

            {/* Member since */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">Member Since</label>
              <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                <Calendar size={14} className="text-gray-400 shrink-0" />
                <span className="text-white text-sm">{joinDate}</span>
              </div>
            </div>

            {/* Temperature unit */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">Temperature Unit</label>
              <div className="flex gap-2">
                {(['celsius', 'fahrenheit'] as const).map((unit) => (
                  <button
                    key={unit}
                    onClick={() => updatePreferences({ temperatureUnit: unit })}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                      user?.preferences?.temperatureUnit === unit
                        ? 'bg-blue-500 border-blue-500 text-white'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                    }`}
                  >
                    {unit === 'celsius' ? '°C — Celsius' : '°F — Fahrenheit'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
