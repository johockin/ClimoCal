# ClimoCal 🌤️

**Weather in your calendar. No app. No widgets. Just works.**

Get 16-day weather forecasts directly in your calendar app. Subscribe once, get weather forever.

## 🌟 What It Does

ClimoCal puts weather directly in your calendar as events that update automatically every morning:

```
☀️ 22°/15°
⛅ 24°/17° 
🌧️ 18°/12°
```

- **16-day forecast** - See weather up to 2 weeks ahead
- **Auto-updates daily** - Always current, no manual refresh
- **Works everywhere** - Apple Calendar, Google Calendar, Outlook, anything that supports calendar subscriptions
- **Completely free** - No accounts, no tracking, no premium tiers

## 🚀 Get Started

### Option 1: Use the Website (Easiest)
1. Go to **[johockin.github.io/ClimoCal](https://johockin.github.io/ClimoCal)**
2. Click your city to add to Apple Calendar
3. For Google Calendar/Outlook: right-click and copy the link

### Option 2: Direct Links
Pick your city and copy the calendar URL:

- **Toronto**: `webcal://johockin.github.io/ClimoCal/calendars/toronto.ics`
- **Vancouver**: `webcal://johockin.github.io/ClimoCal/calendars/vancouver.ics`
- **Montreal**: `webcal://johockin.github.io/ClimoCal/calendars/montreal.ics`
- **New York**: `webcal://johockin.github.io/ClimoCal/calendars/new-york.ics`
- **London**: `webcal://johockin.github.io/ClimoCal/calendars/london.ics`
- **Tokyo**: `webcal://johockin.github.io/ClimoCal/calendars/tokyo.ics`

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

- **Weather Data**: [Open-Meteo](https://open-meteo.com) (free, no API key needed)
- **Updates**: GitHub Actions runs daily at 6 AM UTC
- **Format**: Standard iCalendar (.ics) files
- **Hosting**: GitHub Pages (free, fast, reliable)
- **Code**: ~50 lines of JavaScript, completely open source

## 🤝 Contributing

Found a bug or want to add a city? 

1. [Open an issue](https://github.com/johockin/ClimoCal/issues) - I respond quickly
2. For developers: Check out [PROJECT_SPEC.md](PROJECT_SPEC.md) for technical details

## 📄 License

MIT License - use it however you want.

---

**Built in an afternoon because I needed it.**  
[Johnny Hockin](https://johnnyhockin.com) • Weather by [Open-Meteo](https://open-meteo.com)