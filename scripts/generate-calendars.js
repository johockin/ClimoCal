// ClimoCal Calendar Generation Script
// Generates weather calendar .ics files using Open-Meteo API
//
// Each city's feed holds:
//   - a 16-day forecast (one all-day event per day), then
//   - typical weather ("≈") for every day out to 12 months, from
//     data/climate-normals.json (built by scripts/build-normals.js).

import ical from 'ical-generator';
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'fs';
import { createHash } from 'crypto';
import { fetchForecasts } from './weather-api.js';
import { weatherEmoji, weatherDescription } from './emoji-mapper.js';

const SITE = 'https://climocal.johnnyhockin.com';
const NORMALS_FILE = 'data/climate-normals.json';
const NORMALS_DAYS_AHEAD = 365;
const MIN_FORECAST_DAYS = 14;     // fewer than this = bad API response, fail the run
const RAIN_TAG_THRESHOLD = 40;    // show "💧NN%" in the title at or above this chance
const POPULAR_CITIES = ['toronto', 'vancouver', 'montreal', 'calgary', 'new-york', 'los-angeles',
  'chicago', 'san-francisco', 'london', 'paris', 'tokyo', 'sydney'];  // shown first on the page

async function generateCalendars() {
  console.log('🌤️  ClimoCal: Starting calendar generation...');

  try {
    const locations = JSON.parse(readFileSync('data/locations.json', 'utf8'));
    const normals = existsSync(NORMALS_FILE)
      ? JSON.parse(readFileSync(NORMALS_FILE, 'utf8')).cities
      : {};

    console.log(`📍 Processing ${locations.length} location(s)`);
    mkdirSync('public/calendars', { recursive: true });

    const forecasts = await fetchForecasts(locations);
    const summaries = [];

    for (const location of locations) {
      const forecast = forecasts.get(location.slug);
      if (!forecast || forecast.length < MIN_FORECAST_DAYS) {
        throw new Error(`${location.name}: only ${forecast?.length ?? 0} forecast days`);
      }
      writeLocationCalendar(location, forecast, normals[location.slug]);
      summaries.push(summarize(location, forecast, Boolean(normals[location.slug])));
    }

    generateStatusFile(summaries);
    renderCityList(locations);
    console.log(`✅ All ${locations.length} calendars generated successfully!`);

  } catch (error) {
    console.error('❌ Calendar generation failed:', error);
    process.exit(1);
  }
}

// --- Units -----------------------------------------------------------------

function isImperial(location) {
  return location.country === 'US';
}

function temp(celsius, location) {
  return isImperial(location)
    ? `${Math.round(celsius * 9 / 5 + 32)}°F`
    : `${Math.round(celsius)}°C`;
}

function wind(kmh, location) {
  return isImperial(location) ? `${Math.round(kmh / 1.609)} mph` : `${Math.round(kmh)} km/h`;
}

function precip(mm, location) {
  return isImperial(location) ? `${(mm / 25.4).toFixed(2)} in` : `${mm.toFixed(1)} mm`;
}

// "2026-10-27T07:08" -> "7:08 AM" (US) or "07:08"
function clock(localIso, location) {
  if (!localIso) return '';
  const [h, m] = localIso.slice(11, 16).split(':').map(Number);
  if (!isImperial(location)) return localIso.slice(11, 16);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}

// --- Dates -----------------------------------------------------------------

// All-day dates are pinned to UTC midnight, and the calendar deliberately has
// no timezone: ical-generator 7 formats DATE values in UTC only when no
// timezone is set (with one, it uses the build machine's local time, which put
// every event a day early on Toronto-time CI). checkFeed() guards this.
function utcDate(isoDate) {
  return new Date(`${isoDate}T00:00:00Z`);
}

function addDays(date, days) {
  return new Date(date.getTime() + days * 86400000);
}

function isoDay(date) {
  return date.toISOString().slice(0, 10);
}

// --- Calendar --------------------------------------------------------------

