import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './WorldMap.css';
import './AIEnhancedMap.css';
import { getCountryFromCoordinates, getCountryFromRegion, COUNTRY_MAPPING } from './countryMapping.js';
import { analyzeSeverityWithAI } from '../../utils/aiSeverityAnalyzer.js';

// Fix for default markers in Leaflet with React
import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Create custom pin-style marker icons for different severity levels
const createSeverityIcon = (severity, isGlobal = false) => {
  if (isGlobal) {
    const config = {
      critical: { color: '#dc2626', symbol: '🌍' },
      major: { color: '#ea580c', symbol: '🌍' },
      minor: { color: '#d97706', symbol: '🌍' }
    };
    const { color, symbol } = config[severity] || { color: '#6b7280', symbol: '🌍' };
    return L.divIcon({
      html: `<div class="global-pin-marker" style="
        width: 32px;
        height: 32px;
        background: radial-gradient(circle, ${color}, ${color}88);
        border-radius: 50%;
        border: 4px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.4), 0 0 20px ${color}44;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        color: white;
      ">
        ${symbol}
      </div>`,
      className: 'custom-severity-icon',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });
  } else {
    const config = {
      critical: { url: '/icons/marker-critical.svg', size: [40, 40], anchor: [20, 40] },
      major: { url: '/icons/marker-major.svg', size: [32, 32], anchor: [16, 32] },
      minor: { url: '/icons/marker-minor.svg', size: [24, 24], anchor: [12, 24] },
      default: { url: '/icons/marker-default.svg', size: [28, 28], anchor: [14, 28] },
    };
    const { url, size, anchor } = config[severity] || config.default;
    return L.icon({
      iconUrl: url,
      iconSize: size,
      iconAnchor: anchor,
      popupAnchor: [0, -anchor[1]],
    });
  }
};

