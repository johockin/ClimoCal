// Weather condition code to emoji mapping for Open-Meteo WMO codes
// Based on WMO weather interpretation codes

export function weatherEmoji(code) {
  // Clear sky
  if (code === 0) return '☀️';
  
  // Mainly clear, partly cloudy, and overcast
  if (code >= 1 && code <= 3) return '⛅';
  
  // Fog and depositing rime fog
  if (code >= 45 && code <= 48) return '🌫️';
  
  // Drizzle: Light, moderate, and dense intensity
  if (code >= 51 && code <= 57) return '🌦️';
  
  // Rain: Slight, moderate and heavy intensity
  if (code >= 61 && code <= 67) return '🌧️';
  
  // Snow fall: Slight, moderate, and heavy intensity
  if (code >= 71 && code <= 77) return '🌨️';
  
  // Rain showers: Slight, moderate, and violent
  if (code >= 80 && code <= 82) return '🌧️';
  
  // Snow showers slight and heavy
  if (code >= 85 && code <= 86) return '🌨️';
  
  // Thunderstorm: Slight or moderate, with slight and heavy hail
  if (code >= 95 && code <= 99) return '⛈️';
  
  // Default for any unmapped codes
  return '🌤️';
}

// Optional: Get descriptive text for weather codes
export function weatherDescription(code) {
  const descriptions = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy', 
    3: 'Overcast',
    45: 'Fog',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    56: 'Light freezing drizzle',
    57: 'Dense freezing drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    66: 'Light freezing rain',
    67: 'Heavy freezing rain',
    71: 'Slight snow',
    73: 'Moderate snow',
    75: 'Heavy snow',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail'
  };
  
  return descriptions[code] || 'Unknown weather condition';
}