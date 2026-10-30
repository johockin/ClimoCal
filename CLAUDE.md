# ClimoCal — hub

## Status
- Live at https://climocal.johnnyhockin.com (GitHub Pages, HTTPS enforced). Main search-traffic source for johnnyhockin.com ("add weather to apple calendar").
- 2026-10-27 revival deployed: 110 cities, typical weather (≈) to 12 months, two-step landing page, Instagram feedback links, keepalive. Feeds verified live.
- Typical weather: 30/110 cities as of 2026-10-27; `Build Typical Weather` adds ~18/day until done (~2026-11-01).
- Blog refresh live at https://johnnyhockin.com/writing/ (2026-10-27; figure-size fix 701c78d). The writing template is now owned by the JH (Johnny-Brand) session (main 1197a7e); don't edit johnnyhockin.com writing files from here without checking with it.

## Next
- [ ] Push ClimoCal `main` (4 docs-only hub/log commits; pushing redeploys the site, so needs johnny's go)
- [ ] Confirm the 2026-10-28/29 runs: keepalive passed and `Build Typical Weather` committed new cities
- [ ] Click through Google Calendar one-click add with a signed-in account

## Map
- `scripts/generate-calendars.js` — one `.ics` per city + `public/status.json` + the city list inside `public/index.html`
- `scripts/weather-api.js` — batched Open-Meteo forecast fetch with retries
- `scripts/build-locations.js` — `data/city-seed.json` → `data/locations.json` via Open-Meteo geocoder
- `scripts/build-normals.js` — 10-yr ERA5 → `data/climate-normals.json` (resumable, quota-paced)
- `scripts/emoji-mapper.js` — WMO code → emoji
- `public/` — the site (`index.html`, `app.js`, `og.jpg`, robots/sitemap); `calendars/` + `status.json` are generated, not committed
- `.github/workflows/` — `generate-calendars.yml` (daily 10:00 UTC + push: build → deploy, keepalive), `build-normals.yml` (daily 09:00 UTC)
- `PROJECT_SPEC.md` — full spec + changelog (deep dive) · `LOG.md` — dated log

## Gotchas
- Pushing `main` = deploying live. Never push `main` without johnny's go.
- `app.js` is fingerprinted (`app.js?v=hash`) by the generator; never hand-edit the `?v=`. Pages caches 10 min.
- GitHub disables scheduled workflows after 60 days without repo activity; the keepalive job re-enables daily.
- All-day dates must be UTC midnight (`utcDate`); local midnight shifts days east of UTC.
- Open-Meteo counts history by length: 10 years ≈ 261 calls/city; free limit 10,000/day, 600/min.
- `index.html` city list sits between `CITIES:START/END` markers; the generator owns it.
- Supply-chain cooldown (`~/.npmrc` `min-release-age=7`) stays on.
- Licence: README says MIT but no LICENSE file; johnny's call (Planning row `johnny-brand-opensource-repos`).
- Local preview: `npm run dev` (generates, then serves `public/` on :4317).

Log: LOG.md · Deep dives: PROJECT_SPEC.md
