// Builds data/locations.json from data/city-seed.json.
//
// To add a city: add "Display Name|Search Name@CC" to its region in the seed
// (only "Display Name" is needed when it's also the search name, and @CC only
// when the region has no default country), then run:
//   node scripts/build-locations.js
//
// Coordinates and timezones come from Open-Meteo's geocoder (most populous
// match in that country). Cities already in locations.json keep their
// existing coordinates and slug, so live subscriptions never move.

import { readFileSync, writeFileSync } from 'fs';
import { fetchJson } from './weather-api.js';

const GEOCODER = 'https://geocoding-api.open-meteo.com/v1/search';

function slugify(name) {
  return name.normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[.,']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function geocode(query, country) {
  const url = `${GEOCODER}?name=${encodeURIComponent(query)}&count=10&countryCode=${country}&language=en`;
  const { results = [] } = await fetchJson(url);
  const places = results.filter(r => r.feature_code?.startsWith('PPL'));
  if (!places.length) throw new Error(`No match for "${query}" in ${country}`);
  return places.sort((a, b) => (b.population || 0) - (a.population || 0))[0];
}

const seed = JSON.parse(readFileSync('data/city-seed.json', 'utf8'));
const existing = new Map(
  JSON.parse(readFileSync('data/locations.json', 'utf8')).map(l => [l.slug, l])
);
const locations = [];

for (const [region, defaultCountry, cities] of seed) {
  for (const entry of cities) {
    const [label, countryOverride] = entry.split('@');
    const [name, query = name] = label.split('|');
    const country = countryOverride || defaultCountry;
    const slug = slugify(name);
    const kept = existing.get(slug);

    if (kept) {
      locations.push({ name, slug, lat: kept.lat, lon: kept.lon, timezone: kept.timezone, country, region });
      continue;
    }

    const place = await geocode(query, country);
    console.log(`📍 ${name}: ${place.name}, ${place.admin1 ?? ''} ${country} ` +
      `(pop ${place.population ?? '?'}) ${place.timezone}`);
    locations.push({
      name, slug,
      lat: Number(place.latitude.toFixed(4)),
      lon: Number(place.longitude.toFixed(4)),
      timezone: place.timezone,
      country, region
    });
  }
}

const slugs = locations.map(l => l.slug);
const dupes = slugs.filter((s, i) => slugs.indexOf(s) !== i);
if (dupes.length) throw new Error(`Duplicate slugs: ${dupes.join(', ')}`);

writeFileSync('data/locations.json', JSON.stringify(locations, null, 2) + '\n');
console.log(`✅ ${locations.length} locations written`);
