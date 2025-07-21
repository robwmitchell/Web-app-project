import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
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
// Enhanced geographical location database
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

// Coordinate detection
const getCoordinates = (text, provider) => {
  const textLower = cleanHtmlContent(text).toLowerCase();
  
  // Cloud regions
  for (const [region, coords] of Object.entries(GEOGRAPHICAL_DATABASE.cloudRegions)) {
    if (textLower.includes(region.toLowerCase())) {
      return [{ lat: coords.lat, lng: coords.lng, region: coords.region, confidence: 'high' }];
    }
  }
  
  // Cities
  for (const [city, coords] of Object.entries(GEOGRAPHICAL_DATABASE.cities)) {
    if (textLower.includes(city)) {
      return [{ lat: coords.lat, lng: coords.lng, region: coords.region, confidence: 'high' }];
    }
  }
  
  // Default fallback
  return [{ lat: 37.7749, lng: -122.4194, region: 'Global (Fallback)', confidence: 'low' }];
};

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

  // Process issues
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
          const countryCode = getCountryFromCoordinates(coord.lat, coord.lng);
          
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
            countryCode: countryCode,
            confidence: coord.confidence || 'medium',
            url: item.html_url || item.link || item.url
          });
        });
      });
    });
    
    return issues;
  }, [cloudflareIncidents, zscalerUpdates, oktaUpdates, sendgridUpdates, slackUpdates, datadogUpdates, awsUpdates, selectedServices, showHistoric]);

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
      
      const popupContent = `
        <div class="country-popup">
          <h3>${group.countryName}</h3>
          <p><strong>${group.issues.length}</strong> active issue${group.issues.length !== 1 ? 's' : ''}</p>
          <p>Highest severity: <span class="severity-${group.maxSeverity}">${group.maxSeverity}</span></p>
        </div>
      `;
      layer.bindPopup(popupContent);
    }
  }, [countryGroups, getCountryStyle]);

  return (
    <div className="world-map-container">
      <div className="world-map-header">
        <div className="header-content">
          <h2>Global Service Status Map</h2>
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
            
            {worldGeoJSON && (
              <GeoJSON
                key="countries"
                data={worldGeoJSON}
                style={getCountryStyle}
                onEachFeature={onEachCountry}
              />
            )}
          </MapContainer>
        </div>

        {selectedCountry && (
          <div className="issue-side-panel">
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
              >
                ×
              </button>
            </div>
            
            <div className="side-panel-content">
              <div className="multiple-issues-view">
                <div className="issues-summary">
                  <h3>Service Issues in {selectedCountry.countryName}</h3>
                  <p className="issues-count">{selectedCountry.issues.length} active issue{selectedCountry.issues.length !== 1 ? 's' : ''}</p>
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
