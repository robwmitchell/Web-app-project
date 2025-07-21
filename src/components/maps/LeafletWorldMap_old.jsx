import React, { useState, useMemo, useEffect, useCallback, memo } from 'react';
import { MapContainer, TileLayer, GeoJSON, Popup, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './WorldMap.css';
import { getCountryFromCoordinates, getCountryFromRegion, COUNTRY_MAPPING } from './countryMapping.js';

// Fix for default markers in Leaflet with React
import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// PERFORMANCE OPTIMIZATION: Move constants and databases outside component
// Enhanced geographical location database - moved outside for performance
const GEOGRAPHICAL_DATABASE = {
  cities: {
    'new york': { lat: 40.7128, lng: -74.0060, region: 'New York, USA' },
    'nyc': { lat: 40.7128, lng: -74.0060, region: 'New York, USA' },
    'manhattan': { lat: 40.7831, lng: -73.9712, region: 'Manhattan, NY' },
    'san francisco': { lat: 37.7749, lng: -122.4194, region: 'San Francisco, USA' },
    'los angeles': { lat: 34.0522, lng: -118.2437, region: 'Los Angeles, USA' },
    'chicago': { lat: 41.8781, lng: -87.6298, region: 'Chicago, USA' },
    'london': { lat: 51.5074, lng: -0.1278, region: 'London, UK' },
    'paris': { lat: 48.8566, lng: 2.3522, region: 'Paris, France' },
    'tokyo': { lat: 35.6762, lng: 139.6503, region: 'Tokyo, Japan' },
    'sydney': { lat: -33.8688, lng: 151.2093, region: 'Sydney, Australia' },
    'singapore': { lat: 1.3521, lng: 103.8198, region: 'Singapore' },
    'mumbai': { lat: 19.0760, lng: 72.8777, region: 'Mumbai, India' },
    'bangalore': { lat: 12.9716, lng: 77.5946, region: 'Bangalore, India' },
    'sao paulo': { lat: -23.5505, lng: -46.6333, region: 'São Paulo, Brazil' },
    'toronto': { lat: 43.6532, lng: -79.3832, region: 'Toronto, Canada' },
    'amsterdam': { lat: 52.3676, lng: 4.9041, region: 'Amsterdam, Netherlands' },
    'frankfurt': { lat: 50.1109, lng: 8.6821, region: 'Frankfurt, Germany' },
    'dublin': { lat: 53.3498, lng: -6.2603, region: 'Dublin, Ireland' },
    'stockholm': { lat: 59.3293, lng: 18.0686, region: 'Stockholm, Sweden' },
    'seoul': { lat: 37.5665, lng: 126.9780, region: 'Seoul, South Korea' },
    'hong kong': { lat: 22.3193, lng: 114.1694, region: 'Hong Kong' },
    'cape town': { lat: -33.9249, lng: 18.4241, region: 'Cape Town, South Africa' },
    'cairo': { lat: 30.0444, lng: 31.2357, region: 'Cairo, Egypt' },
    'istanbul': { lat: 41.0082, lng: 28.9784, region: 'Istanbul, Turkey' },
    'moscow': { lat: 55.7558, lng: 37.6176, region: 'Moscow, Russia' },
    'beijing': { lat: 39.9042, lng: 116.4074, region: 'Beijing, China' },
    'shanghai': { lat: 31.2304, lng: 121.4737, region: 'Shanghai, China' },
    'mexico city': { lat: 19.4326, lng: -99.1332, region: 'Mexico City, Mexico' },
    'buenos aires': { lat: -34.6118, lng: -58.3960, region: 'Buenos Aires, Argentina' },
    'lima': { lat: -12.0464, lng: -77.0428, region: 'Lima, Peru' },
    'lagos': { lat: 6.5244, lng: 3.3792, region: 'Lagos, Nigeria' },
    'nairobi': { lat: -1.2921, lng: 36.8219, region: 'Nairobi, Kenya' },
  },
  regions: {
    'united states': { lat: 39.8283, lng: -98.5795, region: 'United States' },
    'usa': { lat: 39.8283, lng: -98.5795, region: 'United States' },
    'canada': { lat: 56.1304, lng: -106.3468, region: 'Canada' },
    'united kingdom': { lat: 55.3781, lng: -3.4360, region: 'United Kingdom' },
    'uk': { lat: 55.3781, lng: -3.4360, region: 'United Kingdom' },
    'germany': { lat: 51.1657, lng: 10.4515, region: 'Germany' },
    'france': { lat: 46.2276, lng: 2.2137, region: 'France' },
    'italy': { lat: 41.8719, lng: 12.5674, region: 'Italy' },
    'spain': { lat: 40.4637, lng: -3.7492, region: 'Spain' },
    'netherlands': { lat: 52.1326, lng: 5.2913, region: 'Netherlands' },
    'sweden': { lat: 60.1282, lng: 18.6435, region: 'Sweden' },
    'norway': { lat: 60.4720, lng: 8.4689, region: 'Norway' },
    'japan': { lat: 36.2048, lng: 138.2529, region: 'Japan' },
    'south korea': { lat: 35.9078, lng: 127.7669, region: 'South Korea' },
    'china': { lat: 35.8617, lng: 104.1954, region: 'China' },
    'india': { lat: 20.5937, lng: 78.9629, region: 'India' },
    'australia': { lat: -25.2744, lng: 133.7751, region: 'Australia' },
    'brazil': { lat: -14.2350, lng: -51.9253, region: 'Brazil' },
    'south africa': { lat: -30.5595, lng: 22.9375, region: 'South Africa' },
    'russia': { lat: 61.5240, lng: 105.3188, region: 'Russia' },
    'mexico': { lat: 23.6345, lng: -102.5528, region: 'Mexico' },
    'argentina': { lat: -38.4161, lng: -63.6167, region: 'Argentina' },
    'chile': { lat: -35.6751, lng: -71.5430, region: 'Chile' },
    'peru': { lat: -9.1900, lng: -75.0152, region: 'Peru' },
    'colombia': { lat: 4.5709, lng: -74.2973, region: 'Colombia' },
    'turkey': { lat: 38.9637, lng: 35.2433, region: 'Turkey' },
    'egypt': { lat: 26.8206, lng: 30.8025, region: 'Egypt' },
    'nigeria': { lat: 9.0820, lng: 8.6753, region: 'Nigeria' },
    'kenya': { lat: -0.0236, lng: 37.9062, region: 'Kenya' },
    'ethiopia': { lat: 9.1450, lng: 40.4897, region: 'Ethiopia' }
  },
  usStates: {
    'california': { lat: 36.7783, lng: -119.4179, region: 'California, USA' },
    'texas': { lat: 31.9686, lng: -99.9018, region: 'Texas, USA' },
    'florida': { lat: 27.7663, lng: -82.6404, region: 'Florida, USA' },
    'new york state': { lat: 42.1657, lng: -74.9481, region: 'New York State, USA' },
    'illinois': { lat: 40.3363, lng: -89.0022, region: 'Illinois, USA' },
    'pennsylvania': { lat: 41.2033, lng: -77.1945, region: 'Pennsylvania, USA' },
    'ohio': { lat: 40.3888, lng: -82.7649, region: 'Ohio, USA' },
    'georgia': { lat: 33.0406, lng: -83.6431, region: 'Georgia, USA' },
    'north carolina': { lat: 35.5397, lng: -79.8431, region: 'North Carolina, USA' },
    'michigan': { lat: 43.3266, lng: -84.5361, region: 'Michigan, USA' },
    'virginia': { lat: 37.7693, lng: -78.2057, region: 'Virginia, USA' },
    'washington': { lat: 47.0379, lng: -121.1187, region: 'Washington, USA' },
    'oregon': { lat: 44.5672, lng: -122.1269, region: 'Oregon, USA' },
    'colorado': { lat: 39.0598, lng: -105.3111, region: 'Colorado, USA' },
    'arizona': { lat: 33.7298, lng: -111.4312, region: 'Arizona, USA' },
    'nevada': { lat: 38.3135, lng: -117.0554, region: 'Nevada, USA' },
    'utah': { lat: 40.1500, lng: -111.8947, region: 'Utah, USA' }
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

// PERFORMANCE: Pre-compiled regex patterns - moved outside component
const SEVERITY_PATTERNS = {
  critical: /\b(critical|emergency|outage|down|offline|complete failure|total)\b/i,
  major: /\b(major|significant|degraded|disruption|partial|slow|performance)\b/i
};

const RESOLVED_KEYWORDS = ['resolved', 'closed', 'completed', 'fixed', 'restored', 'resolved at'];

// PERFORMANCE: Memoized HTML cleaning function
const htmlCleanCache = new Map();
const cleanHtmlContent = (htmlString) => {
  if (!htmlString) return '';
  
  if (htmlCleanCache.has(htmlString)) {
    return htmlCleanCache.get(htmlString);
  }
  
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlString;
  
  let text = tempDiv.textContent || tempDiv.innerText || '';
  text = text
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, ' ')
    .trim();
  
  // Cache the result (limit cache size)
  if (htmlCleanCache.size > 100) {
    htmlCleanCache.clear();
  }
  htmlCleanCache.set(htmlString, text);
  
  return text;
};

// PERFORMANCE: Optimized helper functions
const getSeverity = (issue) => {
  const text = `${issue.title || issue.name || ''} ${issue.description || ''}`.toLowerCase();
  if (SEVERITY_PATTERNS.critical.test(text)) return 'critical';
  if (SEVERITY_PATTERNS.major.test(text)) return 'major';
  return 'minor';
};

const isRelevant = (issue, date, showHistoric) => {
  try {
    const issueDate = new Date(date);
    if (isNaN(issueDate)) return false;
    
    if (showHistoric) {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return issueDate >= sevenDaysAgo;
    } else {
      const text = `${issue.title || issue.name || ''} ${issue.description || ''}`.toLowerCase();
      return !RESOLVED_KEYWORDS.some(keyword => text.includes(keyword));
    }
  } catch (e) {
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

// Service locations for coordinate detection
const serviceLocations = {
  'Cloudflare': [
    { region: 'us-east-1', lat: 39.0458, lng: -76.6413, keywords: ['us-east', 'virginia', 'washington dc', 'ashburn', 'iad'] },
    { region: 'us-west-1', lat: 37.7749, lng: -122.4194, keywords: ['us-west', 'california', 'san francisco', 'sfo'] },
    { region: 'eu-west-1', lat: 53.3498, lng: -6.2603, keywords: ['eu-west', 'ireland', 'dublin', 'dub'] },
    { region: 'ap-southeast-1', lat: 1.3521, lng: 103.8198, keywords: ['ap-southeast', 'singapore', 'sin'] }
  ],
  'AWS': [
    { region: 'us-east-1', lat: 39.0458, lng: -76.6413, keywords: ['us-east-1', 'n. virginia', 'virginia', 'iad'] },
    { region: 'us-west-1', lat: 37.7749, lng: -122.4194, keywords: ['us-west-1', 'n. california', 'california'] },
    { region: 'eu-west-1', lat: 53.3498, lng: -6.2603, keywords: ['eu-west-1', 'ireland', 'dublin'] },
    { region: 'ap-southeast-1', lat: 1.3521, lng: 103.8198, keywords: ['ap-southeast-1', 'singapore'] }
  ]
};

// PERFORMANCE: Optimized coordinate detection
const coordinateCache = new Map();
const getCoordinates = (text, provider) => {
  const cacheKey = `${text}_${provider}`;
  if (coordinateCache.has(cacheKey)) {
    return coordinateCache.get(cacheKey);
  }
  
  const textLower = cleanHtmlContent(text).toLowerCase();
  const locations = serviceLocations[provider] || [];
  
  // Fast keyword matching
  for (const [region, coords] of Object.entries(GEOGRAPHICAL_DATABASE.cloudRegions)) {
    if (textLower.includes(region.toLowerCase())) {
      const result = [{ lat: coords.lat, lng: coords.lng, region: coords.region, confidence: 'high' }];
      coordinateCache.set(cacheKey, result);
      return result;
    }
  }
  
  // City matching
  for (const [city, coords] of Object.entries(GEOGRAPHICAL_DATABASE.cities)) {
    if (textLower.includes(city)) {
      const result = [{ lat: coords.lat, lng: coords.lng, region: coords.region, confidence: 'high' }];
      coordinateCache.set(cacheKey, result);
      return result;
    }
  }
  
  // Provider-specific fallback
  const result = locations.length > 0 ? [{ 
    lat: locations[0].lat, 
    lng: locations[0].lng, 
    region: locations[0].region + ' (Default)',
    confidence: 'low'
  }] : [{ 
    lat: 37.7749, 
    lng: -122.4194, 
    region: 'Global (Fallback)',
    confidence: 'low'
  }];
  
  coordinateCache.set(cacheKey, result);
  return result;
};

// Group issues by country instead of location
const groupIssuesByCountry = (issues) => {
  const countryGroups = {};
  
  for (const issue of issues) {
    // Try to get country from region text first
    let countryCode = getCountryFromRegion(issue.region || '');
    
    // Fallback to coordinates if region detection fails
    if (!countryCode || countryCode === 'USA') {
      countryCode = getCountryFromCoordinates(issue.lat, issue.lng);
    }
    
    if (!countryGroups[countryCode]) {
      countryGroups[countryCode] = {
        countryCode,
        issues: [],
        maxSeverity: 'minor',
        coordinates: [] // Store all coordinates for this country
      };
    }
    
    countryGroups[countryCode].issues.push(issue);
    countryGroups[countryCode].coordinates.push({ lat: issue.lat, lng: issue.lng });
    
    const severityOrder = { 'critical': 3, 'major': 2, 'minor': 1 };
    if (severityOrder[issue.severity] > severityOrder[countryGroups[countryCode].maxSeverity]) {
      countryGroups[countryCode].maxSeverity = issue.severity;
    }
  }
  
  return Object.values(countryGroups);
};

// Optimized function is getting too complex, let me just try a basic version first
export default function LeafletWorldMap({ 
  cloudflareIncidents = [], 
  zscalerUpdates = [], 
  oktaUpdates = [], 
  sendgridUpdates = [], 
  slackUpdates = [], 
  datadogUpdates = [], 
  awsUpdates = [],
  selectedServices = [],
  showHistoric = false
}) {
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [worldGeoJSON, setWorldGeoJSON] = useState(null);

  // Load world geography data
  useEffect(() => {
    const loadWorldData = async () => {
      try {
        // Use a simpler approach with pre-built GeoJSON data
        const response = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@3/countries-110m.json');
        
        if (!response.ok) {
          throw new Error('Failed to load world geography data');
        }
        
        const topojsonData = await response.json();
        
        // Use dynamic import for topojson-client
        const { feature } = await import('topojson-client');
        const countries = feature(topojsonData, topojsonData.objects.countries);
        
        setWorldGeoJSON(countries);
        console.log('World data loaded successfully:', countries.features.length, 'countries');
      } catch (error) {
        console.warn('Failed to load world geography data:', error);
        // Fallback: map will work without country highlighting
        setWorldGeoJSON(null);
      }
    };
    
    loadWorldData();
  }, []);

  // PERFORMANCE: Optimized issue processing with all helpers moved outside
  const processedIssues = useMemo(() => {
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

    services.forEach(service => {
      if (!selectedServices.includes(service.name.toLowerCase())) return;
      if (!Array.isArray(service.data)) return;

      service.data.forEach((item, index) => {
        const date = item[service.dateField] || item.date || item.created_at;
        if (!isRelevant(item, date, showHistoric)) return;

        const titleText = item.title || item.name || '';
        const descriptionText = item.description || item.body || '';
        const fullText = `${titleText} ${descriptionText}`;
        
        const coordinates = getCoordinates(fullText, service.name);

        coordinates.forEach(coord => {
          issues.push({
            id: `${service.name}-${index}-${coord.region}`,
            provider: service.name,
            title: formatTitle(titleText || 'Service Issue'),
            description: formatDescription(descriptionText),
            severity: getSeverity(item),
            date: date,
            lat: coord.lat,
            lng: coord.lng,
            region: coord.region,
            confidence: coord.confidence || 'medium',
            url: item.html_url || item.link || item.url
          });
        });
      });
    });
    
    return issues;
  }, [cloudflareIncidents, zscalerUpdates, oktaUpdates, sendgridUpdates, slackUpdates, datadogUpdates, awsUpdates, selectedServices, showHistoric]);

  // PERFORMANCE: Optimized grouping by country
  const countryGroups = useMemo(() => {
    const groups = groupIssuesByCountry(processedIssues);
    console.log('Country groups created:', groups.map(g => ({ country: g.countryCode, issues: g.issues.length })));
    return groups;
  }, [processedIssues]);

  // Get country fill color and opacity based on severity
  const getCountryStyle = (countryCode, countryGroup) => {
    if (!countryGroup) {
      return {
        fillColor: 'transparent',
        fillOpacity: 0,
        color: '#cbd5e1',
        weight: 1,
        opacity: 0.3
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

    const getOpacity = (severity, issueCount) => {
      const baseOpacity = severity === 'critical' ? 0.7 : 
                         severity === 'major' ? 0.6 : 0.5;
      return Math.min(0.8, baseOpacity + (issueCount * 0.1));
    };

    return {
      fillColor: getSeverityColor(countryGroup.maxSeverity),
      fillOpacity: getOpacity(countryGroup.maxSeverity, countryGroup.issues.length),
      color: '#ffffff',
      weight: 2,
      opacity: 0.8
    };
  };

  return (
    <div className="world-map-container">
      <div className="world-map-header">
        <div className="header-content">
          <h2>Global Service Status Map</h2>
          <div className="map-legend">
            <div className="legend-item">
              <div className="legend-region" style={{ backgroundColor: '#dc2626', opacity: 0.7 }}></div>
              <span>Critical ({processedIssues.filter(i => i.severity === 'critical').length})</span>
            </div>
            <div className="legend-item">
              <div className="legend-region" style={{ backgroundColor: '#ea580c', opacity: 0.6 }}></div>
              <span>Major ({processedIssues.filter(i => i.severity === 'major').length})</span>
            </div>
            <div className="legend-item">
              <div className="legend-region" style={{ backgroundColor: '#d97706', opacity: 0.5 }}></div>
              <span>Minor ({processedIssues.filter(i => i.severity === 'minor').length})</span>
            </div>
            <div className="legend-item">
              <div className="legend-region affected-regions"></div>
              <span>Affected Regions ({countryGroups.length})</span>
            </div>
          </div>
        </div>
      </div>

      <div className="map-content-layout">
        <div className="leaflet-map-wrapper">
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
            
            {/* Render world countries with highlighting for affected regions */}
            {worldGeoJSON && worldGeoJSON.features.map((country, index) => {
              // Find if this country has issues
              const countryGroup = countryGroups.find(group => {
                // Try to match country by different methods
                const countryId = country.id || country.properties?.ADM0_A3 || country.properties?.ISO_A3 || country.properties?.ISO_A3_EH;
                const countryName = country.properties?.NAME || country.properties?.NAME_EN || '';
                
                // Match by ISO code
                if (group.countryCode === countryId) return true;
                
                // Match by name variations
                const groupCountryName = Object.keys(COUNTRY_MAPPING).find(key => 
                  COUNTRY_MAPPING[key] === group.countryCode
                );
                if (groupCountryName && countryName.toLowerCase().includes(groupCountryName.toLowerCase())) {
                  return true;
                }
                
                return false;
              });

              const style = getCountryStyle(country.id, countryGroup);

              return (
                <GeoJSON
                  key={`country-${index}`}
                  data={country}
                  style={style}
                  eventHandlers={countryGroup ? {
                    click: () => {
                      setSelectedCountry(countryGroup);
                      setSelectedIssue(null);
                    },
                    mouseover: (e) => {
                      e.target.setStyle({
                        weight: 3,
                        opacity: 1,
                        fillOpacity: Math.min(0.9, style.fillOpacity + 0.2)
                      });
                    },
                    mouseout: (e) => {
                      e.target.setStyle(style);
                    }
                  } : {}}
                >
                  {countryGroup && (
                    <Tooltip direction="top" sticky={true}>
                      <div className="tooltip-content">
                        <strong>{country.properties?.NAME || country.properties?.NAME_EN || 'Country'}</strong>
                        <div className="tooltip-title">
                          {countryGroup.issues.length} issue{countryGroup.issues.length !== 1 ? 's' : ''}
                        </div>
                        <div className="tooltip-severity">
                          Severity: {countryGroup.maxSeverity}
                        </div>
                        <em>Click to view details</em>
                      </div>
                    </Tooltip>
                  )}
                </GeoJSON>
              );
            })}
          </MapContainer>
        </div>

        {/* Side Panel for Issue Details */}
        {selectedCountry && (
          <div className="issue-side-panel">
            <div className="side-panel-header">
              <div className="panel-title-section">
              {selectedCountry.issues.length > 1 ? (
                <>
                  <div className="provider-badge">
                    <strong>{selectedCountry.issues.length} Issues in this Region</strong>
                  </div>
                  <div 
                    className="severity-badge"
                    style={{ 
                      backgroundColor: selectedCountry.maxSeverity === 'critical' ? '#dc2626' : 
                                      selectedCountry.maxSeverity === 'major' ? '#ea580c' : '#d97706',
                      color: 'white'
                    }}
                  >
                    Highest: {selectedCountry.maxSeverity}
                  </div>
                </>
              ) : (
                <>
                  <div className="provider-badge">
                    <strong>{selectedCountry.issues[0].provider}</strong>
                  </div>
                  <div 
                    className="severity-badge"
                    style={{ 
                      backgroundColor: selectedCountry.issues[0].severity === 'critical' ? '#dc2626' : 
                                      selectedCountry.issues[0].severity === 'major' ? '#ea580c' : '#d97706',
                      color: 'white'
                    }}
                  >
                    {selectedCountry.issues[0].severity}
                  </div>
                </>
              )}
            </div>
            <button 
              className="close-side-panel"
              onClick={() => setSelectedCountry(null)}
              title="Close details"
            >
              ×
            </button>
          </div>
          
          <div className="side-panel-content">
            {selectedCountry.issues.length > 1 ? (
              // Multiple issues view
              <div className="multiple-issues-view">
                <div className="issues-summary">
                  <h3>Service Issues in this Region</h3>
                  <p className="issues-count">{selectedCountry.issues.length} active issues detected</p>
                </div>
                
                <div className="issues-list-panel">
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
            ) : (
              // Single issue view
              <div className="single-issue-view">
                <div className="issue-title-section">
                  <h3>{selectedCountry.issues[0].title}</h3>
                </div>
                
                <div className="issue-meta-section">
                  <div className="meta-item">
                    <span className="meta-label">Region:</span>
                    <span className="meta-value">{selectedCountry.issues[0].region}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Date:</span>
                    <span className="meta-value">{new Date(selectedCountry.issues[0].date).toLocaleString()}</span>
                  </div>
                </div>

                {selectedCountry.issues[0].description && (
                  <div className="issue-description-section">
                    <div className="section-label">Description</div>
                    <div className="description-content">{selectedCountry.issues[0].description}</div>
                  </div>
                )}
                
                {selectedCountry.issues[0].url && (
                  <div className="issue-actions-section">
                    <a 
                      href={selectedCountry.issues[0].url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="view-details-btn"
                    >
                      <span>View Full Details</span>
                      <span className="external-link-icon">↗</span>
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        )}
      </div>

      <div className="map-summary-compact">
        <div className="summary-item-compact">
          <span className="summary-label-compact">Total Issues</span>
          <span className="summary-value-compact">{processedIssues.length}</span>
        </div>
        <div className="summary-item-compact">
          <span className="summary-label-compact">Critical</span>
          <span className="summary-value-compact critical">
            {processedIssues.filter(i => i.severity === 'critical').length}
          </span>
        </div>
        <div className="summary-item-compact">
          <span className="summary-label-compact">Regions</span>
          <span className="summary-value-compact">{countryGroups.length}</span>
        </div>
        <div className="summary-item-compact">
          <span className="summary-label-compact">Mode</span>
          <span className="summary-value-compact">
            {showHistoric ? 'Last 7 Days' : 'Current Active'}
          </span>
        </div>
      </div>
    </div>
  );
}
