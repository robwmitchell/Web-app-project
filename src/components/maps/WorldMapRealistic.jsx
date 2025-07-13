import React, { useState, useMemo } from 'react';
import './WorldMap.css';

// Realistic world map component with proper geographic shapes
export default function WorldMapRealistic({ 
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

  // Process all issues and group by region
  const regionData = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const regions = {
      'North America': { count: 0, maxSeverity: 'operational', issues: [] },
      'South America': { count: 0, maxSeverity: 'operational', issues: [] },
      'Europe': { count: 0, maxSeverity: 'operational', issues: [] },
      'Africa': { count: 0, maxSeverity: 'operational', issues: [] },
      'Asia Pacific': { count: 0, maxSeverity: 'operational', issues: [] },
      'Australia': { count: 0, maxSeverity: 'operational', issues: [] },
      'Global': { count: 0, maxSeverity: 'operational', issues: [] }
    };

    // Helper to check if issue is relevant
    const isRelevant = (issue, date) => {
      try {
        const issueDate = new Date(date);
        if (isNaN(issueDate)) return false;
        
        if (showHistoric) {
          return issueDate >= sevenDaysAgo;
        } else {
          // For current active, check if not resolved
          const text = `${issue.title || issue.name || ''} ${issue.description || ''}`.toLowerCase();
          const resolvedKeywords = ['resolved', 'closed', 'completed', 'fixed', 'restored'];
          return !resolvedKeywords.some(keyword => text.includes(keyword));
        }
      } catch (e) {
        return false;
      }
    };

    // Helper to detect region from text
    const detectRegion = (text) => {
      const textLower = text.toLowerCase();
      
      if (textLower.match(/\b(us|usa|united states|america|north america|canada|mexico|virginia|oregon|california|texas|new york|toronto|vancouver)\b/)) {
        return 'North America';
      }
      if (textLower.match(/\b(brazil|argentina|south america|chile|peru|colombia|venezuela)\b/)) {
        return 'South America';
      }
      if (textLower.match(/\b(eu|europe|emea|uk|britain|england|germany|france|ireland|dublin|london|frankfurt|amsterdam|berlin|paris|madrid|rome|stockholm)\b/)) {
        return 'Europe';
      }
      if (textLower.match(/\b(africa|south africa|nigeria|kenya|egypt|morocco)\b/)) {
        return 'Africa';
      }
      if (textLower.match(/\b(asia|apac|japan|tokyo|singapore|hong kong|seoul|mumbai|bangalore|thailand|malaysia|philippines|indonesia|china|india)\b/)) {
        return 'Asia Pacific';
      }
      if (textLower.match(/\b(australia|sydney|melbourne|oceania|new zealand)\b/)) {
        return 'Australia';
      }
      if (textLower.match(/\b(global|worldwide|all regions|multiple regions|international|everywhere)\b/)) {
        return 'Global';
      }
      
      return 'Global'; // Default
    };

    // Helper to determine severity
    const getSeverity = (issue) => {
      const text = `${issue.title || issue.name || ''} ${issue.description || ''}`.toLowerCase();
      
      if (text.match(/\b(critical|emergency|outage|down|offline|complete failure)\b/)) {
        return 'critical';
      }
      if (text.match(/\b(major|significant|degraded|disruption|partial|slow)\b/)) {
        return 'major';
      }
      return 'minor';
    };

    // Process all services
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
      
      service.data.forEach(issue => {
        const issueDate = issue[service.dateField] || issue.date || issue.pubDate;
        if (!isRelevant(issue, issueDate)) return;
        
        const text = `${issue.title || issue.name || ''} ${issue.description || ''}`;
        const region = detectRegion(text);
        const severity = getSeverity(issue);
        
        regions[region].count++;
        regions[region].issues.push({
          ...issue,
          provider: service.name,
          severity,
          region
        });
        
        // Update max severity
        const severityOrder = { 'critical': 3, 'major': 2, 'minor': 1, 'operational': 0 };
        if (severityOrder[severity] > severityOrder[regions[region].maxSeverity]) {
          regions[region].maxSeverity = severity;
        }
      });
    });

    return regions;
  }, [cloudflareIncidents, zscalerUpdates, oktaUpdates, sendgridUpdates, slackUpdates, datadogUpdates, awsUpdates, selectedServices, showHistoric]);

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return '#dc2626';
      case 'major': return '#ea580c';
      case 'minor': return '#d97706';
      default: return '#10b981';
    }
  };

  const getRegionColor = (region) => {
    const data = regionData[region];
    if (!data || data.count === 0) {
      return 'rgba(34, 197, 94, 0.6)'; // Green for operational
    }
    return getSeverityColor(data.maxSeverity);
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
          {/* Ocean background with realistic gradient */}
          <defs>
            <radialGradient id="oceanGradient" cx="50%" cy="50%" r="70%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#1e40af" stopOpacity="0.5" />
            </radialGradient>
            
            {/* Geographic grid */}
            <pattern id="grid" width="50" height="25" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 25" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5"/>
            </pattern>
          </defs>
          
          <rect width="1000" height="500" fill="url(#oceanGradient)" rx="8"/>
          <rect width="1000" height="500" fill="url(#grid)" />
          
          {/* Realistic continent shapes */}
          <g className="world-continents">
            {/* North America - Including USA, Canada, Mexico */}
            <path
              d="M 50 120 
                 C 80 80, 120 60, 160 65
                 C 200 70, 240 75, 280 85
                 C 320 95, 350 115, 370 140
                 C 380 165, 375 190, 365 215
                 C 355 240, 340 260, 320 275
                 C 295 285, 270 280, 245 270
                 C 220 260, 195 245, 175 225
                 C 155 205, 140 185, 130 160
                 C 120 135, 115 110, 125 90
                 C 135 75, 150 85, 170 95
                 C 150 105, 130 115, 110 130
                 C 90 145, 75 160, 65 180
                 C 55 200, 50 180, 45 160
                 C 40 140, 45 120, 50 120 Z
                 
                 M 140 290
                 C 160 285, 180 290, 195 300
                 C 210 310, 215 325, 205 335
                 C 195 345, 180 340, 165 330
                 C 150 320, 140 305, 140 290 Z"
              fill={getRegionColor('North America')}
              stroke="rgba(255, 255, 255, 0.8)"
              strokeWidth="2"
              className="continent-clickable"
              onClick={() => setSelectedRegion('North America')}
              style={{ cursor: 'pointer', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))' }}
            />
            
            {/* South America */}
            <path
              d="M 180 320
                 C 200 315, 220 320, 235 330
                 C 250 340, 260 355, 265 375
                 C 270 395, 268 415, 260 435
                 C 252 455, 240 470, 225 475
                 C 210 480, 195 475, 185 465
                 C 175 455, 170 440, 172 425
                 C 174 410, 180 395, 185 380
                 C 190 365, 195 350, 200 335
                 C 185 325, 180 320, 180 320 Z"
              fill={getRegionColor('South America')}
              stroke="rgba(255, 255, 255, 0.8)"
              strokeWidth="2"
              className="continent-clickable"
              onClick={() => setSelectedRegion('South America')}
              style={{ cursor: 'pointer', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))' }}
            />
            
            {/* Europe */}
            <path
              d="M 450 100
                 C 470 95, 490 100, 510 105
                 C 530 110, 545 120, 555 135
                 C 565 150, 560 165, 550 180
                 C 540 195, 525 205, 510 210
                 C 495 215, 480 210, 470 200
                 C 460 190, 455 175, 460 160
                 C 465 145, 475 130, 485 115
                 C 495 105, 505 100, 515 105
                 C 505 110, 495 115, 485 120
                 C 475 125, 465 130, 455 135
                 C 445 140, 440 150, 445 160
                 C 450 170, 460 175, 470 170
                 C 460 165, 455 155, 460 145
                 C 465 135, 475 130, 485 135
                 C 475 140, 465 145, 455 150
                 C 450 120, 450 100, 450 100 Z"
              fill={getRegionColor('Europe')}
              stroke="rgba(255, 255, 255, 0.8)"
              strokeWidth="2"
              className="continent-clickable"
              onClick={() => setSelectedRegion('Europe')}
              style={{ cursor: 'pointer', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))' }}
            />
            
            {/* Africa */}
            <path
              d="M 470 200
                 C 490 195, 510 200, 525 210
                 C 540 220, 550 235, 555 255
                 C 560 275, 558 295, 553 315
                 C 548 335, 540 355, 530 375
                 C 520 395, 505 410, 485 420
                 C 465 430, 445 425, 430 415
                 C 415 405, 405 390, 410 375
                 C 415 360, 425 345, 435 330
                 C 445 315, 455 300, 460 285
                 C 465 270, 467 255, 470 240
                 C 473 225, 475 210, 470 200 Z"
              fill={getRegionColor('Africa')}
              stroke="rgba(255, 255, 255, 0.8)"
              strokeWidth="2"
              className="continent-clickable"
              onClick={() => setSelectedRegion('Africa')}
              style={{ cursor: 'pointer', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))' }}
            />
            
            {/* Asia - Including China, India, Russia */}
            <path
              d="M 560 90
                 C 590 85, 620 90, 650 95
                 C 680 100, 710 110, 740 125
                 C 770 140, 795 160, 815 185
                 C 835 210, 845 235, 840 260
                 C 835 285, 820 305, 800 320
                 C 780 335, 755 340, 730 335
                 C 705 330, 680 320, 660 305
                 C 640 290, 625 270, 615 250
                 C 605 230, 600 210, 605 190
                 C 610 170, 620 150, 635 135
                 C 650 120, 670 110, 690 105
                 C 710 100, 730 105, 750 115
                 C 730 110, 710 105, 690 110
                 C 670 115, 650 125, 635 140
                 C 620 155, 610 175, 615 195
                 C 620 215, 635 230, 650 240
                 C 665 250, 680 255, 695 250
                 C 680 245, 665 235, 655 220
                 C 645 205, 640 185, 650 170
                 C 660 155, 675 145, 690 140
                 C 675 135, 660 140, 650 150
                 C 640 160, 635 175, 645 185
                 C 655 195, 670 200, 685 195
                 C 670 190, 655 180, 650 165
                 C 580 120, 570 105, 560 90 Z"
              fill={getRegionColor('Asia Pacific')}
              stroke="rgba(255, 255, 255, 0.8)"
              strokeWidth="2"
              className="continent-clickable"
              onClick={() => setSelectedRegion('Asia Pacific')}
              style={{ cursor: 'pointer', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))' }}
            />
            
            {/* Australia and Oceania */}
            <path
              d="M 720 330
                 C 745 325, 770 330, 790 340
                 C 810 350, 825 365, 830 380
                 C 835 395, 830 410, 820 420
                 C 810 430, 795 435, 780 430
                 C 765 425, 750 415, 740 400
                 C 730 385, 725 370, 730 355
                 C 735 340, 745 330, 760 325
                 C 745 322, 730 325, 720 330 Z
                 
                 M 860 310
                 C 870 305, 880 310, 885 320
                 C 890 330, 885 340, 875 345
                 C 865 350, 855 345, 850 335
                 C 845 325, 850 315, 860 310 Z"
              fill={getRegionColor('Australia')}
              stroke="rgba(255, 255, 255, 0.8)"
              strokeWidth="2"
              className="continent-clickable"
              onClick={() => setSelectedRegion('Australia')}
              style={{ cursor: 'pointer', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))' }}
            />
          </g>
          
          {/* Enhanced issue indicators */}
          {Object.entries(regionData).map(([region, data]) => {
            const positions = {
              'North America': { x: 200, y: 180 },
              'South America': { x: 215, y: 400 },
              'Europe': { x: 500, y: 160 },
              'Africa': { x: 490, y: 310 },
              'Asia Pacific': { x: 700, y: 200 },
              'Australia': { x: 775, y: 375 },
              'Global': { x: 900, y: 60 }
            };
            
            const pos = positions[region];
            if (!pos || data.count === 0) return null;
            
            const severityColor = getSeverityColor(data.maxSeverity);
            
            return (
              <g key={region} className="issue-indicator-group">
                {/* Animated pulse rings */}
                <circle
                  cx={pos.x} cy={pos.y} r="28"
                  fill="none" stroke={severityColor} strokeWidth="2" opacity="0.3"
                  className="issue-pulse-outer"
                />
                <circle
                  cx={pos.x} cy={pos.y} r="20"
                  fill="none" stroke={severityColor} strokeWidth="1.5" opacity="0.5"
                  className="issue-pulse-middle"
                />
                
                {/* Main indicator */}
                <circle
                  cx={pos.x} cy={pos.y} r="14"
                  fill={severityColor} stroke="rgba(255,255,255,0.9)" strokeWidth="3"
                  className="issue-indicator-main"
                  onClick={() => setSelectedRegion(region)}
                  style={{ cursor: 'pointer', filter: 'drop-shadow(0 0 12px rgba(0,0,0,0.6))' }}
                />
                
                {/* Count badge */}
                <circle
                  cx={pos.x + 12} cy={pos.y - 12} r="12"
                  fill="rgba(255,255,255,0.95)" stroke={severityColor} strokeWidth="2"
                />
                <text
                  x={pos.x + 12} y={pos.y - 8}
                  textAnchor="middle" fill="#1f2937" fontSize="10" fontWeight="700"
                >
                  {data.count}
                </text>
                
                {/* Labels */}
                <text
                  x={pos.x} y={pos.y + 40}
                  textAnchor="middle" fill="white" fontSize="13" fontWeight="700"
                  style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}
                >
                  {region}
                </text>
                <text
                  x={pos.x} y={pos.y + 56}
                  textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="11" fontWeight="600"
                  style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}
                >
                  {data.count} issue{data.count !== 1 ? 's' : ''}
                </text>
              </g>
            );
          })}
          
          {/* Geographic reference lines */}
          <g opacity="0.15">
            <line x1="0" y1="250" x2="1000" y2="250" stroke="white" strokeWidth="1" strokeDasharray="8,4" />
            <line x1="450" y1="0" x2="450" y2="500" stroke="white" strokeWidth="1" strokeDasharray="8,4" />
          </g>
        </svg>
      </div>

      {/* Region details panel */}
      {selectedRegion && regionData[selectedRegion] && regionData[selectedRegion].count > 0 && (
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
            {regionData[selectedRegion].issues.map((issue, idx) => (
              <div key={idx} className="issue-item">
                <div className="issue-header">
                  <span className="issue-provider">{issue.provider}</span>
                  <span 
                    className="issue-severity"
                    style={{ color: getSeverityColor(issue.severity) }}
                  >
                    {issue.severity}
                  </span>
                </div>
                <div className="issue-title">{issue.title || issue.name}</div>
                <div className="issue-date">
                  {new Date(issue.date || issue.created_at || issue.pubDate).toLocaleString()}
                </div>
                {issue.link && (
                  <a 
                    href={issue.link} 
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
          <span className="summary-value">{Object.values(regionData).reduce((sum, region) => sum + region.count, 0)}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Affected Regions:</span>
          <span className="summary-value">{Object.values(regionData).filter(region => region.count > 0).length}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Mode:</span>
          <span className="summary-value">{showHistoric ? 'Last 7 Days' : 'Current Active'}</span>
        </div>
      </div>
    </div>
  );
}
