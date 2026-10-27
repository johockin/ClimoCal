// Open-Meteo API wrapper - NO API KEY NEEDED!
//
// Forecasts are fetched in batches: Open-Meteo accepts comma-separated
// coordinates and timezones and returns one result per location, so ~100
// cities cost 2-3 HTTP requests a day instead of 100.

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const BATCH_SIZE = 50;
const DAILY_VARS = [
  'weather_code', 'temperature_2m_max', 'temperature_2m_min',
  'precipitation_sum', 'precipitation_probability_max',
  'wind_speed_10m_max', 'uv_index_max', 'sunrise', 'sunset'
].join(',');

// Fetch with retries and exponential backoff (1s, 2s, 4s). Open-Meteo has no
// uptime guarantee on the free tier, and one blip shouldn't cost a day.
export async function fetchJson(url, attempts = 4) {
  for (let attempt = 1; ; attempt++) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Open-Meteo ${response.status}: ${body.slice(0, 200)}`);
      }
      return await response.json();
    } catch (error) {
      if (attempt >= attempts) throw error;
      const wait = 1000 * 2 ** (attempt - 1);
      console.warn(`⚠️  ${error.message} — retrying in ${wait / 1000}s`);
      await new Promise(resolve => setTimeout(resolve, wait));
    }
  }
}

// Returns a Map of slug -> 16-day forecast (array of days), local to each city.
export async function fetchForecasts(locations) {
  const forecasts = new Map();

  for (let i = 0; i < locations.length; i += BATCH_SIZE) {
    const batch = locations.slice(i, i + BATCH_SIZE);
    const url = `${FORECAST_URL}?` +
      `latitude=${batch.map(l => l.lat).join(',')}` +
      `&longitude=${batch.map(l => l.lon).join(',')}` +
      `&timezone=${batch.map(l => encodeURIComponent(l.timezone)).join(',')}` +
      `&daily=${DAILY_VARS}&forecast_days=16`;

    console.log(`🌤️  Fetching forecasts for ${batch.length} cities`);
    const data = await fetchJson(url);
    const results = Array.isArray(data) ? data : [data];

    if (results.length !== batch.length) {
      throw new Error(`Asked for ${batch.length} locations, got ${results.length}`);
    }
    batch.forEach((location, index) => {
      forecasts.set(location.slug, transformForecastData(results[index]));
    });
  }

  return forecasts;
}

// Parallel arrays -> one object per day. Values stay unrounded here so
// unit conversion (°C -> °F) happens before rounding, not after.
function transformForecastData(data) {
  const { daily } = data;

  if (!daily || !daily.time) {
    throw new Error('Invalid weather data received from Open-Meteo');
  }

  return daily.time.map((date, index) => ({
    date,
    weatherCode: daily.weather_code[index],
    tempMax: daily.temperature_2m_max[index],
    tempMin: daily.temperature_2m_min[index],
    precipitation: daily.precipitation_sum[index] || 0,
    precipitationProbability: daily.precipitation_probability_max[index] || 0,
    windSpeed: daily.wind_speed_10m_max[index] || 0,
    uvIndex: daily.uv_index_max[index] || 0,
    sunrise: daily.sunrise[index],   // local time, e.g. "2026-10-27T07:08"
    sunset: daily.sunset[index]
  })).filter(day => day.tempMax != null && day.tempMin != null);
}
