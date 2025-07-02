import React, { useState, useEffect } from 'react';
import './LivePulseCard.css'; // Reuse existing card styles

const CustomServiceCard = ({ 
  service, 
  onClose, 
  isClosed, 
  onToggleShowMore, 
  showMore,
  onReportIssue 
}) => {
  const [serviceData, setServiceData] = useState({
    status: 'Loading...',
    updates: [],
    lastUpdated: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch data from the custom RSS feed
  useEffect(() => {
    const fetchCustomData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Use CORS proxy for development
        const proxyUrl = 'https://api.allorigins.win/raw?url=';
        const targetUrl = encodeURIComponent(service.feedUrl);
        const fetchUrl = `${proxyUrl}${targetUrl}`;
        
        console.log(`Fetching custom RSS for ${service.name}:`, service.feedUrl);
        
        const response = await fetch(fetchUrl);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: Failed to fetch RSS feed`);
        }
        
        const xmlText = await response.text();
        
        // Parse the RSS feed directly in the browser
        const items = parseCustomRSS(xmlText, 25);
        const status = determineStatusFromItems(items);
        
        setServiceData({
          status,
          updates: items || [],
          lastUpdated: new Date()
        });
        
      } catch (err) {
        console.error(`Error fetching custom service data for ${service.name}:`, err);
        setError(err.message);
        setServiceData({
          status: 'Error',
          updates: [],
          lastUpdated: new Date()
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCustomData();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchCustomData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [service.feedUrl, service.name]);

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'operational':
        return '#10b981';
      case 'issues detected':
      case 'error':
        return '#ef4444';
      case 'degraded performance':
        return '#f59e0b';
      case 'under maintenance':
        return '#6366f1';
      default:
        return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'operational':
        return '✅';
      case 'issues detected':
      case 'error':
        return '🔴';
      case 'degraded performance':
        return '🟡';
      case 'under maintenance':
        return '🔧';
      default:
        return '🔄';
    }
  };

  const formatEventType = (eventType) => {
    const typeMap = {
      'incident': '🚨 Incident',
      'resolved': '✅ Resolved',
      'maintenance': '🔧 Maintenance',
      'degradation': '⚠️ Degradation',
      'outage': '🔴 Outage',
      'update': '📢 Update'
    };
    return typeMap[eventType] || '📢 Update';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);
      
      if (diffDays === 0) {
        if (diffHours === 0) {
          const diffMinutes = Math.floor(diffMs / (1000 * 60));
          return diffMinutes <= 1 ? 'Just now' : `${diffMinutes}m ago`;
        }
        return `${diffHours}h ago`;
      } else if (diffDays === 1) {
        return 'Yesterday';
      } else if (diffDays < 7) {
        return `${diffDays}d ago`;
      } else {
        return date.toLocaleDateString();
      }
    } catch {
      return dateString;
    }
  };

  // RSS parsing functions for client-side use (same as in AddCustomService)
  function parseCustomRSS(xmlText, maxItems = 25) {
    try {
      const cleanXml = xmlText.trim().replace(/^\uFEFF/, '');
      const parser = new DOMParser();
      const xml = parser.parseFromString(cleanXml, 'text/xml');
      
      const parserError = xml.querySelector('parsererror');
      if (parserError) {
        throw new Error('XML parsing failed: ' + parserError.textContent);
      }
      
      let items = Array.from(xml.querySelectorAll('item')); // RSS 2.0
      if (items.length === 0) {
        items = Array.from(xml.querySelectorAll('entry')); // Atom
      }
      
      if (items.length === 0) {
        console.warn('[RSS] No items found in feed');
        return [];
      }
      
      return items.slice(0, maxItems).map((item, index) => {
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
      }).filter(item => item.title);
      
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
    
    const recentItems = items.slice(0, 5);
    
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
    
    const hasDegradation = recentItems.some(item => {
      return item.eventType === 'degradation' || item.severity === 'major';
    });
    
    if (hasDegradation) {
      return 'Degraded Performance';
    }
    
    const hasMaintenance = recentItems.some(item => {
      return item.eventType === 'maintenance';
    });
    
    if (hasMaintenance) {
      return 'Under Maintenance';
    }
    
    return 'Operational';
  }

  if (isClosed) {
    return null;
  }

  const displayUpdates = showMore ? serviceData.updates : serviceData.updates.slice(0, 3);
  const hasMoreUpdates = serviceData.updates.length > 3;

  return (
    <div className="live-pulse-card custom-service-card">
      <div className="card-header">
        <div className="service-info">
          <div className="service-logo-container">
            {service.logo ? (
              <img 
                src={service.logo} 
                alt={`${service.name} logo`} 
                className="service-logo"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div 
              className="custom-service-icon" 
              style={{ 
                backgroundColor: service.color,
                display: service.logo ? 'none' : 'flex'
              }}
            >
              📡
            </div>
          </div>
          <div className="service-details">
            <h3 className="service-name">{service.name}</h3>
            <p className="service-description">{service.description}</p>
            <span className="custom-badge">Custom RSS</span>
          </div>
        </div>
        
        <div className="status-section">
          <span className="status-text">{serviceData.status}</span>
          {loading && <div className="loading-spinner"></div>}
        </div>
        <button 
          className="close-card-btn"
          onClick={() => onClose(service.id)}
          title={`Hide ${service.name} card`}
          aria-label={`Hide ${service.name} card`}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="10" cy="10" r="9" fill="#e2e8f0"/>
            <path d="M7 7L13 13M13 7L7 13" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {error && (
        <div className="error-banner">
          <span className="error-icon">⚠️</span>
          <span>Failed to load RSS feed: {error}</span>
        </div>
      )}

      <div className="card-content">
        {serviceData.updates.length > 0 ? (
          <div className="updates-section">
            <h4 className="updates-title">Recent Updates</h4>
            <div className="updates-list">
              {displayUpdates.map((update, index) => (
                <div key={update.id || index} className="update-item">
                  <div className="update-header">
                    <span className="event-type">{formatEventType(update.eventType)}</span>
                    <span className="update-date">{formatDate(update.date)}</span>
                  </div>
                  <h5 className="update-title">{update.title}</h5>
                  {update.description && (
                    <p className="update-description">
                      {update.description.length > 200 
                        ? `${update.description.substring(0, 200)}...`
                        : update.description
                      }
                    </p>
                  )}
                  {update.link && (
                    <a 
                      href={update.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="update-link"
                    >
                      Read more →
                    </a>
                  )}
                </div>
              ))}
            </div>
            
            {hasMoreUpdates && (
              <button 
                className="show-more-btn"
                onClick={() => onToggleShowMore(service.id)}
              >
                {showMore ? 'Show Less' : `Show ${serviceData.updates.length - 3} More Updates`}
              </button>
            )}
          </div>
        ) : (
          !loading && (
            <div className="no-updates">
              <span className="no-updates-icon">📋</span>
              <p>No recent updates available</p>
            </div>
          )
        )}

        <div className="card-footer">
          <div className="last-updated">
            Last updated: {serviceData.lastUpdated ? serviceData.lastUpdated.toLocaleTimeString() : 'Never'}
          </div>
          <button 
            className="report-issue-btn"
            onClick={() => onReportIssue && onReportIssue(service.name)}
          >
            Report Issue
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomServiceCard;
