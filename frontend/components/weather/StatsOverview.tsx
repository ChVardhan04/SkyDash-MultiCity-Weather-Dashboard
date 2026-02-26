'use client';

import { TrendingUp, TrendingDown, Wind, Droplets, Eye, Award, AlertTriangle } from 'lucide-react';
import { getWeatherEmoji, getWeatherGradient } from '@/lib/weatherUtils';

interface Props {
  cities: any[];
  weatherData: Record<string, any>;
  units: string;
}

export default function StatsOverview({ cities, weatherData, units }: Props) {
  const citiesWithWeather = cities.filter((c) => weatherData[c._id]);

  if (citiesWithWeather.length === 0) {
    return (
      <div className="text-center py-20 text-gray-500">
        <BarChart className="w-12 h-12 mx-auto mb-4 opacity-30" />
        <p>No weather data available for statistics</p>
      </div>
    );
  }

  const sorted = {
    byTemp: [...citiesWithWeather].sort((a, b) => weatherData[b._id].temp - weatherData[a._id].temp),
    byHumidity: [...citiesWithWeather].sort((a, b) => weatherData[b._id].humidity - weatherData[a._id].humidity),
    byWind: [...citiesWithWeather].sort((a, b) => weatherData[b._id].windSpeed - weatherData[a._id].windSpeed),
  };

  const unit = units === 'imperial' ? '°F' : '°C';
  const hottest = sorted.byTemp[0];
  const coldest = sorted.byTemp[sorted.byTemp.length - 1];
  const windiest = sorted.byWind[0];
  const mostHumid = sorted.byHumidity[0];

  const avgTemp = Math.round(citiesWithWeather.reduce((s, c) => s + weatherData[c._id].temp, 0) / citiesWithWeather.length);
  const avgHumidity = Math.round(citiesWithWeather.reduce((s, c) => s + weatherData[c._id].humidity, 0) / citiesWithWeather.length);

  const extremes = citiesWithWeather.filter((c) => {
    const w = weatherData[c._id];
    return w.temp > 35 || w.temp < 0 || w.windSpeed > 15 || w.main === 'Thunderstorm';
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-xl font-bold text-white">Weather Intelligence Dashboard</h2>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard title="Hottest City" city={hottest} weather={weatherData[hottest._id]} icon={<TrendingUp className="text-red-400" size={18} />} highlight="temp" unit={unit} color="from-red-500/20 to-orange-500/10" border="border-red-500/20" />
        <SummaryCard title="Coolest City" city={coldest} weather={weatherData[coldest._id]} icon={<TrendingDown className="text-blue-400" size={18} />} highlight="temp" unit={unit} color="from-blue-500/20 to-cyan-500/10" border="border-blue-500/20" />
        <SummaryCard title="Windiest City" city={windiest} weather={weatherData[windiest._id]} icon={<Wind className="text-green-400" size={18} />} highlight="windSpeed" unit="m/s" color="from-green-500/20 to-teal-500/10" border="border-green-500/20" />
        <SummaryCard title="Most Humid" city={mostHumid} weather={weatherData[mostHumid._id]} icon={<Droplets className="text-purple-400" size={18} />} highlight="humidity" unit="%" color="from-purple-500/20 to-violet-500/10" border="border-purple-500/20" />
      </div>

      {/* Averages */}
      <div className="glass rounded-2xl p-5">
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          <Award size={16} className="text-yellow-400" />
          Network Averages ({citiesWithWeather.length} cities)
        </h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-gray-400 text-sm mb-1">Average Temperature</p>
            <p className="text-3xl font-bold text-white">{avgTemp}{unit}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm mb-1">Average Humidity</p>
            <p className="text-3xl font-bold text-white">{avgHumidity}%</p>
          </div>
        </div>
      </div>

      {/* Temperature bar chart */}
      <div className="glass rounded-2xl p-5">
        <h3 className="font-semibold text-white mb-4">Temperature Comparison</h3>
        <div className="space-y-3">
          {sorted.byTemp.map((city) => {
            const w = weatherData[city._id];
            const minTemp = sorted.byTemp[sorted.byTemp.length - 1];
            const maxTemp = sorted.byTemp[0];
            const range = (weatherData[maxTemp._id].temp - weatherData[minTemp._id].temp) || 1;
            const pct = Math.max(5, ((w.temp - weatherData[minTemp._id].temp) / range) * 100);

            return (
              <div key={city._id}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-300 flex items-center gap-1.5">
                    {getWeatherEmoji(w.icon)} {city.name}
                  </span>
                  <span className="text-white font-medium">{w.temp}{unit}</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-orange-500 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Extreme weather alerts */}
      {extremes.length > 0 && (
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-5">
          <h3 className="font-semibold text-orange-300 mb-3 flex items-center gap-2">
            <AlertTriangle size={16} /> Weather Alerts
          </h3>
          <div className="space-y-2">
            {extremes.map((city) => {
              const w = weatherData[city._id];
              const alerts = [];
              if (w.temp > 35) alerts.push(`🌡️ Extreme heat: ${w.temp}${unit}`);
              if (w.temp < 0) alerts.push(`🧊 Freezing conditions: ${w.temp}${unit}`);
              if (w.windSpeed > 15) alerts.push(`💨 Strong winds: ${w.windSpeed}m/s`);
              if (w.main === 'Thunderstorm') alerts.push('⛈️ Thunderstorm active');
              return (
                <div key={city._id} className="text-sm text-orange-200">
                  <span className="font-medium">{city.name}:</span>{' '}
                  {alerts.join(' · ')}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Weather condition breakdown */}
      <div className="glass rounded-2xl p-5">
        <h3 className="font-semibold text-white mb-4">Conditions Breakdown</h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(
            citiesWithWeather.reduce((acc: Record<string, number>, c) => {
              const main = weatherData[c._id].main;
              acc[main] = (acc[main] || 0) + 1;
              return acc;
            }, {})
          ).map(([cond, count]) => (
            <div key={cond} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 text-sm">
              <span>{getWeatherEmoji(citiesWithWeather.find((c) => weatherData[c._id].main === cond) ? weatherData[citiesWithWeather.find((c) => weatherData[c._id].main === cond)!._id].icon : '01d')}</span>
              <span className="text-gray-300">{cond}</span>
              <span className="text-gray-500">×{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ title, city, weather, icon, highlight, unit, color, border }: any) {
  return (
    <div className={`bg-gradient-to-br ${color} border ${border} rounded-2xl p-4`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400">{title}</span>
        {icon}
      </div>
      <p className="font-bold text-white">{city.name}</p>
      <p className="text-2xl font-bold text-white mt-1">
        {weather[highlight]}{unit}
      </p>
      <p className="text-xs text-gray-400 mt-1 capitalize">{weather.description}</p>
    </div>
  );
}

function BarChart({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M3 3v18h18M9 17V9m4 8V5m4 12v-4" />
    </svg>
  );
}
