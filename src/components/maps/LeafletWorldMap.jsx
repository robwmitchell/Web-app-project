import React, { useState, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
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

// Component to handle map bounds changes and zoom controls
function MapBoundsHandler({ issues }) {
  const map = useMap();
  
  useEffect(() => {
    if (issues.length > 0) {
      const group = new L.featureGroup(
        issues.map(issue => L.circleMarker([issue.lat, issue.lng]))
      );
      map.fitBounds(group.getBounds().pad(0.1));
    }
  }, [issues, map]);
  
  // Add zoom control event listeners
  useEffect(() => {
    const handleZoomIn = () => map.zoomIn();
    const handleZoomOut = () => map.zoomOut();
    
    const zoomInBtn = document.querySelector('.zoom-in');
    const zoomOutBtn = document.querySelector('.zoom-out');
    
    if (zoomInBtn && zoomOutBtn) {
      zoomInBtn.addEventListener('click', handleZoomIn);
      zoomOutBtn.addEventListener('click', handleZoomOut);
      
      return () => {
        zoomInBtn.removeEventListener('click', handleZoomIn);
        zoomOutBtn.removeEventListener('click', handleZoomOut);
      };
    }
  }, [map]);
  
  return null;
}

// Main LeafletWorldMap component
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

// Utility functions for cleaning and formatting issue data
const cleanHtmlContent = (htmlString) => {
  if (!htmlString) return '';
  
  // Create a temporary div to parse HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlString;
  
  // Get text content and clean up
  let text = tempDiv.textContent || tempDiv.innerText || '';
  
  // Additional cleanup
  text = text
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/\n+/g, ' ') // Replace newlines with spaces
    .trim(); // Remove leading/trailing whitespace
  
  return text;
};

const formatDescription = (description, maxLength = 200) => {
  if (!description) return '';
  
  const cleaned = cleanHtmlContent(description);
  if (cleaned.length <= maxLength) return cleaned;
  
  // Find the last complete sentence within the limit
  const truncated = cleaned.substring(0, maxLength);
  const lastSentenceEnd = Math.max(
    truncated.lastIndexOf('.'),
    truncated.lastIndexOf('!'),
    truncated.lastIndexOf('?')
  );
  
  if (lastSentenceEnd > maxLength * 0.7) {
    return truncated.substring(0, lastSentenceEnd + 1);
  }
  
  // If no good sentence break, find last word
  const lastSpace = truncated.lastIndexOf(' ');
  return lastSpace > 0 ? truncated.substring(0, lastSpace) + '...' : truncated + '...';
};

const formatTitle = (title) => {
  if (!title) return 'Service Issue';
  
  const cleaned = cleanHtmlContent(title);
  // Capitalize first letter if needed
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
};

