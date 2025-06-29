import React, { useState } from 'react';
import './ServiceSelectionSplash.css';
import logoImage from './assets/stackstatus1.png';
import { serviceLogos } from './serviceLogos';

const AVAILABLE_SERVICES = [
  {
    id: 'cloudflare',
    name: 'Cloudflare',
    description: 'Web infrastructure and website security',
    logo: serviceLogos.Cloudflare,
    color: '#f38020'
  },
  {
    id: 'zscaler',
    name: 'Zscaler',
    description: 'Cloud security and zero trust network access',
    logo: serviceLogos.Zscaler,
    color: '#0066cc'
  },
  {
    id: 'okta',
    name: 'Okta',
    description: 'Identity and access management',
    logo: serviceLogos.Okta,
    color: '#007dc1'
  },
  {
    id: 'sendgrid',
    name: 'SendGrid',
    description: 'Email delivery and marketing platform',
    logo: serviceLogos.SendGrid,
    color: '#1a82e2'
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Team collaboration and messaging',
    logo: serviceLogos.Slack,
    color: '#4a154b'
  },
  {
    id: 'datadog',
    name: 'Datadog',
    description: 'Monitoring and analytics platform',
    logo: serviceLogos.Datadog,
    color: '#632c41'
  },
  {
    id: 'aws',
    name: 'AWS',
    description: 'Amazon Web Services cloud platform',
    logo: serviceLogos.AWS,
    color: '#ff9900'
  }
];

export default function ServiceSelectionSplash({ onServicesSelected }) {
  const [selectedServices, setSelectedServices] = useState(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleService = (serviceId) => {
    const newSelected = new Set(selectedServices);
    if (newSelected.has(serviceId)) {
      newSelected.delete(serviceId);
    } else {
      newSelected.add(serviceId);
    }
    setSelectedServices(newSelected);
  };

  const selectAll = () => {
    setSelectedServices(new Set(AVAILABLE_SERVICES.map(s => s.id)));
  };

  const selectNone = () => {
    setSelectedServices(new Set());
  };

  const handleContinue = () => {
    if (selectedServices.size === 0) return;
    
    setIsSubmitting(true);
    
    // Save selection to localStorage
    localStorage.setItem('selectedServices', JSON.stringify([...selectedServices]));
    
    // Simulate a brief loading state
    setTimeout(() => {
      onServicesSelected([...selectedServices]);
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
              className={`service-card ${selectedServices.has(service.id) ? 'selected' : ''}`}
              onClick={() => toggleService(service.id)}
              style={{ '--service-color': service.color }}
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
