import React, { useState, useEffect } from 'react';
import './ServiceSelectionSplash.css';
import logoImage from './assets/stackstatus1.png';
import { serviceLogos } from './serviceLogos';

const AVAILABLE_SERVICES = [
  {
    id: 'cloudflare',
    name: 'Cloudflare',
    description: 'Web infrastructure and website security',
    logo: serviceLogos.Cloudflare,
    color: '#f38020',
    alertTypes: [
      { id: 'incidents', name: 'Service Incidents', description: 'Critical outages and service disruptions', default: true },
      { id: 'maintenance', name: 'Maintenance Windows', description: 'Scheduled maintenance and updates', default: false },
      { id: 'degradation', name: 'Performance Issues', description: 'Service degradation and slowdowns', default: true }
    ]
  },
  {
    id: 'zscaler',
    name: 'Zscaler',
    description: 'Cloud security and zero trust network access',
    logo: serviceLogos.Zscaler,
    color: '#0066cc',
    alertTypes: [
      { id: 'disruptions', name: 'Service Disruptions', description: 'Service interruptions and outages', default: true },
      { id: 'updates', name: 'Service Updates', description: 'General service announcements', default: false },
      { id: 'degradation', name: 'Performance Issues', description: 'Service degradation alerts', default: true }
    ]
  },
  {
    id: 'okta',
    name: 'Okta',
    description: 'Identity and access management',
    logo: serviceLogos.Okta,
    color: '#007dc1',
    alertTypes: [
      { id: 'incidents', name: 'Service Incidents', description: 'Authentication and SSO issues', default: true },
      { id: 'maintenance', name: 'Maintenance', description: 'Scheduled system maintenance', default: false },
      { id: 'security', name: 'Security Alerts', description: 'Security-related notifications', default: true }
    ]
  },
  {
    id: 'sendgrid',
    name: 'SendGrid',
    description: 'Email delivery and marketing platform',
    logo: serviceLogos.SendGrid,
    color: '#1a82e2',
    alertTypes: [
      { id: 'delivery', name: 'Delivery Issues', description: 'Email delivery problems and delays', default: true },
      { id: 'api', name: 'API Issues', description: 'API service disruptions', default: true },
      { id: 'maintenance', name: 'Maintenance', description: 'Scheduled maintenance windows', default: false }
    ]
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Team collaboration and messaging',
    logo: serviceLogos.Slack,
    color: '#4a154b',
    alertTypes: [
      { id: 'messaging', name: 'Messaging Issues', description: 'Message delivery and sync problems', default: true },
      { id: 'calls', name: 'Voice/Video Calls', description: 'Calling and video conference issues', default: true },
      { id: 'files', name: 'File Sharing', description: 'File upload and sharing problems', default: false }
    ]
  },
  {
    id: 'datadog',
    name: 'Datadog',
    description: 'Monitoring and analytics platform',
    logo: serviceLogos.Datadog,
    color: '#632c41',
    alertTypes: [
      { id: 'monitoring', name: 'Monitoring Issues', description: 'Data collection and alerting problems', default: true },
      { id: 'dashboard', name: 'Dashboard Issues', description: 'UI and visualization problems', default: false },
      { id: 'api', name: 'API Issues', description: 'API service disruptions', default: true }
    ]
  },
  {
    id: 'aws',
    name: 'AWS',
    description: 'Amazon Web Services cloud platform',
    logo: serviceLogos.AWS,
    color: '#ff9900',
    alertTypes: [
      { id: 'compute', name: 'Compute Services', description: 'EC2, Lambda, and compute issues', default: true },
      { id: 'storage', name: 'Storage Services', description: 'S3, EBS, and storage issues', default: true },
      { id: 'network', name: 'Networking', description: 'VPC, CloudFront, and network issues', default: true },
      { id: 'database', name: 'Database Services', description: 'RDS, DynamoDB, and database issues', default: false }
    ]
  }
];

