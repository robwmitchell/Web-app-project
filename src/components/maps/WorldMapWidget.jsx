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
    <div className="google-maps-widget">
      {/* Left Sidebar Menu - Google Maps Style */}
      <div className="maps-sidebar">
        <div className="sidebar-header">
          <h3 className="sidebar-title">Global Status</h3>
          <div className="status-summary">
            <div className="metric">
              <span className="metric-value">{totalIssues}</span>
              <span className="metric-label">Issues</span>
            </div>
            <div className="metric">
              <span className="metric-value">{selectedServices.length}</span>
              <span className="metric-label">Services</span>
            </div>
          </div>
        </div>
        
        {/* Toggle Controls */}
        <div className="view-controls">
          <div className="control-group">
            <label className="control-label">View Mode</label>
            <div className="toggle-buttons">
              <button 
                className={`toggle-button ${!localShowHistoric ? 'active' : ''}`}
                onClick={() => setLocalShowHistoric(false)}
              >
                <span className="button-icon">�</span>
                <span className="button-text">Live Issues</span>
              </button>
              <button 
                className={`toggle-button ${localShowHistoric ? 'active' : ''}`}
                onClick={() => setLocalShowHistoric(true)}
              >
                <span className="button-icon">�</span>
                <span className="button-text">Last 7 Days</span>
              </button>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="legend-section">
          <label className="control-label">Severity Levels</label>
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

      {/* Main Map Area */}
      <div className="maps-main">
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
          />
        </Suspense>
      </div>
    </div>
  );
}