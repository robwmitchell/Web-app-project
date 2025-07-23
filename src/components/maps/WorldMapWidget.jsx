import React, { useState } from 'react';
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
  
  // Use the parent's selected services directly
  const selectedServices = initialSelectedServices;

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
    <div className="fullscreen-map-widget">
      {/* Top Controls Bar */}
      <div className="map-top-controls">
        <div className="controls-left">
          <h3 className="map-title">Global Status Monitor</h3>
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
        
        <div className="controls-center">
          {/* Toggle Controls */}
          <div className="view-controls">
            <button 
              className={`toggle-button ${!localShowHistoric ? 'active' : ''}`}
              onClick={() => setLocalShowHistoric(false)}
            >
              <span className="button-icon">🔴</span>
              <span className="button-text">Live Issues</span>
            </button>
            <button 
              className={`toggle-button ${localShowHistoric ? 'active' : ''}`}
              onClick={() => setLocalShowHistoric(true)}
            >
              <span className="button-icon">📊</span>
              <span className="button-text">Last 7 Days</span>
            </button>
          </div>
        </div>

        <div className="controls-right">
          {/* Legend */}
          <div className="legend-section">
            <div className="legend-list">
              <div className="legend-item">
                <div className="legend-marker critical"></div>
                <span className="legend-text">Critical</span>
              </div>
              <div className="legend-item">
                <div className="legend-marker major"></div>
                <span className="legend-text">Major</span>
              </div>
              <div className="legend-item">
                <div className="legend-marker minor"></div>
                <span className="legend-text">Minor</span>
              </div>
            </div>
          </div>
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