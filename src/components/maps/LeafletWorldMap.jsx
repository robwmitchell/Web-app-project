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

// Create custom marker icons for different severity levels
const createSeverityIcon = (severity) => {
  const colors = {
    critical: '#dc2626',
    major: '#ea580c', 
    minor: '#d97706'
  };
  
  const color = colors[severity] || '#6b7280';
  
  return L.divIcon({
    html: `<div style="
      background-color: ${color};
      width: 16px;
      height: 16px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    "></div>`,
    className: 'custom-marker-icon',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10]
  });
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
    'ottawa': { lat: 45.4215, lng: -75.7981, region: 'Ottawa, Canada' },
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
    'chennai ii': { lat: 13.0827, lng: 80.2707, region: 'Chennai, India' },
    'maa2': { lat: 13.0827, lng: 80.2707, region: 'Chennai (MAA2), India' },
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
    'cancun': { lat: 21.1619, lng: -86.8515, region: 'Cancún, Mexico' },
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
  major: /\b(major|significant|degraded|disruption|partial|slow|performance)\b/i
};

const RESOLVED_KEYWORDS = ['resolved', 'closed', 'completed', 'fixed', 'restored', 'resolved at'];

// Helper functions
const cleanHtmlContent = (htmlString) => {
  if (!htmlString) return '';
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlString;
  let text = tempDiv.textContent || tempDiv.innerText || '';
  return text.replace(/\s+/g, ' ').replace(/\n+/g, ' ').trim();
};

// AI-powered severity determination
const getSeverityWithAI = (issue, serviceName) => {
  const aiAnalysis = analyzeSeverityWithAI(issue, {
    service: serviceName,
    timestamp: new Date(issue.date || issue.created_at || Date.now())
  });
  
  // Return both the severity and the AI analysis for debugging/display
  return {
    severity: aiAnalysis.severity,
    confidence: aiAnalysis.confidence,
    reasoning: aiAnalysis.reasoning,
    factors: aiAnalysis.factors
  };
};

const isRelevant = (issue, date, showHistoric) => {
  try {
    const issueDate = new Date(date);
    if (isNaN(issueDate)) {
      console.log(`❌ Invalid date for issue:`, date);
      return false;
    }
    
    if (showHistoric) {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const isWithinRange = issueDate >= sevenDaysAgo;
      console.log(`📅 Historic check (7 days):`, { 
        issueDate: issueDate.toISOString().split('T')[0], 
        sevenDaysAgo: sevenDaysAgo.toISOString().split('T')[0], 
        isWithinRange,
        title: (issue.title || issue.name || '').substring(0, 50)
      });
      return isWithinRange;
    } else {
      const text = `${issue.title || issue.name || ''} ${issue.description || ''}`.toLowerCase();
      const hasResolvedKeyword = RESOLVED_KEYWORDS.some(keyword => text.includes(keyword));
      console.log(`🔍 Live check:`, { 
        title: (issue.title || issue.name || '').substring(0, 50), 
        hasResolvedKeyword, 
        matchedKeyword: RESOLVED_KEYWORDS.find(keyword => text.includes(keyword))
      });
      return !hasResolvedKeyword;
    }
  } catch (e) {
    console.log(`❌ Error in isRelevant:`, e);
    return false;
  }
};

const formatTitle = (title) => {
  if (!title) return 'Service Issue';
  const cleaned = cleanHtmlContent(title);
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
};

const formatDescription = (description, maxLength = 200) => {
  if (!description) return '';
  const cleaned = cleanHtmlContent(description);
  if (cleaned.length <= maxLength) return cleaned;
  const truncated = cleaned.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  return lastSpace > 0 ? truncated.substring(0, lastSpace) + '...' : truncated + '...';
};

