# ClimoCal — hub

## Status
- Live at https://climocal.johnnyhockin.com (GitHub Pages, custom domain; also johockin.github.io/ClimoCal). Main search-traffic source for johnnyhockin.com ("add weather to apple calendar").
- **Feeds frozen since 2025-12-27**: GitHub disabled the daily workflow for inactivity (`disabled_inactivity`). Site serves, forecasts are 10 months stale.
- 2026-10-27: Los Angeles + Shanghai added locally (8 cities), Sunday-tag and city-name bugs fixed. Committed, **not pushed**: a push to `main` deploys live, so it waits on johnny's go.

## Next
- [ ] johnny's go → push `main`, `gh workflow enable`, confirm deploy, close issue #1 (Shanghai)
- [ ] Stop the 60-day auto-disable recurring (keepalive or move off GitHub cron)
- [ ] johnny picks from the improvement list (LOG.md, 2026-10-27)

## Map
- `scripts/generate-calendars.js` — builds one `.ics` per city + `public/status.json`
- `scripts/weather-api.js` — Open-Meteo forecast fetch (no key) · `scripts/emoji-mapper.js` — WMO code → emoji
- `data/locations.json` — city list (order = order on the page; `country: "usa"` → °F)
- `public/` — the site (`index.html`, `app.js`) + generated `calendars/`; deployed as-is
- `.github/workflows/generate-calendars.yml` — daily 10:00 UTC + on push: generate → deploy Pages
- `PROJECT_SPEC.md` — full spec, design philosophy, changelog to 2025-08 (deep dive; read on demand)
- `LOG.md` — dated log, newest first

## Gotchas
- Pushing `main` = deploying live. Never push without johnny's go.
- GitHub disables scheduled workflows in public repos after 60 days without a commit.
- `new Date('YYYY-MM-DD')` is UTC midnight; use `getUTCDay()` for weekdays.
- `calgary.ics`/`ottawa.ics` are orphans (not in `locations.json`), served frozen at Aug-2025 data.
- Supply-chain cooldown (`~/.npmrc` `min-release-age=7`) stays on; `npm ci` works with the lockfile.
- Licence: README says MIT but there's no LICENSE file; johnny's call (Planning row `johnny-brand-opensource-repos`).
- Local preview: `npx serve public` (or `.claude/launch.json` "climocal", untracked).

Log: LOG.md · Deep dives: PROJECT_SPEC.md
