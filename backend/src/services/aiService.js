/**
 * AI Agent Service
 * - If OPENAI_API_KEY is set: uses GPT-4o mini with agentic tool loop
 * - If no key: uses built-in rule-based fallback (no API needed)
 */

const axios = require('axios');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_BASE = 'https://api.openai.com/v1';

// ─── Tool definitions ─────────────────────────────────────────────────────────
const WEATHER_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'analyze_weather_comparison',
      description: 'Compare weather across multiple cities',
      parameters: {
        type: 'object',
        properties: {
          analysis_type: {
            type: 'string',
            enum: ['warmest', 'coolest', 'rainiest', 'windiest', 'best_travel', 'summary'],
          },
        },
        required: ['analysis_type'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_activity_recommendation',
      description: 'Suggest activities based on weather in a city',
      parameters: {
        type: 'object',
        properties: {
          city_name: { type: 'string' },
          weather_condition: { type: 'string' },
          temperature: { type: 'number' },
        },
        required: ['city_name', 'weather_condition', 'temperature'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'check_extreme_conditions',
      description: 'Check for extreme or dangerous weather',
      parameters: {
        type: 'object',
        properties: {
          threshold_type: { type: 'string', enum: ['heat', 'cold', 'wind', 'storm', 'all'] },
        },
        required: ['threshold_type'],
      },
    },
  },
];

// ─── Tool execution ───────────────────────────────────────────────────────────
const executeToolCall = (toolName, toolArgs, weatherContext) => {
  const cities = (weatherContext.cities || []).filter((c) => c.weather);

  switch (toolName) {
    case 'analyze_weather_comparison': {
      const { analysis_type } = toolArgs;
      if (cities.length === 0) return 'No city weather data available.';
      const sorted = [...cities];
      if (analysis_type === 'warmest') {
        sorted.sort((a, b) => b.weather.temp - a.weather.temp);
        return `Warmest: ${sorted.slice(0, 3).map((c) => `${c.name} (${c.weather.temp}${c.weather.unit})`).join(', ')}`;
      }
      if (analysis_type === 'coolest') {
        sorted.sort((a, b) => a.weather.temp - b.weather.temp);
        return `Coolest: ${sorted.slice(0, 3).map((c) => `${c.name} (${c.weather.temp}${c.weather.unit})`).join(', ')}`;
      }
      if (analysis_type === 'windiest') {
        sorted.sort((a, b) => b.weather.windSpeed - a.weather.windSpeed);
        return `Windiest: ${sorted[0]?.name} at ${sorted[0]?.weather.windSpeed} m/s`;
      }
      if (analysis_type === 'best_travel') {
        const ideal = sorted.filter((c) => c.weather.temp > 18 && c.weather.temp < 28 && c.weather.clouds < 50);
        return ideal.length > 0
          ? `Best travel: ${ideal.map((c) => c.name).join(', ')} — mild and clear`
          : 'No city currently has ideal travel conditions (18–28°C, clear skies)';
      }
      if (analysis_type === 'summary') {
        return cities.map((c) => `${c.name}: ${c.weather.temp}${c.weather.unit}, ${c.weather.description}`).join(' | ');
      }
      return 'Analysis done';
    }
    case 'get_activity_recommendation': {
      const { city_name, weather_condition, temperature } = toolArgs;
      let activities = [];
      if (temperature > 28) activities = ['swimming', 'beach', 'water sports'];
      else if (temperature > 20) activities = ['hiking', 'cycling', 'outdoor dining'];
      else if (temperature > 10) activities = ['walking', 'jogging', 'café hopping'];
      else activities = ['indoor activities', 'museum', 'cooking'];
      if (weather_condition.includes('rain') || weather_condition.includes('storm')) {
        return `In ${city_name} with ${weather_condition}, go for: museum visit, coffee shop, or indoor gym.`;
      }
      return `In ${city_name} at ${temperature}°, try: ${activities.join(', ')}.`;
    }
    case 'check_extreme_conditions': {
      const alerts = [];
      cities.forEach((city) => {
        const { temp, windSpeed, main } = city.weather;
        if (temp > 38) alerts.push(`⚠️ Extreme heat in ${city.name}: ${temp}°`);
        if (temp < -10) alerts.push(`❄️ Extreme cold in ${city.name}: ${temp}°`);
        if (windSpeed > 20) alerts.push(`💨 Strong winds in ${city.name}: ${windSpeed} m/s`);
        if (main === 'Thunderstorm') alerts.push(`⛈️ Thunderstorm in ${city.name}`);
      });
      return alerts.length > 0 ? alerts.join('\n') : 'No extreme conditions detected.';
    }
    default:
      return 'Unknown tool';
  }
};

// ─── Rule-based fallback (no OpenAI key needed) ───────────────────────────────
const runFallbackAgent = (userMessage, weatherContext) => {
  const cities = (weatherContext.cities || []).filter((c) => c.weather);
  const msg = userMessage.toLowerCase();

  if (cities.length === 0) {
    return "You haven't added any cities yet! Add some cities to your dashboard first, then I can give you weather insights. 🌍";
  }

  // Warmest / hottest
  if (msg.includes('warm') || msg.includes('hot') || msg.includes('highest temp')) {
    const sorted = [...cities].sort((a, b) => b.weather.temp - a.weather.temp);
    const top = sorted[0];
    return `🌡️ The warmest city in your list is **${top.name}** at **${top.weather.temp}${top.weather.unit}** (${top.weather.description}). ${sorted.length > 1 ? `Next is ${sorted[1].name} at ${sorted[1].weather.temp}${sorted[1].weather.unit}.` : ''}`;
  }

  // Coolest / coldest
  if (msg.includes('cool') || msg.includes('cold') || msg.includes('lowest temp')) {
    const sorted = [...cities].sort((a, b) => a.weather.temp - b.weather.temp);
    const top = sorted[0];
    return `❄️ The coolest city is **${top.name}** at **${top.weather.temp}${top.weather.unit}** (${top.weather.description}).`;
  }

  // Rain / umbrella
  if (msg.includes('rain') || msg.includes('umbrella') || msg.includes('wet')) {
    const rainy = cities.filter((c) => ['Rain', 'Drizzle', 'Thunderstorm'].includes(c.weather.main));
    if (rainy.length > 0) {
      return `🌧️ You'll need an umbrella in: **${rainy.map((c) => c.name).join(', ')}**. Stay dry!`;
    }
    return "☀️ Good news — no rain expected in any of your cities right now!";
  }

  // Wind
  if (msg.includes('wind') || msg.includes('windy')) {
    const sorted = [...cities].sort((a, b) => b.weather.windSpeed - a.weather.windSpeed);
    const top = sorted[0];
    return `💨 Windiest city is **${top.name}** at ${top.weather.windSpeed} m/s. ${top.weather.windSpeed > 10 ? 'Hold onto your hat!' : 'Fairly calm overall.'}`;
  }

  // Best / travel / visit
  if (msg.includes('best') || msg.includes('travel') || msg.includes('visit') || msg.includes('go')) {
    const ideal = cities.filter((c) => c.weather.temp > 15 && c.weather.temp < 30 && !['Rain', 'Thunderstorm', 'Snow'].includes(c.weather.main));
    if (ideal.length > 0) {
      const top = ideal.sort((a, b) => b.weather.temp - a.weather.temp)[0];
      return `✈️ Best city to visit right now is **${top.name}** — ${top.weather.temp}${top.weather.unit} and ${top.weather.description}. Perfect conditions!`;
    }
    return `🌍 None of your cities have perfect conditions right now, but **${cities[0].name}** (${cities[0].weather.temp}${cities[0].weather.unit}, ${cities[0].weather.description}) seems most manageable.`;
  }

  // Outfit / wear / dress
  if (msg.includes('wear') || msg.includes('outfit') || msg.includes('dress') || msg.includes('clothes')) {
    const cityMatch = cities.find((c) => msg.includes(c.name.toLowerCase()));
    const city = cityMatch || cities[0];
    const { temp, description, unit } = city.weather;
    let outfit = '';
    if (temp > 28) outfit = 'Light clothes, shorts, and sunscreen ☀️';
    else if (temp > 20) outfit = 'T-shirt and light trousers 👕';
    else if (temp > 10) outfit = 'A jacket or light sweater 🧥';
    else if (temp > 0) outfit = 'Warm coat, scarf, and gloves 🧣';
    else outfit = 'Heavy winter gear — it\'s freezing! 🥶';
    return `👗 For **${city.name}** (${temp}${unit}, ${description}): ${outfit}`;
  }

  // Alerts / extreme / dangerous
  if (msg.includes('alert') || msg.includes('extreme') || msg.includes('danger') || msg.includes('warning')) {
    const alerts = [];
    cities.forEach((c) => {
      if (c.weather.temp > 38) alerts.push(`🔥 Extreme heat in ${c.name}: ${c.weather.temp}°`);
      if (c.weather.temp < -10) alerts.push(`🥶 Extreme cold in ${c.name}: ${c.weather.temp}°`);
      if (c.weather.windSpeed > 20) alerts.push(`💨 Dangerous winds in ${c.name}: ${c.weather.windSpeed} m/s`);
      if (c.weather.main === 'Thunderstorm') alerts.push(`⛈️ Thunderstorm in ${c.name}`);
    });
    return alerts.length > 0
      ? `⚠️ Weather alerts:\n${alerts.join('\n')}`
      : '✅ No extreme weather conditions in any of your cities right now. All clear!';
  }

  // Summary / overview / all cities
  if (msg.includes('summar') || msg.includes('overview') || msg.includes('all') || msg.includes('compare')) {
    const lines = cities.map((c) => `• **${c.name}**: ${c.weather.temp}${c.weather.unit}, ${c.weather.description}, 💧 ${c.weather.humidity}%`);
    return `🌍 Weather across your cities:\n\n${lines.join('\n')}`;
  }

  // Humidity
  if (msg.includes('humid')) {
    const sorted = [...cities].sort((a, b) => b.weather.humidity - a.weather.humidity);
    return `💧 Most humid: **${sorted[0].name}** at ${sorted[0].weather.humidity}% humidity.`;
  }

  // Generic greeting / help
  if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey') || msg.includes('help')) {
    return `👋 Hi! I'm SkyMind, your weather assistant. I can see weather for your ${cities.length} cities.\n\nTry asking me:\n• "Which city is warmest?"\n• "Do I need an umbrella anywhere?"\n• "What should I wear in ${cities[0]?.name}?"\n• "Any extreme weather alerts?"\n• "Compare all my cities"`;
  }

  // Default — give a summary
  const sorted = [...cities].sort((a, b) => b.weather.temp - a.weather.temp);
  return `☀️ Currently tracking **${cities.length} cities**. Warmest is **${sorted[0].name}** at ${sorted[0].weather.temp}${sorted[0].weather.unit}. Ask me anything about your cities' weather!`;
};

