# ClimoCal — log (newest first)

## 2026-10-27 (later) — Revival batch: items 2–8
- Live: pushed LA + Shanghai to `main`, re-enabled the workflow, deploy green, issue #1 closed. HTTPS enforced on Pages.
- On `revival` (not deployed): keepalive job; Node 24 actions; batched forecast fetch with retries; stable UIDs, exclusive DTEND, UTC dates, units converted before rounding, mph/inches for US, null day-16 dropped; rain % and sunrise/sunset; 110 cities from a geocoded seed; typical weather (≈) to 12 months from 10-yr ERA5 with a self-finishing backfill workflow; generated feeds no longer committed; `serve` dropped (0 audit findings).
- Landing page rebuilt per johnny ("less brash, more immediate, SO clear where to press"): headline, a live week of real forecast chips, then step 1 (which calendar) and step 2 (tap your city), with text that says exactly what happens per app. Story and FAQ below. Checked at desktop and 375px, no console errors.

## 2026-10-27 — Resurrection pass, LA + Shanghai
- Cloned fresh. The live site serves, but the daily workflow has been `disabled_inactivity` since 2025-12-27, so every feed is stuck at that date. Last green run: 2025-12-27.
- Added Los Angeles (user request) and Shanghai (issue #1). Fixed the Sunday tag landing on Monday (UTC date parsing) and the "Los angeles"/"New york" names. Generated and checked all 8 feeds, plus the page in a browser. Committed locally, not pushed (a push deploys).
- Lean hub created; `PROJECT_SPEC.md` kept as deep dive (2025 history lives in its changelog).
- Improvement list, ranked (fixes first):
  1. Revive: push + `gh workflow enable` (needs go).
  2. Stop the 60-day auto-disable: a monthly keepalive commit job, no third-party action.
  3. Mobile: copying the feed URL needs right-click, which phones don't have, so Google/Outlook users on a phone are stuck.
  4. Feed correctness: all-day DTEND = DTSTART (should be the next day); UIDs are random on every run (ical-generator v7 ignores `uid`, it wants `id`); orphan calgary/ottawa feeds frozen since Aug 2025; °F converted from already-rounded °C (±1°F); US wind shown in km/h.
  5. Hygiene: Node 20 (EOL 2026-04) → 24, `npm ci --production` → `--omit=dev`, enforce HTTPS on Pages, failure alerting, `serve` dev dependency has audit advisories (dev only, never deployed). The hero "23°/10°" is a static placeholder, not live weather.
  6. Win: any city. Short term: ~100 big cities + a search box (stays static). Long term: an on-demand `?lat=&lon=` feed via a Worker (breaks the static-only rule, needs approval).
  7. Win: climate normals past day 16, the "Climo" in the name: the typical high/low for every day up to 12 months out, precomputed from the Open-Meteo archive. Fits the "planning shoots months ahead" story.
  8. Win: richer events (rain % in the title when it's likely, sunrise/sunset), one-click Google Calendar subscribe, a working "request a city" link, page SEO for "add weather to apple calendar".