// Known service provider data center locations
const serviceLocations = {
  'Cloudflare': [
    { region: 'us-east-1', lat: 39.0458, lng: -76.6413, keywords: ['us-east', 'virginia', 'washington dc', 'ashburn', 'iad'] },
    { region: 'us-west-1', lat: 37.7749, lng: -122.4194, keywords: ['us-west', 'california', 'san francisco', 'sfo'] },
    { region: 'us-west-2', lat: 45.5152, lng: -122.6784, keywords: ['us-west-2', 'oregon', 'portland', 'pdx'] },
    { region: 'eu-west-1', lat: 53.3498, lng: -6.2603, keywords: ['eu-west', 'ireland', 'dublin', 'dub'] },
    { region: 'eu-central-1', lat: 50.1109, lng: 8.6821, keywords: ['eu-central', 'germany', 'frankfurt', 'fra'] },
    { region: 'ap-southeast-1', lat: 1.3521, lng: 103.8198, keywords: ['ap-southeast', 'singapore', 'sin'] },
    { region: 'ap-northeast-1', lat: 35.6762, lng: 139.6503, keywords: ['ap-northeast', 'japan', 'tokyo', 'nrt'] },
    { region: 'ap-southeast-2', lat: -33.8688, lng: 151.2093, keywords: ['ap-southeast-2', 'australia', 'sydney', 'syd'] },
    { region: 'eu-west-2', lat: 51.5074, lng: -0.1278, keywords: ['eu-west-2', 'uk', 'london', 'lhr'] },
    { region: 'sa-east-1', lat: -23.5505, lng: -46.6333, keywords: ['sa-east', 'brazil', 'sao paulo', 'gru'] }
  ],
  'AWS': [
    { region: 'us-east-1', lat: 39.0458, lng: -76.6413, keywords: ['us-east-1', 'n. virginia', 'virginia', 'iad'] },
    { region: 'us-west-1', lat: 37.7749, lng: -122.4194, keywords: ['us-west-1', 'n. california', 'california', 'sfo'] },
    { region: 'us-west-2', lat: 45.5152, lng: -122.6784, keywords: ['us-west-2', 'oregon', 'pdx'] },
    { region: 'eu-west-1', lat: 53.3498, lng: -6.2603, keywords: ['eu-west-1', 'ireland', 'dublin'] },
    { region: 'eu-central-1', lat: 50.1109, lng: 8.6821, keywords: ['eu-central-1', 'frankfurt', 'germany'] },
    { region: 'ap-southeast-1', lat: 1.3521, lng: 103.8198, keywords: ['ap-southeast-1', 'singapore'] },
    { region: 'ap-northeast-1', lat: 35.6762, lng: 139.6503, keywords: ['ap-northeast-1', 'tokyo', 'japan'] },
    { region: 'ap-southeast-2', lat: -33.8688, lng: 151.2093, keywords: ['ap-southeast-2', 'sydney', 'australia'] },
    { region: 'eu-west-2', lat: 51.5074, lng: -0.1278, keywords: ['eu-west-2', 'london', 'uk'] },
    { region: 'sa-east-1', lat: -23.5505, lng: -46.6333, keywords: ['sa-east-1', 'sao paulo', 'brazil'] },
    { region: 'ca-central-1', lat: 43.6532, lng: -79.3832, keywords: ['ca-central-1', 'canada', 'toronto'] }
  ],
  'Okta': [
    { region: 'us-production', lat: 37.7749, lng: -122.4194, keywords: ['us', 'united states', 'america', 'production'] },
    { region: 'eu-production', lat: 52.3676, lng: 4.9041, keywords: ['eu', 'europe', 'amsterdam', 'production'] },
    { region: 'preview', lat: 47.6062, lng: -122.3321, keywords: ['preview', 'seattle', 'staging'] }
  ],
  'SendGrid': [
    { region: 'us-west', lat: 37.7749, lng: -122.4194, keywords: ['us-west', 'west coast'] },
    { region: 'us-east', lat: 40.7128, lng: -74.0060, keywords: ['us-east', 'east coast'] },
    { region: 'eu', lat: 53.3498, lng: -6.2603, keywords: ['eu', 'europe', 'ireland'] },
    { region: 'ap', lat: 1.3521, lng: 103.8198, keywords: ['ap', 'asia pacific', 'singapore'] }
  ],
  'Slack': [
    { region: 'us', lat: 37.7749, lng: -122.4194, keywords: ['us', 'united states'] },
    { region: 'eu', lat: 53.3498, lng: -6.2603, keywords: ['eu', 'europe'] },
    { region: 'au', lat: -33.8688, lng: 151.2093, keywords: ['au', 'australia'] },
    { region: 'jp', lat: 35.6762, lng: 139.6503, keywords: ['jp', 'japan'] }
  ],
  'Datadog': [
    { region: 'us1', lat: 40.7128, lng: -74.0060, keywords: ['us1', 'us east'] },
    { region: 'us3', lat: 37.7749, lng: -122.4194, keywords: ['us3', 'us west'] },
    { region: 'eu', lat: 53.3498, lng: -6.2603, keywords: ['eu', 'europe', 'ireland'] },
    { region: 'eu1', lat: 52.5200, lng: 13.4050, keywords: ['eu1', 'germany'] },
    { region: 'ap1', lat: 35.6762, lng: 139.6503, keywords: ['ap1', 'japan'] }
  ],
  'Zscaler': [
    { region: 'americas', lat: 37.7749, lng: -122.4194, keywords: ['americas', 'us', 'america'] },
    { region: 'emea', lat: 51.5074, lng: -0.1278, keywords: ['emea', 'europe', 'middle east', 'africa'] },
    { region: 'apac', lat: 35.6762, lng: 139.6503, keywords: ['apac', 'asia pacific'] }
  ]
};