// Enhanced coordinate detection with intelligent text parsing
const getCoordinates = (text, provider) => {
  const textLower = cleanHtmlContent(text).toLowerCase();
  const foundLocations = [];
  
  // Improved location extraction patterns for common service update formats
  const locationPatterns = [
    // Datacenter format: "Chennai II (MAA2)" or "Region, City"
    /([a-z\s\-]{2,25})\s+(?:ii|iii|iv|i)\s*\(([a-z0-9]{2,6})\)/gi,
    // Affected Datacenters/Regions format
    /(?:affected.*?regions?:|affecting.*?regions?:)\s*([a-z\s,\-]{5,50})/gi,
    // City (CODE) format
    /([a-z\s\-]{3,25})\s*\(([a-z0-9]{2,6})\)/gi,
    // Direct city mentions with context
    /(?:in|at|from|affecting)\s+([a-z\s\-]{2,25})(?:\s+(?:region|area|datacenter|data center|dc|zone|customers|users|clients)|,|\.|$)/gi,
    // City experiencing issues
    /([a-z\s\-]{2,25})\s+(?:is\s+|are\s+)?(?:experiencing|having|reporting|down|offline|degraded|affected|unavailable)(?:\s|,|\.|\(|$)/gi,
    // Geographic qualifiers  
    /([a-z\s\-]{2,25})\s+(?:region|datacenter|data center|dc|zone|pop|facility|area|office)(?:\s|,|\.|\(|$)/gi,
    // Service patterns
    /(?:outage|issue|problem|down|offline|disruption)\s+(?:in|at|affecting)\s+([a-z\s\-]{2,25})(?:\s|,|\.|\(|$)/gi,
    // User/customer patterns
    /(?:customers|users|clients|subscribers)\s+(?:in|at|from|located)\s+([a-z\s\-]{2,25})(?:\s|,|\.|\(|$)/gi,
    // Parenthetical mentions
    /\(([a-z\s,\-]{3,35})\)/gi,
    // Cloud regions
    /((?:us|eu|ap|ca|sa|me|af)[\-_](?:east|west|north|south|central|southeast|northeast|southwest|northwest)[\-_]?\d*)/gi,
    // Airport codes (for Cloudflare)
    /\b([a-z]{3})\s+(?:airport|pop|edge|location)/gi,
    // Geographic descriptors
    /(?:detected|identified|reported)\s+(?:in|at|from)\s+([a-z\s\-]{2,25})(?:\s|,|\.|\(|$)/gi
  ];
  
  // Extract potential locations using improved patterns
  const extractedTerms = new Set();
  
  locationPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(textLower)) !== null) {
      for (let i = 1; i < match.length; i++) {
        if (match[i]) {
          let term = match[i].trim().replace(/[,\.\(\)]/g, '').replace(/\s+/g, ' ');
          // Filter terms that are likely to be city names
          if (term.length >= 2 && term.length <= 30 && !term.match(/^\d+$/)) {
            // Skip common non-location words
            const skipWords = ['service', 'issue', 'problem', 'outage', 'down', 'offline', 'customers', 'users', 'clients', 'experiencing', 'affecting', 'system', 'network', 'server', 'database', 'website', 'application', 'connectivity', 'performance', 'response', 'timeout', 'error', 'failure', 'maintenance'];
            if (!skipWords.some(word => term.includes(word))) {
              extractedTerms.add(term);
            }
          }
        }
      }
    }
  });
  
  // Also extract individual city names from the text
  const words = textLower.replace(/[^\w\s\-]/g, ' ').split(/\s+/);
  const potentialCities = new Set();
  
  // Check single words and common multi-word city combinations
  for (let i = 0; i < words.length; i++) {
    if (words[i] && words[i].length >= 3) {
      potentialCities.add(words[i]);
    }
    
    // Two-word combinations (like "new york", "san francisco")
    if (i < words.length - 1 && words[i] && words[i + 1]) {
      const twoWord = `${words[i]} ${words[i + 1]}`;
      if (twoWord.length >= 4 && twoWord.length <= 25) {
        potentialCities.add(twoWord);
      }
    }
    
    // Three-word combinations (like "new york city")
    if (i < words.length - 2 && words[i] && words[i + 1] && words[i + 2]) {
      const threeWord = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
      if (threeWord.length >= 6 && threeWord.length <= 35) {
        potentialCities.add(threeWord);
      }
    }
  }
  
  // Combine extracted terms with potential cities
  const allTerms = new Set([...extractedTerms, ...potentialCities]);
  
  // Priority 1: Cloud regions (exact matches)
  for (const [region, coords] of Object.entries(GEOGRAPHICAL_DATABASE.cloudRegions)) {
    if (textLower.includes(region.toLowerCase()) || allTerms.has(region.toLowerCase())) {
      foundLocations.push({ 
        lat: coords.lat, 
        lng: coords.lng, 
        region: coords.region, 
        confidence: 'high',
        source: 'cloud-region'
      });
    }
  }
  
  // Priority 2: Exact city matches from database
  for (const [city, coords] of Object.entries(GEOGRAPHICAL_DATABASE.cities)) {
    if (textLower.includes(city) || allTerms.has(city)) {
      foundLocations.push({ 
        lat: coords.lat, 
        lng: coords.lng, 
        region: coords.region, 
        confidence: 'high',
        source: 'exact-city'
      });
    }
  }
  
  // Priority 2.5: Datacenter codes and regional specifications
  const datacenterCodes = {
    'maa2': { lat: 13.0827, lng: 80.2707, region: 'Chennai (MAA2), India' },
    'maa1': { lat: 13.0827, lng: 80.2707, region: 'Chennai (MAA1), India' },
    'bom1': { lat: 19.0760, lng: 72.8777, region: 'Mumbai (BOM1), India' },
    'del1': { lat: 28.7041, lng: 77.1025, region: 'Delhi (DEL1), India' },
    'sin1': { lat: 1.3521, lng: 103.8198, region: 'Singapore (SIN1)' },
    'hkg1': { lat: 22.3193, lng: 114.1694, region: 'Hong Kong (HKG1)' },
    'nrt1': { lat: 35.7720, lng: 140.3928, region: 'Tokyo Narita (NRT1), Japan' },
    'syd1': { lat: -33.9399, lng: 151.1753, region: 'Sydney (SYD1), Australia' }
  };
  
  // Check for datacenter codes
  for (const [code, coords] of Object.entries(datacenterCodes)) {
    if (textLower.includes(code) || allTerms.has(code)) {
      foundLocations.push({ 
        lat: coords.lat, 
        lng: coords.lng, 
        region: coords.region, 
        confidence: 'high',
        source: 'datacenter-code'
      });
    }
  }
  
  // Check for APAC region mentions and map to likely locations
  if (textLower.includes('apac') || textLower.includes('asia pacific')) {
    // If APAC is mentioned with specific cities, prioritize those
    const apacCities = ['chennai', 'mumbai', 'singapore', 'hong kong', 'tokyo', 'sydney', 'manila'];
    const foundApacCity = apacCities.find(city => textLower.includes(city));
    if (foundApacCity && GEOGRAPHICAL_DATABASE.cities[foundApacCity]) {
      const coords = GEOGRAPHICAL_DATABASE.cities[foundApacCity];
      foundLocations.push({ 
        lat: coords.lat, 
        lng: coords.lng, 
        region: coords.region, 
        confidence: 'high',
        source: 'apac-specific'
      });
    }
  }
  
  // Priority 3: Fuzzy matching on extracted terms
  const cityKeys = Object.keys(GEOGRAPHICAL_DATABASE.cities);
  allTerms.forEach(term => {
    if (term.length >= 3) {
      // Look for cities that match the term
      const matchingCities = cityKeys.filter(city => {
        return city === term || // exact match
               city.startsWith(term) || // starts with term
               (term.length >= 4 && city.includes(term)) || // contains term (if term is long enough)
               (term.length >= 5 && city.includes(term.substring(0, Math.floor(term.length * 0.8)))); // partial match
      });
      
      matchingCities.forEach(city => {
        const coords = GEOGRAPHICAL_DATABASE.cities[city];
        // Avoid duplicates based on coordinates
        if (!foundLocations.some(loc => Math.abs(loc.lat - coords.lat) < 0.1 && Math.abs(loc.lng - coords.lng) < 0.1)) {
          foundLocations.push({ 
            lat: coords.lat, 
            lng: coords.lng, 
            region: coords.region, 
            confidence: 'medium',
            source: 'fuzzy-match',
            matchedTerm: term,
            cityKey: city
          });
        }
      });
    }
  });
  
  // Priority 4: Provider-specific location patterns
  if (provider === 'Cloudflare') {
    // Cloudflare often uses airport codes for their edge locations
    const airportCodes = {
      'lhr': { lat: 51.4700, lng: -0.4543, region: 'London Heathrow, UK' },
      'jfk': { lat: 40.6413, lng: -73.7781, region: 'New York JFK, USA' },
      'lax': { lat: 33.9425, lng: -118.4081, region: 'Los Angeles, USA' },
      'nrt': { lat: 35.7720, lng: 140.3928, region: 'Tokyo Narita, Japan' },
      'fra': { lat: 50.0379, lng: 8.5622, region: 'Frankfurt, Germany' },
      'sin': { lat: 1.3644, lng: 103.9915, region: 'Singapore Changi' },
      'syd': { lat: -33.9399, lng: 151.1753, region: 'Sydney, Australia' },
      'dxb': { lat: 25.2532, lng: 55.3657, region: 'Dubai, UAE' },
      'cdg': { lat: 49.0097, lng: 2.5479, region: 'Paris Charles de Gaulle, France' },
      'ams': { lat: 52.3105, lng: 4.7683, region: 'Amsterdam Schiphol, Netherlands' },
      'mad': { lat: 40.4839, lng: -3.5680, region: 'Madrid Barajas, Spain' },
      'mxp': { lat: 45.6301, lng: 8.7231, region: 'Milan Malpensa, Italy' },
    };
    
    for (const [code, coords] of Object.entries(airportCodes)) {
      if (textLower.includes(code)) {
        if (!foundLocations.some(loc => Math.abs(loc.lat - coords.lat) < 0.1 && Math.abs(loc.lng - coords.lng) < 0.1)) {
          foundLocations.push({ 
            lat: coords.lat, 
            lng: coords.lng, 
            region: coords.region, 
            confidence: 'medium',
            source: 'airport-code'
          });
        }
      }
    }
  }
  
  // Remove duplicates and sort by confidence
  const uniqueLocations = [];
  const seenCoords = new Set();
  
  foundLocations.forEach(location => {
    const coordKey = `${Math.round(location.lat * 100)}_${Math.round(location.lng * 100)}`;
    if (!seenCoords.has(coordKey)) {
      seenCoords.add(coordKey);
      uniqueLocations.push(location);
    }
  });
  
  // Sort by confidence (high > medium > low)
  uniqueLocations.sort((a, b) => {
    const confidenceOrder = { 'high': 3, 'medium': 2, 'low': 1 };
    return confidenceOrder[b.confidence] - confidenceOrder[a.confidence];
  });
  
  // Return the best matches (limit to 5 to avoid cluttering)
  if (uniqueLocations.length > 0) {
    return uniqueLocations.slice(0, 5);
  }
  
  // Final fallback
  return [{ 
    lat: 37.7749, 
    lng: -122.4194, 
    region: 'Global (No specific location detected)', 
    confidence: 'low',
    source: 'fallback'
  }];
};

// AI-powered location extraction using local inference
const extractLocationsWithAI = async (text, provider) => {
  try {
    // Create a simple cache key to avoid re-processing identical text
    const cacheKey = `${provider}-${text.slice(0, 100)}`;
    
    // Simple in-memory cache (could be expanded to localStorage)
    if (!window.locationExtractionCache) {
      window.locationExtractionCache = new Map();
    }
    
    if (window.locationExtractionCache.has(cacheKey)) {
      return window.locationExtractionCache.get(cacheKey);
    }

    // Simple prompt engineering approach for location extraction
    const prompt = `Extract geographical locations from this service update text. Return only city names, datacenter locations, or regions mentioned. Be specific and accurate.

Text: "${text}"

Extract locations as a JSON array of objects with format:
[{"location": "City Name", "confidence": "high|medium|low", "context": "brief context"}]

Focus on:
- City names (e.g., "Chennai", "New York")
- Datacenter locations (e.g., "Chennai II", "MAA2")  
- Regional indicators (e.g., "APAC", "US East")
- Airport codes if relevant to ${provider}

Ignore generic terms like "customers", "users", "service", "network".`;

    // For now, we'll use a simple AI-like pattern matching with enhanced intelligence
    // This can be replaced with actual AI API calls (OpenAI, Claude, etc.) later
    const result = await smartLocationExtraction(text, provider, prompt);
    
    // Cache the result (limit cache size to prevent memory issues)
    if (window.locationExtractionCache.size > 100) {
      const firstKey = window.locationExtractionCache.keys().next().value;
      window.locationExtractionCache.delete(firstKey);
    }
    window.locationExtractionCache.set(cacheKey, result);
    
    return result;
    
  } catch (error) {
    console.warn('AI location extraction failed, falling back to pattern matching:', error);
    return getCoordinates(text, provider);
  }
};

// Enhanced smart location extraction (simulating AI behavior)
const smartLocationExtraction = async (text, provider, prompt) => {
  // Early return for empty or very short text
  if (!text || text.trim().length < 10) {
    return getCoordinates(text, provider);
  }

  const textLower = text.toLowerCase();
  const locations = [];
  
  // AI-like contextual analysis patterns (optimized)
  const contextualPatterns = [
    // Datacenter with location format
    {
      pattern: /(?:urgent|maintenance|outage)?\s*([a-z\s]+?)\s+(?:ii|iii|i)?\s*\(([a-z0-9]{2,6})\)\s*datacenter/gi,
      confidence: 'high',
      context: 'datacenter_specification'
    },
    // Affected regions with cities
    {
      pattern: /affected.*?(?:regions?|datacenters?):\s*([^.!?]+)/gi,
      confidence: 'high',
      context: 'affected_regions_list'
    },
    // Regional context with city
    {
      pattern: /(apac|emea|americas|asia pacific|europe|north america),?\s*([a-z\s]+?)(?:\s|,|\.|\()/gi,
      confidence: 'high',
      context: 'regional_specification'
    },
    // Maintenance in location
    {
      pattern: /(?:maintenance|outage|issue)\s+(?:in|at)\s+(?:the\s+)?([a-z\s]+?)\s+(?:datacenter|dc|region|facility)/gi,
      confidence: 'high',
      context: 'maintenance_location'
    },
    // Traffic failover location
    {
      pattern: /traffic\s+will\s+failover\s+to.*?(?:in\s+)?([a-z\s]+?)(?:\s+datacenter|\s+dc|\.|,)/gi,
      confidence: 'medium',
      context: 'failover_location'
    }
  ];
  
  // Process each pattern with AI-like intelligence (limit iterations)
  contextualPatterns.forEach(({ pattern, confidence, context }) => {
    let match;
    let matchCount = 0;
    const maxMatches = 5; // Prevent excessive processing
    
    while ((match = pattern.exec(textLower)) !== null && matchCount < maxMatches) {
      matchCount++;
      for (let i = 1; i < match.length; i++) {
        if (match[i]) {
          const extracted = match[i].trim();
          if (extracted.length >= 3 && extracted.length <= 50) {
            // Clean and process the extracted location
            const cleanLocation = extracted
              .replace(/[,\.\(\)]/g, ' ')
              .replace(/\s+/g, ' ')
              .trim();
            
            if (cleanLocation && !isGenericTerm(cleanLocation)) {
              locations.push({
                location: cleanLocation,
                confidence,
                context,
                originalMatch: match[0]
              });
            }
          }
        }
      }
    }
  });
  
  // AI-like location resolution and coordinate mapping (limit processing)
  const resolvedLocations = [];
  const maxLocations = 3; // Limit to prevent excessive processing
  
  for (let i = 0; i < Math.min(locations.length, maxLocations); i++) {
    const loc = locations[i];
    try {
      const coordinates = await intelligentLocationMapping(loc.location, provider);
      if (coordinates && coordinates.length > 0) {
        coordinates.forEach(coord => {
          resolvedLocations.push({
            ...coord,
            aiConfidence: loc.confidence,
            aiContext: loc.context,
            originalMatch: loc.originalMatch,
            source: 'ai-enhanced'
          });
        });
      }
    } catch (error) {
      console.warn('Location mapping failed for:', loc.location, error);
      continue;
    }
  }
  
  // If no AI-extracted locations, fall back to enhanced pattern matching
  if (resolvedLocations.length === 0) {
    return getCoordinates(text, provider);
  }
  
  return resolvedLocations.slice(0, 3); // Limit final results
};

// Check if term is too generic to be a location
const isGenericTerm = (term) => {
  const genericTerms = [
    'service', 'network', 'system', 'server', 'database', 'website', 'application',
    'customers', 'users', 'clients', 'traffic', 'connection', 'maintenance',
    'outage', 'issue', 'problem', 'down', 'offline', 'performance', 'response',
    'hardware', 'software', 'infrastructure', 'platform', 'cloud', 'internet',
    'connectivity', 'availability', 'monitoring', 'alert', 'notification'
  ];
  
  return genericTerms.some(generic => 
    term.includes(generic) || term === generic
  );
};

// Intelligent location mapping with enhanced context awareness
const intelligentLocationMapping = async (locationText, provider) => {
  const text = locationText.toLowerCase().trim();
  const results = [];
  
  // Priority 1: Exact datacenter codes
  const datacenterCodes = {
    'maa2': { lat: 13.0827, lng: 80.2707, region: 'Chennai (MAA2), India' },
    'maa1': { lat: 13.0827, lng: 80.2707, region: 'Chennai (MAA1), India' },
    'bom1': { lat: 19.0760, lng: 72.8777, region: 'Mumbai (BOM1), India' },
    'del1': { lat: 28.7041, lng: 77.1025, region: 'Delhi (DEL1), India' },
    'sin1': { lat: 1.3521, lng: 103.8198, region: 'Singapore (SIN1)' },
    'hkg1': { lat: 22.3193, lng: 114.1694, region: 'Hong Kong (HKG1)' },
    'nrt1': { lat: 35.7720, lng: 140.3928, region: 'Tokyo Narita (NRT1), Japan' },
    'syd1': { lat: -33.9399, lng: 151.1753, region: 'Sydney (SYD1), Australia' }
  };
  
  if (datacenterCodes[text]) {
    results.push({
      ...datacenterCodes[text],
      confidence: 'high',
      source: 'datacenter-mapping'
    });
  }
  
  // Priority 2: Enhanced city matching with context awareness
  const words = text.split(' ').filter(word => word.length >= 3);
  
  for (const word of words) {
    // Check direct city matches
    if (GEOGRAPHICAL_DATABASE.cities[word]) {
      const coords = GEOGRAPHICAL_DATABASE.cities[word];
      results.push({
        lat: coords.lat,
        lng: coords.lng,
        region: coords.region,
        confidence: 'high',
        source: 'exact-city-match'
      });
    }
    
    // Check partial matches for compound city names
    const matchingCities = Object.keys(GEOGRAPHICAL_DATABASE.cities).filter(city => {
      return city.includes(word) || word.includes(city);
    });
    
    matchingCities.forEach(city => {
      const coords = GEOGRAPHICAL_DATABASE.cities[city];
      // Avoid duplicates
      if (!results.some(r => Math.abs(r.lat - coords.lat) < 0.1 && Math.abs(r.lng - coords.lng) < 0.1)) {
        results.push({
          lat: coords.lat,
          lng: coords.lng,
          region: coords.region,
          confidence: 'medium',
          source: 'partial-city-match',
          matchedCity: city
        });
      }
    });
  }
  
  // Priority 3: Regional context mapping
  if (text.includes('apac') || text.includes('asia pacific')) {
    // If specific APAC cities are mentioned, prioritize them
    const apacCities = ['chennai', 'mumbai', 'singapore', 'hong kong', 'tokyo', 'sydney', 'manila'];
    const mentionedApacCity = apacCities.find(city => text.includes(city));
    
    if (mentionedApacCity && GEOGRAPHICAL_DATABASE.cities[mentionedApacCity]) {
      const coords = GEOGRAPHICAL_DATABASE.cities[mentionedApacCity];
      results.push({
        lat: coords.lat,
        lng: coords.lng,
        region: coords.region,
        confidence: 'high',
        source: 'apac-regional-context'
      });
    }
  }
  
  // Priority 4: Cloud regions
  for (const [region, coords] of Object.entries(GEOGRAPHICAL_DATABASE.cloudRegions)) {
    if (text.includes(region.toLowerCase())) {
      results.push({
        lat: coords.lat,
        lng: coords.lng,
        region: coords.region,
        confidence: 'high',
        source: 'cloud-region'
      });
    }
  }
  
  return results.length > 0 ? results.slice(0, 3) : []; // Limit to top 3 matches
};

// Main component
export default function LeafletWorldMap({ 
  cloudflareIncidents = [], 
  zscalerUpdates = [], 
  oktaUpdates = [], 
  sendgridUpdates = [], 
  slackUpdates = [], 
  datadogUpdates = [], 
  awsUpdates = [],
  selectedServices = [],
  showHistoric = false,
  isWidget = false
}) {
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [worldGeoJSON, setWorldGeoJSON] = useState(null);

  // Load world geography data
  useEffect(() => {
    const loadWorldData = async () => {
      try {
        // Use a reliable world geography source
        const response = await fetch('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const countries = await response.json();
        setWorldGeoJSON(countries);
      } catch (error) {
        console.error('Error loading world data:', error);
        // Fallback: create a simple placeholder
        setWorldGeoJSON({
          type: "FeatureCollection",
          features: []
        });
      }
    };

    loadWorldData();
  }, []);

  // Process issues with AI-enhanced location detection
  const [processedIssues, setProcessedIssues] = useState([]);
  const [isProcessingLocations, setIsProcessingLocations] = useState(false);
  const [lastProcessedHash, setLastProcessedHash] = useState('');

  // Create a stable hash of the input data to prevent unnecessary re-processing
  const dataHash = useMemo(() => {
    // Use the selected services as is - no fallback to all services
    const servicesForHash = selectedServices?.length > 0 ? selectedServices.slice().sort() : [];
    
    const dataString = JSON.stringify({
      cloudflare: cloudflareIncidents?.length || 0,
      zscaler: zscalerUpdates?.length || 0,
      okta: oktaUpdates?.length || 0,
      sendgrid: sendgridUpdates?.length || 0,
      slack: slackUpdates?.length || 0,
      datadog: datadogUpdates?.length || 0,
      aws: awsUpdates?.length || 0,
      selectedServices: servicesForHash,
      showHistoric
    });
    return btoa(dataString).slice(0, 16); // Short hash
  }, [cloudflareIncidents?.length, zscalerUpdates?.length, oktaUpdates?.length, sendgridUpdates?.length, slackUpdates?.length, datadogUpdates?.length, awsUpdates?.length, selectedServices, showHistoric]);

  useEffect(() => {
    // Prevent unnecessary re-processing if data hasn't changed
    if (dataHash === lastProcessedHash || isProcessingLocations) {
      return;
    }

    const processIssuesWithAI = async () => {
      setIsProcessingLocations(true);
      setLastProcessedHash(dataHash);
      
      const issues = [];
      
      const services = [
        { name: 'Cloudflare', data: cloudflareIncidents, dateField: 'created_at' },
        { name: 'Zscaler', data: zscalerUpdates, dateField: 'date' },
        { name: 'Okta', data: oktaUpdates, dateField: 'date' },
        { name: 'SendGrid', data: sendgridUpdates, dateField: 'date' },
        { name: 'Slack', data: slackUpdates, dateField: 'date' },
        { name: 'Datadog', data: datadogUpdates, dateField: 'date' },
        { name: 'AWS', data: awsUpdates, dateField: 'date' }
      ];

      for (const service of services) {
        // Process services that are either: 1) No services selected (show all), or 2) Explicitly selected
        const shouldProcessService = !selectedServices?.length || selectedServices?.includes(service.name.toLowerCase());
        
        if (!shouldProcessService) continue;
        if (!Array.isArray(service.data)) continue;

        for (const [index, item] of service.data.entries()) {
          const date = item[service.dateField] || item.date || item.created_at;
          const isItemRelevant = isRelevant(item, date, showHistoric);
          
          if (!isItemRelevant) continue;

          const titleText = item.title || item.name || '';
          const descriptionText = item.description || item.body || '';
          const fullText = `${titleText} ${descriptionText}`;
          
          try {
            // Use AI-enhanced location extraction
            const coordinates = await extractLocationsWithAI(fullText, service.name);

            coordinates.forEach(coord => {
              const countryCode = getCountryFromCoordinates(coord.lat, coord.lng);
              const aiSeverityAnalysis = getSeverityWithAI(item, service.name);
              
              issues.push({
                id: `${service.name}-${index}-${coord.region}`,
                provider: service.name,
                title: formatTitle(titleText || 'Service Issue'),
                description: formatDescription(descriptionText),
                severity: aiSeverityAnalysis.severity,
                aiConfidence: aiSeverityAnalysis.confidence,
                aiReasoning: aiSeverityAnalysis.reasoning,
                aiFactors: aiSeverityAnalysis.factors,
                date: date,
                lat: coord.lat,
                lng: coord.lng,
                region: coord.region,
                countryCode: countryCode,
                confidence: coord.confidence || coord.aiConfidence || 'medium',
                aiContext: coord.aiContext,
                extractionSource: coord.source,
                url: item.html_url || item.link || item.url
              });
            });
          } catch (error) {
            console.warn(`Failed to process location for ${service.name} item ${index}:`, error);
            // Fallback to original coordinates function
            const coordinates = getCoordinates(fullText, service.name);
            coordinates.forEach(coord => {
              const countryCode = getCountryFromCoordinates(coord.lat, coord.lng);
              const aiSeverityAnalysis = getSeverityWithAI(item, service.name);
              
              issues.push({
                id: `${service.name}-${index}-${coord.region}`,
                provider: service.name,
                title: formatTitle(titleText || 'Service Issue'),
                description: formatDescription(descriptionText),
                severity: aiSeverityAnalysis.severity,
                aiConfidence: aiSeverityAnalysis.confidence,
                aiReasoning: aiSeverityAnalysis.reasoning,
                aiFactors: aiSeverityAnalysis.factors,
                date: date,
                lat: coord.lat,
                lng: coord.lng,
                region: coord.region,
                countryCode: countryCode,
                confidence: coord.confidence || 'medium',
                extractionSource: 'fallback-pattern',
                url: item.html_url || item.link || item.url
              });
            });
          }
        }
      }
      
      console.log(`📍 Processed ${issues.length} issues for markers`);
      setProcessedIssues(issues);
      setIsProcessingLocations(false);
    };

    // Add a small delay to debounce rapid changes
    const timer = setTimeout(() => {
      processIssuesWithAI();
    }, 100);

    return () => clearTimeout(timer);
  }, [dataHash, lastProcessedHash, isProcessingLocations]);

  // Clear cache when selectedServices or showHistoric changes to ensure map updates immediately
  useEffect(() => {
    console.log('🔄 Clearing cache due to change:', { selectedServices, showHistoric });
    if (selectedServices || showHistoric !== undefined) {
      setLastProcessedHash(''); // Force re-processing
      setProcessedIssues([]); // Clear current issues
    }
  }, [selectedServices, showHistoric]);

  // Group issues by country
  const countryGroups = useMemo(() => {
    const groups = {};
    
    processedIssues.forEach(issue => {
      const countryCode = issue.countryCode;
      
      if (!groups[countryCode]) {
        groups[countryCode] = {
          countryCode,
          countryName: Object.keys(COUNTRY_MAPPING).find(key => COUNTRY_MAPPING[key] === countryCode) || countryCode,
          issues: [],
          maxSeverity: 'minor'
        };
      }
      
      groups[countryCode].issues.push(issue);
      
      const severityOrder = { 'critical': 3, 'major': 2, 'minor': 1 };
      if (severityOrder[issue.severity] > severityOrder[groups[countryCode].maxSeverity]) {
        groups[countryCode].maxSeverity = issue.severity;
      }
    });
    
    return Object.values(groups);
  }, [processedIssues]);

  // Style countries based on issues  
  const getCountryStyle = useCallback((feature) => {
    // Try multiple property names for country codes and normalize them
    let countryCode = feature.properties.ISO_A3 || 
                     feature.properties.ADM0_A3 || 
                     feature.properties.iso_a3 ||
                     feature.properties.ISO3 ||
                     feature.id;
    
    // Normalize country code to match our mapping
    if (countryCode) {
      countryCode = countryCode.toUpperCase();
    }
    
    const group = countryGroups.find(g => g.countryCode === countryCode);
    
    if (!group || group.issues.length === 0) {
      return {
        fillColor: '#f0f0f0',
        weight: 1,
        opacity: 0.5,
        color: '#ccc',
        fillOpacity: 0.3
      };
    }
    
    const getSeverityColor = (severity) => {
      switch (severity) {
        case 'critical': return '#dc2626';
        case 'major': return '#ea580c';
        case 'minor': return '#d97706';
        default: return '#6b7280';
      }
    };
    
    const intensity = Math.min(group.issues.length / 5, 1);
    
    return {
      fillColor: getSeverityColor(group.maxSeverity),
      weight: 2,
      opacity: 0.8,
      color: '#ffffff',
      fillOpacity: 0.4 + (intensity * 0.4)
    };
  }, [countryGroups]);

  // Handle country interactions
  const onEachCountry = useCallback((feature, layer) => {
    // Try multiple property names for country codes and normalize them
    let countryCode = feature.properties.ISO_A3 || 
                     feature.properties.ADM0_A3 || 
                     feature.properties.iso_a3 ||
                     feature.properties.ISO3 ||
                     feature.id;
    
    // Normalize country code
    if (countryCode) {
      countryCode = countryCode.toUpperCase();
    }
    
    const group = countryGroups.find(g => g.countryCode === countryCode);
    
    if (group && group.issues.length > 0) {
      layer.on({
        mouseover: () => {
          layer.setStyle({
            weight: 3,
            color: '#ffffff',
            fillOpacity: 0.8
          });
        },
        mouseout: () => {
          layer.setStyle(getCountryStyle(feature));
        },
        click: () => {
          setSelectedCountry(group);
        }
      });
    }
  }, [countryGroups, getCountryStyle]);

  return (
    <div className={`world-map-container ${isWidget ? 'widget-mode' : ''}`}>
      {!isWidget && (
        <div className="world-map-header">
          <div className="header-content">
            <h2>Global Service Status Map</h2>
            <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)', marginBottom: '8px' }}>
              {processedIssues.length} issues • {countryGroups.length} affected regions • {selectedServices?.length || 'All'} services
            </div>
            {isProcessingLocations && (
              <div className="ai-processing-indicator">
                <div className="processing-spinner"></div>
                <span>AI-enhanced location detection in progress...</span>
              </div>
            )}
            <div className="map-legend">
              <div className="legend-item">
                <div className="legend-region affected-regions"></div>
                <span>Regions with Issues ({countryGroups.length})</span>
              </div>
              <div className="legend-item">
                <div className="legend-dot" style={{ backgroundColor: '#dc2626' }}></div>
                <span>Critical ({processedIssues.filter(i => i.severity === 'critical').length})</span>
              </div>
              <div className="legend-item">
                <div className="legend-dot" style={{ backgroundColor: '#ea580c' }}></div>
                <span>Major ({processedIssues.filter(i => i.severity === 'major').length})</span>
              </div>
              <div className="legend-item">
                <div className="legend-dot" style={{ backgroundColor: '#d97706' }}></div>
                <span>Minor ({processedIssues.filter(i => i.severity === 'minor').length})</span>
              </div>
              <div className="legend-item ai-indicator">
                <div className="legend-dot" style={{ backgroundColor: '#8b5cf6' }}></div>
                <span>AI-Enhanced ({processedIssues.filter(i => i.extractionSource === 'ai-enhanced').length})</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={`map-content-layout ${selectedCountry && isWidget ? 'widget-with-panel' : ''}`}>
        <div className="leaflet-map-wrapper">
          {isWidget && isProcessingLocations && (
            <div className="widget-ai-indicator">
              <div className="processing-spinner"></div>
              <span>AI processing locations...</span>
            </div>
          )}
          <MapContainer
            center={[20, 0]}
            zoom={2}
            style={{ height: '100%', width: '100%', borderRadius: '12px' }}
            worldCopyJump={true}
            maxBounds={[[-90, -180], [90, 180]]}
            maxBoundsViscosity={1.0}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              detectRetina={true}
            />
            
            {worldGeoJSON && (
              <GeoJSON
                key="countries"
                data={worldGeoJSON}
                style={getCountryStyle}
                onEachFeature={onEachCountry}
              />
            )}
            
            {/* Render issue markers */}
            {processedIssues.map((issue) => {
              // Validate coordinates before rendering
              const lat = parseFloat(issue.lat);
              const lng = parseFloat(issue.lng);
              
              if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
                return null;
              }
              
              return (
                <Marker
                  key={issue.id}
                  position={[lat, lng]}
                  icon={createSeverityIcon(issue.severity)}
                >
                <Popup maxWidth={300} className="issue-popup">
                  <div className="popup-content">
                    <div className="popup-header">
                      <div className="service-badge" style={{ backgroundColor: '#667eea' }}>
                        {issue.provider}
                      </div>
                      <div className={`severity-badge severity-${issue.severity}`}>
                        {issue.severity}
                      </div>
                    </div>
                    
                    <h4 className="popup-title">{issue.title}</h4>
                    
                    {issue.description && (
                      <p className="popup-description">
                        {issue.description.length > 150 
                          ? `${issue.description.substring(0, 150)}...` 
                          : issue.description}
                      </p>
                    )}
                    
                    <div className="popup-meta">
                      <div className="meta-item">
                        <strong>Location:</strong> {issue.region}
                      </div>
                      <div className="meta-item">
                        <strong>Date:</strong> {new Date(issue.date).toLocaleDateString()}
                      </div>
                      {issue.aiConfidence && (
                        <div className="meta-item ai-meta">
                          <strong>AI Severity:</strong> {issue.severity} ({issue.aiConfidence}% confidence)
                          {issue.aiReasoning && (
                            <div className="ai-reasoning">
                              <em>{issue.aiReasoning}</em>
                            </div>
                          )}
                        </div>
                      )}
                      {issue.extractionSource === 'ai-enhanced' && (
                        <div className="meta-item ai-enhanced">
                          🤖 AI-Enhanced Location Detection
                        </div>
                      )}
                    </div>
                    
                    {issue.url && (
                      <a 
                        href={issue.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="popup-link"
                      >
                        View Details ↗
                      </a>
                    )}
                  </div>
                </Popup>
              </Marker>
              );
            }).filter(Boolean)}
          </MapContainer>
        </div>

        {selectedCountry && (
          <div className={`issue-side-panel ${isWidget ? 'widget-side-panel' : ''}`}>
            <div className="side-panel-header">
              <div className="panel-title-section">
                <div className="provider-badge">
                  <strong>{selectedCountry.countryName}</strong>
                </div>
                <div 
                  className="severity-badge"
                  style={{ 
                    backgroundColor: selectedCountry.maxSeverity === 'critical' ? '#dc2626' : 
                                    selectedCountry.maxSeverity === 'major' ? '#ea580c' : '#d97706',
                    color: 'white'
                  }}
                >
                  {selectedCountry.maxSeverity}
                </div>
              </div>
              <button 
                className="close-side-panel"
                onClick={() => setSelectedCountry(null)}
                title={isWidget ? 'Close details' : 'Close side panel'}
              >
                ×
              </button>
            </div>
            
            <div className="side-panel-content">
              <div className="multiple-issues-view">
                <div className="issues-summary">
                  <h3>{isWidget ? 'Issues in' : 'Service Issues in'} {selectedCountry.countryName}</h3>
                  <p className="issues-count">{selectedCountry.issues.length} active issue{selectedCountry.issues.length !== 1 ? 's' : ''}</p>
                </div>
                
                <div className={`issues-list-panel ${isWidget ? 'widget-issues-list' : ''}`}>
                  {selectedCountry.issues.map((issue, index) => (
                    <div key={issue.id} className="issue-card">
                      <div className="issue-card-header">
                        <div className="service-info">
                          <div className="service-badge" style={{ backgroundColor: '#667eea' }}>
                            {issue.provider}
                          </div>
                          <div className={`severity-badge severity-${issue.severity}`}>
                            {issue.severity}
                          </div>
                        </div>
                        <div className="issue-time">
                          {new Date(issue.date).toLocaleDateString()}
                        </div>
                      </div>
                      
                      <div className="issue-card-content">
                        <h4 className="issue-card-title">{issue.title}</h4>
                        {issue.description && (
                          <p className="issue-card-description">
                            {issue.description}
                          </p>
                        )}
                        
                        <div className="issue-card-meta">
                          {issue.region && (
                            <span className="meta-region">Region: {issue.region}</span>
                          )}
                          {issue.extractionSource === 'ai-enhanced' && (
                            <span className="meta-ai-enhanced">
                              🤖 AI-Enhanced Location Detection
                              {issue.aiContext && (
                                <span className="ai-context-tooltip">
                                  Context: {issue.aiContext.replace(/_/g, ' ')}
                                </span>
                              )}
                            </span>
                          )}
                          {issue.aiConfidence && (
                            <span 
                              className="meta-ai-severity" 
                              data-severity={issue.severity}
                            >
                              🧠 AI Severity: {issue.severity.toUpperCase()} ({issue.aiConfidence}% confidence)
                              {issue.aiReasoning && (
                                <span className="ai-reasoning-tooltip">
                                  Reasoning: {issue.aiReasoning}
                                </span>
                              )}
                            </span>
                          )}
                          {issue.confidence && (
                            <span className={`meta-confidence confidence-${issue.confidence}`}>
                              Location Confidence: {issue.confidence}
                            </span>
                          )}
                        </div>
                        
                        {issue.url && (
                          <a 
                            href={issue.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="issue-card-link"
                          >
                            View Details ↗
                          </a>
                        )}
                      </div>
                      
                      {index < selectedCountry.issues.length - 1 && (
                        <hr className="issue-card-divider" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