function writeLocationCalendar(location, forecast, cityNormals) {
  const cal = ical({
    name: `${location.name} Climate`,
    description: `Weather forecast by ClimoCal • climocal.johnnyhockin.com`,
    ttl: 60 * 60 * 4, // 4 hour TTL - more frequent refresh checks
    url: `${SITE}/calendars/${location.slug}.ics`,
    scale: 'gregorian',
    method: 'PUBLISH'
  });

  for (const day of forecast) {
    const emoji = weatherEmoji(day.weatherCode);
    const rain = day.precipitationProbability >= RAIN_TAG_THRESHOLD
      ? ` 💧${Math.round(day.precipitationProbability)}%` : '';
    addDayEvent(cal, location, day.date,
      `${emoji} ${temp(day.tempMax, location)}/${temp(day.tempMin, location)}${rain}`,
      buildForecastDescription(day, location));
  }

  // Typical weather from the day after the forecast ends, out to 12 months
  if (cityNormals) {
    const first = addDays(utcDate(forecast[forecast.length - 1].date), 1);
    const last = addDays(utcDate(forecast[0].date), NORMALS_DAYS_AHEAD);
    for (let date = first; date <= last; date = addDays(date, 1)) {
      const iso = isoDay(date);
      const normal = cityNormals.days[iso.slice(5)] || cityNormals.days['02-28']; // Feb 29
      const [tmax, tmin, wetPct] = normal;
      const rain = wetPct >= RAIN_TAG_THRESHOLD ? ` 💧${wetPct}%` : '';
      addDayEvent(cal, location, iso,
        `≈ ${temp(tmax, location)}/${temp(tmin, location)}${rain}`,
        buildNormalDescription(normal, cityNormals.years, location));
    }
  }

  const ics = cal.toString();
  checkFeed(location, ics);
  writeFileSync(`public/calendars/${location.slug}.ics`, ics);
  console.log(`✅ ${location.name}: ${forecast.length} forecast days` +
    (cityNormals ? ` + typical weather to 12 months` : ''));
}

// Every event's DTSTART must equal the date in its UID, and DTEND the next
// day. Fails the run (so nothing deploys) if date formatting ever drifts.
function checkFeed(location, ics) {
  const events = ics.split('BEGIN:VEVENT').slice(1);
  for (const event of events) {
    const uidDate = event.match(/UID:weather-[a-z0-9-]+?-(\d{4})-(\d{2})-(\d{2})@/);
    const start = event.match(/DTSTART;VALUE=DATE:(\d{8})/);
    const end = event.match(/DTEND;VALUE=DATE:(\d{8})/);
    const expected = uidDate && uidDate.slice(1).join('');
    const nextDay = expected && isoDay(addDays(utcDate(`${uidDate[1]}-${uidDate[2]}-${uidDate[3]}`), 1)).replace(/-/g, '');
    if (!expected || start?.[1] !== expected || end?.[1] !== nextDay) {
      throw new Error(`${location.name}: event dates drifted (UID ${expected}, DTSTART ${start?.[1]}, DTEND ${end?.[1]})`);
    }
  }
}

function addDayEvent(cal, location, isoDate, title, description) {
  // Sunday gets the city name, so a glance at the week says which feed this is.
  // getUTCDay because the date is UTC midnight (see utcDate).
  const start = utcDate(isoDate);
  const cityReminder = start.getUTCDay() === 0 ? ` - ${location.name}` : '';

  cal.createEvent({
    // Stable UID per city per day: refreshes update the same event in place
    // instead of replacing every event with a new random UUID.
    id: `weather-${location.slug}-${isoDate}@climocal.johnnyhockin.com`,
    start,
    end: addDays(start, 1), // all-day DTEND is exclusive: the next day
    allDay: true,
    summary: `${title}${cityReminder}`,
    description,
    location: location.name,
    timestamp: new Date(),
    // Disable alerts/notifications by default
    alarms: [],
    // Set as informational, not actionable
    status: 'CONFIRMED',
    busyStatus: 'FREE',
    // Prevent event from blocking calendar
    transparency: 'TRANSPARENT'
  });
}

function buildForecastDescription(day, location) {
  const lines = [
    `Weather: ${weatherDescription(day.weatherCode)}`,
    `High: ${temp(day.tempMax, location)}, Low: ${temp(day.tempMin, location)}`
  ];
  if (day.precipitation > 0 || day.precipitationProbability > 0) {
    lines.push(`Precipitation: ${precip(day.precipitation, location)} (${Math.round(day.precipitationProbability)}% chance)`);
  }
  if (day.windSpeed > 0) lines.push(`Wind: ${wind(day.windSpeed, location)}`);
  if (day.uvIndex > 0) lines.push(`UV Index: ${Math.round(day.uvIndex)}`);
  if (day.sunrise && day.sunset) {
    lines.push(`Sunrise: ${clock(day.sunrise, location)} · Sunset: ${clock(day.sunset, location)}`);
  }
  return `${lines.join('\n')}\n\n---\nvia ClimoCal`;
}

