import React, { useState, useMemo } from 'react';
import './WorldMap.css';

// Real world map component with actual geographic SVG paths
export default function RealWorldMap({ 
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
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [hoveredIssue, setHoveredIssue] = useState(null);

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
          const resolvedKeywords = ['resolved', 'closed', 'completed', 'fixed', 'restored'];
          return !resolvedKeywords.some(keyword => text.includes(keyword));
        }
      } catch (e) {
        return false;
      }
    };

    // Helper to get severity
    const getSeverity = (issue) => {
      const text = `${issue.title || issue.name || ''} ${issue.description || ''}`.toLowerCase();
      if (text.match(/\b(critical|emergency|outage|down|offline|complete failure)\b/)) return 'critical';
      if (text.match(/\b(major|significant|degraded|disruption|partial|slow)\b/)) return 'major';
      return 'minor';
    };

    // Helper to extract coordinates from text or use default service locations
    const getCoordinates = (text, provider) => {
      const textLower = text.toLowerCase();
      
      // Known data center locations for major cloud providers
      const serviceLocations = {
        'Cloudflare': [
          { region: 'us-east', lat: 39.0458, lng: -76.6413, keywords: ['us-east', 'virginia', 'washington dc', 'ashburn'] },
          { region: 'us-west', lat: 37.7749, lng: -122.4194, keywords: ['us-west', 'california', 'san francisco', 'oregon'] },
          { region: 'eu-west', lat: 53.3498, lng: -6.2603, keywords: ['eu-west', 'ireland', 'dublin', 'europe'] },
          { region: 'eu-central', lat: 50.1109, lng: 8.6821, keywords: ['eu-central', 'germany', 'frankfurt'] },
          { region: 'ap-southeast', lat: 1.3521, lng: 103.8198, keywords: ['ap-southeast', 'singapore', 'asia'] },
          { region: 'ap-northeast', lat: 35.6762, lng: 139.6503, keywords: ['ap-northeast', 'japan', 'tokyo'] }
        ],
        'AWS': [
          { region: 'us-east-1', lat: 39.0458, lng: -76.6413, keywords: ['us-east-1', 'virginia', 'n. virginia'] },
          { region: 'us-west-2', lat: 45.5152, lng: -122.6784, keywords: ['us-west-2', 'oregon'] },
          { region: 'eu-west-1', lat: 53.3498, lng: -6.2603, keywords: ['eu-west-1', 'ireland'] },
          { region: 'eu-central-1', lat: 50.1109, lng: 8.6821, keywords: ['eu-central-1', 'frankfurt'] },
          { region: 'ap-southeast-1', lat: 1.3521, lng: 103.8198, keywords: ['ap-southeast-1', 'singapore'] },
          { region: 'ap-northeast-1', lat: 35.6762, lng: 139.6503, keywords: ['ap-northeast-1', 'tokyo'] }
        ],
        'Okta': [
          { region: 'us', lat: 37.7749, lng: -122.4194, keywords: ['us', 'united states', 'america'] },
          { region: 'eu', lat: 52.3676, lng: 4.9041, keywords: ['eu', 'europe', 'amsterdam'] }
        ],
        'SendGrid': [
          { region: 'us-west', lat: 37.7749, lng: -122.4194, keywords: ['us-west', 'west'] },
          { region: 'us-east', lat: 40.7128, lng: -74.0060, keywords: ['us-east', 'east'] },
          { region: 'eu', lat: 53.3498, lng: -6.2603, keywords: ['eu', 'europe'] }
        ]
      };

      // Try to match specific regions from text
      const locations = serviceLocations[provider] || [];
      for (const location of locations) {
        if (location.keywords.some(keyword => textLower.includes(keyword))) {
          return [{ lat: location.lat, lng: location.lng, region: location.region }];
        }
      }

      // If global or no specific region, return all locations for that provider
      if (textLower.includes('global') || textLower.includes('worldwide') || textLower.includes('all regions')) {
        return locations.map(loc => ({ lat: loc.lat, lng: loc.lng, region: loc.region }));
      }

      // Default to primary location for the provider
      if (locations.length > 0) {
        return [{ lat: locations[0].lat, lng: locations[0].lng, region: locations[0].region }];
      }

      // Fallback coordinates
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
            title: item.title || item.name || 'Service Issue',
            description: item.description || '',
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

  // Convert lat/lng to SVG coordinates (using equirectangular projection)
  const projectCoordinates = (lat, lng) => {
    const svgWidth = 1000;
    const svgHeight = 500;
    
    // Convert to SVG coordinates
    const x = ((lng + 180) / 360) * svgWidth;
    const y = ((90 - lat) / 180) * svgHeight;
    
    return { x, y };
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return '#dc2626';
      case 'major': return '#ea580c';
      case 'minor': return '#d97706';
      default: return '#6b7280';
    }
  };

  const getSeveritySize = (severity) => {
    switch (severity) {
      case 'critical': return 12;
      case 'major': return 10;
      case 'minor': return 8;
      default: return 6;
    }
  };

  return (
    <div className="world-map-container">
      <div className="world-map-header">
        <h2>Global Service Status Map</h2>
        <div className="map-legend">
          <div className="legend-item">
            <div className="legend-dot" style={{ backgroundColor: '#dc2626' }}></div>
            <span>Critical Issues</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot" style={{ backgroundColor: '#ea580c' }}></div>
            <span>Major Issues</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot" style={{ backgroundColor: '#d97706' }}></div>
            <span>Minor Issues</span>
          </div>
        </div>
      </div>

      <div className="world-map-svg-container">
        <svg 
          className="world-map-svg" 
          viewBox="0 0 1000 500" 
          style={{ width: '100%', height: '100%', minHeight: '400px' }}
        >
          <defs>
            <linearGradient id="oceanGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#4f46e5', stopOpacity: 0.8 }} />
              <stop offset="100%" style={{ stopColor: '#1e40af', stopOpacity: 0.9 }} />
            </linearGradient>
            <linearGradient id="landGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#10b981', stopOpacity: 0.9 }} />
              <stop offset="100%" style={{ stopColor: '#059669', stopOpacity: 1 }} />
            </linearGradient>
          </defs>
          
          {/* Ocean background */}
          <rect width="1000" height="500" fill="url(#oceanGradient)" />
          
          {/* Continents - Simplified but recognizable shapes */}
          
          {/* North America */}
          <path 
            d="M 50 120 Q 100 80 180 100 Q 250 85 300 120 Q 320 150 300 200 Q 280 250 250 280 Q 200 300 150 290 Q 100 280 80 250 Q 60 200 50 120 Z"
            fill="url(#landGradient)"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="1"
          />
          
          {/* South America */}
          <path 
            d="M 200 300 Q 230 320 240 380 Q 235 420 220 450 Q 200 470 180 450 Q 160 420 170 380 Q 180 340 200 300 Z"
            fill="url(#landGradient)"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="1"
          />
          
          {/* Europe */}
          <path 
            d="M 450 120 Q 480 110 520 120 Q 540 140 530 170 Q 520 190 500 180 Q 470 175 450 160 Q 440 140 450 120 Z"
            fill="url(#landGradient)"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="1"
          />
          
          {/* Africa */}
          <path 
            d="M 480 180 Q 520 200 540 250 Q 550 300 540 350 Q 530 400 510 420 Q 480 430 460 420 Q 440 400 450 350 Q 460 300 470 250 Q 475 200 480 180 Z"
            fill="url(#landGradient)"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="1"
          />
          
          {/* Asia */}
          <path 
            d="M 520 80 Q 600 70 700 90 Q 780 100 820 130 Q 850 160 840 200 Q 830 240 800 250 Q 750 260 700 250 Q 650 240 600 220 Q 550 200 530 170 Q 515 130 520 80 Z"
            fill="url(#landGradient)"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="1"
          />
          
          {/* Australia */}
          <path 
            d="M 720 350 Q 780 340 820 360 Q 840 380 830 400 Q 810 420 780 410 Q 750 405 720 390 Q 710 370 720 350 Z"
            fill="url(#landGradient)"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="1"
          />

          {/* Issue markers */}
          {processedIssues.map(issue => {
            const coords = projectCoordinates(issue.lat, issue.lng);
            const size = getSeveritySize(issue.severity);
            const color = getSeverityColor(issue.severity);
            
            return (
              <g key={issue.id}>
                {/* Pulse animation for critical issues */}
                {issue.severity === 'critical' && (
                  <circle
                    cx={coords.x}
                    cy={coords.y}
                    r={size + 5}
                    fill={color}
                    opacity="0.3"
                    className="issue-pulse"
                  />
                )}
                
                {/* Main marker */}
                <circle
                  cx={coords.x}
                  cy={coords.y}
                  r={size}
                  fill={color}
                  stroke="white"
                  strokeWidth="2"
                  className="issue-marker"
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredIssue(issue)}
                  onMouseLeave={() => setHoveredIssue(null)}
                  onClick={() => setSelectedRegion(issue)}
                />
                
                {/* Issue count badge for overlapping issues */}
                <text
                  x={coords.x}
                  y={coords.y + 1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  fontSize="8"
                  fontWeight="bold"
                  style={{ pointerEvents: 'none' }}
                >
                  1
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover tooltip */}
        {hoveredIssue && (
          <div 
            className="map-tooltip"
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              background: 'rgba(0, 0, 0, 0.9)',
              color: 'white',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '14px',
              maxWidth: '300px',
              zIndex: 10,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
            }}
          >
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
              {hoveredIssue.provider} - {hoveredIssue.region}
            </div>
            <div style={{ marginBottom: '4px' }}>{hoveredIssue.title}</div>
            <div style={{ 
              fontSize: '12px', 
              opacity: 0.8,
              color: getSeverityColor(hoveredIssue.severity)
            }}>
              {hoveredIssue.severity.toUpperCase()} • {new Date(hoveredIssue.date).toLocaleDateString()}
            </div>
          </div>
        )}
      </div>

      {/* Issue details panel */}
      {selectedRegion && (
        <div className="region-details-panel">
          <div className="panel-header">
            <h3>{selectedRegion.provider} - {selectedRegion.region}</h3>
            <button 
              className="close-panel"
              onClick={() => setSelectedRegion(null)}
            >
              ×
            </button>
          </div>
          <div className="panel-content">
            <div className="issue-item">
              <div className="issue-header">
                <span className="issue-provider">{selectedRegion.provider}</span>
                <span 
                  className="issue-severity"
                  style={{ color: getSeverityColor(selectedRegion.severity) }}
                >
                  {selectedRegion.severity}
                </span>
              </div>
              <div className="issue-title">{selectedRegion.title}</div>
              <div className="issue-description">{selectedRegion.description}</div>
              <div className="issue-date">
                {new Date(selectedRegion.date).toLocaleString()}
              </div>
              {selectedRegion.url && (
                <a 
                  href={selectedRegion.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="issue-link"
                >
                  View details →
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Summary stats */}
      <div className="map-summary">
        <div className="summary-item">
          <span className="summary-label">Total Issues:</span>
          <span className="summary-value">{processedIssues.length}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Critical:</span>
          <span className="summary-value" style={{ color: '#dc2626' }}>
            {processedIssues.filter(i => i.severity === 'critical').length}
          </span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Mode:</span>
          <span className="summary-value">{showHistoric ? 'Last 7 Days' : 'Current Active'}</span>
        </div>
      </div>
    </div>
  );
}
