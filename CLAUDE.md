# ClimoCal — hub

## Status
- Live at https://climocal.johnnyhockin.com (GitHub Pages, HTTPS enforced). Main search-traffic source for johnnyhockin.com ("add weather to apple calendar").
- Daily build re-enabled 2026-10-27 after 10 months frozen (`disabled_inactivity`); a keepalive job now prevents that.
- 2026-10-27 revival (branch `revival`): 110 cities, feed fixes, typical weather (≈) to 12 months, quieter landing page with a two-step subscribe flow. Awaiting johnny's go to merge to `main` (= deploy).
- Typical-weather backfill: ~38 cities/day (Open-Meteo quota); the `Build Typical Weather` workflow finishes the rest by itself.

## Next
- [ ] johnny's go → merge `revival` into `main`, watch deploy, spot-check feeds
- [ ] After the first scheduled run: confirm the keepalive job passed and the normals job committed
- [ ] Check Google Calendar one-click add with a signed-in account (link pattern is standard, not yet clicked through)

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
- GitHub disables scheduled workflows after 60 days without repo activity; the keepalive job re-enables daily.
- All-day dates must be UTC midnight (`utcDate`); local midnight shifts days east of UTC.
- Open-Meteo counts history by length: 10 years ≈ 261 calls/city; free limit 10,000/day, 600/min.
- `index.html` city list sits between `CITIES:START/END` markers; the generator owns it.
- Supply-chain cooldown (`~/.npmrc` `min-release-age=7`) stays on.
- Licence: README says MIT but no LICENSE file; johnny's call (Planning row `johnny-brand-opensource-repos`).
- Local preview: `npm run dev` (generates, then serves `public/` on :4317).

Log: LOG.md · Deep dives: PROJECT_SPEC.md