export default function ServiceSelectionSplash({ onServicesSelected }) {
  const [selectedServices, setSelectedServices] = useState(new Set());
  const [selectedAlertTypes, setSelectedAlertTypes] = useState(new Map());
  const [expandedServices, setExpandedServices] = useState(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize default alert types for all services
  useEffect(() => {
    const defaultAlertTypes = new Map();
    AVAILABLE_SERVICES.forEach(service => {
      const defaults = new Set(
        service.alertTypes.filter(type => type.default).map(type => type.id)
      );
      defaultAlertTypes.set(service.id, defaults);
    });
    setSelectedAlertTypes(defaultAlertTypes);
  }, []);

  const toggleService = (serviceId) => {
    const newSelected = new Set(selectedServices);
    if (newSelected.has(serviceId)) {
      newSelected.delete(serviceId);
      // Also collapse the service when unselected
      const newExpanded = new Set(expandedServices);
      newExpanded.delete(serviceId);
      setExpandedServices(newExpanded);
    } else {
      newSelected.add(serviceId);
    }
    setSelectedServices(newSelected);
  };

  const toggleServiceExpansion = (serviceId) => {
    if (!selectedServices.has(serviceId)) return;
    
    const newExpanded = new Set(expandedServices);
    if (newExpanded.has(serviceId)) {
      newExpanded.delete(serviceId);
    } else {
      newExpanded.add(serviceId);
    }
    setExpandedServices(newExpanded);
  };

  const toggleAlertType = (serviceId, alertTypeId) => {
    const newAlertTypes = new Map(selectedAlertTypes);
    const serviceAlerts = new Set(newAlertTypes.get(serviceId) || []);
    
    if (serviceAlerts.has(alertTypeId)) {
      serviceAlerts.delete(alertTypeId);
    } else {
      serviceAlerts.add(alertTypeId);
    }
    
    newAlertTypes.set(serviceId, serviceAlerts);
    setSelectedAlertTypes(newAlertTypes);
  };

  const selectAll = () => {
    setSelectedServices(new Set(AVAILABLE_SERVICES.map(s => s.id)));
    // Reset to default alert types for all services
    const defaultAlertTypes = new Map();
    AVAILABLE_SERVICES.forEach(service => {
      const defaults = new Set(
        service.alertTypes.filter(type => type.default).map(type => type.id)
      );
      defaultAlertTypes.set(service.id, defaults);
    });
    setSelectedAlertTypes(defaultAlertTypes);
  };

  const selectNone = () => {
    setSelectedServices(new Set());
    setExpandedServices(new Set());
  };

  const handleContinue = () => {
    if (selectedServices.size === 0) return;
    
    setIsSubmitting(true);
    
    // Convert Sets to Arrays for localStorage storage
    const alertTypesAsArrays = {};
    selectedAlertTypes.forEach((alertSet, serviceId) => {
      alertTypesAsArrays[serviceId] = Array.from(alertSet);
    });
    
    // Save selection to localStorage
    const serviceConfig = {
      services: [...selectedServices],
      alertTypes: alertTypesAsArrays
    };
    localStorage.setItem('selectedServices', JSON.stringify([...selectedServices]));
    localStorage.setItem('serviceAlertTypes', JSON.stringify(alertTypesAsArrays));
    
    // Simulate a brief loading state
    setTimeout(() => {
      onServicesSelected([...selectedServices], alertTypesAsArrays);
    }, 500);
  };

  return (
    <div className="splash-screen">
      <div className="splash-background">
        <div className="splash-particles"></div>
      </div>
      
      <div className="splash-container">
        <div className="splash-header">
          <div className="splash-logo">
            <img 
              src={logoImage} 
              alt="Stack Status IO Logo" 
              style={{
                height: 80,
                width: 80,
                borderRadius: 12,
                objectFit: 'cover',
                marginBottom: 16
              }}
            />
          </div>
          <p className="splash-subtitle">
            Monitor the services that matter to you. Select the platforms you'd like to track.
          </p>
        </div>

        <div className="service-selection-grid">
          {AVAILABLE_SERVICES.map((service) => (
            <div
              key={service.id}
              className={`service-card ${selectedServices.has(service.id) ? 'selected' : ''} ${expandedServices.has(service.id) ? 'expanded' : ''}`}
              style={{ '--service-color': service.color }}
            >
              <div 
                className="service-main"
                onClick={() => toggleService(service.id)}
              >
                <div className="service-logo">
                  <img 
                    src={service.logo} 
                    alt={`${service.name} logo`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain'
                    }}
                  />
                </div>
                <div className="service-info">
                  <h3>{service.name}</h3>
                  <p>{service.description}</p>
                </div>
                <div className="service-checkbox">
                  {selectedServices.has(service.id) ? '✓' : '○'}
                </div>
              </div>
              
              {selectedServices.has(service.id) && (
                <div className="service-controls">
                  <button
                    className="alert-config-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleServiceExpansion(service.id);
                    }}
                  >
                    <span className="config-icon">⚙️</span>
                    Configure Alerts
                    <span className={`expand-icon ${expandedServices.has(service.id) ? 'expanded' : ''}`}>▼</span>
                  </button>
                  
                  {expandedServices.has(service.id) && (
                    <div className="alert-types">
                      <div className="alert-types-header">
                        <span>Alert Types:</span>
                        <span className="alert-count">
                          {selectedAlertTypes.get(service.id)?.size || 0} selected
                        </span>
                      </div>
                      {service.alertTypes.map((alertType) => (
                        <div
                          key={alertType.id}
                          className={`alert-type-item ${selectedAlertTypes.get(service.id)?.has(alertType.id) ? 'selected' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleAlertType(service.id, alertType.id);
                          }}
                        >
                          <div className="alert-type-info">
                            <span className="alert-type-name">{alertType.name}</span>
                            <span className="alert-type-desc">{alertType.description}</span>
                          </div>
                          <div className="alert-type-checkbox">
                            {selectedAlertTypes.get(service.id)?.has(alertType.id) ? '✓' : '○'}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="splash-actions">
          <div className="quick-actions">
            <button className="quick-action-btn" onClick={selectAll}>
              Select All
            </button>
            <button className="quick-action-btn" onClick={selectNone}>
              Clear All
            </button>
          </div>
          
          <div className="continue-section">
            <p className="selection-count">
              {selectedServices.size} service{selectedServices.size !== 1 ? 's' : ''} selected
            </p>
            <button
              className={`continue-btn ${selectedServices.size === 0 ? 'disabled' : ''}`}
              onClick={handleContinue}
              disabled={selectedServices.size === 0 || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="loading-spinner"></span>
                  Refreshing Dashboard...
                </>
              ) : (
                `Continue with ${selectedServices.size} service${selectedServices.size !== 1 ? 's' : ''}`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
