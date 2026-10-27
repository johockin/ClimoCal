// Builds data/climate-normals.json: the typical high, low and wet-day chance
// for every calendar day, per city, from 10 years of ERA5 reanalysis
// (Open-Meteo historical archive, elevation-corrected to the city point).
//
// For each day of the year it averages the ±7 days around it across all
// 10 years (150 samples), so the curve is smooth and one odd year can't
// dominate. "Wet" = 1 mm or more of rain or snow (water equivalent).
//
// Cost: Open-Meteo counts history by length, ~261 API calls per city for
// 10 years, against a free limit of 600/min, 5,000/hour and 10,000/day.
// So this is resumable: it saves after every city, paces itself, stops at
// --budget (default 8000 calls) or on a 429, and skips cities already done.
//   node scripts/build-normals.js [--budget 8000]

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fetchJson } from './weather-api.js';

const ARCHIVE_URL = 'https://archive-api.open-meteo.com/v1/archive';
const FIRST_YEAR = 2016;
const LAST_YEAR = 2025;
const WINDOW = 7;            // ± days pooled around each calendar day
const WET_MM = 1;
const NORMALS_FILE = 'data/climate-normals.json';
const PRIORITY = ['toronto', 'vancouver', 'montreal', 'calgary', 'ottawa',
  'new-york', 'los-angeles', 'london', 'tokyo', 'shanghai'];

const DAYS = Math.round((Date.UTC(LAST_YEAR + 1, 0, 1) - Date.UTC(FIRST_YEAR, 0, 1)) / 86400000);
const CALLS_PER_CITY = Math.ceil(DAYS / 14);
const SECONDS_BETWEEN_CITIES = Math.ceil(CALLS_PER_CITY / 550 * 60); // stay under 600/min

const budgetArg = process.argv.indexOf('--budget');
let budget = budgetArg > -1 ? Number(process.argv[budgetArg + 1]) : 8000;

// Position in a leap year (0..365), so Feb 29 gets its own slot
function leapIndex(isoDate) {
  const [, m, d] = isoDate.split('-').map(Number);
  return Math.round((Date.UTC(2024, m - 1, d) - Date.UTC(2024, 0, 1)) / 86400000);
}

function monthDay(index) {
  return new Date(Date.UTC(2024, 0, 1) + index * 86400000).toISOString().slice(5, 10);
}

function computeNormals(daily) {
  const buckets = Array.from({ length: 366 }, () => ({ max: [], min: [], wet: 0, n: 0 }));
  daily.time.forEach((date, i) => {
    const tmax = daily.temperature_2m_max[i];
    const tmin = daily.temperature_2m_min[i];
    const rain = daily.precipitation_sum[i];
    if (tmax == null || tmin == null || rain == null) return;
    const center = leapIndex(date);
    for (let offset = -WINDOW; offset <= WINDOW; offset++) {
      const b = buckets[(center + offset + 366) % 366];
      b.max.push(tmax); b.min.push(tmin); b.n++;
      if (rain >= WET_MM) b.wet++;
    }
  });

  const mean = values => values.reduce((a, b) => a + b, 0) / values.length;
  const days = {};
  buckets.forEach((b, index) => {
    if (b.n < 50) throw new Error(`Only ${b.n} samples for ${monthDay(index)}`);
    days[monthDay(index)] = [
      Number(mean(b.max).toFixed(1)),
      Number(mean(b.min).toFixed(1)),
      Math.round(b.wet / b.n * 100)
    ];
  });
  return days;
}

const locations = JSON.parse(readFileSync('data/locations.json', 'utf8'));
const store = existsSync(NORMALS_FILE)
  ? JSON.parse(readFileSync(NORMALS_FILE, 'utf8'))
  : { source: `ERA5 via Open-Meteo, ${FIRST_YEAR}–${LAST_YEAR}, ±${WINDOW}-day window`, cities: {} };

const todo = locations
  .filter(l => !store.cities[l.slug])
  .sort((a, b) => (PRIORITY.indexOf(b.slug) > -1) - (PRIORITY.indexOf(a.slug) > -1));

console.log(`📚 ${locations.length - todo.length}/${locations.length} cities done; ` +
  `${todo.length} to go at ~${CALLS_PER_CITY} calls each, budget ${budget}`);

for (const [n, location] of todo.entries()) {
  if (budget < CALLS_PER_CITY) {
    console.log('⏸️  Budget spent for this run; the next run picks up here.');
    break;
  }
  if (n > 0) await new Promise(r => setTimeout(r, SECONDS_BETWEEN_CITIES * 1000));

  const url = `${ARCHIVE_URL}?latitude=${location.lat}&longitude=${location.lon}` +
    `&start_date=${FIRST_YEAR}-01-01&end_date=${LAST_YEAR}-12-31` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum` +
    `&timezone=${encodeURIComponent(location.timezone)}`;

  try {
    const data = await fetchJson(url, 2);
    store.cities[location.slug] = { years: `${FIRST_YEAR}–${LAST_YEAR}`, days: computeNormals(data.daily) };
    budget -= CALLS_PER_CITY;
    writeFileSync(NORMALS_FILE, JSON.stringify(store));
    const jul = store.cities[location.slug].days['07-15'];
    const jan = store.cities[location.slug].days['01-15'];
    console.log(`✅ ${location.name}: Jan 15 ≈ ${jan[0]}/${jan[1]}°C, Jul 15 ≈ ${jul[0]}/${jul[1]}°C`);
  } catch (error) {
    // 429 = rate limit for today; stop cleanly and let the next run resume
    console.warn(`⏸️  ${location.name}: ${error.message.slice(0, 120)} — stopping, will resume next run`);
    break;
  }
}

const done = Object.keys(store.cities).length;
console.log(`📚 ${done}/${locations.length} cities have typical weather`);
