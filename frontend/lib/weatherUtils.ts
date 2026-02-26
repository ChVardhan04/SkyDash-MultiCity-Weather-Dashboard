// Map OpenWeatherMap icon codes to emoji and color themes
export const getWeatherEmoji = (iconCode: string): string => {
  const map: Record<string, string> = {
    '01d': '☀️', '01n': '🌙',
    '02d': '⛅', '02n': '☁️',
    '03d': '☁️', '03n': '☁️',
    '04d': '☁️', '04n': '☁️',
    '09d': '🌧️', '09n': '🌧️',
    '10d': '🌦️', '10n': '🌧️',
    '11d': '⛈️', '11n': '⛈️',
    '13d': '❄️', '13n': '❄️',
    '50d': '🌫️', '50n': '🌫️',
  };
  return map[iconCode] || '🌡️';
};

export const getWeatherGradient = (main: string, isDay: boolean): string => {
  const gradients: Record<string, string> = {
    Clear: isDay
      ? 'from-amber-400 via-orange-300 to-sky-400'
      : 'from-indigo-900 via-blue-900 to-slate-900',
    Clouds: 'from-slate-400 via-gray-400 to-blue-300',
    Rain: 'from-slate-600 via-blue-700 to-slate-800',
    Drizzle: 'from-slate-500 via-blue-600 to-slate-700',
    Thunderstorm: 'from-gray-800 via-purple-900 to-gray-900',
    Snow: 'from-blue-100 via-blue-200 to-slate-200',
    Mist: 'from-gray-400 via-slate-400 to-gray-500',
    Fog: 'from-gray-400 via-slate-400 to-gray-500',
    Haze: 'from-amber-200 via-orange-200 to-yellow-300',
  };
  return gradients[main] || 'from-blue-500 via-sky-500 to-indigo-500';
};

export const getWindDirection = (deg: number): string => {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(deg / 45) % 8];
};

export const formatTime = (timestamp: number, timezone: number): string => {
  const date = new Date((timestamp + timezone) * 1000);
  return date.toUTCString().slice(17, 22);
};

export const isDay = (sunrise: number, sunset: number): boolean => {
  const now = Math.floor(Date.now() / 1000);
  return now >= sunrise && now <= sunset;
};

export const getUVLabel = (uvi: number): { label: string; color: string } => {
  if (uvi < 3) return { label: 'Low', color: 'text-green-400' };
  if (uvi < 6) return { label: 'Moderate', color: 'text-yellow-400' };
  if (uvi < 8) return { label: 'High', color: 'text-orange-400' };
  if (uvi < 11) return { label: 'Very High', color: 'text-red-400' };
  return { label: 'Extreme', color: 'text-purple-400' };
};

export const getAQILabel = (aqi: number): { label: string; color: string } => {
  const labels = ['', 'Good', 'Fair', 'Moderate', 'Poor', 'Very Poor'];
  const colors = ['', 'text-green-400', 'text-yellow-400', 'text-orange-400', 'text-red-400', 'text-purple-400'];
  return { label: labels[aqi] || 'Unknown', color: colors[aqi] || 'text-gray-400' };
};
