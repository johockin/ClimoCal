# CLIMOCAL PROJECT SPECIFICATION

⚠️ This is the **living god file** for ClimoCal. This document is the canonical source of truth for all project decisions, architectural intentions, user needs, tech stack context, and collaborator expectations. 

Every coder must reference and maintain it. Every AI collaborator must not make a single move without knowing it up and down. Every architectural decision must be documented here.

---

## 🔰 PURPOSE OF THIS FILE

- Serves as the **canonical source of truth** for the ClimoCal project
- Evolves over time, **growing with every decision**, mistake, fix, or insight
- **Future collaborators (human or AI)** must be able to read this file and understand how the project works, why it's built the way it is, and what to do next

---

## ✍️ ETHOS AND EXPECTATIONS (LEAVE THESE PERMANENTLY, ALWAYS FOLLOW THEM)

### ✅ My Expectations:

- **You must document everything.**
  - Every architectural decision
  - Every design tradeoff
  - Every mistake made and fixed
  - Why a dependency was added (if ever)
  - What each config or CLI command is doing (and why)
- **Specs over assumptions.**
  - When in doubt, ask me.
  - If there's ambiguity, propose 2–3 interpretations and we'll decide.
- **No magic.**
  - Code must be explainable.
  - Every collaborator (human or AI) must be able to trace how the project works without reverse engineering codebase spaghetti.
- **Work in stable milestones.**
  - Each chunk of progress must be committable and testable.
  - Label milestone commits clearly in the spec and Git history.
- **I do the QA.**
  - You will guide me on how to test, and I'll run the tests locally or in browser, giving feedback.
- **This file is allowed to be sprawling.**
  - It's the beating heart of the project. Make it exhaustive and clear.
  - Use headings, sections, bullets, and dividers.
- **You are encouraged to prompt me regularly.**
  - Ask for clarification, priorities, and updates.
  - Especially if stuck, or if something needs approval before proceeding.
- **The roadmap is alive.**
  - Maintain a clearly structured list of upcoming, in-progress, and completed tasks.
  - Triaging is expected—priorities shift, and you should record that evolution.
  - Document when bugs are deprioritized or promoted to urgent.
  - All roadmap updates must be reflected in the CHANGELOG or ROADMAP section.
- **Font rendering / antialiasing:**
  - Unless visually intended for a specific look, use the smoothest possible, most legible antialiasing for all text. Prioritize readability and polish in UI text.

### 🧠 Guiding Philosophy:

- **Transparency > Cleverness**
- **Stability > Speed**
- **Performance > Convention**
- **Explicitness > DRY if it aids readability**
- **Centralization of knowledge > scattershot insight buried in files**

---

## 🔍 LEVEL SET SUMMARY

- **Project name**: ClimoCal
- **Purpose**: A "set and forget" weather calendar subscription service that provides weather forecasts, historical climate data, and seasonal averages as an iCalendar (.ics) feed with zero maintenance
- **Audience / users**: Personal use initially (Johnny), with potential for wider sharing later
- **Most important outcome**: Reliability and zero-maintenance operation - it must "just work" forever without intervention
- **Visual vs performance vs design**: Performance and reliability are paramount. Visual design should be minimal and functional. No fancy UI needed - the calendar is the interface.
- **Performance priority**: High - Static files must load instantly, calendar subscriptions must refresh reliably
- **SEO priority**: Low - This is a utility service, not a content site
- **Maintenance over time**: Zero maintenance required after initial setup - this is the core requirement
- **Deployment target(s)**: GitHub Pages (free, reliable, zero maintenance)
- **Initial feature list**:
  - [x] 16-day weather forecast with emoji indicators
  - [x] Daily high/low temperatures in calendar events  
  - [x] Location-based subscriptions (starting with Toronto)
  - [x] Auto-refreshing calendar subscriptions
  - [x] Simple web UI for generating subscription links
  - [ ] Seasonal climate averages (monthly historical data)
  - [ ] Multiple location support
- **Tech constraints / requests from user**:
  - [x] Must use GitHub Actions + Static Files approach (not serverless functions)
  - [x] Must use Open-Meteo API (no API key required)
  - [x] Must be truly "set and forget" - no ongoing maintenance
  - [x] Must work with Apple Calendar, Google Calendar, Outlook
- **Other notes**: Architecture has been pre-designed and reviewed by code-architect. Ready for implementation.

---

## 🏗️ TECHNICAL ARCHITECTURE

### Core Architectural Decision: GitHub Actions + Pre-Generated Static Files

**Why this approach over serverless functions:**
- **No cold starts** - Static files are always instant
- **No API limits for users** - Weather API only called during generation  
- **100% uptime** - GitHub Pages/CDN never goes down
- **Zero maintenance** - Runs automatically forever
- **Free forever** - All within free tiers

