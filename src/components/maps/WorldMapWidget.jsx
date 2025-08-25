import React, { useState, useEffect } from 'react';
import { Suspense } from 'react';
import './WorldMapWidget.css';

const LeafletWorldMap = React.lazy(() => import('./LeafletWorldMap'));

export default function WorldMapWidget({ 
  cloudflareIncidents = [], 
  zscalerUpdates = [], 
  oktaUpdates = [], 
  sendgridUpdates = [], 
  slackUpdates = [], 
  datadogUpdates = [], 
  awsUpdates = [],
  selectedServices: initialSelectedServices = [],
  showHistoric = false 
}) {
  const [localShowHistoric, setLocalShowHistoric] = useState(showHistoric);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [localSelectedServices, setLocalSelectedServices] = useState(initialSelectedServices);
  const [filteredSeverities, setFilteredSeverities] = useState(['critical', 'major', 'minor']);
  
  // Mobile responsiveness state
  const [isMobile, setIsMobile] = useState(false);
  const [filtersCollapsed, setFiltersCollapsed] = useState(false);

  // Mobile detection effect
  useEffect(() => {
    const checkIsMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      // Collapse filters by default on mobile
      setFiltersCollapsed(mobile);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);
  
  // Map of available services with their display names
  const availableServices = [
    { id: 'cloudflare', name: 'Cloudflare', logo: '/src/assets/cloudflare-logo.svg' },
    { id: 'zscaler', name: 'Zscaler', logo: '/src/assets/Zscaler.svg' },
    { id: 'okta', name: 'Okta', logo: '/src/assets/Okta-logo.svg' },
    { id: 'sendgrid', name: 'SendGrid', logo: '/src/assets/SendGrid.svg' },
    { id: 'slack', name: 'Slack', logo: '/src/assets/slack-logo.png' },
    { id: 'datadog', name: 'Datadog', logo: '/src/assets/datadog-logo.png' },
    { id: 'aws', name: 'AWS', logo: '/src/assets/aws-logo.png' }
  ];
  
  // Toggle service selection
  const toggleService = (serviceId) => {
    setLocalSelectedServices(prev => {
      if (prev.includes(serviceId)) {
        return prev.filter(id => id !== serviceId);
      } else {
        return [...prev, serviceId];
      }
    });
  };
  
  // Toggle severity filter
  const toggleSeverity = (severity) => {
    setFilteredSeverities(prev => {
      if (prev.includes(severity)) {
        return prev.filter(sev => sev !== severity);
      } else {
        return [...prev, severity];
      }
    });
  };
  
  // Use the local selected services
  const selectedServices = localSelectedServices;

  // Count total issues for display
  const totalIssues = [
    ...(selectedServices.includes('cloudflare') ? (cloudflareIncidents || []) : []),
    ...(selectedServices.includes('zscaler') ? (zscalerUpdates || []) : []),
    ...(selectedServices.includes('okta') ? (oktaUpdates || []) : []),
    ...(selectedServices.includes('sendgrid') ? (sendgridUpdates || []) : []),
    ...(selectedServices.includes('slack') ? (slackUpdates || []) : []),
    ...(selectedServices.includes('datadog') ? (datadogUpdates || []) : []),
    ...(selectedServices.includes('aws') ? (awsUpdates || []) : [])
  ].length;

  return (
    <div className={`fullscreen-map-widget ${isMobile ? 'mobile-view' : ''}`}>
      {/* Top Controls Bar */}
      <div className="map-top-controls">
        <div className="controls-left">
          <div className="title-row">
            <h3 className="map-title">Global Status Monitor</h3>
            {isMobile && (
              <button 
                className="mobile-filter-toggle"
                onClick={() => setFiltersCollapsed(!filtersCollapsed)}
                aria-label="Toggle filters"
              >
                <span className="filter-icon">{filtersCollapsed ? '⚙️' : '✕'}</span>
              </button>
            )}
          </div>
          <div className="status-summary">
            <div className="metric">
              <span className="metric-value">{totalIssues}</span>
              <span className="metric-label">Active Issues</span>
            </div>
            <div className="metric">
              <span className="metric-value">{selectedServices.length}</span>
              <span className="metric-label">Services</span>
            </div>
          </div>
        </div>
        
        {/* Collapsible controls for mobile */}
        <div className={`collapsible-controls ${filtersCollapsed ? 'collapsed' : 'expanded'}`}>
          <div className="controls-center">
            {/* Toggle Controls */}
            <div className="view-controls">
              <button 
                className={`toggle-button ${!localShowHistoric ? 'active' : ''}`}
                onClick={() => setLocalShowHistoric(false)}
              >
                <span className="button-icon">🔴</span>
                <span className="button-text">Live</span>
              </button>
              <button 
                className={`toggle-button ${localShowHistoric ? 'active' : ''}`}
                onClick={() => setLocalShowHistoric(true)}
              >
                <span className="button-icon">📊</span>
                <span className="button-text">History</span>
              </button>
            </div>
          </div>

          <div className="controls-right">
            {/* Severity Legend as Filter */}
            <div className="legend-section">
              <div className="legend-list">
                {['critical', 'major', 'minor'].map(severity => (
                  <div 
                    key={severity}
                    className={`legend-item ${filteredSeverities.includes(severity) ? 'active' : 'inactive'}`}
                    onClick={() => toggleSeverity(severity)}
                    title={`Click to ${filteredSeverities.includes(severity) ? 'hide' : 'show'} ${severity} issues`}
                  >
                    <div className={`legend-marker ${severity}`}></div>
                    <span className="legend-text">{severity.charAt(0).toUpperCase() + severity.slice(1)}</span>
                    <span className="checkmark">{filteredSeverities.includes(severity) ? '✓' : ''}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Service Pills Row - Also collapsible on mobile */}
      <div className={`service-pills-row ${filtersCollapsed ? 'collapsed' : 'expanded'}`}>
        <div className="service-pills-container">
          {availableServices.map(service => (
            <div
              key={service.id}
              className={`service-pill ${selectedServices.includes(service.id) ? 'active' : ''}`}
              onClick={() => toggleService(service.id)}
            >
              <img src={service.logo} alt={service.name} className="service-pill-logo" />
              <span className="service-pill-name">{service.name}</span>
              {selectedServices.includes(service.id) && <span className="service-pill-check">✓</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Main Map Container */}
      <div className="map-container">
        {/* Map Area */}
        <div className={`map-area ${selectedIssue ? 'with-details' : ''}`}>
          <Suspense fallback={
            <div className="maps-loading">
              <div className="loading-content">
                <div className="loading-spinner"></div>
                <p className="loading-text">Loading global map...</p>
              </div>
            </div>
          }>
            <LeafletWorldMap
              cloudflareIncidents={cloudflareIncidents}
              zscalerUpdates={zscalerUpdates}
              oktaUpdates={oktaUpdates}
              sendgridUpdates={sendgridUpdates}
              slackUpdates={slackUpdates}
              datadogUpdates={datadogUpdates}
              awsUpdates={awsUpdates}
              selectedServices={selectedServices}
              filteredSeverities={filteredSeverities}
              showHistoric={localShowHistoric}
              isWidget={true}
              onIssueClick={setSelectedIssue}
            />
          </Suspense>
        </div>

        {/* Issue Details Panel */}
        {selectedIssue && (
          <div className="issue-details-panel">
            <div className="details-header">
              <div className="details-title-row">
                <h3 className="details-title">Issue Details</h3>
                <button 
                  className="close-details"
                  onClick={() => setSelectedIssue(null)}
                >
                  ×
                </button>
              </div>
              
              <div className="issue-badges">
                <div className="service-badge" style={{ backgroundColor: getServiceColor(selectedIssue.provider) }}>
                  {selectedIssue.provider}
                </div>
                <div className={`severity-badge severity-${selectedIssue.severity}`}>
                  {selectedIssue.severity}
                </div>
              </div>
            </div>
            
            <div className="details-content">
              <h4 className="issue-title">{selectedIssue.title}</h4>
              
              {selectedIssue.description && (
                <div className="issue-description">
                  <p>{selectedIssue.description}</p>
                </div>
              )}
              
              <div className="issue-meta">
                <div className="meta-row">
                  <span className="meta-label">Location:</span>
                  <span className="meta-value">{selectedIssue.region}</span>
                </div>
                <div className="meta-row">
                  <span className="meta-label">Date:</span>
                  <span className="meta-value">{new Date(selectedIssue.date).toLocaleDateString()}</span>
                </div>
                <div className="meta-row">
                  <span className="meta-label">Time:</span>
                  <span className="meta-value">{new Date(selectedIssue.date).toLocaleTimeString()}</span>
                </div>
                {selectedIssue.coordinates && (
                  <div className="meta-row">
                    <span className="meta-label">Coordinates:</span>
                    <span className="meta-value">{selectedIssue.lat?.toFixed(4)}, {selectedIssue.lng?.toFixed(4)}</span>
                  </div>
                )}
              </div>

              {selectedIssue.aiConfidence && (
                <div className="ai-analysis">
                  <h5>AI Analysis</h5>
                  <div className="meta-row">
                    <span className="meta-label">Confidence:</span>
                    <span className="meta-value">{selectedIssue.aiConfidence}%</span>
                  </div>
                  {selectedIssue.aiReasoning && (
                    <div className="ai-reasoning">
                      <span className="meta-label">Reasoning:</span>
                      <p className="reasoning-text">{selectedIssue.aiReasoning}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function to get service colors
function getServiceColor(provider) {
  const colors = {
    'cloudflare': '#f38020',
    'zscaler': '#0066cc',
    'okta': '#007dc1',
    'sendgrid': '#1a82e2',
    'slack': '#4a154b',
    'datadog': '#632ca6',
    'aws': '#ff9900'
  };
  return colors[provider?.toLowerCase()] || '#667eea';
}