// Open-Meteo API wrapper - NO API KEY NEEDED!

export async function fetchWeatherData(lat, lon, timezone = 'auto') {
  const baseUrl = 'https://api.open-meteo.com/v1/forecast';
  
  // Fetch 16-day forecast with all the data we need
  const forecastUrl = `${baseUrl}?latitude=${lat}&longitude=${lon}` +
    '&daily=weather_code,temperature_2m_max,temperature_2m_min,' +
    'precipitation_sum,precipitation_probability_max,wind_speed_10m_max,uv_index_max' +
    `&timezone=${timezone}&forecast_days=16`;
  
  console.log(`🌤️  Fetching weather for ${lat}, ${lon}`);
  
  try {
    const response = await fetch(forecastUrl);
    
    if (!response.ok) {
      throw new Error(`Open-Meteo API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Transform the data into a more usable format
    return transformForecastData(data);
    
  } catch (error) {
    console.error('❌ Weather API error:', error.message);
    throw error;
  }
}

function transformForecastData(data) {
  const { daily } = data;
  
  if (!daily || !daily.time) {
    throw new Error('Invalid weather data received from Open-Meteo');
  }
  
  // Transform parallel arrays into array of objects
  const forecast = daily.time.map((date, index) => ({
    date: date,
    weatherCode: daily.weather_code[index],
    tempMax: Math.round(daily.temperature_2m_max[index]),
    tempMin: Math.round(daily.temperature_2m_min[index]),
    precipitation: daily.precipitation_sum[index] || 0,
    precipitationProbability: daily.precipitation_probability_max[index] || 0,
    windSpeed: daily.wind_speed_10m_max[index] || 0,
    uvIndex: daily.uv_index_max[index] || 0
  }));
  
  console.log(`✅ Processed ${forecast.length} days of weather data`);
  
  return {
    forecast,
    generatedAt: new Date().toISOString(),
    location: {
      latitude: data.latitude,
      longitude: data.longitude,
      timezone: data.timezone
    }
  };
}

// Optional: Fetch historical data for climate averages (for future use)
export async function fetchHistoricalData(lat, lon, startYear = new Date().getFullYear() - 30) {
  const baseUrl = 'https://archive-api.open-meteo.com/v1/era5';
  const endYear = new Date().getFullYear() - 1;
  
  const historicalUrl = `${baseUrl}?latitude=${lat}&longitude=${lon}` +
    `&start_date=${startYear}-01-01&end_date=${endYear}-12-31` +
    '&daily=temperature_2m_max,temperature_2m_min,precipitation_sum';
  
  try {
    const response = await fetch(historicalUrl);
    
    if (!response.ok) {
      console.warn('⚠️ Historical data not available, skipping');
      return null;
    }
    
    const data = await response.json();
    return calculateMonthlyAverages(data);
    
  } catch (error) {
    console.warn('⚠️ Could not fetch historical data:', error.message);
    return null;
  }
}

function calculateMonthlyAverages(historicalData) {
  // This would calculate monthly climate averages
  // For now, return null - this is a future enhancement
  return null;
}