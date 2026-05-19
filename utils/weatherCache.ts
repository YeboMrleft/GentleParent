// Module-level = persists for the entire app session, resets on app open
let cachedWeather: WeatherData | null = null;
let hasFetchedThisSession = false;

export interface WeatherData {
  temp: string;
  condition: string;
  icon: string;
  city: string;
  // add whatever fields your weather response returns
}

export const weatherCache = {
  get: (): WeatherData | null => cachedWeather,

  set: (data: WeatherData) => {
    cachedWeather = data;
    hasFetchedThisSession = true;
  },

  hasFetched: (): boolean => hasFetchedThisSession,
};