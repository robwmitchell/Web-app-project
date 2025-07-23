import React, { useState, useEffect, useMemo } from 'react';
import './WorldMap.css';

// Known service provider data center regions and locations
const SERVICE_LOCATIONS = {
  'Cloudflare': {
    regions: [
      { name: 'North America (East)', lat: 40.7128, lng: -74.0060, countries: ['US', 'CA'] },
      { name: 'North America (West)', lat: 37.7749, lng: -122.4194, countries: ['US', 'CA'] },
      { name: 'Europe (West)', lat: 51.5074, lng: -0.1278, countries: ['GB', 'FR', 'DE', 'NL'] },
      { name: 'Europe (Central)', lat: 52.5200, lng: 13.4050, countries: ['DE', 'PL', 'CZ'] },
      { name: 'Asia Pacific (East)', lat: 35.6762, lng: 139.6503, countries: ['JP', 'KR'] },
      { name: 'Asia Pacific (Southeast)', lat: 1.3521, lng: 103.8198, countries: ['SG', 'MY', 'TH'] },
      { name: 'Australia', lat: -33.8688, lng: 151.2093, countries: ['AU'] },
      { name: 'South America', lat: -23.5505, lng: -46.6333, countries: ['BR', 'AR'] }
    ]
  },
  'AWS': {
    regions: [
      { name: 'US East (N. Virginia)', lat: 38.7223, lng: -78.1690, countries: ['US'] },
      { name: 'US West (Oregon)', lat: 45.5152, lng: -122.6784, countries: ['US'] },
      { name: 'Europe (Ireland)', lat: 53.3498, lng: -6.2603, countries: ['IE', 'GB'] },
      { name: 'Europe (Frankfurt)', lat: 50.1109, lng: 8.6821, countries: ['DE'] },
      { name: 'Asia Pacific (Tokyo)', lat: 35.6762, lng: 139.6503, countries: ['JP'] },
      { name: 'Asia Pacific (Singapore)', lat: 1.3521, lng: 103.8198, countries: ['SG'] },
      { name: 'Asia Pacific (Sydney)', lat: -33.8688, lng: 151.2093, countries: ['AU'] },
      { name: 'Canada (Central)', lat: 43.6532, lng: -79.3832, countries: ['CA'] }
    ]
  },
  'Okta': {
    regions: [
      { name: 'US Production', lat: 37.7749, lng: -122.4194, countries: ['US'] },
      { name: 'EU Production', lat: 52.3676, lng: 4.9041, countries: ['NL', 'DE', 'GB'] },
      { name: 'Preview Environment', lat: 47.6062, lng: -122.3321, countries: ['US'] }
    ]
  },
  'SendGrid': {
    regions: [
      { name: 'US West', lat: 37.7749, lng: -122.4194, countries: ['US'] },
      { name: 'US East', lat: 40.7128, lng: -74.0060, countries: ['US'] },
      { name: 'Europe', lat: 53.3498, lng: -6.2603, countries: ['IE', 'GB', 'DE'] },
      { name: 'Asia Pacific', lat: 1.3521, lng: 103.8198, countries: ['SG', 'JP'] }
    ]
  },
  'Slack': {
    regions: [
      { name: 'US', lat: 37.7749, lng: -122.4194, countries: ['US'] },
      { name: 'Europe', lat: 53.3498, lng: -6.2603, countries: ['IE', 'GB', 'DE', 'FR'] },
      { name: 'Australia', lat: -33.8688, lng: 151.2093, countries: ['AU'] },
      { name: 'Japan', lat: 35.6762, lng: 139.6503, countries: ['JP'] }
    ]
  },
  'Datadog': {
    regions: [
      { name: 'US1 (East)', lat: 40.7128, lng: -74.0060, countries: ['US'] },
      { name: 'US3 (West)', lat: 37.7749, lng: -122.4194, countries: ['US'] },
      { name: 'EU (Ireland)', lat: 53.3498, lng: -6.2603, countries: ['IE', 'GB'] },
      { name: 'EU (Germany)', lat: 52.5200, lng: 13.4050, countries: ['DE'] },
      { name: 'AP1 (Japan)', lat: 35.6762, lng: 139.6503, countries: ['JP'] }
    ]
  },
  'Zscaler': {
    regions: [
      { name: 'Americas', lat: 37.7749, lng: -122.4194, countries: ['US', 'CA', 'BR'] },
      { name: 'EMEA', lat: 51.5074, lng: -0.1278, countries: ['GB', 'DE', 'FR', 'IT'] },
      { name: 'APAC', lat: 35.6762, lng: 139.6503, countries: ['JP', 'SG', 'AU', 'IN'] }
    ]
  }
};

