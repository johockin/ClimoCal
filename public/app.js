// ClimoCal Client-Side Logic
//
// The city list is plain HTML (written at build time), so it works with no
// JavaScript: every city links to its webcal:// feed for Apple Calendar.
// This script adds the app picker (step 1), city search, and the live week
// preview at the top.

const SITE_HOST = 'climocal.johnnyhockin.com';
const FEEDBACK_URL = 'https://instagram.com/johnnystagram';

// Step 2's title and follow-up line say exactly what a city tap will do
const APPS = {
  apple: {
    title: 'Tap your city to add it to Apple Calendar.',
    after: 'Calendar asks you to confirm. Tap Subscribe and you\'re done.',
    href: city => feed(city, 'webcal')
  },
  google: {
    title: 'Click your city to add it to Google Calendar.',
    after: 'Google Calendar opens in a new tab. Click Add and you\'re done. Do this on a computer; it then shows up on your phone too.',
    href: city => `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(feed(city, 'webcal'))}`
  },
  outlook: {
    title: 'Click your city to add it to Outlook.',
    after: 'Outlook on the web opens in a new tab and asks you to confirm. For a work or school account, pick Something else.',
    href: city => `https://outlook.live.com/calendar/0/addfromweb?url=${encodeURIComponent(feed(city, 'https'))}` +
      `&name=${encodeURIComponent(`${city.dataset.name} Climate`)}`
  },
  copy: {
    title: 'Tap your city to copy its calendar link.',
    after: 'Then paste it into your calendar app where it says Subscribe or Add calendar from URL.',
    href: city => feed(city, 'https')
  }
};

let currentApp = 'apple';
let status = null;

function feed(city, scheme) {
  return `${scheme}://${SITE_HOST}/calendars/${city.dataset.slug}.ics`;
}

document.addEventListener('DOMContentLoaded', () => {
  setupAppPicker();
  setupSearch();
  setupCityTaps();
  loadWeek();
});

// --- Step 1: app picker ------------------------------------------------------

function setupAppPicker() {
  let saved = null;
  try { saved = localStorage.getItem('climocal-app'); } catch { /* private mode */ }
  const guess = /Android/i.test(navigator.userAgent) ? 'google' : 'apple';
  setApp(APPS[saved] ? saved : guess);

  document.querySelectorAll('.app-picker button').forEach(button => {
    button.addEventListener('click', () => {
      setApp(button.dataset.app);
      try { localStorage.setItem('climocal-app', button.dataset.app); } catch { /* ignore */ }
    });
  });
}

function setApp(app) {
  currentApp = app;
  document.querySelectorAll('.app-picker button').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.app === app));
  });
  document.getElementById('step2-title').textContent = APPS[app].title;
  document.getElementById('after').textContent = APPS[app].after;
  document.getElementById('copy-fallback').hidden = true;

  const external = app === 'google' || app === 'outlook';
  document.querySelectorAll('.city').forEach(city => {
    city.href = APPS[app].href(city);
    if (external) {
      city.target = '_blank';
      city.rel = 'noopener';
    } else {
      city.removeAttribute('target');
      city.removeAttribute('rel');
    }
  });
}

// --- Step 2: city taps ---------------------------------------------------------

function setupCityTaps() {
  const cities = document.getElementById('cities');

  cities.addEventListener('click', async event => {
    const city = event.target.closest('.city');
    if (!city) return;
    markDone(city);
    if (currentApp !== 'copy') return; // the link itself does the work

    event.preventDefault();
    const url = feed(city, 'https');
    try {
      await navigator.clipboard.writeText(url);
      toast(`Copied the ${city.dataset.name} link. Now paste it into your calendar app.`);
    } catch {
      // Clipboard blocked: show the link, selected, to copy by hand
      const box = document.getElementById('copy-fallback');
      const input = document.getElementById('copy-fallback-url');
      input.value = url;
      box.hidden = false;
      input.focus();
      input.select();
    }
  });

  // Desktop: hovering a city previews its week at the top
  cities.addEventListener('mouseover', event => {
    const city = event.target.closest('.city');
    if (city) showWeek(city.dataset.slug);
  });
}

function markDone(city) {
  document.querySelectorAll('.city.done').forEach(c => c.classList.remove('done'));
  city.classList.add('done');
}