function buildNormalDescription([tmax, tmin, wetPct], years, location) {
  return [
    `Typical weather for this date (${years} average)`,
    `High: ${temp(tmax, location)}, Low: ${temp(tmin, location)}`,
    `Rain or snow on ${wetPct}% of these days`,
    '',
    'Not a forecast. The real forecast replaces this about 16 days out.',
    '',
    '---',
    'via ClimoCal'
  ].join('\n');
}

// --- Status file -----------------------------------------------------------

// One entry per city in status.json: the page uses it for the city list's
// live week preview (7 days, numbers already in the city's units).
function summarize(location, forecast, hasNormals) {
  const degrees = c => Math.round(isImperial(location) ? c * 9 / 5 + 32 : c);
  return {
    name: location.name,
    slug: location.slug,
    region: location.region,
    timezone: location.timezone,
    unit: isImperial(location) ? 'F' : 'C',
    normals: hasNormals,
    week: forecast.slice(0, 7).map(day => ({
      date: day.date,
      emoji: weatherEmoji(day.weatherCode),
      high: degrees(day.tempMax),
      low: degrees(day.tempMin),
      rain: day.precipitationProbability >= RAIN_TAG_THRESHOLD ? Math.round(day.precipitationProbability) : 0
    }))
  };
}

function generateStatusFile(locations) {
  const status = {
    lastGenerated: new Date().toISOString(),
    success: true,
    locationsGenerated: locations.length,
    locations,
    nextUpdate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
  };

  writeFileSync('public/status.json', JSON.stringify(status));
  console.log('📊 Status file generated');
}

function fingerprint(file) {
  return createHash('sha256').update(readFileSync(file)).digest('hex').slice(0, 10);
}

// --- City list in index.html -------------------------------------------------

// The page's city list is static HTML between two markers, so it renders
// instantly, works without JavaScript, and is readable by search engines.
// Output depends only on locations.json, so the file changes only when the
// city list does.
function renderCityList(locations) {
  const escape = text => text.replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const chip = c =>
    `<a class="city" href="webcal://climocal.johnnyhockin.com/calendars/${c.slug}.ics" ` +
    `data-slug="${c.slug}" data-name="${escape(c.name)}">${escape(c.name)}</a>`;

  const bySlug = new Map(locations.map(l => [l.slug, l]));
  const popular = POPULAR_CITIES.map(slug => bySlug.get(slug)).filter(Boolean);

  const regions = new Map();
  for (const location of locations) {
    if (!regions.has(location.region)) regions.set(location.region, []);
    regions.get(location.region).push(location);
  }

  // Popular cities up front; every region folded behind "See all N"
  const html = [
    `<div class="popular" id="popular">`,
    `  <h3>Popular</h3>`,
    `  <div class="region-cities">`,
    ...popular.map(c => `    ${chip(c)}`),
    `  </div>`,
    `</div>`,
    `<h3 class="more-label" id="more-label">More cities</h3>`,
    ...[...regions].map(([region, cities]) => [
      `<details class="region" data-region="${escape(region)}">`,
      `  <summary><span class="region-name">${escape(region)}</span><span class="see-all"><span class="when-closed">See all ${cities.length}</span><span class="when-open">Close</span></span></summary>`,
      `  <div class="region-cities">`,
      ...cities.map(c => `    ${chip(c)}`),
      `  </div>`,
      `</details>`
    ].join('\n'))
  ].join('\n');

  const file = 'public/index.html';
  const page = readFileSync(file, 'utf8');
  const updated = page
    .replace(/(<!-- CITIES:START[^>]*-->\n)[\s\S]*?(<!-- CITIES:END -->)/, `$1${html}\n$2`)
    .replace(/(id="city-count">)\d+(<)/, `$1${locations.length}$2`)
    // Fingerprint the script URL so a new page never runs a cached old app.js
    // (Pages caches for 10 minutes; a mismatched pair left the page dead).
    .replace(/src="app\.js(\?v=[0-9a-f]+)?"/, `src="app.js?v=${fingerprint('public/app.js')}"`);
  if (!updated.includes('<!-- CITIES:END -->')) throw new Error('City list markers missing from index.html');
  if (updated !== page) {
    writeFileSync(file, updated);
    console.log('🗺️  City list in index.html updated');
  }
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
