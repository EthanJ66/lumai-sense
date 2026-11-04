import { WeatherData, WeatherDisplayData } from '../types/weather';

const API_KEY = import.meta.env.VITE_ACCUWEATHER_API_KEY;
const LOCATION_KEY = import.meta.env.VITE_QINGDAO_LOCATION_KEY || '106573'; // Qingdao Huangdao District

// Weather icon mapping to emoji
const weatherIconMap: Record<number, string> = {
  1: '☀️', 2: '☀️', 3: '⛅', 4: '⛅', 5: '🌤️', 6: '☁️', 7: '☁️', 8: '☁️',
  11: '🌫️', 12: '🌧️', 13: '🌦️', 14: '🌦️', 15: '⛈️', 16: '⛈️', 17: '🌧️', 18: '🌧️',
  19: '🌨️', 20: '🌨️', 21: '🌨️', 22: '❄️', 23: '❄️', 24: '🧊', 25: '🌨️',
  26: '🌧️', 29: '🌧️', 32: '💨', 33: '🌙', 34: '🌙', 35: '⛅', 36: '⛅', 37: '🌫️', 38: '☁️',
  39: '🌧️', 40: '🌧️', 41: '⛈️', 42: '⛈️', 43: '🌨️', 44: '❄️'
};

class WeatherService {
  private cache: { data: WeatherDisplayData | null; timestamp: number } = {
    data: null,
    timestamp: 0
  };
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

  async getCurrentWeather(): Promise<WeatherDisplayData> {
    // Return cached data if still valid
    const now = Date.now();
    if (this.cache.data && (now - this.cache.timestamp) < this.CACHE_DURATION) {
      return this.cache.data;
    }

    // If no API key, return mock data
    if (!API_KEY || API_KEY === 'your_api_key_here') {
      console.warn('AccuWeather API key not configured, using mock data');
      return this.getMockWeatherData();
    }

    try {
      const response = await fetch(
        `https://dataservice.accuweather.com/currentconditions/v1/${LOCATION_KEY}?apikey=${API_KEY}&language=zh-cn&details=true`
      );

      if (!response.ok) {
        throw new Error(`AccuWeather API error: ${response.status}`);
      }

      const data: WeatherData[] = await response.json();

      if (!data || data.length === 0) {
        throw new Error('No weather data received');
      }

      const weatherData = data[0];
      const displayData: WeatherDisplayData = {
        temperature: Math.round(weatherData.Temperature.Metric.Value),
        humidity: weatherData.RelativeHumidity,
        weatherText: weatherData.WeatherText,
        weatherIcon: weatherIconMap[weatherData.WeatherIcon] || '☁️'
      };

      // Update cache
      this.cache = {
        data: displayData,
        timestamp: now
      };

      return displayData;
    } catch (error) {
      console.error('Failed to fetch weather data:', error);
      // Return mock data on error
      return this.getMockWeatherData();
    }
  }

  private getMockWeatherData(): WeatherDisplayData {
    // Mock data for Qingdao Huangdao District (winter conditions)
    return {
      temperature: 2,
      humidity: 65,
      weatherText: '多云',
      weatherIcon: '☁️'
    };
  }

  clearCache(): void {
    this.cache = {
      data: null,
      timestamp: 0
    };
  }
}

export const weatherService = new WeatherService();
