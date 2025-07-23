import React from 'react';
import { Suspense, useState } from 'react';
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
  showHistoric: initialShowHistoric = false 
}) {  // Use the parent's selected services directly instead of creating local state
  // This ensures consistency with the main app's service selection
  const selectedServices = initialSelectedServices;
  
  // Add internal state for historic toggle in the widget
  const [showHistoric, setShowHistoric] = useState(initialShowHistoric);

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
    <div className="world-map-widget">
      {/* Left Sidebar Menu */}
      <div className="widget-sidebar">
        <div className="sidebar-header">
          <h3 className="sidebar-title">🌍 Global Overview</h3>
        </div>
        
        <div className="sidebar-content">
          {/* Quick Stats */}
          <div className="status-summary">
            <div className="summary-stat">
              <span className="stat-number">{totalIssues}</span>
              <span className="stat-label">Issues Found</span>
            </div>
            <div className="summary-stat">
              <span className="stat-number">{selectedServices.length}</span>
              <span className="stat-label">Services</span>
            </div>
          </div>
          
          {/* Severity Legend */}
          <div className="sidebar-legend">
            <h4 className="legend-title">Severity</h4>
            <div className="legend-items">
              <div className="legend-item">
                <div className="legend-dot critical"></div>
                <span>Critical</span>
              </div>
              <div className="legend-item">
                <div className="legend-dot major"></div>
                <span>Major</span>
              </div>
              <div className="legend-item">
                <div className="legend-dot minor"></div>
                <span>Minor</span>
              </div>
            </div>
          </div>
          
          {/* Interactive View Mode Toggle */}
          <div className="mode-toggle-section">
            <h4 className="toggle-title">Time Range</h4>
            <div className="mode-toggle">
              <button 
                className={`toggle-btn ${!showHistoric ? 'active' : ''}`}
                onClick={() => setShowHistoric(false)}
              >
                Live Issues
              </button>
              <button 
                className={`toggle-btn ${showHistoric ? 'active' : ''}`}
                onClick={() => setShowHistoric(true)}
              >
                Last 7 Days
              </button>
            </div>
            <div className="mode-description">
              {showHistoric ? 
                'Showing all issues from the past 7 days' : 
                'Showing only current unresolved issues'
              }
            </div>
          </div>
        </div>
      </div>
      
      {/* Map Container */}
      <div className="widget-map-container">
        <Suspense fallback={
          <div className="map-loading">
            <div className="loading-spinner"></div>
            <p>Loading global service status map...</p>
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
            showHistoric={showHistoric}
            isWidget={true}
          />
        </Suspense>
      </div>
    </div>
  );
}
