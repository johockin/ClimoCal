# ClimoCal 🌤️

**Weather in your calendar. No app. No widgets. Just works.**

Every day in your calendar shows the weather: a 16-day forecast, then typical weather for that date out to a year. Subscribe once; it updates itself every morning.

## 🌟 What It Does

```
☀️ 22°C/15°C          forecast (16 days out)
🌧️ 18°C/12°C 💧70%    40%+ chance of rain
≈ 24°C/15°C           past day 16: the 10-year average for that date
```

- **110 cities** across North America, Latin America, Europe, Africa, Asia and Oceania
- **°F and mph** for US cities, °C and km/h everywhere else
- **Tap any day** for wind, UV, sunrise and sunset
- **Works everywhere** - Apple Calendar, Google Calendar, Outlook, anything that supports calendar subscriptions
- **Completely free** - No accounts, no tracking, no premium tiers

## 🚀 Get Started

Go to **[climocal.johnnyhockin.com](https://climocal.johnnyhockin.com)**, pick your calendar app, tap your city.

Or subscribe directly: `webcal://climocal.johnnyhockin.com/calendars/<city>.ics`, e.g. `toronto`, `los-angeles`, `new-york`, `london`, `tokyo`. The full list is in [`data/locations.json`](data/locations.json).

*Need another city? [Open an issue](https://github.com/johockin/ClimoCal/issues) and I'll add it.*

## 📱 How to Subscribe

### Apple Calendar (iOS/Mac)
- Click any `webcal://` link above or on the website
- Calendar will open and ask to subscribe
- Done!

### Google Calendar
- Copy the `webcal://` link
- In Google Calendar, click the + next to "Other calendars"
- Choose "From URL" and paste the link
- Done!

### Outlook
- Copy the `webcal://` link
- In Outlook, go to Calendar → Add Calendar → Subscribe from web
- Paste the link
- Done!

## ❓ Why This Exists

I'm a film producer. I live in my calendar, planning shoots months ahead. Weather determines everything - can we shoot outside? Do we need rain gear? Should we reschedule?

I got tired of switching between calendar and weather apps. Apple Calendar only shows weather if you add a location to each event. Google Calendar killed their weather feature. Other services are broken or want $5/month for something that should be free.

I just wanted to glance at next Tuesday and see if it's going to rain. So I built this.

## 🔧 Technical Details

- **Weather Data**: [Open-Meteo](https://open-meteo.com) forecast + ERA5 history (free, no API key needed)
- **Updates**: GitHub Actions runs daily at 10:00 UTC (6 AM Toronto)
- **Format**: Standard iCalendar (.ics) files
- **Hosting**: GitHub Pages (free, fast, reliable)
- **Code**: a few hundred lines of JavaScript, one dependency (`ical-generator`)
- **Add a city**: add it to `data/city-seed.json`, run `npm run locations`; typical weather fills in on the next daily run

## 🤝 Contributing

Found a bug or want to add a city? 

1. [Open an issue](https://github.com/johockin/ClimoCal/issues) - I respond quickly
2. For developers: Check out [PROJECT_SPEC.md](PROJECT_SPEC.md) for technical details

## 📄 License

MIT License - use it however you want.

---

**Built in an afternoon because I needed it.**  
[Johnny Hockin](https://johnnyhockin.com) • Weather by [Open-Meteo](https://open-meteo.com)