// Process issues and map them to geographic coordinates
const processedIssues = useMemo(() => {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const issues = [];

  // Helper to check if issue is relevant
  const isRelevant = (issue, date) => {
    try {
      const issueDate = new Date(date);
      if (isNaN(issueDate)) return false;
      
      if (showHistoric) {
        return issueDate >= sevenDaysAgo;
      } else {
        const text = `${issue.title || issue.name || ''} ${issue.description || ''}`.toLowerCase();
        const resolvedKeywords = ['resolved', 'closed', 'completed', 'fixed', 'restored', 'resolved at'];
        return !resolvedKeywords.some(keyword => text.includes(keyword));
      }
    } catch (e) {
      return false;
    }
  };

  // Helper to get severity
  const getSeverity = (issue) => {
    const text = `${issue.title || issue.name || ''} ${issue.description || ''}`.toLowerCase();
    if (text.match(/\b(critical|emergency|outage|down|offline|complete failure|total)\b/)) return 'critical';
    if (text.match(/\b(major|significant|degraded|disruption|partial|slow|performance)\b/)) return 'major';
    return 'minor';
  };

  // Helper to extract coordinates from text
  const getCoordinates = (text, provider) => {
    const textLower = text.toLowerCase();
    const locations = serviceLocations[provider] || [];
    
    // Try to match specific regions from text
    for (const location of locations) {
      if (location.keywords.some(keyword => textLower.includes(keyword))) {
        return [{ lat: location.lat, lng: location.lng, region: location.region }];
      }
    }

    // If global or no specific region, return multiple key locations
    if (textLower.includes('global') || textLower.includes('worldwide') || textLower.includes('all regions')) {
      return locations.slice(0, 3).map(loc => ({ lat: loc.lat, lng: loc.lng, region: loc.region }));
    }

    // Default to primary location for the provider
    if (locations.length > 0) {
      return [{ lat: locations[0].lat, lng: locations[0].lng, region: locations[0].region }];
    }

    // Fallback coordinates (San Francisco)
    return [{ lat: 37.7749, lng: -122.4194, region: 'global' }];
  };

  // Process each service
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
      if (!isRelevant(item, date)) return;

      const text = `${item.title || item.name || ''} ${item.description || ''}`;
      const coordinates = getCoordinates(text, service.name);

      coordinates.forEach(coord => {
        issues.push({
          id: `${service.name}-${index}-${coord.region}`,
          provider: service.name,
          title: formatTitle(item.title || item.name || 'Service Issue'),
          description: formatDescription(item.description),
          severity: getSeverity(item),
          date: date,
          lat: coord.lat,
          lng: coord.lng,
          region: coord.region,
          url: item.html_url || item.link || item.url
        });
      });
    });
  });

  return issues;
}, [cloudflareIncidents, zscalerUpdates, oktaUpdates, sendgridUpdates, slackUpdates, datadogUpdates, awsUpdates, selectedServices, showHistoric]);

const getSeverityColor = (severity) => {
  switch (severity) {
    case 'critical': return '#dc2626';
    case 'major': return '#ea580c';
    case 'minor': return '#d97706';
    default: return '#6b7280';
  }
};

const getSeverityRadius = (severity) => {
  switch (severity) {
    case 'critical': return 15;
    case 'major': return 12;
    case 'minor': return 9;
    default: return 6;
  }
};

return (
  <div className="world-map-container">
    <div className="world-map-header">
      <div className="header-content">
        <h2>Global Service Status Map</h2>
        <div className="map-legend">
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
          
          <MapBoundsHandler issues={processedIssues} />
          
          {processedIssues.map(issue => (
            <CircleMarker
              key={issue.id}
              center={[issue.lat, issue.lng]}
              radius={getSeverityRadius(issue.severity)}
              fillColor={getSeverityColor(issue.severity)}
              color="white"
              weight={2}
              opacity={1}
              fillOpacity={0.8}
              className={`issue-marker-${issue.severity}`}
              eventHandlers={{
                click: () => setSelectedIssue(issue)
              }}
            />
          ))}
        </MapContainer>
      </div>

      {/* Side Panel for Issue Details */}
      {selectedIssue && (
        <div className="issue-side-panel">
          <div className="side-panel-header">
            <div className="panel-title-section">
              <div className="provider-badge">
                <strong>{selectedIssue.provider}</strong>
              </div>
              <div 
                className="severity-badge"
                style={{ 
                  backgroundColor: getSeverityColor(selectedIssue.severity),
                  color: 'white'
                }}
              >
                {selectedIssue.severity}
              </div>
            </div>
            <button 
              className="close-side-panel"
              onClick={() => setSelectedIssue(null)}
              title="Close details"
            >
              ×
            </button>
          </div>
          
          <div className="side-panel-content">
            <div className="issue-title-section">
              <h3>{selectedIssue.title}</h3>
            </div>
            
            <div className="issue-meta-section">
              <div className="meta-item">
                <span className="meta-label">Region:</span>
                <span className="meta-value">{selectedIssue.region}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Date:</span>
                <span className="meta-value">{new Date(selectedIssue.date).toLocaleString()}</span>
              </div>
            </div>

            {selectedIssue.description && (
              <div className="issue-description-section">
                <div className="section-label">Description</div>
                <div className="description-content">{selectedIssue.description}</div>
              </div>
            )}
            
            {selectedIssue.url && (
              <div className="issue-actions-section">
                <a 
                  href={selectedIssue.url} 
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
        </div>
      )}
    </div>

    {/* Summary stats */}
    <div className="map-summary">
      <div className="summary-item">
        <span className="summary-label">Total Issues</span>
        <span className="summary-value">{processedIssues.length}</span>
      </div>
      <div className="summary-item">
        <span className="summary-label">Critical</span>
        <span className="summary-value critical">
          {processedIssues.filter(i => i.severity === 'critical').length}
        </span>
      </div>
      <div className="summary-item">
        <span className="summary-label">Major</span>
        <span className="summary-value major">
          {processedIssues.filter(i => i.severity === 'major').length}
        </span>
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
