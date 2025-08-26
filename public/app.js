// ClimoCal Client-Side Logic

document.addEventListener('DOMContentLoaded', async () => {
  console.log('🌤️  ClimoCal loading...');
  
  // Load available cities first
  await loadCities();
  
  // Load and display status information
  await loadStatus();
  
  // Set up calendar subscription handlers
  setupSubscriptionHandlers();
  
  // Set up font toggle functionality
  setupFontToggle();
});

async function loadCities() {
  const loadingEl = document.getElementById('locations-loading');
  const containerEl = document.getElementById('locations-container');
  
  try {
    const response = await fetch('status.json');
    
    if (!response.ok) {
      throw new Error(`Status API error: ${response.status}`);
    }
    
    const status = await response.json();
    
    // Hide loading message
    loadingEl.style.display = 'none';
    
    // Group cities by continent
    const continents = {};
    status.locations.forEach(location => {
      const continent = location.continent || 'other';
      if (!continents[continent]) {
        continents[continent] = [];
      }
      continents[continent].push(location);
    });
    
    // Display cities grouped by continent
    Object.keys(continents).sort().forEach(continent => {
      if (continent !== 'other') {
        const continentHeader = document.createElement('div');
        continentHeader.className = 'continent-header';
        continentHeader.textContent = continent;
        containerEl.appendChild(continentHeader);
      }
      
      continents[continent].forEach(location => {
        const cityCard = createCityCard(location);
        containerEl.appendChild(cityCard);
      });
    });
    
    console.log(`loaded ${status.locations.length} cities`);
    
  } catch (error) {
    console.warn('Could not load cities:', error.message);
    
    // Fallback: show just toronto
    loadingEl.style.display = 'none';
    const fallbackLocation = {
      name: 'toronto',
      slug: 'toronto'
    };
    
    const cityCard = createCityCard(fallbackLocation);
    containerEl.appendChild(cityCard);
  }
}

function createCityCard(location) {
  const card = document.createElement('div');
  card.className = 'city';
  
  card.innerHTML = `
    <div class="city-name">${location.name}</div>
    <div class="city-controls">
      <a href="webcal://johockin.github.io/ClimoCal/calendars/${location.slug}.ics">apple</a>
      <a href="https://calendar.google.com/calendar/r?cid=webcal://johockin.github.io/ClimoCal/calendars/${location.slug}.ics" target="_blank" rel="noopener">google</a>
      <a href="https://johockin.github.io/ClimoCal/calendars/${location.slug}.ics" download="ClimoCal-${location.name}.ics">download</a>
    </div>
  `;
  
  // Toggle controls on click
  card.addEventListener('click', () => {
    const wasActive = card.classList.contains('active');
    // Close all other cities
    document.querySelectorAll('.city.active').forEach(c => c.classList.remove('active'));
    // Toggle this one
    if (!wasActive) {
      card.classList.add('active');
    }
  });
  
  return card;
}

function getCityEmoji(cityName) {
  const cityEmojis = {
    'Toronto': '🏙️',
    'Vancouver': '🏔️',
    'Montreal': '🍁',
    'Calgary': '🏔️',
    'Ottawa': '🇨🇦',
    'New York': '🗽',
    'London': '🇬🇧',
    'Tokyo': '🏯'
  };
  
  return cityEmojis[cityName] || '📍';
}

async function loadStatus() {
  try {
    const response = await fetch('status.json');
    
    if (!response.ok) {
      throw new Error(`Status API error: ${response.status}`);
    }
    
    const status = await response.json();
    updateStatusDisplay(status);
    
  } catch (error) {
    console.warn('Could not load status:', error.message);
    
    // Fallback: try to get last modified from calendar file
    try {
      const calResponse = await fetch('calendars/toronto.ics', { method: 'HEAD' });
      if (calResponse.ok) {
        const lastModified = calResponse.headers.get('last-modified');
        if (lastModified) {
          const lastUpdated = new Date(lastModified);
          updateStatusDisplay({
            lastGenerated: lastUpdated.toISOString(),
            success: true,
            nextUpdate: new Date(lastUpdated.getTime() + 24 * 60 * 60 * 1000).toISOString()
          });
        }
      }
    } catch (fallbackError) {
      console.warn('Fallback status check also failed:', fallbackError.message);
      setStatusError();
    }
  }
}