### Key Technical Choices:

- **Framework / language**: Node.js scripts for calendar generation, vanilla HTML/CSS/JS for frontend
- **Weather API**: Open-Meteo (no API key needed, no rate limits, global coverage, includes historical data)
- **Calendar generation**: `ical-generator` library for standards-compliant .ics files  
- **Static file hosting**: GitHub Pages 
- **Automation**: GitHub Actions with cron scheduling (daily at 6 AM)
- **Styling approach**: Minimal CSS for the subscription page
- **State management**: None needed - stateless static generation
- **Directory structure plan**:
  ```
  climocal/
  ├── .github/workflows/generate-calendars.yml  # Scheduled generation
  ├── public/                                   # GitHub Pages root  
  │   ├── index.html                           # Subscription UI
  │   ├── style.css                            # Minimal styling
  │   ├── app.js                               # Client-side logic
  │   └── calendars/                           # Generated .ics files
  │       └── toronto.ics                      
  ├── scripts/
  │   ├── generate-calendars.js                # Main generation script
  │   ├── weather-api.js                       # Open-Meteo integration  
  │   └── emoji-mapper.js                      # Weather to emoji mapping
  ├── data/
  │   ├── locations.json                       # Predefined locations
  │   └── climate-normals.json                 # Historical averages
  └── package.json                             # Dependencies (minimal)
  ```
- **Key dependencies**: `ical-generator` only - ultra-minimal dependency footprint
- **Planned dev workflow**: Direct Node.js script execution, no build process needed
- **Testing tools / approach**: Manual testing with real calendar applications (Apple Calendar, Google Calendar, Outlook)

### Architecture Review Results:
✅ **Code-architect assessment**: "This is a SOLID architecture" - "architecturally wise" 
✅ **Confidence level**: High - will work reliably for years with minimal intervention
✅ **Main strengths**: Excellent for personal use, true "zero maintenance", leverages reliable free infrastructure
⚠️ **Minor recommendations**: Add fallback weather API and health monitoring (optional enhancements)

---

## 🎯 CORE FEATURES

### MVP Features (Sprint 1 - Personal Use)
1. **16-day weather forecast** with emoji indicators
2. **Daily high/low temperatures** in calendar event titles
3. **Toronto location** (single location to start)
4. **Auto-refreshing** calendar subscriptions via standard iCal TTL
5. **Simple web UI** for subscription links
6. **GitHub Actions automation** for daily calendar generation

### Stretch Features (Later Sprints)
- Seasonal climate averages (monthly historical data)
- Multiple location support in single feed  
- Historical "on this day" weather records
- Severe weather alerts as calendar events
- Moon phases and astronomical events
- Sunrise/sunset times
- User preferences (units, language, detail level)

---

## 🚀 IMPLEMENTATION PLAN

### Sprint 1: Personal Use MVP (2-3 hours total)
1. Set up GitHub repo and enable GitHub Pages
2. Create basic directory structure  
3. Implement calendar generation script with Open-Meteo integration
4. Add GitHub Action for scheduled generation (daily 6 AM)
5. Create minimal web UI for subscription links
6. Test with real calendar applications
7. **Milestone M1**: Personal weather calendar working and auto-updating

### Sprint 2: Polish & Expand (Optional - 2 hours)  
1. Add seasonal climate averages
2. Support for additional locations
3. Enhanced emoji mapping for weather conditions
4. Improved web UI styling
5. **Milestone M2**: Enhanced personal calendar with historical context

### Sprint 3: Public Sharing (Optional - Weekend project)
1. Add location search functionality
2. Custom domain setup
3. Usage analytics
4. Documentation for public sharing
5. **Milestone M3**: Public service ready for sharing

---

## 📊 CALENDAR SUBSCRIPTION MECHANICS

### How it Works:
1. **Generation**: GitHub Action runs daily, fetches weather data, generates .ics files
2. **Subscription**: Users subscribe once using webcal:// URL  
3. **Auto-refresh**: Calendar apps check for updates automatically:
   - Apple Calendar: Every 1-4 hours (not configurable)
   - Google Calendar: Every 8-24 hours (not configurable)
   - Outlook: Every 1-4 hours (configurable)
4. **Smart updates**: Apps only download if Last-Modified header indicates changes
5. **User experience**: Weather updates appear automatically, no user action needed

### Subscription URLs:
- **Apple Calendar**: `webcal://username.github.io/climocal/calendars/toronto.ics`
- **Google Calendar**: Via calendar.google.com import with webcal URL
- **Direct download**: `https://username.github.io/climocal/calendars/toronto.ics`

---

## 📒 CHANGELOG (REVERSE CHRONOLOGICAL)

