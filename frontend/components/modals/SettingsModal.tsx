'use client';

import { useState } from 'react';
import {
  X, Settings, Thermometer, Moon, Sun, Monitor,
  Bell, Trash2, Loader2, Shield, RefreshCw, Check
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { citiesAPI } from '@/lib/api';

interface Props {
  onClose: () => void;
}

export default function SettingsModal({ onClose }: Props) {
  const { user, updatePreferences, logout } = useAuth();
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [clearingCities, setClearingCities] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handlePref = async (key: string, value: string) => {
    setSaving(key);
    try {
      await updatePreferences({ [key]: value } as any);
      setSaved(key);
      setTimeout(() => setSaved(null), 2000);
    } finally {
      setSaving(null);
    }
  };

  const handleClearAllCities = async () => {
    if (!showDeleteConfirm) { setShowDeleteConfirm(true); return; }
    setClearingCities(true);
    try {
      const res = await citiesAPI.getAll();
      await Promise.all(res.data.cities.map((c: any) => citiesAPI.remove(c._id)));
      setShowDeleteConfirm(false);
      onClose();
      window.location.reload();
    } catch {
      alert('Failed to clear cities');
    } finally {
      setClearingCities(false);
    }
  };

  const themeOptions = [
    { value: 'light', icon: <Sun size={15} />, label: 'Light' },
    { value: 'dark',  icon: <Moon size={15} />, label: 'Dark' },
    { value: 'auto',  icon: <Monitor size={15} />, label: 'System' },
  ];

  const unitOptions = [
    { value: 'celsius',    label: '°C', sub: 'Celsius' },
    { value: 'fahrenheit', label: '°F', sub: 'Fahrenheit' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md glass rounded-2xl shadow-2xl animate-slide-up overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 sticky top-0 bg-gray-900/90 backdrop-blur-sm z-10">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Settings size={18} className="text-blue-400" /> Settings
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        <div className="p-5 space-y-6">

          {/* Temperature Unit */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Thermometer size={15} className="text-blue-400" />
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Temperature Unit</h3>
            </div>
            <div className="flex gap-2">
              {unitOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handlePref('temperatureUnit', opt.value)}
                  className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all border flex flex-col items-center gap-0.5 ${
                    user?.preferences?.temperatureUnit === opt.value
                      ? 'bg-blue-500 border-blue-400 text-white'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/20'
                  }`}
                >
                  <span className="text-lg font-bold">{opt.label}</span>
                  <span className="text-xs opacity-70">{opt.sub}</span>
                  {saving === 'temperatureUnit' && user?.preferences?.temperatureUnit !== opt.value ? null : null}
                  {saved === 'temperatureUnit' && user?.preferences?.temperatureUnit === opt.value && (
                    <Check size={12} className="text-green-300 mt-0.5" />
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* Theme */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Moon size={15} className="text-purple-400" />
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">App Theme</h3>
            </div>
            <div className="flex gap-2">
              {themeOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handlePref('theme', opt.value)}
                  className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all border flex flex-col items-center gap-1 ${
                    user?.preferences?.theme === opt.value
                      ? 'bg-purple-500 border-purple-400 text-white'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/20'
                  }`}
                >
                  {opt.icon}
                  <span className="text-xs">{opt.label}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">Theme change will apply on next visit</p>
          </section>

          {/* Notifications placeholder */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Bell size={15} className="text-yellow-400" />
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Notifications</h3>
            </div>
            <div className="space-y-2">
              {[
                { label: 'Extreme weather alerts', sublabel: 'Get notified for severe conditions' },
                { label: 'Daily weather summary', sublabel: 'Morning briefing for your cities' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                  <div>
                    <p className="text-sm text-white">{item.label}</p>
                    <p className="text-xs text-gray-400">{item.sublabel}</p>
                  </div>
                  <div className="w-10 h-5 bg-gray-700 rounded-full relative cursor-not-allowed opacity-50">
                    <div className="w-4 h-4 bg-gray-500 rounded-full absolute top-0.5 left-0.5 transition-all" />
                  </div>
                </div>
              ))}
              <p className="text-xs text-gray-500 px-1">Notifications coming soon</p>
            </div>
          </section>

          {/* Account */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Shield size={15} className="text-green-400" />
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Account</h3>
            </div>
            <div className="space-y-2">
              {/* Clear all cities */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white">Clear All Cities</p>
                    <p className="text-xs text-gray-400">Remove all tracked cities from your dashboard</p>
                  </div>
                  <button
                    onClick={handleClearAllCities}
                    disabled={clearingCities}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      showDeleteConfirm
                        ? 'bg-red-500 text-white hover:bg-red-400'
                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                    }`}
                  >
                    {clearingCities ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : showDeleteConfirm ? (
                      'Confirm Delete'
                    ) : (
                      'Clear All'
                    )}
                  </button>
                </div>
                {showDeleteConfirm && (
                  <p className="text-xs text-red-400 mt-2">
                    ⚠️ This will remove all your cities. Click &quot;Confirm Delete&quot; to proceed or close this modal to cancel.
                  </p>
                )}
              </div>

              {/* Sign out */}
              <button
                onClick={() => { onClose(); logout(); }}
                className="w-full flex items-center justify-between bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 hover:bg-red-500/20 transition-all group"
              >
                <div className="text-left">
                  <p className="text-sm text-red-400 group-hover:text-red-300">Sign Out</p>
                  <p className="text-xs text-gray-500">You&apos;ll need to log in again</p>
                </div>
                <X size={15} className="text-red-400" />
              </button>
            </div>
          </section>

          {/* App info */}
          <div className="text-center pt-2 border-t border-white/5">
            <p className="text-xs text-gray-600">SkyDash v1.0.0 • Built with Next.js + Open-Meteo</p>
          </div>
        </div>
      </div>
    </div>
  );
}
