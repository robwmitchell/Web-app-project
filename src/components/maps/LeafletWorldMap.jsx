import React, { useState, useMemo, useEffect } from 'react';
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

// Group issues by location to handle overlapping markers - moved outside component
const groupIssuesByLocation = (issues) => {
  const locationGroups = {};
  const PROXIMITY_THRESHOLD = 0.5; // degrees (roughly 50km)
  
  issues.forEach(issue => {
    const key = `${Math.round(issue.lat / PROXIMITY_THRESHOLD) * PROXIMITY_THRESHOLD}_${Math.round(issue.lng / PROXIMITY_THRESHOLD) * PROXIMITY_THRESHOLD}`;
    
    if (!locationGroups[key]) {
      locationGroups[key] = {
        lat: issue.lat,
        lng: issue.lng,
        issues: [],
        maxSeverity: 'minor'
      };
    }
    
    locationGroups[key].issues.push(issue);
    
    // Update max severity for the group
    const severityOrder = { 'critical': 3, 'major': 2, 'minor': 1 };
    if (severityOrder[issue.severity] > severityOrder[locationGroups[key].maxSeverity]) {
      locationGroups[key].maxSeverity = issue.severity;
    }
  });
  
  return Object.values(locationGroups);
};

// Helper functions for cluster visualization
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

const getClusterRadius = (group) => {
  const baseRadius = getSeverityRadius(group.maxSeverity);
  const countMultiplier = Math.min(1 + (group.issues.length - 1) * 0.3, 2.5);
  return baseRadius * countMultiplier;
};

const getClusterColor = (group) => {
  const baseColor = getSeverityColor(group.maxSeverity);
  return baseColor;
};

const getServiceColor = (service) => {
  const colors = {
    'Cloudflare': '#f48120',
    'AWS': '#ff9900', 
    'Zscaler': '#00bfff',
    'Okta': '#007dc1',
    'SendGrid': '#1a82e2',
    'Slack': '#4a154b',
    'Datadog': '#632ca6'
  };
  return colors[service] || '#6b7280';
};

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
  const [selectedGroup, setSelectedGroup] = useState(null); // New state for issue groups

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

const formatTime = (timeString) => {
  if (!timeString) return 'Unknown time';
  
  try {
    const date = new Date(timeString);
    if (isNaN(date)) return 'Invalid date';
    
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 60) {
      return diffMins <= 1 ? 'Just now' : `${diffMins} mins ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  } catch (e) {
    return 'Invalid date';
  }
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

// Group issues by location after processing
const groupedIssues = useMemo(() => groupIssuesByLocation(processedIssues), [processedIssues]);

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
          <div className="legend-item legend-cluster-info">
            <div className="legend-cluster-icon">
              <div className="legend-dot clustered" style={{ backgroundColor: '#6b7280' }}></div>
              <span className="cluster-count-example">3</span>
            </div>
            <span>Multiple issues ({groupedIssues.filter(g => g.issues.length > 1).length} areas)</span>
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
          
          {groupedIssues.map((group, index) => (
            <CircleMarker
              key={`group-${index}`}
              center={[group.lat, group.lng]}
              radius={getClusterRadius(group)}
              fillColor={getClusterColor(group)}
              color="white"
              weight={group.issues.length > 1 ? 3 : 2}
              opacity={1}
              fillOpacity={group.issues.length > 1 ? 0.9 : 0.8}
              className={`issue-marker-${group.maxSeverity} ${group.issues.length > 1 ? 'clustered' : ''}`}
              eventHandlers={{
                click: () => {
                  // Always open in side panel, pass the entire group
                  setSelectedGroup(group);
                  setSelectedIssue(null); // Clear single issue selection
                }
              }}
            >
              {/* Tooltip for markers */}
              {group.issues.length > 1 ? (
                <Tooltip permanent className="cluster-tooltip" direction="center">
                  <span className="cluster-count">{group.issues.length}</span>
                </Tooltip>
              ) : (
                <Tooltip className="single-issue-tooltip" direction="top">
                  <div className="tooltip-content">
                    <strong>{group.issues[0].provider}</strong><br/>
                    {formatTitle(group.issues[0].title)}<br/>
                    <em>Click to view details</em>
                  </div>
                </Tooltip>
              )}
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      {/* Side Panel for Issue Details */}
      {(selectedGroup || selectedIssue) && (
        <div className="issue-side-panel">
          <div className="side-panel-header">
            <div className="panel-title-section">
              {selectedGroup ? (
                <>
                  <div className="provider-badge">
                    <strong>{selectedGroup.issues.length} Issues in this Area</strong>
                  </div>
                  <div 
                    className="severity-badge"
                    style={{ 
                      backgroundColor: getSeverityColor(selectedGroup.maxSeverity),
                      color: 'white'
                    }}
                  >
                    Highest: {selectedGroup.maxSeverity}
                  </div>
                </>
              ) : (
                <>
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
                </>
              )}
            </div>
            <button 
              className="close-side-panel"
              onClick={() => {
                setSelectedGroup(null);
                setSelectedIssue(null);
              }}
              title="Close details"
            >
              ×
            </button>
          </div>
          
          <div className="side-panel-content">
            {selectedGroup ? (
              // Multiple issues view
              <div className="multiple-issues-view">
                <div className="issues-summary">
                  <h3>Service Issues in this Region</h3>
                  <p className="issues-count">{selectedGroup.issues.length} active issues detected</p>
                </div>
                
                <div className="issues-list-panel">
                  {selectedGroup.issues.map((issue, index) => (
                    <div key={issue.id} className="issue-card">
                      <div className="issue-card-header">
                        <div className="service-info">
                          <div className="service-badge" style={{ backgroundColor: getServiceColor(issue.provider) }}>
                            {issue.provider}
                          </div>
                          <div className={`severity-badge severity-${issue.severity}`}>
                            {issue.severity}
                          </div>
                        </div>
                        <div className="issue-time">
                          {formatTime(issue.date)}
                        </div>
                      </div>
                      
                      <div className="issue-card-content">
                        <h4 className="issue-card-title">{formatTitle(issue.title)}</h4>
                        {issue.description && (
                          <p className="issue-card-description">
                            {formatDescription(issue.description)}
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
                      
                      {index < selectedGroup.issues.length - 1 && (
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
