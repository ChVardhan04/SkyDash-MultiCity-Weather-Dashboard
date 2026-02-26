/**
 * Weather Service
 * Uses Open-Meteo (https://open-meteo.com) — 100% FREE, no API key required
 * Uses Nominatim (OpenStreetMap)          — 100% FREE, no API key required
 */

const axios = require('axios');

const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org';

const cache = new Map();
const CACHE_TTL = 10 * 60 * 1000;

const getCached = (key) => {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() - item.timestamp > CACHE_TTL) { cache.delete(key); return null; }
  return item.data;
};
const setCache = (key, data) => cache.set(key, { data, timestamp: Date.now() });

const WMO_CODES = {
  0:  { description: 'clear sky',           main: 'Clear',        icon: '01' },
  1:  { description: 'mainly clear',         main: 'Clear',        icon: '01' },
  2:  { description: 'partly cloudy',        main: 'Clouds',       icon: '02' },
  3:  { description: 'overcast',             main: 'Clouds',       icon: '04' },
  45: { description: 'fog',                  main: 'Fog',          icon: '50' },
  48: { description: 'icy fog',              main: 'Fog',          icon: '50' },
  51: { description: 'light drizzle',        main: 'Drizzle',      icon: '09' },
  53: { description: 'drizzle',              main: 'Drizzle',      icon: '09' },
  55: { description: 'heavy drizzle',        main: 'Drizzle',      icon: '09' },
  61: { description: 'light rain',           main: 'Rain',         icon: '10' },
  63: { description: 'rain',                 main: 'Rain',         icon: '10' },
  65: { description: 'heavy rain',           main: 'Rain',         icon: '10' },
  71: { description: 'light snow',           main: 'Snow',         icon: '13' },
  73: { description: 'snow',                 main: 'Snow',         icon: '13' },
  75: { description: 'heavy snow',           main: 'Snow',         icon: '13' },
  80: { description: 'light showers',        main: 'Rain',         icon: '09' },
  81: { description: 'showers',              main: 'Rain',         icon: '09' },
  82: { description: 'heavy showers',        main: 'Rain',         icon: '09' },
  95: { description: 'thunderstorm',         main: 'Thunderstorm', icon: '11' },
  96: { description: 'thunderstorm w/ hail', main: 'Thunderstorm', icon: '11' },
  99: { description: 'heavy thunderstorm',   main: 'Thunderstorm', icon: '11' },
};

const getWMOInfo = (code, isDay) => {
  const info = WMO_CODES[code] || { description: 'unknown', main: 'Clear', icon: '01' };
  return { ...info, icon: `${info.icon}${isDay ? 'd' : 'n'}` };
};

const isoToUnix = (iso) => Math.floor(new Date(iso).getTime() / 1000);

const searchCities = async (query) => {
  const cacheKey = `geo:${query.toLowerCase()}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const response = await axios.get(`${NOMINATIM_URL}/search`, {
    params: { q: query, format: 'json', limit: 8, addressdetails: 1 },
    headers: { 'User-Agent': 'SkyDash-Weather-App/1.0' },
    timeout: 8000,
  });

  const seen = new Set();
  const cities = response.data
    .filter((r) => ['city', 'town', 'village', 'municipality', 'administrative'].includes(r.type || r.addresstype || ''))
    .map((r) => {
      const name = r.address.city || r.address.town || r.address.village || r.name;
      const country = r.address.country || '';
      const state = r.address.state || '';
      const countryCode = (r.address.country_code || '').toUpperCase();
      return {
        name, country, countryCode, state,
        lat: parseFloat(r.lat),
        lon: parseFloat(r.lon),
        displayName: [name, state, country].filter(Boolean).join(', '),
      };
    })
    .filter((c) => { const k = `${c.name}|${c.country}`; if (seen.has(k)) return false; seen.add(k); return true; })
    .slice(0, 5);

  setCache(cacheKey, cities);
  return cities;
};

const getWeatherByCoords = async (lat, lon, units = 'metric') => {
  const cacheKey = `weather:${lat}:${lon}:${units}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const tempUnit = units === 'imperial' ? 'fahrenheit' : 'celsius';
  const windUnit = units === 'imperial' ? 'mph' : 'ms';

  const response = await axios.get(OPEN_METEO_URL, {
    params: {
      latitude: lat, longitude: lon,
      current: 'temperature_2m,apparent_temperature,relative_humidity_2m,surface_pressure,wind_speed_10m,wind_direction_10m,weather_code,cloud_cover,visibility,is_day',
      daily: 'sunrise,sunset',
      temperature_unit: tempUnit,
      wind_speed_unit: windUnit,
      timezone: 'auto',
      forecast_days: 1,
    },
    timeout: 8000,
  });

  setCache(cacheKey, response.data);
  return response.data;
};

const getForecastByCoords = async (lat, lon, units = 'metric') => {
  const cacheKey = `forecast:${lat}:${lon}:${units}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const tempUnit = units === 'imperial' ? 'fahrenheit' : 'celsius';

  const response = await axios.get(OPEN_METEO_URL, {
    params: {
      latitude: lat, longitude: lon,
      daily: 'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset',
      temperature_unit: tempUnit,
      timezone: 'auto',
      forecast_days: 7,
    },
    timeout: 8000,
  });

  setCache(cacheKey, response.data);
  return response.data;
};

const formatWeatherData = (raw, units = 'metric') => {
  const c = raw.current;
  const isDay = c.is_day === 1;
  const wmoInfo = getWMOInfo(c.weather_code, isDay);

  const sunrise = raw.daily?.sunrise?.[0] ? isoToUnix(raw.daily.sunrise[0]) : Math.floor(Date.now() / 1000) - 3600;
  const sunset  = raw.daily?.sunset?.[0]  ? isoToUnix(raw.daily.sunset[0])  : Math.floor(Date.now() / 1000) + 3600;

  return {
    temp:        Math.round(c.temperature_2m),
    feelsLike:   Math.round(c.apparent_temperature),
    humidity:    c.relative_humidity_2m,
    pressure:    Math.round(c.surface_pressure),
    windSpeed:   Math.round(c.wind_speed_10m * 10) / 10,
    windDeg:     c.wind_direction_10m,
    visibility:  c.visibility ?? 10000,
    description: wmoInfo.description,
    icon:        wmoInfo.icon,
    main:        wmoInfo.main,
    sunrise,
    sunset,
    timezone:    raw.utc_offset_seconds || 0,
    clouds:      c.cloud_cover,
    unit:        units === 'imperial' ? '°F' : '°C',
  };
};

const getDailyForecast = (forecastData) => {
  const d = forecastData.daily;
  return d.time.slice(0, 5).map((dateStr, i) => {
    const wmoInfo = getWMOInfo(d.weather_code[i], true);
    const date = new Date(dateStr);
    return {
      date:        date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      dt:          Math.floor(date.getTime() / 1000),
      min:         Math.round(d.temperature_2m_min[i]),
      max:         Math.round(d.temperature_2m_max[i]),
      icon:        wmoInfo.icon,
      description: wmoInfo.description,
      main:        wmoInfo.main,
    };
  });
};

module.exports = { getWeatherByCoords, getForecastByCoords, searchCities, formatWeatherData, getDailyForecast };