// PERFORMANCE OPTIMIZATION: Move constants and databases outside component
// Enhanced geographical location database with extensive city coverage
const GEOGRAPHICAL_DATABASE = {
  cities: {
    // Major US Cities
    'new york': { lat: 40.7128, lng: -74.0060, region: 'New York, USA' },
    'nyc': { lat: 40.7128, lng: -74.0060, region: 'New York, USA' },
    'manhattan': { lat: 40.7831, lng: -73.9712, region: 'Manhattan, NY' },
    'san francisco': { lat: 37.7749, lng: -122.4194, region: 'San Francisco, USA' },
    'san jose': { lat: 37.3382, lng: -121.8863, region: 'San Jose, USA' },
    'los angeles': { lat: 34.0522, lng: -118.2437, region: 'Los Angeles, USA' },
    'chicago': { lat: 41.8781, lng: -87.6298, region: 'Chicago, USA' },
    'houston': { lat: 29.7604, lng: -95.3698, region: 'Houston, USA' },
    'phoenix': { lat: 33.4484, lng: -112.0740, region: 'Phoenix, USA' },
    'philadelphia': { lat: 39.9526, lng: -75.1652, region: 'Philadelphia, USA' },
    'san antonio': { lat: 29.4241, lng: -98.4936, region: 'San Antonio, USA' },
    'san diego': { lat: 32.7157, lng: -117.1611, region: 'San Diego, USA' },
    'dallas': { lat: 32.7767, lng: -96.7970, region: 'Dallas, USA' },
    'austin': { lat: 30.2672, lng: -97.7431, region: 'Austin, USA' },
    'fort worth': { lat: 32.7555, lng: -97.3308, region: 'Fort Worth, USA' },
    'columbus': { lat: 39.9612, lng: -82.9988, region: 'Columbus, USA' },
    'charlotte': { lat: 35.2271, lng: -80.8431, region: 'Charlotte, USA' },
    'indianapolis': { lat: 39.7684, lng: -86.1581, region: 'Indianapolis, USA' },
    'seattle': { lat: 47.6062, lng: -122.3321, region: 'Seattle, USA' },
    'denver': { lat: 39.7392, lng: -104.9903, region: 'Denver, USA' },
    'boston': { lat: 42.3601, lng: -71.0589, region: 'Boston, USA' },
    'el paso': { lat: 31.7619, lng: -106.4850, region: 'El Paso, USA' },
    'detroit': { lat: 42.3314, lng: -83.0458, region: 'Detroit, USA' },
    'nashville': { lat: 36.1627, lng: -86.7816, region: 'Nashville, USA' },
    'portland': { lat: 45.5152, lng: -122.6784, region: 'Portland, USA' },
    'memphis': { lat: 35.1495, lng: -90.0490, region: 'Memphis, USA' },
    'oklahoma city': { lat: 35.4676, lng: -97.5164, region: 'Oklahoma City, USA' },
    'las vegas': { lat: 36.1699, lng: -115.1398, region: 'Las Vegas, USA' },
    'louisville': { lat: 38.2527, lng: -85.7585, region: 'Louisville, USA' },
    'baltimore': { lat: 39.2904, lng: -76.6122, region: 'Baltimore, USA' },
    'milwaukee': { lat: 43.0389, lng: -87.9065, region: 'Milwaukee, USA' },
    'albuquerque': { lat: 35.0844, lng: -106.6504, region: 'Albuquerque, USA' },
    'fresno': { lat: 36.7378, lng: -119.7871, region: 'Fresno, USA' },
    'tucson': { lat: 32.2226, lng: -110.9747, region: 'Tucson, USA' },
    'sacramento': { lat: 38.5816, lng: -121.4944, region: 'Sacramento, USA' },
    'kansas city': { lat: 39.0997, lng: -94.5786, region: 'Kansas City, USA' },
    'mesa': { lat: 33.4152, lng: -111.8315, region: 'Mesa, USA' },
    'atlanta': { lat: 33.7490, lng: -84.3880, region: 'Atlanta, USA' },
    'omaha': { lat: 41.2565, lng: -95.9345, region: 'Omaha, USA' },
    'colorado springs': { lat: 38.8339, lng: -104.8214, region: 'Colorado Springs, USA' },
    'raleigh': { lat: 35.7796, lng: -78.6382, region: 'Raleigh, USA' },
    'virginia beach': { lat: 36.8529, lng: -75.9780, region: 'Virginia Beach, USA' },
    'miami': { lat: 25.7617, lng: -80.1918, region: 'Miami, USA' },
    'tampa': { lat: 27.9506, lng: -82.4572, region: 'Tampa, USA' },
    'orlando': { lat: 28.5383, lng: -81.3792, region: 'Orlando, USA' },
    'pittsburgh': { lat: 40.4406, lng: -79.9959, region: 'Pittsburgh, USA' },
    'cincinnati': { lat: 39.1031, lng: -84.5120, region: 'Cincinnati, USA' },
    'cleveland': { lat: 41.4993, lng: -81.6944, region: 'Cleveland, USA' },
    // Canadian Cities
    'toronto': { lat: 43.6532, lng: -79.3832, region: 'Toronto, Canada' },
    'montreal': { lat: 45.5017, lng: -73.5673, region: 'Montreal, Canada' },
    'vancouver': { lat: 49.2827, lng: -123.1207, region: 'Vancouver, Canada' },
    'ottawa': { lat: 45.4215, lng: -75.6981, region: 'Ottawa, Canada' },
    'calgary': { lat: 51.0447, lng: -114.0719, region: 'Calgary, Canada' },
    'edmonton': { lat: 53.5461, lng: -113.4938, region: 'Edmonton, Canada' },
    'winnipeg': { lat: 49.8951, lng: -97.1384, region: 'Winnipeg, Canada' },
    'quebec city': { lat: 46.8139, lng: -71.2080, region: 'Quebec City, Canada' },
    // European Cities
    'london': { lat: 51.5074, lng: -0.1278, region: 'London, UK' },
    'paris': { lat: 48.8566, lng: 2.3522, region: 'Paris, France' },
    'berlin': { lat: 52.5200, lng: 13.4050, region: 'Berlin, Germany' },
    'madrid': { lat: 40.4168, lng: -3.7038, region: 'Madrid, Spain' },
    'rome': { lat: 41.9028, lng: 12.4964, region: 'Rome, Italy' },
    'barcelona': { lat: 41.3851, lng: 2.1734, region: 'Barcelona, Spain' },
    'munich': { lat: 48.1351, lng: 11.5820, region: 'Munich, Germany' },
    'milan': { lat: 45.4642, lng: 9.1900, region: 'Milan, Italy' },
    'amsterdam': { lat: 52.3676, lng: 4.9041, region: 'Amsterdam, Netherlands' },
    'brussels': { lat: 50.8503, lng: 4.3517, region: 'Brussels, Belgium' },
    'vienna': { lat: 48.2082, lng: 16.3738, region: 'Vienna, Austria' },
    'zurich': { lat: 47.3769, lng: 8.5417, region: 'Zurich, Switzerland' },
    'frankfurt': { lat: 50.1109, lng: 8.6821, region: 'Frankfurt, Germany' },
    'dublin': { lat: 53.3498, lng: -6.2603, region: 'Dublin, Ireland' },
    'stockholm': { lat: 59.3293, lng: 18.0686, region: 'Stockholm, Sweden' },
    'oslo': { lat: 59.9139, lng: 10.7522, region: 'Oslo, Norway' },
    'copenhagen': { lat: 55.6761, lng: 12.5683, region: 'Copenhagen, Denmark' },
    'helsinki': { lat: 60.1699, lng: 24.9384, region: 'Helsinki, Finland' },
    'warsaw': { lat: 52.2297, lng: 21.0122, region: 'Warsaw, Poland' },
    'prague': { lat: 50.0755, lng: 14.4378, region: 'Prague, Czech Republic' },
    'budapest': { lat: 47.4979, lng: 19.0402, region: 'Budapest, Hungary' },
    'bucharest': { lat: 44.4268, lng: 26.1025, region: 'Bucharest, Romania' },
    'athens': { lat: 37.9838, lng: 23.7275, region: 'Athens, Greece' },
    'lisbon': { lat: 38.7223, lng: -9.1393, region: 'Lisbon, Portugal' },
    'manchester': { lat: 53.4808, lng: -2.2426, region: 'Manchester, UK' },
    'birmingham': { lat: 52.4862, lng: -1.8904, region: 'Birmingham, UK' },
    'glasgow': { lat: 55.8642, lng: -4.2518, region: 'Glasgow, UK' },
    'edinburgh': { lat: 55.9533, lng: -3.1883, region: 'Edinburgh, UK' },
    // Asian Cities
    'tokyo': { lat: 35.6762, lng: 139.6503, region: 'Tokyo, Japan' },
    'osaka': { lat: 34.6937, lng: 135.5023, region: 'Osaka, Japan' },
    'seoul': { lat: 37.5665, lng: 126.9780, region: 'Seoul, South Korea' },
    'beijing': { lat: 39.9042, lng: 116.4074, region: 'Beijing, China' },
    'shanghai': { lat: 31.2304, lng: 121.4737, region: 'Shanghai, China' },
    'guangzhou': { lat: 23.1291, lng: 113.2644, region: 'Guangzhou, China' },
    'shenzhen': { lat: 22.5431, lng: 114.0579, region: 'Shenzhen, China' },
    'hong kong': { lat: 22.3193, lng: 114.1694, region: 'Hong Kong' },
    'singapore': { lat: 1.3521, lng: 103.8198, region: 'Singapore' },
    'bangkok': { lat: 13.7563, lng: 100.5018, region: 'Bangkok, Thailand' },
    'jakarta': { lat: -6.2088, lng: 106.8456, region: 'Jakarta, Indonesia' },
    'kuala lumpur': { lat: 3.1390, lng: 101.6869, region: 'Kuala Lumpur, Malaysia' },
    'manila': { lat: 14.5995, lng: 120.9842, region: 'Manila, Philippines' },
    'ho chi minh city': { lat: 10.8231, lng: 106.6297, region: 'Ho Chi Minh City, Vietnam' },
    'mumbai': { lat: 19.0760, lng: 72.8777, region: 'Mumbai, India' },
    'delhi': { lat: 28.7041, lng: 77.1025, region: 'Delhi, India' },
    'bangalore': { lat: 12.9716, lng: 77.5946, region: 'Bangalore, India' },
    'hyderabad': { lat: 17.3850, lng: 78.4867, region: 'Hyderabad, India' },
    'chennai': { lat: 13.0827, lng: 80.2707, region: 'Chennai, India' },
    'kolkata': { lat: 22.5726, lng: 88.3639, region: 'Kolkata, India' },
    'pune': { lat: 18.5204, lng: 73.8567, region: 'Pune, India' },
    'ahmedabad': { lat: 23.0225, lng: 72.5714, region: 'Ahmedabad, India' },
    // Australian & Oceania Cities
    'sydney': { lat: -33.8688, lng: 151.2093, region: 'Sydney, Australia' },
    'melbourne': { lat: -37.8136, lng: 144.9631, region: 'Melbourne, Australia' },
    'brisbane': { lat: -27.4698, lng: 153.0251, region: 'Brisbane, Australia' },
    'perth': { lat: -31.9505, lng: 115.8605, region: 'Perth, Australia' },
    'adelaide': { lat: -34.9285, lng: 138.6007, region: 'Adelaide, Australia' },
    'auckland': { lat: -36.8485, lng: 174.7633, region: 'Auckland, New Zealand' },
    'wellington': { lat: -41.2865, lng: 174.7762, region: 'Wellington, New Zealand' },
    // South American Cities
    'sao paulo': { lat: -23.5505, lng: -46.6333, region: 'São Paulo, Brazil' },
    'rio de janeiro': { lat: -22.9068, lng: -43.1729, region: 'Rio de Janeiro, Brazil' },
    'buenos aires': { lat: -34.6118, lng: -58.3960, region: 'Buenos Aires, Argentina' },
    'lima': { lat: -12.0464, lng: -77.0428, region: 'Lima, Peru' },
    'bogota': { lat: 4.7110, lng: -74.0721, region: 'Bogotá, Colombia' },
    'santiago': { lat: -33.4489, lng: -70.6693, region: 'Santiago, Chile' },
    'caracas': { lat: 10.4806, lng: -66.9036, region: 'Caracas, Venezuela' },
    'montevideo': { lat: -34.9011, lng: -56.1645, region: 'Montevideo, Uruguay' },
    // African Cities
    'cairo': { lat: 30.0444, lng: 31.2357, region: 'Cairo, Egypt' },
    'lagos': { lat: 6.5244, lng: 3.3792, region: 'Lagos, Nigeria' },
    'nairobi': { lat: -1.2921, lng: 36.8219, region: 'Nairobi, Kenya' },
    'cape town': { lat: -33.9249, lng: 18.4241, region: 'Cape Town, South Africa' },
    'johannesburg': { lat: -26.2041, lng: 28.0473, region: 'Johannesburg, South Africa' },
    'casablanca': { lat: 33.5731, lng: -7.5898, region: 'Casablanca, Morocco' },
    'tunis': { lat: 36.8065, lng: 10.1815, region: 'Tunis, Tunisia' },
    'addis ababa': { lat: 9.1450, lng: 38.7451, region: 'Addis Ababa, Ethiopia' },
    'algiers': { lat: 36.7378, lng: 3.0875, region: 'Algiers, Algeria' },
    // Middle Eastern Cities
    'istanbul': { lat: 41.0082, lng: 28.9784, region: 'Istanbul, Turkey' },
    'dubai': { lat: 25.2048, lng: 55.2708, region: 'Dubai, UAE' },
    'riyadh': { lat: 24.7136, lng: 46.6753, region: 'Riyadh, Saudi Arabia' },
    'tel aviv': { lat: 32.0853, lng: 34.7818, region: 'Tel Aviv, Israel' },
    'jerusalem': { lat: 31.7683, lng: 35.2137, region: 'Jerusalem, Israel' },
    'tehran': { lat: 35.6892, lng: 51.3890, region: 'Tehran, Iran' },
    'baghdad': { lat: 33.3152, lng: 44.3661, region: 'Baghdad, Iraq' },
    'kuwait city': { lat: 29.3759, lng: 47.9774, region: 'Kuwait City, Kuwait' },
    'doha': { lat: 25.2854, lng: 51.5310, region: 'Doha, Qatar' },
    'abu dhabi': { lat: 24.2539, lng: 54.3773, region: 'Abu Dhabi, UAE' },
    'manama': { lat: 26.0667, lng: 50.5577, region: 'Manama, Bahrain' },
    'muscat': { lat: 23.5859, lng: 58.4059, region: 'Muscat, Oman' },
    'ankara': { lat: 39.9334, lng: 32.8597, region: 'Ankara, Turkey' },
    // Russian Cities
    'moscow': { lat: 55.7558, lng: 37.6176, region: 'Moscow, Russia' },
    'saint petersburg': { lat: 59.9311, lng: 30.3609, region: 'Saint Petersburg, Russia' },
    'novosibirsk': { lat: 55.0084, lng: 82.9357, region: 'Novosibirsk, Russia' },
    'yekaterinburg': { lat: 56.8431, lng: 60.6454, region: 'Yekaterinburg, Russia' },
    'nizhny novgorod': { lat: 56.2965, lng: 43.9361, region: 'Nizhny Novgorod, Russia' },
    // Mexican Cities
    'mexico city': { lat: 19.4326, lng: -99.1332, region: 'Mexico City, Mexico' },
    'guadalajara': { lat: 20.6597, lng: -103.3496, region: 'Guadalajara, Mexico' },
    'monterrey': { lat: 25.6866, lng: -100.3161, region: 'Monterrey, Mexico' },
    'puebla': { lat: 19.0414, lng: -98.2063, region: 'Puebla, Mexico' },
    'tijuana': { lat: 32.5149, lng: -117.0382, region: 'Tijuana, Mexico' },
    'cancun': { lat: 21.1619, lng: -86.8515, region: 'Cancún, Mexico' }
  },
  cloudRegions: {
    'us-east-1': { lat: 39.0458, lng: -76.6413, region: 'US East (N. Virginia)' },
    'us-east-2': { lat: 39.9612, lng: -82.9988, region: 'US East (Ohio)' },
    'us-west-1': { lat: 37.7749, lng: -122.4194, region: 'US West (N. California)' },
    'us-west-2': { lat: 45.5152, lng: -122.6784, region: 'US West (Oregon)' },
    'eu-west-1': { lat: 53.3498, lng: -6.2603, region: 'Europe (Ireland)' },
    'eu-west-2': { lat: 51.5074, lng: -0.1278, region: 'Europe (London)' },
    'eu-west-3': { lat: 48.8566, lng: 2.3522, region: 'Europe (Paris)' },
    'eu-central-1': { lat: 50.1109, lng: 8.6821, region: 'Europe (Frankfurt)' },
    'eu-north-1': { lat: 59.3293, lng: 18.0686, region: 'Europe (Stockholm)' },
    'ap-southeast-1': { lat: 1.3521, lng: 103.8198, region: 'Asia Pacific (Singapore)' },
    'ap-southeast-2': { lat: -33.8688, lng: 151.2093, region: 'Asia Pacific (Sydney)' },
    'ap-northeast-1': { lat: 35.6762, lng: 139.6503, region: 'Asia Pacific (Tokyo)' },
    'ap-northeast-2': { lat: 37.5665, lng: 126.9780, region: 'Asia Pacific (Seoul)' },
    'ap-south-1': { lat: 19.0760, lng: 72.8777, region: 'Asia Pacific (Mumbai)' },
    'sa-east-1': { lat: -23.5505, lng: -46.6333, region: 'South America (São Paulo)' },
    'ca-central-1': { lat: 43.6532, lng: -79.3832, region: 'Canada (Central)' },
    'af-south-1': { lat: -33.9249, lng: 18.4241, region: 'Africa (Cape Town)' },
    'me-south-1': { lat: 26.0667, lng: 50.5577, region: 'Middle East (Bahrain)' }
  }
};  
    // Pre-compiled regex patterns