function toast(message) {
  document.querySelector('.toast')?.remove();
  const el = document.createElement('div');
  el.className = 'toast';
  el.setAttribute('role', 'status');
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

// --- Search --------------------------------------------------------------------

function fold(text) {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

function setupSearch() {
  const input = document.getElementById('city-search');
  const noMatch = document.getElementById('no-match');
  const popular = document.getElementById('popular');
  const moreLabel = document.getElementById('more-label');
  const regions = [...document.querySelectorAll('.region')];
  let openBeforeSearch = null;

  input.addEventListener('input', () => {
    const query = fold(input.value.trim());

    if (!query) {
      // Back to the resting layout: popular row, regions as they were
      popular.hidden = moreLabel.hidden = false;
      regions.forEach((region, i) => {
        region.hidden = false;
        region.open = openBeforeSearch ? openBeforeSearch[i] : false;
        region.querySelectorAll('.city').forEach(city => { city.hidden = false; });
      });
      openBeforeSearch = null;
      noMatch.hidden = true;
      return;
    }

    // Searching: hide the popular duplicates, open every region with a match
    if (!openBeforeSearch) openBeforeSearch = regions.map(region => region.open);
    popular.hidden = moreLabel.hidden = true;
    const visible = [];

    regions.forEach(region => {
      // A region matches by its start ("can" → Canada), never mid-word
      const regionMatch = query.length >= 3 && fold(region.dataset.region).startsWith(query);
      let regionShown = 0;
      region.querySelectorAll('.city').forEach(city => {
        const match = regionMatch || fold(city.dataset.name).includes(query);
        city.hidden = !match;
        if (match) { regionShown++; visible.push(city); }
      });
      region.hidden = regionShown === 0;
      region.open = regionShown > 0;
    });

    if (visible.length === 1) showWeek(visible[0].dataset.slug);

    noMatch.hidden = visible.length !== 0;
    if (visible.length === 0) {
      const name = input.value.trim();
      noMatch.textContent = `${name} isn't on the list yet. `;
      const link = document.createElement('a');
      link.href = FEEDBACK_URL;
      link.textContent = 'DM me on Instagram';
      noMatch.append(link, ` and I'll add ${name}.`);
    }
  });

  // Enter picks the city when the search narrows to exactly one
  input.addEventListener('keydown', event => {
    if (event.key !== 'Enter') return;
    const visible = [...document.querySelectorAll('.region:not([hidden]) .city:not([hidden])')];
    if (visible.length === 1) visible[0].click();
  });
}

// --- Live week preview -----------------------------------------------------------

async function loadWeek() {
  try {
    const response = await fetch('status.json');
    if (!response.ok) throw new Error(`status.json ${response.status}`);
    status = await response.json();

    // The visitor's own city when their timezone matches one, else Toronto
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const home = status.locations.find(loc => loc.timezone === zone)
      || status.locations.find(loc => loc.slug === 'toronto')
      || status.locations[0];
    showWeek(home.slug);
  } catch (error) {
    console.warn('Could not load the week preview:', error.message);
    // No data: the week preview stays hidden (it starts hidden in the HTML)
  }
}

function showWeek(slug) {
  const city = status?.locations.find(loc => loc.slug === slug);
  if (!city || city.slug === showWeek.current) return;
  showWeek.current = city.slug;

  document.getElementById('week').hidden = false;
  const days = document.getElementById('week-days');
  days.replaceChildren(...city.week.map(day => {
    const date = new Date(`${day.date}T12:00:00Z`);
    const cell = document.createElement('div');
    cell.className = 'week-day';

    const label = document.createElement('strong');
    label.textContent = `${date.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' })} ${date.getUTCDate()}`;

    const chip = document.createElement('span');
    chip.className = 'event';
    chip.textContent = `${day.emoji} ${day.high}°/${day.low}°`;
    if (day.rain) {
      const rain = document.createElement('span');
      rain.className = 'rain';
      rain.textContent = `💧${day.rain}%`;
      chip.append(rain);
    }

    cell.append(label, chip);
    return cell;
  }));

  const hours = (Date.now() - new Date(status.lastGenerated)) / 3600000;
  const age = hours < 1 ? 'less than an hour ago'
    : hours < 48 ? `${Math.round(hours)} hour${Math.round(hours) === 1 ? '' : 's'} ago`
    : `${Math.round(hours / 24)} days ago`;
  const caption = document.getElementById('week-caption');
  caption.textContent = `How it looks in your calendar: ${city.name} this week, °${city.unit}. Updated ${age}.`;
  // Feeds rebuild every morning; past 36 hours something is stuck, so say so
  caption.classList.toggle('stale', hours > 36);
}
