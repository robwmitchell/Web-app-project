import React, { useState, useMemo, useEffect, useCallback, memo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './WorldMap.css';

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
  const [selectedGroup, setSelectedGroup] = useState(null);

  // Simple processing for now - we'll optimize incrementally
  const processedIssues = useMemo(() => {
    const issues = [];
    
    // Just process Cloudflare for now to test structure
    if (selectedServices.includes('cloudflare') && Array.isArray(cloudflareIncidents)) {
      cloudflareIncidents.slice(0, 10).forEach((item, index) => {
        issues.push({
          id: `cloudflare-${index}`,
          provider: 'Cloudflare',
          title: item.title || 'Service Issue',
          description: item.description || '',
          severity: 'minor',
          date: item.created_at,
          lat: 37.7749,
          lng: -122.4194,
          region: 'San Francisco, USA',
          url: item.html_url
        });
      });
    }
    
    return issues;
  }, [cloudflareIncidents, selectedServices, showHistoric]);

  // Simple grouping for now
  const groupedIssues = useMemo(() => {
    return processedIssues.map(issue => ({
      lat: issue.lat,
      lng: issue.lng,
      issues: [issue],
      maxSeverity: issue.severity
    }));
  }, [processedIssues]);

  return (
    <div className="world-map-container">
      <div className="world-map-header">
        <div className="header-content">
          <h2>Global Service Status Map</h2>
          <div className="map-legend">
            <div className="legend-item">
              <div className="legend-dot" style={{ backgroundColor: '#dc2626' }}></div>
              <span>Critical (0)</span>
            </div>
            <div className="legend-item">
              <div className="legend-dot" style={{ backgroundColor: '#ea580c' }}></div>
              <span>Major (0)</span>
            </div>
            <div className="legend-item">
              <div className="legend-dot" style={{ backgroundColor: '#d97706' }}></div>
              <span>Minor ({processedIssues.length})</span>
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
            
            {groupedIssues.map((group, index) => (
              <CircleMarker
                key={`group-${index}`}
                center={[group.lat, group.lng]}
                radius={8}
                fillColor="#d97706"
                color="white"
                weight={2}
                opacity={1}
                fillOpacity={0.8}
                eventHandlers={{
                  click: () => {
                    setSelectedGroup(group);
                    setSelectedIssue(null);
                  }
                }}
              >
                <Tooltip direction="top" sticky={true}>
                  <div className="tooltip-content">
                    <strong>{group.issues[0].provider}</strong>
                    <div className="tooltip-title">
                      {group.issues[0].title}
                    </div>
                    <em>Click to view details</em>
                  </div>
                </Tooltip>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>
      </div>

      <div className="map-summary">
        <div className="summary-item">
          <span className="summary-label">Total Issues</span>
          <span className="summary-value">{processedIssues.length}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Mode</span>
          <span className="summary-value">
            {showHistoric ? 'Last 7 Days' : 'Current Active'}
          </span>
        </div>
      </div>
    </div>
  );
}
