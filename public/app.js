// ClimoCal Client-Side Logic

document.addEventListener('DOMContentLoaded', async () => {
  console.log('🌤️  ClimoCal loading...');
  
  // Set current date in hero
  setCurrentDate();
  
  // Load available cities
  await loadCities();
});

function setCurrentDate() {
  const now = new Date();
  const options = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  const dateString = now.toLocaleDateString('en-US', options);
  document.getElementById('current-date').textContent = dateString;
}

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
      continents[continent].forEach(location => {
        const cityItem = createCityItem(location);
        containerEl.appendChild(cityItem);
      });
    });
    
    // Set hero weather to first city (Toronto) if available
    const firstCity = status.locations.find(loc => loc.name === 'toronto') || status.locations[0];
    if (firstCity) {
      setHeroWeather(firstCity);
    }
    
    console.log(`loaded ${status.locations.length} cities`);
    
  } catch (error) {
    console.warn('Could not load cities:', error.message);
    
    // Fallback: show just toronto
    loadingEl.style.display = 'none';
    const fallbackLocation = {
      name: 'toronto',
      slug: 'toronto'
    };
    
    const cityItem = createCityItem(fallbackLocation);
    containerEl.appendChild(cityItem);
  }
}

function createCityItem(location) {
  const cityItem = document.createElement('div');
  cityItem.className = 'city-item';
  
  // Capitalize city name for display
  const displayName = location.name.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  const calendarUrl = `webcal://climocal.johnnyhockin.com/calendars/${location.slug}.ics`;
  
  cityItem.innerHTML = `
    <a href="${calendarUrl}" class="city-btn">
      <span>${displayName}</span>
      <span class="arrow">→</span>
    </a>
    <div class="subscribe-options">
      <div class="copy-url-section">
        <p>Calendar URL:</p>
        <input type="text" class="calendar-url" value="${calendarUrl}" readonly>
        <button class="copy-btn">Copy</button>
      </div>
    </div>
  `;
  
  // Right-click to show copy options
  const cityBtn = cityItem.querySelector('.city-btn');
  const options = cityItem.querySelector('.subscribe-options');
  const copyBtn = cityItem.querySelector('.copy-btn');
  const urlInput = cityItem.querySelector('.calendar-url');
  
  cityBtn.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    
    // Close all other city options
    document.querySelectorAll('.subscribe-options.active').forEach(opt => {
      opt.classList.remove('active');
    });
    
    // Show this one
    options.classList.add('active');
  });
  
  // Copy button functionality
  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(calendarUrl);
      copyBtn.textContent = 'Copied!';
      setTimeout(() => {
        copyBtn.textContent = 'Copy';
      }, 2000);
    } catch (error) {
      // Fallback: select the text
      urlInput.select();
      document.execCommand('copy');
      copyBtn.textContent = 'Copied!';
      setTimeout(() => {
        copyBtn.textContent = 'Copy';
      }, 2000);
    }
  });
  
  // Click outside to close
  document.addEventListener('click', (e) => {
    if (!cityItem.contains(e.target)) {
      options.classList.remove('active');
    }
  });
  
  return cityItem;
}

async function setHeroWeather(location) {
  // Try to get current weather for hero display
  try {
    // This is a simple demo - in a real app you might fetch current weather
    // For now, just show a static example
    const heroEmoji = document.getElementById('hero-emoji');
    const heroTemp = document.getElementById('hero-temp');
    
    // Set based on location for variety
    const weatherExamples = {
      'toronto': { emoji: '⛅', temp: '23°/10°' },
      'vancouver': { emoji: '🌧️', temp: '18°/12°' },
      'montreal': { emoji: '❄️', temp: '15°/5°' },
      'new-york': { emoji: '☀️', temp: '25°/18°' },
      'london': { emoji: '🌦️', temp: '16°/8°' },
      'tokyo': { emoji: '☀️', temp: '28°/22°' }
    };
    
    const weather = weatherExamples[location.slug] || { emoji: '🌤️', temp: '22°/15°' };
    heroEmoji.textContent = weather.emoji;
    heroTemp.textContent = weather.temp;
    
  } catch (error) {
    console.warn('Could not set hero weather:', error.message);
  }
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
    background: ${type === 'error' ? '#dc3545' : '#ff9500'};
    color: white;
    padding: 12px 20px;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    z-index: 1000;
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    font-size: 14px;
    font-weight: 500;
  `;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  // Remove after 3 seconds
  setTimeout(() => {
    notification.remove();
  }, 3000);
}