// Location keywords to extract regions from incident descriptions
const LOCATION_KEYWORDS = {
  'North America': ['north america', 'na', 'us-east', 'us-west', 'usa', 'canada', 'virginia', 'oregon', 'california'],
  'Europe': ['europe', 'eu', 'emea', 'ireland', 'dublin', 'frankfurt', 'london', 'amsterdam', 'germany'],
  'Asia Pacific': ['asia', 'apac', 'tokyo', 'singapore', 'sydney', 'japan', 'australia', 'hong kong'],
  'Global': ['global', 'worldwide', 'all regions', 'multiple regions', 'international']
};

export default function WorldMap({ 
  cloudflareIncidents = [], 
  zscalerUpdates = [], 
  oktaUpdates = [], 
  sendgridUpdates = [], 
  slackUpdates = [], 
  datadogUpdates = [], 
  awsUpdates = [],
  selectedServices = [],
  showHistoric = false // true for last 7 days, false for current active issues
}) {
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [hoveredIssue, setHoveredIssue] = useState(null);

  // Debug logging to understand data flow
  useEffect(() => {
    // Data flow logging removed for production
  }, [cloudflareIncidents, zscalerUpdates, oktaUpdates, sendgridUpdates, slackUpdates, datadogUpdates, awsUpdates, selectedServices, showHistoric]);

  // Debug log processed issues
  useEffect(() => {
    // Issue processing logging removed for production
  }, [locationIssues, regionData]);

  // Filter and analyze issues by location
  const locationIssues = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const issues = [];

    // Helper to check if issue is recent (last 7 days)
    const isRecent = (date) => {
      const issueDate = new Date(date);
      return !isNaN(issueDate) && issueDate >= sevenDaysAgo;
    };

    // Helper to check if issue is currently active
    const isActive = (issue, provider) => {
      const text = `${issue.title || issue.name || ''} ${issue.description || ''}`.toLowerCase();
      const resolvedKeywords = ['resolved', 'closed', 'completed', 'fixed', 'restored'];
      
      // Check for resolved status
      if (provider === 'cloudflare' && issue.resolved_at) {
        return false;
      }
      
      return !resolvedKeywords.some(keyword => text.includes(keyword));
    };

    // Helper to extract affected regions from text
    const extractRegions = (text, provider) => {
      const affectedRegions = [];
      const textLower = text.toLowerCase();
      
      // Check for location keywords
      Object.entries(LOCATION_KEYWORDS).forEach(([region, keywords]) => {
        if (keywords.some(keyword => textLower.includes(keyword))) {
          affectedRegions.push(region);
        }
      });

      // If no specific region found, check if it's a global issue
      const globalKeywords = ['all', 'entire', 'complete', 'total', 'widespread'];
      if (globalKeywords.some(keyword => textLower.includes(keyword))) {
        affectedRegions.push('Global');
      }

      // If still no regions, default to all service regions
      if (affectedRegions.length === 0 && SERVICE_LOCATIONS[provider]) {
        return SERVICE_LOCATIONS[provider].regions.map(r => r.name);
      }

      return affectedRegions;
    };

    // Process each service
    const services = [
      { name: 'Cloudflare', data: cloudflareIncidents, type: 'incidents' },
      { name: 'Zscaler', data: zscalerUpdates, type: 'updates' },
      { name: 'Okta', data: oktaUpdates, type: 'updates' },
      { name: 'SendGrid', data: sendgridUpdates, type: 'updates' },
      { name: 'Slack', data: slackUpdates, type: 'updates' },
      { name: 'Datadog', data: datadogUpdates, type: 'updates' },
      { name: 'AWS', data: awsUpdates, type: 'updates' }
    ];

    services.forEach(({ name, data, type }) => {
      if (!selectedServices.includes(name.toLowerCase())) return;
      if (!Array.isArray(data)) return;

      data.forEach(item => {
        const dateField = type === 'incidents' ? (item.updated_at || item.created_at) : (item.date || item.reported_at);
        
        // Filter based on mode
        if (showHistoric) {
          if (!isRecent(dateField)) return;
        } else {
          if (!isActive(item, name.toLowerCase())) return;
        }

        const text = `${item.title || item.name || ''} ${item.description || item.body || ''}`;
        const regions = extractRegions(text, name);
        const severity = item.impact || item.severity || (text.toLowerCase().includes('critical') ? 'critical' : 
                        text.toLowerCase().includes('major') ? 'major' : 'minor');

        regions.forEach(region => {
          issues.push({
            id: `${name}-${item.id || item.title}-${region}`,
            provider: name,
            title: item.title || item.name,
            description: item.description || item.body || '',
            region,
            severity,
            date: dateField,
            url: item.shortlink || item.link || item.url
          });
        });
      });
    });

    return issues;
  }, [cloudflareIncidents, zscalerUpdates, oktaUpdates, sendgridUpdates, slackUpdates, datadogUpdates, awsUpdates, selectedServices, showHistoric]);

  // Group issues by region for visualization
  const regionData = useMemo(() => {
    const regions = {};
    
    locationIssues.forEach(issue => {
      if (!regions[issue.region]) {
        regions[issue.region] = {
          name: issue.region,
          issues: [],
          maxSeverity: 'minor',
          count: 0
        };
      }
      
      regions[issue.region].issues.push(issue);
      regions[issue.region].count++;
      
      // Update max severity
      const severityOrder = { 'critical': 3, 'major': 2, 'minor': 1 };
      if (severityOrder[issue.severity] > severityOrder[regions[issue.region].maxSeverity]) {
        regions[issue.region].maxSeverity = issue.severity;
      }
    });
    
    return regions;
  }, [locationIssues]);

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return '#dc2626';
      case 'major': return '#ea580c';
      case 'minor': return '#d97706';
      default: return '#6b7280';
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
          <div className="legend-item">
            <div className="legend-dot" style={{ backgroundColor: '#10b981' }}></div>
            <span>Operational</span>
          </div>
        </div>
      </div>

      <div className="world-map-svg-container">
        <svg viewBox="0 0 1000 500" className="world-map-svg">
          {/* World map background */}
          <rect width="1000" height="500" fill="rgba(255, 255, 255, 0.1)" rx="8" />
          
          {/* Better world map SVG paths */}
          <g className="world-continents">
            {/* North America */}
            <path
              d="M 60 140 Q 80 120 120 130 L 180 125 Q 220 120 260 140 L 280 160 Q 285 180 275 200 L 250 220 Q 220 230 190 225 L 150 220 Q 120 215 100 200 L 80 180 Q 65 160 60 140 Z"
              className="continent north-america"
              fill={regionData['North America'] ? getSeverityColor(regionData['North America'].maxSeverity) : 'rgba(255, 255, 255, 0.3)'}
              stroke="rgba(255, 255, 255, 0.5)"
              strokeWidth="1"
              onClick={() => setSelectedRegion('North America')}
              style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
            />
            
            {/* Europe */}
            <path
              d="M 420 120 Q 440 110 470 115 L 510 120 Q 540 125 560 140 L 575 160 Q 570 175 555 185 L 520 190 Q 485 185 455 180 L 430 170 Q 415 155 420 120 Z"
              className="continent europe"
              fill={regionData['Europe'] ? getSeverityColor(regionData['Europe'].maxSeverity) : 'rgba(255, 255, 255, 0.3)'}
              stroke="rgba(255, 255, 255, 0.5)"
              strokeWidth="1"
              onClick={() => setSelectedRegion('Europe')}
              style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
            />
            
            {/* Asia Pacific */}
            <path
              d="M 580 110 Q 620 100 680 105 L 760 110 Q 820 115 860 130 L 880 150 Q 885 170 875 190 L 850 210 Q 800 220 740 215 L 680 210 Q 630 205 590 195 L 575 175 Q 575 140 580 110 Z"
              className="continent asia-pacific"
              fill={regionData['Asia Pacific'] ? getSeverityColor(regionData['Asia Pacific'].maxSeverity) : 'rgba(255, 255, 255, 0.3)'}
              stroke="rgba(255, 255, 255, 0.5)"
              strokeWidth="1"
              onClick={() => setSelectedRegion('Asia Pacific')}
              style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
            />
            
            {/* Australia */}
            <path
              d="M 720 310 Q 750 300 780 305 L 820 310 Q 850 315 865 330 L 870 350 Q 865 365 850 370 L 815 375 Q 780 370 750 365 L 725 360 Q 715 345 720 310 Z"
              className="continent australia"
              fill={regionData['Australia'] ? getSeverityColor(regionData['Australia'].maxSeverity) : 'rgba(255, 255, 255, 0.3)'}
              stroke="rgba(255, 255, 255, 0.5)"
              strokeWidth="1"
              onClick={() => setSelectedRegion('Australia')}
              style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
            />
            
            {/* South America */}
            <path
              d="M 200 250 Q 220 240 245 245 L 275 250 Q 295 255 305 275 L 310 320 Q 305 360 285 380 L 260 395 Q 235 400 210 390 L 190 370 Q 180 340 185 310 L 190 280 Q 195 260 200 250 Z"
              className="continent south-america"
              fill={regionData['South America'] ? getSeverityColor(regionData['South America'].maxSeverity) : 'rgba(255, 255, 255, 0.3)'}
              stroke="rgba(255, 255, 255, 0.5)"
              strokeWidth="1"
              onClick={() => setSelectedRegion('South America')}
              style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
            />
            
            {/* Africa */}
            <path
              d="M 380 200 Q 400 190 425 195 L 455 200 Q 485 205 505 225 L 520 260 Q 515 300 495 330 L 470 355 Q 445 365 420 360 L 395 350 Q 375 330 370 300 L 375 270 Q 380 235 380 200 Z"
              className="continent africa"
              fill={regionData['Africa'] ? getSeverityColor(regionData['Africa'].maxSeverity) : 'rgba(255, 255, 255, 0.3)'}
              stroke="rgba(255, 255, 255, 0.5)"
              strokeWidth="1"
              onClick={() => setSelectedRegion('Africa')}
              style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
            />
          </g>

          {/* Issue markers with better positioning */}
          {Object.entries(regionData).map(([regionName, region]) => {
            // Position markers based on region
            const positions = {
              'North America': { x: 170, y: 165 },
              'Europe': { x: 495, y: 155 },
              'Asia Pacific': { x: 720, y: 160 },
              'Australia': { x: 790, y: 340 },
              'South America': { x: 250, y: 320 },
              'Africa': { x: 440, y: 280 },
              'Global': { x: 500, y: 100 }
            };
            
            const pos = positions[regionName] || { x: 500, y: 250 };
            const radius = Math.min(12 + region.count * 3, 25);
            
            return (
              <g key={regionName} className="issue-marker-group">
                {/* Pulsing circle for active issues */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={radius + 5}
                  fill={getSeverityColor(region.maxSeverity)}
                  opacity="0.3"
                  className="issue-marker-pulse"
                  style={{
                    animation: region.count > 0 ? 'pulse 2s infinite' : 'none'
                  }}
                />
                
                {/* Main issue marker */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={radius}
                  fill={getSeverityColor(region.maxSeverity)}
                  opacity={0.9}
                  className="issue-marker"
                  onMouseEnter={(e) => setHoveredIssue({ 
                    region: { ...region, name: regionName }, 
                    x: e.clientX, 
                    y: e.clientY 
                  })}
                  onMouseLeave={() => setHoveredIssue(null)}
                  onClick={() => setSelectedRegion(regionName)}
                  style={{ 
                    cursor: 'pointer',
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                  }}
                />
                
                {/* Issue count text */}
                <text
                  x={pos.x}
                  y={pos.y + 4}
                  textAnchor="middle"
                  className="issue-count"
                  fill="white"
                  fontSize="12"
                  fontWeight="bold"
                  style={{
                    textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                    pointerEvents: 'none'
                  }}
                >
                  {region.count}
                </text>
              </g>
            );
          })}
          
          {/* Region labels */}
          <g className="region-labels" fill="rgba(255, 255, 255, 0.8)" fontSize="11" fontWeight="500">
            <text x="170" y="140" textAnchor="middle">North America</text>
            <text x="495" y="135" textAnchor="middle">Europe</text>
            <text x="720" y="140" textAnchor="middle">Asia Pacific</text>
            <text x="790" y="400" textAnchor="middle">Australia</text>
            <text x="250" y="410" textAnchor="middle">South America</text>
            <text x="440" y="390" textAnchor="middle">Africa</text>
          </g>
        </svg>
      </div>

      {/* Tooltip */}
      {hoveredIssue && (
        <div 
          className="map-tooltip"
          style={{
            position: 'fixed',
            left: hoveredIssue.x + 10,
            top: hoveredIssue.y - 10,
            zIndex: 1000
          }}
        >
          <div className="tooltip-header">
            <strong>{hoveredIssue.region.name}</strong>
          </div>
          <div className="tooltip-content">
            <div>{hoveredIssue.region.count} active issue{hoveredIssue.region.count !== 1 ? 's' : ''}</div>
            <div>Highest severity: {hoveredIssue.region.maxSeverity}</div>
          </div>
        </div>
      )}

      {/* Region details panel */}
      {selectedRegion && regionData[selectedRegion] && (
        <div className="region-details-panel">
          <div className="panel-header">
            <h3>{selectedRegion} - Service Issues</h3>
            <button 
              className="close-panel"
              onClick={() => setSelectedRegion(null)}
            >
              ×
            </button>
          </div>
          <div className="panel-content">
            {regionData[selectedRegion].issues.map(issue => (
              <div key={issue.id} className="issue-item">
                <div className="issue-header">
                  <span className="issue-provider">{issue.provider}</span>
                  <span 
                    className="issue-severity"
                    style={{ color: getSeverityColor(issue.severity) }}
                  >
                    {issue.severity}
                  </span>
                </div>
                <div className="issue-title">{issue.title}</div>
                <div className="issue-date">
                  {new Date(issue.date).toLocaleString()}
                </div>
                {issue.url && (
                  <a 
                    href={issue.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="issue-link"
                  >
                    View details →
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary stats */}
      <div className="map-summary">
        <div className="summary-item">
          <span className="summary-label">Total Issues:</span>
          <span className="summary-value">{locationIssues.length}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Affected Regions:</span>
          <span className="summary-value">{Object.keys(regionData).length}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Mode:</span>
          <span className="summary-value">{showHistoric ? 'Last 7 Days' : 'Current Active'}</span>
        </div>
      </div>
    </div>
  );
}
