// ─────────────────────────────────────────────
// WEATHER SERVICE
// Fetches current weather + daily forecast
// Generates child outfit suggestions
// ─────────────────────────────────────────────

const WEATHER_API_KEY = '71cb10e559a7098e9abf083f8ad5e976';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

export interface WeatherData {
  city: string;
  country: string;
  temp: number;          // Celsius
  feelsLike: number;
  condition: string;     // e.g. "Rain", "Clear", "Clouds"
  description: string;  // e.g. "light rain"
  icon: string;          // weather emoji
  humidity: number;
  windSpeed: number;
  high: number;
  low: number;
}

// ── Weather condition → emoji ─────────────────────────────────────────────────
const getWeatherEmoji = (condition: string): string => {
  const map: Record<string, string> = {
    Thunderstorm: '⛈️',
    Drizzle:      '🌦️',
    Rain:         '🌧️',
    Snow:         '❄️',
    Mist:         '🌫️',
    Fog:          '🌫️',
    Haze:         '🌫️',
    Dust:         '💨',
    Clear:        '☀️',
    Clouds:       '⛅',
  };
  return map[condition] || '🌤️';
};

// ── Fetch current weather by coordinates ─────────────────────────────────────
export const fetchWeather = async (
  lat: number,
  lon: number,
): Promise<WeatherData | null> => {
  try {
    // Current weather
    const currentRes = await fetch(
      `${BASE_URL}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${WEATHER_API_KEY}`
    );
    if (!currentRes.ok) {
      console.log('❌ Weather fetch failed:', currentRes.status);
      return null;
    }
    const current = await currentRes.json();

    // Forecast for high/low
    const forecastRes = await fetch(
      `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=metric&cnt=8&appid=${WEATHER_API_KEY}`
    );
    const forecast = await forecastRes.json();

    const temps = forecast.list?.map((f: any) => f.main.temp) || [];
    const high  = temps.length ? Math.round(Math.max(...temps)) : Math.round(current.main.temp_max);
    const low   = temps.length ? Math.round(Math.min(...temps)) : Math.round(current.main.temp_min);

    const condition = current.weather[0].main;

    return {
      city:        current.name,
      country:     current.sys.country,
      temp:        Math.round(current.main.temp),
      feelsLike:   Math.round(current.main.feels_like),
      condition,
      description: current.weather[0].description,
      icon:        getWeatherEmoji(condition),
      humidity:    current.main.humidity,
      windSpeed:   Math.round(current.wind.speed),
      high,
      low,
    };
  } catch (error: any) {
    console.log('❌ Weather error:', error.message);
    return null;
  }
};

// ── Outfit suggestion based on weather ───────────────────────────────────────
export const getOutfitSuggestion = (
  weather: WeatherData,
  childName: string,
): string => {
  const { temp, condition, windSpeed } = weather;
  const isRaining  = ['Rain', 'Drizzle', 'Thunderstorm'].includes(condition);
  const isSnowing  = condition === 'Snow';
  const isWindy    = windSpeed > 7;
  const isFoggy    = ['Mist', 'Fog', 'Haze'].includes(condition);

  // Very cold (below 10°C)
  if (temp < 10) {
    if (isRaining) return `🧥 Cold and wet out there — dress ${childName} in a warm waterproof coat, boots and a beanie!`;
    if (isSnowing) return `🧤 Bundle ${childName} up! Thick coat, warm socks, gloves and a hat today.`;
    return `🧣 Very cold today — layer ${childName} up well with a warm coat, scarf and closed shoes.`;
  }

  // Cold (10–17°C)
  if (temp < 18) {
    if (isRaining) return `☔ Cold and rainy — grab a warm rain jacket and closed shoes for ${childName} today.`;
    if (isWindy) return `🌬️ Cold and windy — a warm jacket and long pants for ${childName} to stay comfortable.`;
    return `🧥 It's cold — a warm jacket and long pants for ${childName}. Not a day for short sleeves.`;
  }

  // Mild (18–22°C)
  if (temp < 23) {
    if (isRaining) return `🌂 Cool and rainy — a light warm jacket for ${childName} and maybe gumboots if they'll be outside.`;
    if (isFoggy) return `🌫️ Foggy morning — start ${childName} with a light jacket they can take off as it clears.`;
    if (isWindy) return `💨 Mild but breezy — a light layer for ${childName} will keep them comfortable.`;
    return `😊 Mild day — a light jacket or long sleeve for ${childName} in the morning should do it.`;
  }

  // Warm (23–28°C)
  if (temp < 29) {
    if (isRaining) return `🌦️ Warm but rainy — light clothes and a compact rain jacket for ${childName} today.`;
    return `🌤️ Lovely weather — ${childName} can wear light comfortable clothes. Maybe sunscreen if they'll be outside!`;
  }

  // Hot (29°C+)
  if (temp >= 29) {
    return `☀️ Hot day ahead! Light breathable clothes for ${childName}, sun hat, and don't forget sunscreen 🧴`;
  }

  return `👕 Check the weather and dress ${childName} comfortably for the day ahead!`;
};

// ── Full notification message ─────────────────────────────────────────────────
export const buildWeatherMessage = (
  weather: WeatherData,
  childName: string,
  userName: string,
): { title: string; body: string } => {
  const outfit = getOutfitSuggestion(weather, childName);
  return {
    title: `${weather.icon} Good morning${userName ? `, ${userName}` : ''}!`,
    body:  `${weather.temp}°C in ${weather.city} · ${weather.description}. ${outfit}`,
  };
};