// ─── Main AI agent (with OpenAI) ─────────────────────────────────────────────
const runWeatherAgentWithOpenAI = async (userMessage, weatherContext) => {
  const systemPrompt = `You are SkyMind, an intelligent weather assistant for a multi-city weather dashboard.
You have access to real-time weather data for the user's cities and can use tools to analyze them.

User's cities:
${JSON.stringify(weatherContext.cities?.map((c) => ({
  name: c.name, country: c.country, isFavorite: c.isFavorite, weather: c.weather,
})), null, 2)}

Be conversational, helpful, and specific. Keep responses to 2-4 sentences unless detail is needed.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage },
  ];

  let response;
  let iterations = 0;

  while (iterations < 5) {
    iterations++;
    response = await axios.post(
      `${OPENAI_BASE}/chat/completions`,
      {
        model: 'gpt-4o-mini',
        messages,
        tools: WEATHER_TOOLS,
        tool_choice: 'auto',
        max_tokens: 500,
        temperature: 0.7,
      },
      { headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' } }
    );

    const assistantMessage = response.data.choices[0].message;
    messages.push(assistantMessage);

    if (!assistantMessage.tool_calls || assistantMessage.tool_calls.length === 0) {
      return { message: assistantMessage.content, iterations };
    }

    for (const toolCall of assistantMessage.tool_calls) {
      const toolArgs = JSON.parse(toolCall.function.arguments);
      const toolResult = executeToolCall(toolCall.function.name, toolArgs, weatherContext);
      messages.push({ role: 'tool', tool_call_id: toolCall.id, content: String(toolResult) });
    }
  }

  return { message: response.data.choices[0].message.content || 'Analysis complete.', iterations };
};

// ─── Public API ───────────────────────────────────────────────────────────────
const runWeatherAgent = async (userMessage, weatherContext) => {
  // Use OpenAI if key is available, otherwise use smart fallback
  if (OPENAI_API_KEY && OPENAI_API_KEY.startsWith('sk-')) {
    try {
      return await runWeatherAgentWithOpenAI(userMessage, weatherContext);
    } catch (err) {
      console.warn('OpenAI failed, using fallback:', err.message);
      // Fall through to fallback
    }
  }
  // Rule-based fallback — always works, no API key needed
  return { message: runFallbackAgent(userMessage, weatherContext), iterations: 0 };
};

const generateCityInsight = async (cityData, weatherData) => {
  // Built-in insight if no OpenAI key
  if (!OPENAI_API_KEY || !OPENAI_API_KEY.startsWith('sk-')) {
    const { temp, unit, description, humidity, windSpeed } = weatherData;
    const insights = [];
    if (temp > 35) insights.push('Extremely hot — stay hydrated and avoid midday sun.');
    else if (temp > 28) insights.push('Warm and sunny — great for outdoor activities.');
    else if (temp > 20) insights.push('Pleasant conditions — ideal for exploring outside.');
    else if (temp > 10) insights.push('Cool weather — a light jacket recommended.');
    else if (temp > 0) insights.push('Cold today — bundle up before heading out.');
    else insights.push('Freezing conditions — dress in heavy winter layers.');
    if (humidity > 80) insights.push('High humidity may feel uncomfortable.');
    if (windSpeed > 10) insights.push('Windy — secure loose items outdoors.');
    return insights.join(' ');
  }

  try {
    const prompt = `One sentence weather insight for ${cityData.name}: ${weatherData.temp}${weatherData.unit}, ${weatherData.description}, humidity ${weatherData.humidity}%, wind ${weatherData.windSpeed}m/s. Practical advice. Max 20 words.`;
    const response = await axios.post(
      `${OPENAI_BASE}/chat/completions`,
      { model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], max_tokens: 60 },
      { headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' } }
    );
    return response.data.choices[0].message.content.trim();
  } catch {
    return null;
  }
};

module.exports = { runWeatherAgent, generateCityInsight };