const SEVERITY_PATTERNS = {
  critical: /\b(critical|emergency|outage|down|offline|complete failure|total)\b/i,
  major: /\b(major|significant|degraded|disruption|partial|slow|performance)\b/i,
  minor: /\b(minor|warning|notice|caution|advisory|informational)\b/i,
  info: /\b(info|information|note|update|alert)\b/i,
  debug: /\b(debug|debugging|diagnostic|trace)\b/i
};

const RESOLVED_KEYWORDS = ['resolved', 'closed', 'completed', 'fixed', 'restored', 'resolved at'];

const isRelevant = (issue, date, showHistoric) => {
  try {
    let issueDate;
    // Handle different date formats
    if (typeof date === 'string') {
      // Handle DD/MM/YYYY, HH:MM:SS format
      if (date.match(/^\d{2}\/\d{2}\/\d{4}/)) {
        const [datePart, timePart] = date.split(', ');
        const [day, month, year] = datePart.split('/').map(Number);
        const [hour, minute, second] = timePart ? timePart.split(':').map(Number) : [0,0,0];
        issueDate = new Date(year, month - 1, day, hour, minute, second);
      } else {
        // Try standard JS date parsing (RFC 2822, ISO 8601, etc.)
        issueDate = new Date(date);
      }
    } else {
      issueDate = new Date(date);
    }
    if (isNaN(issueDate)) {
      console.log('Invalid date for issue:', {
        issue: issue.title || issue.name || JSON.stringify(issue),
        date: typeof date === 'object' ? JSON.stringify(date) : date,
        dateType: typeof date
      });
      return false;
    }
    if (showHistoric) {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const isWithinRange = issueDate >= sevenDaysAgo;
      return isWithinRange;
    } else {
      const text = `${issue.title || issue.name || ''} ${issue.description || ''}`.toLowerCase();
      const hasResolvedKeyword = RESOLVED_KEYWORDS.some(keyword => text.includes(keyword));
      return !hasResolvedKeyword;
    }
  } catch (e) {
    console.log('Error in isRelevant:', e, {
      issue: issue.title || issue.name || JSON.stringify(issue),
      date: typeof date === 'object' ? JSON.stringify(date) : date
    });
    return false;
  }
};

const LeafletWorldMap = (props) => {
  // Example center and zoom, adjust as needed
  const center = [20, 0];
  const zoom = 2;

  return (
    <MapContainer center={center} zoom={zoom} style={{ height: '100vh', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />
      {/* Add your Marker, Popup, and other map logic here */}
    </MapContainer>
  );
};

export default LeafletWorldMap;