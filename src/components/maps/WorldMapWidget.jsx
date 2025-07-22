import React from 'react';
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
}) {  // Use the parent's selected services directly instead of creating local state
  // This ensures consistency with the main app's service selection
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
    <div className="world-map-widget">
      <div className="widget-header">
        <div className="widget-title-section">
          <h3 className="widget-title">
            🌍 Global Service Status Map
          </h3>
          <div className="widget-stats">
            <span className="stat-item">
              {totalIssues} active issue{totalIssues !== 1 ? 's' : ''}
            </span>
            <span className="stat-item">
              {selectedServices.length} service{selectedServices.length !== 1 ? 's' : ''} monitored
            </span>
          </div>
        </div>
        
        <div className="widget-controls">
          {/* Service filtering is now controlled by the main app */}
          <div className="widget-info">
            Services: {selectedServices.length > 0 ? selectedServices.join(', ') : 'None selected'}
          </div>
        </div>
      </div>
      
      {/* Widget Legend and Stats */}
      <div className="widget-legend-section">
        <div className="widget-legend">
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
      
      {/* Widget Summary Bar */}
      <div className="widget-summary-bar">
        <div className="summary-item">
          <span className="summary-label">Active Issues</span>
          <span className="summary-value">{totalIssues}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Services</span>
          <span className="summary-value">{selectedServices.length}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Mode</span>
          <span className="summary-value">{showHistoric ? '7 Days' : 'Current'}</span>
        </div>
      </div>
    </div>
  );
}
