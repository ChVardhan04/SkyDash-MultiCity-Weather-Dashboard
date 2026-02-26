'use client';

import { useState, useCallback, useRef } from 'react';
import { Search, X, MapPin, Loader2, Plus } from 'lucide-react';
import { weatherAPI } from '@/lib/api';

interface Props {
  onAdd: (city: any) => Promise<void>;
  onClose: () => void;
}

export default function AddCityModal({ onAdd, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [error, setError] = useState('');
  const debounceRef = useRef<NodeJS.Timeout>();

  const handleSearch = useCallback(async (q: string) => {
    setQuery(q);
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      setError('');
      try {
        const res = await weatherAPI.search(q.trim());
        setResults(res.data.cities);
        if (res.data.cities.length === 0) setError('No cities found. Try a different name.');
      } catch {
        setError('Search failed. Please try again.');
      } finally {
        setSearching(false);
      }
    }, 400);
  }, []);

  const handleAdd = async (city: any) => {
    setAdding(city.displayName);
    setError('');
    try {
      await onAdd(city);
    } catch (err: any) {
      setError(err.message);
      setAdding(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md glass rounded-2xl shadow-2xl animate-slide-up overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">Add a City</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        {/* Search */}
        <div className="p-5">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              autoFocus
              type="text"
              className="input-field pl-10 pr-10"
              placeholder="Search for a city (e.g. London, Tokyo)"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
            />
            {searching && (
              <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" size={16} />
            )}
          </div>

          {error && (
            <p className="text-sm text-red-400 mt-3 flex items-center gap-1.5">
              <span>⚠️</span> {error}
            </p>
          )}

          {/* Results */}
          {results.length > 0 && (
            <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
              {results.map((city, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-transparent hover:border-white/10 cursor-pointer group"
                  onClick={() => handleAdd(city)}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <MapPin size={14} className="text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{city.displayName}</p>
                      <p className="text-xs text-gray-500">
                        {city.lat.toFixed(2)}°N, {city.lon.toFixed(2)}°E
                      </p>
                    </div>
                  </div>
                  {adding === city.displayName ? (
                    <Loader2 size={16} className="text-blue-400 animate-spin" />
                  ) : (
                    <Plus size={16} className="text-gray-500 group-hover:text-blue-400 transition-colors" />
                  )}
                </div>
              ))}
            </div>
          )}

          {query.length === 0 && (
            <div className="mt-6 text-center text-gray-500">
              <MapPin className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Start typing a city name to search</p>
              <p className="text-xs mt-1 opacity-60">You can add up to 20 cities</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
