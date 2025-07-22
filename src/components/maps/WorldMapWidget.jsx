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
}}) {
  // Local state for widget-specific service selection
  // Default to all services if none initially selected
  const [selectedServices, setSelectedServices] = useState(
    initialSelectedServices?.length > 0 
      ? initialSelectedServices 
      : ['cloudflare', 'zscaler', 'okta', 'sendgrid', 'slack', 'datadog', 'aws']
  );
  const [showServiceFilter, setShowServiceFilter] = useState(false);
  
  const serviceOptions = [
    { id: 'cloudflare', name: 'Cloudflare', count: cloudflareIncidents?.length || 0, color: '#f48120' },
    { id: 'zscaler', name: 'Zscaler', count: zscalerUpdates?.length || 0, color: '#0052cc' },
    { id: 'okta', name: 'Okta', count: oktaUpdates?.length || 0, color: '#007dc1' },
    { id: 'sendgrid', name: 'SendGrid', count: sendgridUpdates?.length || 0, color: '#1a82e2' },
    { id: 'slack', name: 'Slack', count: slackUpdates?.length || 0, color: '#4a154b' },
    { id: 'datadog', name: 'Datadog', count: datadogUpdates?.length || 0, color: '#632ca6' },
    { id: 'aws', name: 'AWS', count: awsUpdates?.length || 0, color: '#ff9900' }
  ];

  const handleServiceToggle = (serviceId) => {
    if (selectedServices.includes(serviceId)) {
      setSelectedServices(prev => prev.filter(id => id !== serviceId));
    } else {
      setSelectedServices(prev => [...prev, serviceId]);
    }
  };

  const handleSelectAll = () => {
    setSelectedServices(serviceOptions.map(s => s.id));
  };

  const handleSelectNone = () => {
    setSelectedServices([]);
  };

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
          <button 
            className={`filter-toggle ${showServiceFilter ? 'active' : ''}`}
            onClick={() => setShowServiceFilter(!showServiceFilter)}
            title="Filter Services"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"/>
            </svg>
            Filter Services
          </button>
        </div>
      </div>

      {showServiceFilter && (
        <div className="service-filter-panel">
          <div className="filter-controls">
            <button className="filter-action" onClick={handleSelectAll}>
              Select All
            </button>
            <button className="filter-action" onClick={handleSelectNone}>
              Select None
            </button>
          </div>
          
          <div className="service-checkboxes">
            {serviceOptions.map(service => (
              <label key={service.id} className="service-checkbox">
                <input
                  type="checkbox"
                  checked={selectedServices.includes(service.id)}
                  onChange={() => handleServiceToggle(service.id)}
                />
                <div className="checkbox-content">
                  <div 
                    className="service-indicator" 
                    style={{ backgroundColor: service.color }}
                  ></div>
                  <span className="service-name">{service.name}</span>
                  <span className="service-count">({service.count})</span>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}
      
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
