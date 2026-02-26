'use client';

import { useState } from 'react';
import {
  Star, Trash2, Wind, Droplets, Eye, Thermometer,
  Sunrise, Sunset, Loader2, ChevronDown, ChevronUp, StickyNote
} from 'lucide-react';
import { getWeatherEmoji, getWeatherGradient, getWindDirection, formatTime } from '@/lib/weatherUtils';
import { citiesAPI, aiAPI } from '@/lib/api';

interface Props {
  city: any;
  weather: any;
  loadingWeather: boolean;
  onRemove: () => void;
  onToggleFavorite: () => void;
  units: string;
  compact?: boolean;
}

export default function CityCard({ city, weather, loadingWeather, onRemove, onToggleFavorite, units, compact }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [insight, setInsight] = useState<string | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [notes, setNotes] = useState(city.notes || '');
  const [editingNotes, setEditingNotes] = useState(false);

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Remove ${city.name} from dashboard?`)) return;
    setRemoving(true);
    await onRemove();
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite();
  };

  const fetchInsight = async () => {
    if (insight) return;
    setLoadingInsight(true);
    try {
      const res = await aiAPI.getCityInsight(city._id);
      setInsight(res.data.insight);
    } catch {
      setInsight('Unable to generate insight at this time.');
    } finally {
      setLoadingInsight(false);
    }
  };

  const saveNotes = async () => {
    try {
      await citiesAPI.updateNotes(city._id, notes);
      setEditingNotes(false);
    } catch { /* ignore */ }
  };

  const isDaytime = weather
    ? Math.floor(Date.now() / 1000) >= weather.sunrise && Math.floor(Date.now() / 1000) <= weather.sunset
    : true;

  const gradient = weather ? getWeatherGradient(weather.main, isDaytime) : 'from-slate-700 to-slate-800';

  if (compact) {
    return (
      <div className={`glass rounded-xl p-4 flex items-center gap-4 hover:border-white/20 transition-all animate-fade-in ${removing ? 'opacity-50 scale-95' : ''}`}>
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-2xl shrink-0`}>
          {weather ? getWeatherEmoji(weather.icon) : '🌡️'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-white truncate">{city.name}</h3>
            {city.isFavorite && <Star size={12} className="text-yellow-400 fill-yellow-400 shrink-0" />}
          </div>
          <p className="text-sm text-gray-400 truncate">{city.country}</p>
        </div>
        <div className="text-right shrink-0">
          {loadingWeather ? (
            <Loader2 className="w-5 h-5 text-gray-500 animate-spin" />
          ) : weather ? (
            <>
              <p className="text-xl font-bold text-white">{weather.temp}{weather.unit}</p>
              <p className="text-xs text-gray-400 capitalize">{weather.description}</p>
            </>
          ) : (
            <p className="text-sm text-gray-500">No data</p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={handleFavorite} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
            <Star size={14} className={city.isFavorite ? 'text-yellow-400 fill-yellow-400' : 'text-gray-500'} />
          </button>
          <button onClick={handleRemove} disabled={removing} className="p-2 rounded-lg hover:bg-red-500/10 transition-colors">
            <Trash2 size={14} className="text-gray-500 hover:text-red-400" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl overflow-hidden transition-all duration-300 animate-fade-in border border-white/10 hover:border-white/20 ${removing ? 'opacity-50 scale-95' : ''} ${city.isFavorite ? 'ring-1 ring-yellow-400/30' : ''}`}>
      {/* Card header with gradient */}
      <div className={`bg-gradient-to-br ${gradient} p-5 relative`}>
        {/* Favorite badge */}
        {city.isFavorite && (
          <div className="absolute top-3 left-3 bg-yellow-400/20 backdrop-blur-sm border border-yellow-400/30 text-yellow-300 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
            <Star size={10} fill="currentColor" /> Favorite
          </div>
        )}

        {/* Actions */}
        <div className="absolute top-3 right-3 flex gap-1">
          <button
            onClick={handleFavorite}
            className="p-1.5 bg-black/20 backdrop-blur-sm rounded-lg hover:bg-black/30 transition-all"
          >
            <Star size={14} className={city.isFavorite ? 'text-yellow-400 fill-yellow-400' : 'text-white/70'} />
          </button>
          <button
            onClick={handleRemove}
            disabled={removing}
            className="p-1.5 bg-black/20 backdrop-blur-sm rounded-lg hover:bg-red-500/40 transition-all"
          >
            {removing ? <Loader2 size={14} className="text-white animate-spin" /> : <Trash2 size={14} className="text-white/70" />}
          </button>
        </div>

        {/* City name */}
        <div className="pt-4">
          <h3 className="text-lg font-bold text-white drop-shadow-sm">{city.name}</h3>
          <p className="text-white/70 text-sm">{city.country}</p>
        </div>

        {/* Main temp */}
        <div className="flex items-end justify-between mt-4">
          {loadingWeather ? (
            <Loader2 className="w-8 h-8 text-white/50 animate-spin" />
          ) : weather ? (
            <>
              <div>
                <div className="text-5xl font-thin text-white leading-none">
                  {weather.temp}<span className="text-2xl">{weather.unit}</span>
                </div>
                <p className="text-white/80 text-sm mt-1 capitalize">{weather.description}</p>
                <p className="text-white/60 text-xs">Feels like {weather.feelsLike}{weather.unit}</p>
              </div>
              <div className="text-5xl">{getWeatherEmoji(weather.icon)}</div>
            </>
          ) : (
            <p className="text-white/50 text-sm">Weather unavailable</p>
          )}
        </div>
      </div>

      {/* Card body */}
      <div className="bg-gray-900/80 backdrop-blur-sm p-4">
        {weather && (
          <>
            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-2 text-center mb-3">
              <StatBadge icon={<Droplets size={12} />} label="Humidity" value={`${weather.humidity}%`} />
              <StatBadge icon={<Wind size={12} />} label="Wind" value={`${weather.windSpeed}m/s ${getWindDirection(weather.windDeg)}`} />
              <StatBadge icon={<Eye size={12} />} label="Visibility" value={`${Math.round(weather.visibility / 1000)}km`} />
            </div>

            {/* Sunrise / Sunset */}
            <div className="flex justify-between text-xs text-gray-400 border-t border-white/5 pt-3 mb-3">
              <span className="flex items-center gap-1">
                <Sunrise size={12} className="text-amber-400" />
                {formatTime(weather.sunrise, weather.timezone)}
              </span>
              <span className="flex items-center gap-1">
                <Sunset size={12} className="text-orange-400" />
                {formatTime(weather.sunset, weather.timezone)}
              </span>
            </div>
          </>
        )}

        {/* Expandable section */}
        <button
          onClick={() => { setExpanded(!expanded); if (!expanded) fetchInsight(); }}
          className="flex items-center justify-between w-full text-xs text-gray-400 hover:text-gray-300 transition-colors"
        >
          <span>Details & AI Insight</span>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {expanded && (
          <div className="mt-3 space-y-3 animate-slide-up">
            {/* AI Insight */}
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3">
              <p className="text-xs font-medium text-purple-300 mb-1.5 flex items-center gap-1">
                ✨ SkyMind Insight
              </p>
              {loadingInsight ? (
                <div className="flex items-center gap-2 text-gray-400 text-xs">
                  <Loader2 size={12} className="animate-spin" /> Generating insight...
                </div>
              ) : (
                <p className="text-xs text-gray-300 leading-relaxed">{insight || 'Click to generate AI insight'}</p>
              )}
            </div>

            {/* Notes */}
            <div className="bg-white/5 rounded-xl p-3">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-medium text-gray-400 flex items-center gap-1">
                  <StickyNote size={11} /> Notes
                </p>
                {!editingNotes ? (
                  <button onClick={() => setEditingNotes(true)} className="text-xs text-blue-400 hover:text-blue-300">Edit</button>
                ) : (
                  <button onClick={saveNotes} className="text-xs text-green-400 hover:text-green-300">Save</button>
                )}
              </div>
              {editingNotes ? (
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-transparent text-xs text-gray-300 resize-none focus:outline-none placeholder-gray-600"
                  placeholder="Add a note about this city..."
                  rows={2}
                  maxLength={200}
                />
              ) : (
                <p className="text-xs text-gray-400">{notes || 'No notes added'}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatBadge({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-white/5 rounded-xl p-2">
      <div className="flex items-center justify-center gap-1 text-gray-400 mb-0.5">{icon}</div>
      <p className="text-white text-xs font-medium">{value}</p>
      <p className="text-gray-500 text-xs">{label}</p>
    </div>
  );
}
