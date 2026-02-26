'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Cloud, LogOut, Settings, User, ChevronDown, Thermometer } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import ProfileModal from '@/components/modals/ProfileModal';
import SettingsModal from '@/components/modals/SettingsModal';

export default function Navbar() {
  const { user, logout, updatePreferences } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [updatingUnit, setUpdatingUnit] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const handleUnitToggle = async () => {
    if (!user || updatingUnit) return;
    setUpdatingUnit(true);
    try {
      await updatePreferences({
        temperatureUnit: user.preferences.temperatureUnit === 'celsius' ? 'fahrenheit' : 'celsius',
      });
    } finally {
      setUpdatingUnit(false);
    }
  };

  return (
    <>
      <nav className="border-b border-white/10 bg-gray-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="p-1.5 bg-blue-500/20 rounded-lg">
                <Cloud className="w-5 h-5 text-blue-400" />
              </div>
              <span className="font-bold text-white text-lg tracking-tight">SkyDash</span>
            </Link>

            {/* Right side */}
            <div className="flex items-center gap-3">

              {/* Unit toggle */}
              <button
                onClick={handleUnitToggle}
                disabled={updatingUnit}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 hover:text-white hover:border-white/20 transition-all"
                title="Toggle temperature unit"
              >
                <Thermometer size={14} />
                <span className="font-mono font-medium">
                  {user?.preferences?.temperatureUnit === 'fahrenheit' ? '°F' : '°C'}
                </span>
              </button>

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg hover:border-white/20 transition-all"
                >
                  <div className="w-7 h-7 bg-blue-500/30 rounded-full flex items-center justify-center text-blue-300 text-sm font-medium">
                    {user?.name?.[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm text-gray-300 hidden sm:block max-w-[120px] truncate">
                    {user?.name}
                  </span>
                  <ChevronDown size={14} className={`text-gray-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-52 glass rounded-xl border border-white/10 shadow-xl overflow-hidden animate-slide-up z-50">
                    <div className="px-4 py-3 border-b border-white/10">
                      <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                      <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={() => { setMenuOpen(false); setShowProfile(true); }}
                        className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        <User size={15} /> Profile
                      </button>
                      <button
                        onClick={() => { setMenuOpen(false); setShowSettings(true); }}
                        className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        <Settings size={15} /> Settings
                      </button>
                      <hr className="border-white/10 my-1" />
                      <button
                        onClick={() => { setMenuOpen(false); logout(); }}
                        className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                      >
                        <LogOut size={15} /> Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {menuOpen && (
          <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
        )}
      </nav>

      {/* Modals */}
      {showProfile  && <ProfileModal  onClose={() => setShowProfile(false)}  />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </>
  );
}
