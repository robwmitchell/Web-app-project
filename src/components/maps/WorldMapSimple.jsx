import React, { useState, useMemo } from 'react';
import './WorldMap.css';

// Simple world map component with error boundaries
export default function WorldMapSimple({ 
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

  // Simple issue analysis with better geographic detection
  const issueData = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const allIssues = [];
    
    // Helper to check if issue is recent or active
    const isRelevant = (issue, date) => {
      try {
        const issueDate = new Date(date);
        if (isNaN(issueDate)) return false;
        
        if (showHistoric) {
          return issueDate >= sevenDaysAgo;
        } else {
          // For current active, check if not resolved
          const text = `${issue.title || issue.name || ''} ${issue.description || ''}`.toLowerCase();
          const resolvedKeywords = ['resolved', 'closed', 'completed', 'fixed', 'restored', 'resolved at'];
          return !resolvedKeywords.some(keyword => text.includes(keyword));
        }
      } catch (e) {
        return false;
      }
    };

    // Helper to detect region from issue text
    const detectRegion = (text) => {
      const textLower = text.toLowerCase();
      
      // North America keywords
      if (textLower.match(/\b(us|usa|united states|america|north america|canada|mexico|virginia|oregon|california|texas|new york|toronto|vancouver)\b/)) {
        return 'North America';
      }
      
      // Europe keywords
      if (textLower.match(/\b(eu|europe|emea|uk|britain|england|germany|france|ireland|dublin|london|frankfurt|amsterdam|berlin|paris|madrid|rome|stockholm)\b/)) {
        return 'Europe';
      }
      
      // Asia Pacific keywords
      if (textLower.match(/\b(asia|apac|japan|tokyo|singapore|australia|sydney|hong kong|seoul|mumbai|bangalore|thailand|malaysia|philippines|indonesia)\b/)) {
        return 'Asia Pacific';
      }
      
      // Global keywords
      if (textLower.match(/\b(global|worldwide|all regions|multiple regions|international|everywhere)\b/)) {
        return 'Global';
      }
      
      // Default to Global if no region detected
      return 'Global';
    };

    // Helper to determine severity
    const getSeverity = (issue, provider) => {
      const text = `${issue.title || issue.name || ''} ${issue.description || ''}`.toLowerCase();
      
      if (text.match(/\b(critical|emergency|outage|down|offline|complete failure)\b/)) {
        return 'critical';
      }
      if (text.match(/\b(major|significant|degraded|disruption|partial|slow)\b/)) {
        return 'major';
      }
      return 'minor';
    };

    // Process Cloudflare incidents
    if (selectedServices.includes('cloudflare') && Array.isArray(cloudflareIncidents)) {
      cloudflareIncidents.forEach(incident => {
        if (isRelevant(incident, incident.created_at || incident.date)) {
          const text = `${incident.name || incident.title || ''} ${incident.description || ''}`;
          allIssues.push({
            id: `cloudflare-${incident.id || Math.random()}`,
            provider: 'Cloudflare',
            title: incident.name || incident.title || 'Unknown Issue',
            date: incident.created_at || incident.date,
            severity: incident.impact === 'critical' ? 'critical' : getSeverity(incident, 'cloudflare'),
            region: detectRegion(text)
          });
        }
      });
    }

    // Process other services
    const services = [
      { name: 'Zscaler', data: zscalerUpdates, id: 'zscaler' },
      { name: 'Okta', data: oktaUpdates, id: 'okta' },
      { name: 'SendGrid', data: sendgridUpdates, id: 'sendgrid' },
      { name: 'Slack', data: slackUpdates, id: 'slack' },
      { name: 'Datadog', data: datadogUpdates, id: 'datadog' },
      { name: 'AWS', data: awsUpdates, id: 'aws' }
    ];

    services.forEach(service => {
      if (selectedServices.includes(service.id) && Array.isArray(service.data)) {
        service.data.forEach((update, index) => {
          if (isRelevant(update, update.date || update.pubDate)) {
            const text = `${update.title || ''} ${update.description || ''}`;
            allIssues.push({
              id: `${service.id}-${index}`,
              provider: service.name,
              title: update.title || 'Service Update',
              date: update.date || update.pubDate,
              severity: getSeverity(update, service.name),
              region: detectRegion(text)
            });
          }
        });
      }
    });

    return allIssues;
  }, [cloudflareIncidents, zscalerUpdates, oktaUpdates, sendgridUpdates, slackUpdates, datadogUpdates, awsUpdates, selectedServices, showHistoric]);

  // Regional data aggregation
  const regionData = useMemo(() => {
    const regions = {
      'North America': { issues: [], count: 0, severity: 'operational' },
      'Europe': { issues: [], count: 0, severity: 'operational' },
      'Asia Pacific': { issues: [], count: 0, severity: 'operational' },
      'Global': { issues: [], count: 0, severity: 'operational' }
    };

    issueData.forEach(issue => {
      const region = issue.region || 'Global';
      if (regions[region]) {
        regions[region].issues.push(issue);
        regions[region].count++;
        
        // Update severity (critical > major > minor)
        if (issue.severity === 'critical' || regions[region].severity === 'operational') {
          regions[region].severity = issue.severity;
        } else if (issue.severity === 'major' && regions[region].severity !== 'critical') {
          regions[region].severity = issue.severity;
        }
      }
    });

    return regions;
  }, [issueData]);

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return '#dc2626';
      case 'major': return '#ea580c';
      case 'minor': return '#d97706';
      default: return 'rgba(255, 255, 255, 0.3)';
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
          <rect width="1000" height="500" fill="rgba(255, 255, 255, 0.05)" rx="8" />
          
          {/* World map continents */}
          <g className="world-continents">
            {/* North America */}
            <path
              d="M158 110L180 95L220 100L250 120L280 110L290 130L285 160L270 180L250 200L230 220L200 240L170 250L140 240L120 220L110 200L100 180L105 160L120 140L140 125L158 110Z"
              fill={getSeverityColor(regionData['North America'].severity)}
              stroke="rgba(255, 255, 255, 0.6)"
              strokeWidth="1.5"
              className="continent north-america"
              onClick={() => setSelectedRegion('North America')}
              style={{ cursor: 'pointer', opacity: 0.85 }}
            />
            
            {/* South America */}
            <path
              d="M200 260L220 250L240 270L250 300L245 340L235 380L225 410L210 440L195 450L180 440L170 410L165 380L170 340L180 300L190 270L200 260Z"
              fill={getSeverityColor(regionData['North America'].severity)}
              stroke="rgba(255, 255, 255, 0.6)"
              strokeWidth="1.5"
              className="continent south-america"
              onClick={() => setSelectedRegion('North America')}
              style={{ cursor: 'pointer', opacity: 0.85 }}
            />

            {/* Europe */}
            <path
              d="M480 120L520 115L540 125L550 140L545 160L535 175L520 185L500 190L480 185L465 175L455 160L450 140L460 125L480 120Z"
              fill={getSeverityColor(regionData['Europe'].severity)}
              stroke="rgba(255, 255, 255, 0.6)"
              strokeWidth="1.5"
              className="continent europe"
              onClick={() => setSelectedRegion('Europe')}
              style={{ cursor: 'pointer', opacity: 0.85 }}
            />

            {/* Africa */}
            <path
              d="M450 200L490 195L520 210L530 240L525 280L515 320L500 360L480 390L460 400L440 390L425 360L420 320L425 280L435 240L450 200Z"
              fill={getSeverityColor(regionData['Europe'].severity)}
              stroke="rgba(255, 255, 255, 0.6)"
              strokeWidth="1.5"
              className="continent africa"
              onClick={() => setSelectedRegion('Europe')}
              style={{ cursor: 'pointer', opacity: 0.85 }}
            />

            {/* Asia */}
            <path
              d="M550 110L620 105L680 115L730 125L780 140L820 160L830 180L825 200L810 220L780 240L740 250L700 245L660 240L620 235L580 230L550 220L540 200L545 180L550 160L555 140L550 110Z"
              fill={getSeverityColor(regionData['Asia Pacific'].severity)}
              stroke="rgba(255, 255, 255, 0.6)"
              strokeWidth="1.5"
              className="continent asia"
              onClick={() => setSelectedRegion('Asia Pacific')}
              style={{ cursor: 'pointer', opacity: 0.85 }}
            />

            {/* Australia */}
            <path
              d="M720 350L760 345L800 355L820 375L815 395L800 405L760 410L720 405L705 395L700 375L705 355L720 350Z"
              fill={getSeverityColor(regionData['Asia Pacific'].severity)}
              stroke="rgba(255, 255, 255, 0.6)"
              strokeWidth="1.5"
              className="continent australia"
              onClick={() => setSelectedRegion('Asia Pacific')}
              style={{ cursor: 'pointer', opacity: 0.85 }}
            />

            {/* Japan */}
            <path
              d="M820 180L840 175L845 185L842 195L835 200L825 195L820 185L820 180Z"
              fill={getSeverityColor(regionData['Asia Pacific'].severity)}
              stroke="rgba(255, 255, 255, 0.6)"
              strokeWidth="1.5"
              className="continent japan"
              onClick={() => setSelectedRegion('Asia Pacific')}
              style={{ cursor: 'pointer', opacity: 0.85 }}
            />
          </g>

          {/* Region labels */}
          <g className="region-labels">
            <text x="200" y="170" textAnchor="middle" fill="white" fontSize="16" fontWeight="700" className="region-label">
              North America
            </text>
            {regionData['North America'].count > 0 && (
              <text x="200" y="190" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="13" fontWeight="600">
                {regionData['North America'].count} issues
              </text>
            )}

            <text x="500" y="155" textAnchor="middle" fill="white" fontSize="16" fontWeight="700" className="region-label">
              Europe
            </text>
            {regionData['Europe'].count > 0 && (
              <text x="500" y="175" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="13" fontWeight="600">
                {regionData['Europe'].count} issues
              </text>
            )}

            <text x="700" y="190" textAnchor="middle" fill="white" fontSize="16" fontWeight="700" className="region-label">
              Asia Pacific
            </text>
            {regionData['Asia Pacific'].count > 0 && (
              <text x="700" y="210" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="13" fontWeight="600">
                {regionData['Asia Pacific'].count} issues
              </text>
            )}

            {/* Global services indicator */}
            <circle
              cx="870"
              cy="80"
              r="50"
              fill={getSeverityColor(regionData['Global'].severity)}
              stroke="rgba(255, 255, 255, 0.6)"
              strokeWidth="2"
              className="global-indicator"
              onClick={() => setSelectedRegion('Global')}
              style={{ cursor: 'pointer', opacity: 0.8 }}
            />
            <text x="870" y="75" textAnchor="middle" fill="white" fontSize="14" fontWeight="700">
              Global
            </text>
            <text x="870" y="88" textAnchor="middle" fill="white" fontSize="14" fontWeight="700">
              Services
            </text>
            {regionData['Global'].count > 0 && (
              <text x="870" y="105" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="12" fontWeight="600">
                {regionData['Global'].count} issues
              </text>
            )}
          </g>

          {/* Pulse animations for active issues */}
          {Object.entries(regionData).map(([regionName, region]) => {
            if (region.count === 0 || region.severity === 'operational') return null;
            
            const positions = {
              'North America': { x: 200, y: 170 },
              'Europe': { x: 500, y: 155 },
              'Asia Pacific': { x: 700, y: 190 },
              'Global': { x: 870, y: 80 }
            };
            
            const pos = positions[regionName];
            if (!pos) return null;

            return (
              <g key={`pulse-${regionName}`}>
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="25"
                  fill="none"
                  stroke={getSeverityColor(region.severity)}
                  strokeWidth="3"
                  opacity="0.8"
                  className="pulse-ring"
                />
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="35"
                  fill="none"
                  stroke={getSeverityColor(region.severity)}
                  strokeWidth="2"
                  opacity="0.4"
                  className="pulse-ring"
                  style={{ animationDelay: '0.5s' }}
                />
              </g>
            );
          })}

          {/* Status indicators for each region */}
          {Object.entries(regionData).map(([regionName, region]) => {
            if (region.count === 0) return null;
            
            const positions = {
              'North America': { x: 230, y: 150 },
              'Europe': { x: 530, y: 135 },
              'Asia Pacific': { x: 730, y: 170 },
              'Global': { x: 900, y: 60 }
            };
            
            const pos = positions[regionName];
            if (!pos) return null;

            return (
              <circle
                key={`status-${regionName}`}
                cx={pos.x}
                cy={pos.y}
                r="8"
                fill={getSeverityColor(region.severity)}
                stroke="white"
                strokeWidth="2"
                className="status-dot"
              />
            );
          })}
        </svg>
      </div>

      {/* Region details panel */}
      {selectedRegion && regionData[selectedRegion] && regionData[selectedRegion].count > 0 && (
        <div className="region-details-panel">
          <div className="panel-header">
            <h3>{selectedRegion} - Service Issues ({regionData[selectedRegion].count})</h3>
            <button 
              className="close-panel"
              onClick={() => setSelectedRegion(null)}
            >
              ×
            </button>
          </div>
          <div className="panel-content">
            {regionData[selectedRegion].issues.slice(0, 10).map((issue, index) => (
              <div key={issue.id || index} className="issue-item">
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
                  {issue.date ? new Date(issue.date).toLocaleString() : 'Unknown date'}
                </div>
              </div>
            ))}
            {regionData[selectedRegion].issues.length > 10 && (
              <div className="issue-item">
                <div className="issue-title">
                  ... and {regionData[selectedRegion].issues.length - 10} more issues
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Summary stats */}
      <div className="map-summary">
        <div className="summary-item">
          <span className="summary-label">Total Issues:</span>
          <span className="summary-value">{issueData.length}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Affected Regions:</span>
          <span className="summary-value">
            {Object.values(regionData).filter(r => r.count > 0).length}
          </span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Mode:</span>
          <span className="summary-value">
            {showHistoric ? 'Last 7 Days' : 'Current Active'}
          </span>
        </div>
      </div>
    </div>
  );
}
