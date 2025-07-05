import React, { useState } from 'react';
import './AddCustomService.css';

const AddCustomService = ({ onAddService, onCancel, existingServices = [] }) => {
  const [formData, setFormData] = useState({
    name: '',
    feedUrl: '',
    description: '',
    color: '#007dc1',
    alertTypes: {
      incidents: true,
      maintenance: false,
      degradation: true
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewData, setPreviewData] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleAlertTypeChange = (alertType) => {
    setFormData(prev => ({
      ...prev,
      alertTypes: {
        ...prev.alertTypes,
        [alertType]: !prev.alertTypes[alertType]
      }
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Service name is required');
      return false;
    }
    
    if (!formData.feedUrl.trim()) {
      setError('RSS feed URL is required');
      return false;
    }
    
    // Check if service name already exists
    if (existingServices.some(service => 
      service.name.toLowerCase() === formData.name.trim().toLowerCase()
    )) {
      setError('A service with this name already exists');
      return false;
    }
    
    // Validate URL format
    try {
      new URL(formData.feedUrl);
    } catch {
      setError('Please enter a valid URL');
      return false;
    }
    
    return true;
  };

  const handlePreview = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    setError('');
    setPreviewData(null);
    
    try {
      // For development, we'll use a CORS proxy or direct fetch
      const proxyUrl = 'https://api.allorigins.win/raw?url=';
      const targetUrl = encodeURIComponent(formData.feedUrl.trim());
      const fetchUrl = `${proxyUrl}${targetUrl}`;
      
      console.log('Fetching RSS feed:', formData.feedUrl.trim());
      
      const response = await fetch(fetchUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch RSS feed`);
      }
      
      const xmlText = await response.text();
      
      // Parse the RSS feed directly in the browser
      const items = parseCustomRSS(xmlText, 5);
      const status = determineStatusFromItems(items);
      
      const data = {
        serviceName: formData.name.trim(),
        feedUrl: formData.feedUrl.trim(),
        status,
        updates: items,
        lastUpdated: new Date().toISOString(),
        itemCount: items.length
      };
      
      setPreviewData(data);
      
    } catch (err) {
      console.error('Preview error:', err);
      setError(err.message || 'Failed to preview RSS feed. Please check the URL and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    if (!previewData) {
      setError('Please preview the RSS feed first');
      return;
    }
    
    // Generate a unique ID for the custom service
    const serviceId = `custom-${formData.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    
    const customService = {
      id: serviceId,
      name: formData.name.trim(),
      description: formData.description.trim() || 'Custom RSS feed integration',
      feedUrl: formData.feedUrl.trim(),
      color: formData.color,
      alertTypes: Object.entries(formData.alertTypes)
        .filter(([_, enabled]) => enabled)
        .map(([type, _]) => ({
          id: type,
          name: type.charAt(0).toUpperCase() + type.slice(1),
          description: `${type} notifications`,
          default: true
        })),
      isCustom: true,
      logo: null, // Will use a default icon
      previewData
    };
    
    onAddService(customService);
  };

  return (
    <div className="add-custom-service-overlay">
      <div className="add-custom-service-modal">
        <div className="modal-header">
          <h2>Add Custom RSS Integration</h2>
          <button className="close-button" onClick={onCancel} aria-label="Close">×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="custom-service-form">
          <div className="form-group">
            <label htmlFor="serviceName">Service Name *</label>
            <input
              id="serviceName"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g., My Custom Service"
              maxLength={50}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="feedUrl">RSS Feed URL *</label>
            <input
              id="feedUrl"
              type="url"
              name="feedUrl"
              value={formData.feedUrl}
              onChange={handleInputChange}
              placeholder="https://example.com/status.rss"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="description">Description (Optional)</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Brief description of this service"
              maxLength={200}
              rows={3}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="color">Card Color</label>
            <div className="color-input-group">
              <input
                id="color"
                type="color"
                name="color"
                value={formData.color}
                onChange={handleInputChange}
              />
              <span className="color-preview" style={{ backgroundColor: formData.color }}></span>
            </div>
          </div>
          
          <div className="form-group">
            <label>Alert Types</label>
            <div className="alert-types">
              {Object.entries(formData.alertTypes).map(([type, enabled]) => (
                <label key={type} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={() => handleAlertTypeChange(type)}
                  />
                  <span className="checkbox-text">{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                </label>
              ))}
            </div>
          </div>
          
          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}
          
          <div className="form-actions">
            <button
              type="button"
              onClick={handlePreview}
              disabled={isLoading || !formData.name.trim() || !formData.feedUrl.trim()}
              className="preview-button"
            >
              {isLoading ? (
                <>
                  <span className="loading-spinner"></span>
                  Testing Feed...
                </>
              ) : (
                'Preview RSS Feed'
              )}
            </button>
            
            <div className="submit-actions">
              <button type="button" onClick={onCancel} className="cancel-button">
                Cancel
              </button>
              <button
                type="submit"
                disabled={!previewData || isLoading}
                className="submit-button"
              >
                Add Service
              </button>
            </div>
          </div>
        </form>
        
        {previewData && (
          <div className="preview-section">
            <h3>RSS Feed Preview</h3>
            <div className="preview-status">
              <span className={`status-indicator ${previewData.status.toLowerCase().replace(/\s+/g, '-')}`}>
                {previewData.status}
              </span>
              <span className="item-count">{previewData.itemCount} items found</span>
            </div>
            
            {previewData.updates && previewData.updates.length > 0 && (
              <div className="preview-items">
                <h4>Recent Updates:</h4>
                {previewData.updates.slice(0, 3).map((item, index) => (
                  <div key={index} className="preview-item">
                    <div className="item-title">{item.title}</div>
                    <div className="item-meta">
                      <span className={`event-type ${item.eventType}`}>{item.eventType}</span>
                      {item.date && <span className="item-date">{new Date(item.date).toLocaleDateString()}</span>}
                    </div>
                    {item.description && (
                      <div className="item-description">
                        {item.description.substring(0, 150)}
                        {item.description.length > 150 ? '...' : ''}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// RSS parsing functions for client-side use
function parseCustomRSS(xmlText, maxItems = 25) {
  try {
    // Remove any BOM or whitespace at the start
    const cleanXml = xmlText.trim().replace(/^\uFEFF/, '');
    
    const parser = new DOMParser();
    const xml = parser.parseFromString(cleanXml, 'text/xml');
    
    // Check for parsing errors
    const parserError = xml.querySelector('parsererror');
    if (parserError) {
      throw new Error('XML parsing failed: ' + parserError.textContent);
    }
    
    // Try different RSS formats
    let items = Array.from(xml.querySelectorAll('item')); // RSS 2.0
    if (items.length === 0) {
      items = Array.from(xml.querySelectorAll('entry')); // Atom
    }
    
    if (items.length === 0) {
      console.warn('[RSS] No items found in feed');
      return [];
    }
    
    return items.slice(0, maxItems).map((item, index) => {
      // Handle both RSS and Atom formats
      const isAtom = item.tagName === 'entry';
      
      const title = isAtom 
        ? item.querySelector('title')?.textContent?.trim() || ''
        : item.querySelector('title')?.textContent?.trim() || '';
        
      const link = isAtom
        ? item.querySelector('link')?.getAttribute('href') || item.querySelector('link')?.textContent?.trim() || ''
        : item.querySelector('link')?.textContent?.trim() || '';
        
      const dateEl = isAtom
        ? item.querySelector('updated, published')
        : item.querySelector('pubDate, dc\\:date, date');
      const date = dateEl?.textContent?.trim() || '';
      
      const description = isAtom
        ? item.querySelector('summary, content')?.textContent?.trim() || ''
        : item.querySelector('description, content\\:encoded')?.textContent?.trim() || '';
      
      // Clean up HTML from description
      const cleanDescription = description.replace(/<[^>]*>/g, '').trim();
      
      return {
        id: `custom-${index}-${Date.now()}`,
        title,
        link,
        date,
        description: cleanDescription,
        eventType: categorizeEvent(title, cleanDescription),
        severity: determineSeverity(title, cleanDescription)
      };
    }).filter(item => item.title); // Filter out items without titles
    
  } catch (error) {
    console.error('[RSS] Error parsing RSS XML:', error);
    throw new Error(`RSS parsing failed: ${error.message}`);
  }
}

function categorizeEvent(title, description) {
  const content = (title + ' ' + description).toLowerCase();
  
  if (content.includes('resolved') || content.includes('fixed') || content.includes('completed')) {
    return 'resolved';
  }
  if (content.includes('investigating') || content.includes('ongoing') || content.includes('incident')) {
    return 'incident';
  }
  if (content.includes('maintenance') || content.includes('scheduled') || content.includes('update')) {
    return 'maintenance';
  }
  if (content.includes('degraded') || content.includes('slow') || content.includes('performance')) {
    return 'degradation';
  }
  if (content.includes('outage') || content.includes('down') || content.includes('unavailable')) {
    return 'outage';
  }
  
  return 'update';
}

function determineSeverity(title, description) {
  const content = (title + ' ' + description).toLowerCase();
  
  if (content.includes('critical') || content.includes('outage') || content.includes('down')) {
    return 'critical';
  }
  if (content.includes('major') || content.includes('significant') || content.includes('widespread')) {
    return 'major';
  }
  if (content.includes('minor') || content.includes('partial') || content.includes('limited')) {
    return 'minor';
  }
  
  return 'info';
}

function determineStatusFromItems(items) {
  if (!items || items.length === 0) {
    return 'Operational';
  }
  
  // Get the most recent items (last 24 hours worth or first 5, whichever is less)
  const recentItems = items.slice(0, 5);
  
  // Check for active incidents
  const hasActiveIncident = recentItems.some(item => {
    const content = (item.title + ' ' + item.description).toLowerCase();
    return (
      item.eventType === 'incident' ||
      item.eventType === 'outage' ||
      item.severity === 'critical' ||
      (content.includes('investigating') && !content.includes('resolved')) ||
      (content.includes('ongoing') && !content.includes('resolved')) ||
      (content.includes('down') && !content.includes('resolved'))
    );
  });
  
  if (hasActiveIncident) {
    return 'Issues Detected';
  }
  
  // Check for degraded performance
  const hasDegradation = recentItems.some(item => {
    return item.eventType === 'degradation' || item.severity === 'major';
  });
  
  if (hasDegradation) {
    return 'Degraded Performance';
  }
  
  // Check for maintenance
  const hasMaintenance = recentItems.some(item => {
    return item.eventType === 'maintenance';
  });
  
  if (hasMaintenance) {
    return 'Under Maintenance';
  }
  
  return 'Operational';
}

export default AddCustomService;
