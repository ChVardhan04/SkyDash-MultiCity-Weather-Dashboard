'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { citiesAPI, weatherAPI } from '@/lib/api';
import Navbar from '@/components/layout/Navbar';
import CityCard from '@/components/weather/CityCard';
import AddCityModal from '@/components/weather/AddCityModal';
import AIChat from '@/components/ai/AIChat';
import WeatherMap from '@/components/weather/WeatherMap';
import StatsOverview from '@/components/weather/StatsOverview';
import {
  Plus, Star, Grid3X3, List, Bot, Map, BarChart3, Loader2, CloudOff, Sparkles
} from 'lucide-react';

type View = 'grid' | 'list' | 'map' | 'stats';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [cities, setCities] = useState<any[]>([]);
  const [weatherData, setWeatherData] = useState<Record<string, any>>({});
  const [loadingCities, setLoadingCities] = useState(true);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [view, setView] = useState<View>('grid');
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');
  const [error, setError] = useState('');

  const units = user?.preferences?.temperatureUnit === 'fahrenheit' ? 'imperial' : 'metric';

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  // Load cities
  const loadCities = useCallback(async () => {
    try {
      setLoadingCities(true);
      const res = await citiesAPI.getAll();
      setCities(res.data.cities);
    } catch {
      setError('Failed to load cities');
    } finally {
      setLoadingCities(false);
    }
  }, []);

  useEffect(() => {
    if (user) loadCities();
  }, [user, loadCities]);

  // Fetch weather for all cities
  const fetchWeather = useCallback(async () => {
    if (cities.length === 0) return;
    setLoadingWeather(true);
    try {
      const res = await weatherAPI.getBulk(units);
      const map: Record<string, any> = {};
      res.data.results.forEach((r: any) => {
        if (!r.error) map[r.cityId] = r.weather;
      });
      setWeatherData(map);
    } catch {
      // Fail silently
    } finally {
      setLoadingWeather(false);
    }
  }, [cities, units]);

  useEffect(() => {
    fetchWeather();
    const interval = setInterval(fetchWeather, 10 * 60 * 1000); // refresh every 10 min
    return () => clearInterval(interval);
  }, [fetchWeather]);

  const handleAddCity = async (cityData: any) => {
    try {
      await citiesAPI.add(cityData);
      await loadCities();
      setShowAddModal(false);
    } catch (err: any) {
      throw new Error(err.response?.data?.error || 'Failed to add city');
    }
  };

  const handleRemoveCity = async (id: string) => {
    await citiesAPI.remove(id);
    setCities((prev) => prev.filter((c) => c._id !== id));
    setWeatherData((prev) => { const d = { ...prev }; delete d[id]; return d; });
  };

  const handleToggleFavorite = async (id: string) => {
    await citiesAPI.toggleFavorite(id);
    setCities((prev) => prev.map((c) => c._id === id ? { ...c, isFavorite: !c.isFavorite } : c));
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const filteredCities = filter === 'favorites'
    ? cities.filter((c) => c.isFavorite)
    : cities;

  const favoritesCount = cities.filter((c) => c.isFavorite).length;

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Good {getGreeting()}, {user.name.split(' ')[0]} 👋
            </h1>
            <p className="text-gray-400 text-sm mt-0.5">
              {cities.length} cities tracked · {favoritesCount} favorites
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* View toggles */}
            <div className="flex bg-white/5 rounded-xl p-1 border border-white/10">
              {([
                { id: 'grid', icon: Grid3X3 },
                { id: 'list', icon: List },
                { id: 'map', icon: Map },
                { id: 'stats', icon: BarChart3 },
              ] as const).map(({ id, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setView(id)}
                  className={`p-2 rounded-lg transition-all ${view === id ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  <Icon size={16} />
                </button>
              ))}
            </div>

            {/* AI Chat button */}
            <button
              onClick={() => setShowAI(!showAI)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all border ${
                showAI ? 'bg-purple-500/20 border-purple-500/50 text-purple-300' : 'bg-white/5 border-white/10 text-gray-300 hover:text-white'
              }`}
            >
              <Bot size={16} />
              SkyMind AI
              {showAI && <Sparkles size={12} className="text-purple-400" />}
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <Plus size={16} />
              Add City
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        {cities.length > 0 && (
          <div className="flex gap-2 mb-6">
            {(['all', 'favorites'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  filter === f
                    ? 'bg-blue-500 text-white'
                    : 'bg-white/5 text-gray-400 hover:text-white border border-white/10'
                }`}
              >
                {f === 'favorites' && <Star size={12} fill={filter === 'favorites' ? 'white' : 'none'} />}
                {f.charAt(0).toUpperCase() + f.slice(1)}
                {f === 'favorites' && favoritesCount > 0 && (
                  <span className="bg-white/20 text-white rounded-full px-1.5 py-0.5 text-xs">{favoritesCount}</span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* AI Chat Panel */}
        {showAI && (
          <div className="mb-6 animate-slide-up">
            <AIChat cities={cities} weatherData={weatherData} units={units} />
          </div>
        )}

        {/* Content */}
        {loadingCities ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
            <p className="text-gray-400">Loading your cities...</p>
          </div>
        ) : filteredCities.length === 0 ? (
          <EmptyState
            filter={filter}
            onAdd={() => setShowAddModal(true)}
            onAll={() => setFilter('all')}
          />
        ) : (
          <>
            {view === 'grid' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCities.map((city) => (
                  <CityCard
                    key={city._id}
                    city={city}
                    weather={weatherData[city._id]}
                    loadingWeather={loadingWeather && !weatherData[city._id]}
                    onRemove={() => handleRemoveCity(city._id)}
                    onToggleFavorite={() => handleToggleFavorite(city._id)}
                    units={units}
                  />
                ))}
              </div>
            )}

            {view === 'list' && (
              <div className="space-y-2">
                {filteredCities.map((city) => (
                  <CityCard
                    key={city._id}
                    city={city}
                    weather={weatherData[city._id]}
                    loadingWeather={loadingWeather && !weatherData[city._id]}
                    onRemove={() => handleRemoveCity(city._id)}
                    onToggleFavorite={() => handleToggleFavorite(city._id)}
                    units={units}
                    compact
                  />
                ))}
              </div>
            )}

            {view === 'map' && (
              <WeatherMap cities={filteredCities} weatherData={weatherData} />
            )}

            {view === 'stats' && (
              <StatsOverview cities={filteredCities} weatherData={weatherData} units={units} />
            )}
          </>
        )}
      </main>

      {/* Add City Modal */}
      {showAddModal && (
        <AddCityModal onAdd={handleAddCity} onClose={() => setShowAddModal(false)} />
      )}
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
}

function EmptyState({ filter, onAdd, onAll }: { filter: string; onAdd: () => void; onAll: () => void }) {
  if (filter === 'favorites') {
    return (
      <div className="text-center py-20">
        <Star className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-300 mb-2">No favorites yet</h3>
        <p className="text-gray-500 mb-6">Star a city card to add it to your favorites</p>
        <button onClick={onAll} className="btn-secondary text-sm">View all cities</button>
      </div>
    );
  }
  return (
    <div className="text-center py-20">
      <CloudOff className="w-12 h-12 text-gray-600 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-300 mb-2">No cities yet</h3>
      <p className="text-gray-500 mb-6">Add your first city to start tracking weather</p>
      <button onClick={onAdd} className="btn-primary flex items-center gap-2 mx-auto text-sm">
        <Plus size={16} /> Add your first city
      </button>
    </div>
  );
}
