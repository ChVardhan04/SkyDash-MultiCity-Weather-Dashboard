'use client';

import { useEffect, useRef } from 'react';
import { getWeatherEmoji } from '@/lib/weatherUtils';

interface Props {
  cities: any[];
  weatherData: Record<string, any>;
}

export default function WeatherMap({ cities, weatherData }: Props) {
  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-white/10">
        <h3 className="font-semibold text-white">City Map View</h3>
        <p className="text-xs text-gray-400 mt-0.5">Geographic distribution of your tracked cities</p>
      </div>

      {/* Simple SVG world map approximation */}
      <div className="relative bg-gray-900 h-96 overflow-hidden">
        {/* Decorative grid */}
        <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
          {Array.from({ length: 10 }, (_, i) => (
            <line key={`h${i}`} x1="0" y1={`${i * 10}%`} x2="100%" y2={`${i * 10}%`} stroke="white" strokeWidth="0.5" />
          ))}
          {Array.from({ length: 20 }, (_, i) => (
            <line key={`v${i}`} x1={`${i * 5}%`} y1="0" x2={`${i * 5}%`} y2="100%" stroke="white" strokeWidth="0.5" />
          ))}
        </svg>

        {/* City dots */}
        {cities.map((city) => {
          const w = weatherData[city._id];
          // Convert lat/lon to approximate x/y percentage
          const x = ((city.lon + 180) / 360) * 100;
          const y = ((90 - city.lat) / 180) * 100;

          return (
            <div
              key={city._id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              {/* Pulse ring */}
              <div className={`absolute inset-0 rounded-full animate-ping ${city.isFavorite ? 'bg-yellow-400/30' : 'bg-blue-400/20'}`} 
                   style={{ width: '24px', height: '24px', margin: '-4px' }} />
              
              {/* City dot */}
              <div className={`w-4 h-4 rounded-full border-2 cursor-pointer ${city.isFavorite ? 'bg-yellow-400 border-yellow-300' : 'bg-blue-500 border-blue-300'} shadow-lg relative z-10`} />

              {/* Tooltip */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-gray-800 border border-white/20 rounded-xl p-3 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-xl pointer-events-none">
                <p className="font-bold text-white">{city.name}</p>
                {w ? (
                  <>
                    <p className="text-gray-300">{w.temp}{w.unit} · {w.description}</p>
                    <p className="text-gray-400">{getWeatherEmoji(w.icon)} {city.country}</p>
                  </>
                ) : (
                  <p className="text-gray-400">Loading weather...</p>
                )}
              </div>
            </div>
          );
        })}

        {/* Legend */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-1.5 bg-gray-800/80 backdrop-blur-sm border border-white/10 rounded-xl p-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-400 rounded-full" />
            <span className="text-gray-300">Favorite</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full" />
            <span className="text-gray-300">Tracked</span>
          </div>
        </div>

        {/* Axis labels */}
        <div className="absolute bottom-2 left-2 text-xs text-gray-600">180°W</div>
        <div className="absolute bottom-2 right-2 text-xs text-gray-600">180°E</div>
        <div className="absolute top-2 left-2 text-xs text-gray-600">90°N</div>
        <div className="absolute bottom-2 left-8 text-xs text-gray-600">90°S</div>
      </div>

      {/* City list below map */}
      <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 border-t border-white/10">
        {cities.map((city) => {
          const w = weatherData[city._id];
          return (
            <div key={city._id} className="flex items-center gap-2 text-sm">
              <div className={`w-2 h-2 rounded-full shrink-0 ${city.isFavorite ? 'bg-yellow-400' : 'bg-blue-500'}`} />
              <span className="text-gray-300 truncate">{city.name}</span>
              {w && <span className="text-gray-500 shrink-0">{w.temp}{w.unit}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