function updateStatusDisplay(status) {
  const lastUpdatedEl = document.getElementById('last-updated');
  const nextUpdateEl = document.getElementById('next-update');
  const statusIndicatorEl = document.getElementById('status-indicator');
  
  if (lastUpdatedEl && status.lastGenerated) {
    const lastGenerated = new Date(status.lastGenerated);
    lastUpdatedEl.textContent = lastGenerated.toLocaleString();
    lastUpdatedEl.classList.remove('loading');
  }
  
  if (nextUpdateEl && status.nextUpdate) {
    const nextUpdate = new Date(status.nextUpdate);
    nextUpdateEl.textContent = nextUpdate.toLocaleString();
    nextUpdateEl.classList.remove('loading');
  }
  
  if (statusIndicatorEl) {
    statusIndicatorEl.className = `status-indicator ${status.success ? 'success' : 'error'}`;
  }
}

function setStatusError() {
  const lastUpdatedEl = document.getElementById('last-updated');
  const nextUpdateEl = document.getElementById('next-update');
  
  if (lastUpdatedEl) {
    lastUpdatedEl.textContent = 'Unable to check';
    lastUpdatedEl.classList.remove('loading');
  }
  
  if (nextUpdateEl) {
    nextUpdateEl.textContent = 'Unknown';
    nextUpdateEl.classList.remove('loading');
  }
}

function setupSubscriptionHandlers() {
  // Handle Apple Calendar subscription
  const appleButtons = document.querySelectorAll('.btn-apple');
  appleButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      // Let the default behavior handle the webcal:// link
      console.log('📱 Opening Apple Calendar subscription');
    });
  });
  
  // Handle Google Calendar subscription  
  const googleButtons = document.querySelectorAll('.btn-google');
  googleButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      console.log('📅 Opening Google Calendar subscription');
      // The href will handle the redirect to calendar.google.com
    });
  });
  
  // Handle direct download
  const downloadButtons = document.querySelectorAll('.btn-download');
  downloadButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      console.log('⬇️ Downloading calendar file');
      // Default browser download behavior
    });
  });
}

// Utility function to copy calendar URL to clipboard (for future use)
async function copyCalendarUrl(url) {
  try {
    await navigator.clipboard.writeText(url);
    showNotification('Calendar URL copied to clipboard!');
  } catch (error) {
    console.error('Could not copy URL:', error);
    showNotification('Could not copy URL', 'error');
  }
}

function showNotification(message, type = 'success') {
  // Simple toast notification (can be enhanced later)
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'error' ? '#dc3545' : '#28a745'};
    color: white;
    padding: 12px 20px;
    border-radius: 6px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    z-index: 1000;
    font-family: inherit;
  `;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  // Remove after 3 seconds
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Font Toggle Functionality
function setupFontToggle() {
  const toggleButton = document.getElementById('font-toggle');
  let isMonoFont = true; // Start with monospace (Courier Prime)
  
  if (!toggleButton) return;
  
  // Load saved font preference from localStorage
  const savedFont = localStorage.getItem('climocal-font-preference');
  if (savedFont === 'sans') {
    isMonoFont = false;
    switchToSansFont();
    toggleButton.textContent = 'SANS';
  } else {
    toggleButton.textContent = 'MONO';
  }
  
  toggleButton.addEventListener('click', () => {
    if (isMonoFont) {
      // Switch to Helvetica Neue
      switchToSansFont();
      toggleButton.textContent = 'SANS';
      localStorage.setItem('climocal-font-preference', 'sans');
      isMonoFont = false;
    } else {
      // Switch to Courier Prime
      switchToMonoFont();
      toggleButton.textContent = 'MONO';
      localStorage.setItem('climocal-font-preference', 'mono');
      isMonoFont = true;
    }
  });
}

function switchToSansFont() {
  document.documentElement.style.setProperty('--active-font', 'var(--font-sans)');
}

function switchToMonoFont() {
  document.documentElement.style.setProperty('--active-font', 'var(--font-mono)');
}