### 2024-08-26 - Sprint 1 Implementation Complete ✅
- **Achievement**: Successfully implemented complete MVP calendar generation system
- **Files Created**: All core files implemented and tested locally
  - `scripts/generate-calendars.js` - Main calendar generation with Open-Meteo integration
  - `scripts/weather-api.js` - Weather data fetching and transformation
  - `scripts/emoji-mapper.js` - Weather condition to emoji mapping
  - `.github/workflows/generate-calendars.yml` - Daily automation workflow
  - `public/index.html` - Minimal subscription UI
  - `public/style.css` - Clean, accessible styling
  - `public/app.js` - Status loading and subscription handlers
  - `data/locations.json` - Toronto location configuration
  - `package.json` - Ultra-minimal dependencies (only ical-generator)
- **Testing**: Local generation successful - generated 16 days of Toronto weather data
- **Status**: Ready for GitHub Pages deployment and GitHub Actions setup
- **Milestone**: M1 achieved - Basic working calendar generation with Toronto weather

### 2024-08-26 - Project Initialization
- **Decision**: Adopted pre-designed architecture from weather-calendar-architecture.md
- **Decision**: GitHub Actions + Static Files approach over serverless functions for reliability
- **Decision**: Open-Meteo API for weather data (no API key, no rate limits)  
- **Decision**: Ultra-minimal dependencies (only ical-generator)
- **Rationale**: Architecture reviewed by code-architect and deemed "solid" and "architecturally wise"

---

## 🧱 ROADMAP & PIPELINE

### NOW (Sprint 1 - Ready for Deployment)
- [x] Set up GitHub repository with provided URL
- [x] Implement basic calendar generation script with Open-Meteo integration
- [x] Add GitHub Actions workflow for daily execution (6 AM Toronto time)
- [x] Create minimal web UI for subscription with Apple/Google/Direct download options
- [x] Test local calendar generation (✅ 16 days of Toronto weather generated)
- [ ] **NEXT STEP**: Push to GitHub and configure GitHub Pages
- [ ] **FINAL STEP**: Test with personal calendar applications (Apple Calendar, Google Calendar)

### NEXT (Sprint 2 - After MVP Working)
- [ ] Add seasonal climate averages from historical API
- [ ] Support multiple locations (Toronto + others)
- [ ] Enhanced weather condition emoji mapping  
- [ ] Improved web UI styling and UX

### LATER (Sprint 3 - Public Release)
- [ ] Location search functionality
- [ ] Custom domain setup
- [ ] Error handling and fallback weather API
- [ ] Health monitoring and status reporting
- [ ] Public documentation and sharing

### SOMEDAY (Nice to Have)
- [ ] Moon phases and astronomical events
- [ ] Severe weather alerts integration
- [ ] Mobile-responsive subscription UI
- [ ] Usage analytics and monitoring

---

## 📌 MILESTONE COMMITS

- **M1**: Basic working calendar generation with Toronto weather (Sprint 1 complete)
- **M2**: Enhanced calendar with historical data and multiple locations (Sprint 2 complete) 
- **M3**: Public-ready service with location search and custom domain (Sprint 3 complete)
- **M4**: Production service with monitoring and fallbacks (if pursuing public release)

---

## 📌 OPEN QUESTIONS

*None currently - architecture is fully specified and ready for implementation*

---

## 🤖 AI COLLABORATOR INSTRUCTIONS

- Always refer to this file first before making any changes
- Before continuing any work, read this entire document top to bottom, and know it well
- Never introduce dependencies or frameworks without explaining and getting approval
- Always update this spec file whenever you make a move:
  - A new milestone is completed
  - A new file is created  
  - A config is modified
  - An issue is found
  - A feature is added or removed
  - The roadmap changes
  - We realize something about the project
  - A bug is found or squashed
- **For this project**: Push to git after each working milestone for Johnny's QA and testing with real calendar applications
- **Architecture is pre-approved**: Follow the GitHub Actions + Static Files approach exactly as specified
- **Minimal dependencies**: Only add dependencies if absolutely necessary and with explicit approval

---

## 📁 SUPPORTING FILES CREATED

- `README.md` - Points to this spec file and provides quick onboarding
- `CLAUDE.md` - Reference file for AI collaborators pointing to this spec
- `weather-calendar-architecture.md` - Original architecture document (reference only)

---

## 🔗 REPOSITORY CONFIGURATION

- **GitHub Repository**: https://github.com/johockin/ClimoCal.git  
- **GitHub Pages**: To be configured during Sprint 1
- **Actions**: To be configured during Sprint 1
- **Custom Domain**: Optional for Sprint 3

---

This file is sacred. Tend to it. 🌤️