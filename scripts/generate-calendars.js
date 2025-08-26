// ClimoCal Calendar Generation Script
// Generates weather calendar .ics files using Open-Meteo API

import ical from 'ical-generator';
import { writeFileSync, mkdirSync, readFileSync } from 'fs';
import { fetchWeatherData } from './weather-api.js';
import { weatherEmoji, weatherDescription } from './emoji-mapper.js';

async function generateCalendars() {
  console.log('🌤️  ClimoCal: Starting calendar generation...');
  
  try {
    // Load locations from data file
    const locationsData = readFileSync('data/locations.json', 'utf8');
    const locations = JSON.parse(locationsData);
    
    console.log(`📍 Processing ${locations.length} location(s)`);
    
    // Ensure output directory exists
    mkdirSync('public/calendars', { recursive: true });
    
    // Generate calendar for each location
    for (const location of locations) {
      await generateLocationCalendar(location);
    }
    
    // Generate a status file for monitoring
    generateStatusFile(locations);
    
    console.log('✅ All calendars generated successfully!');
    
  } catch (error) {
    console.error('❌ Calendar generation failed:', error);
    process.exit(1);
  }
}

async function generateLocationCalendar(location) {
  console.log(`🌍 Generating calendar for ${location.name}...`);
  
  try {
    // Fetch weather data from Open-Meteo
    const weatherData = await fetchWeatherData(
      location.lat, 
      location.lon, 
      location.timezone || 'auto'
    );
    
    // Create calendar with optimized settings
    const cal = ical({
      name: `TOR ClimoCal`,
      description: `Toronto weather forecasts - automatically updated daily at 6 AM`,
      timezone: location.timezone || 'America/Toronto',
      ttl: 60 * 60 * 4, // 4 hour TTL - more frequent refresh checks
      url: `https://johockin.github.io/ClimoCal/calendars/${location.slug}.ics`,
      scale: 'gregorian',
      method: 'PUBLISH'
    });
    
    // Add weather events
    weatherData.forecast.forEach(day => {
      const emoji = weatherEmoji(day.weatherCode);
      const eventTitle = `${emoji} ${day.tempMax}°/${day.tempMin}°`;
      const description = buildEventDescription(day);
      
      cal.createEvent({
        start: new Date(day.date + 'T00:00:00'),
        end: new Date(day.date + 'T23:59:59'), 
        allDay: true,
        summary: eventTitle,
        description: description,
        location: location.name,
        uid: `weather-${location.slug}-${day.date}@climocal.com`,
        timestamp: new Date(),
        // Disable alerts/notifications by default
        alarms: [],
        // Set as informational, not actionable
        status: 'CONFIRMED',
        busyStatus: 'FREE',
        // Prevent event from blocking calendar
        transparency: 'TRANSPARENT'
      });
    });
    
    // Save file
    const filename = `public/calendars/${location.slug}.ics`;
    writeFileSync(filename, cal.toString());
    
    console.log(`✅ ${location.name}: Generated ${weatherData.forecast.length} days of weather events`);
    
  } catch (error) {
    console.error(`❌ Failed to generate calendar for ${location.name}:`, error.message);
    throw error;
  }
}

function buildEventDescription(day) {
  const condition = weatherDescription(day.weatherCode);
  
  let description = `Weather: ${condition}\n`;
  description += `High: ${day.tempMax}°C, Low: ${day.tempMin}°C\n`;
  
  if (day.precipitation > 0) {
    description += `Precipitation: ${day.precipitation}mm (${day.precipitationProbability}% chance)\n`;
  }
  
  if (day.windSpeed > 0) {
    description += `Wind: ${Math.round(day.windSpeed)} km/h\n`;
  }
  
  if (day.uvIndex > 0) {
    description += `UV Index: ${Math.round(day.uvIndex)}\n`;
  }
  
  description += '\n---\n';
  description += 'Powered by ClimoCal - Weather in your calendar\n';
  description += 'Data from Open-Meteo.com';
  
  return description;
}

function generateStatusFile(locations) {
  const status = {
    lastGenerated: new Date().toISOString(),
    success: true,
    locationsGenerated: locations.length,
    locations: locations.map(loc => ({
      name: loc.name,
      slug: loc.slug,
      calendarUrl: `https://johockin.github.io/ClimoCal/calendars/${loc.slug}.ics`
    })),
    nextUpdate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
  };
  
  writeFileSync('public/status.json', JSON.stringify(status, null, 2));
  console.log('📊 Status file generated');
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⚠️  Calendar generation interrupted');
  process.exit(0);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled promise rejection:', error);
  process.exit(1);
});

// Run the generator
generateCalendars().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});