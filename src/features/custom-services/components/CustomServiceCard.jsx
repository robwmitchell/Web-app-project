import React, { useState, useEffect } from 'react';
import ServiceTimeline from '../../../components/charts/ServiceTimeline';
import { cleanAndTruncateHtml } from '../../../utils/textFormatting';
import '../../services/components/LivePulseCard.css';
import '../../../styles/globals/Glassmorphism.css';

const CustomServiceCard = ({ 
  service, 
  onClose, 
  isClosed, 
  onReportIssue,
  onToggleShowMore,
  showMore = false
}) => {
  const [serviceData, setServiceData] = useState({
    status: 'Loading...',
    updates: [],
    lastUpdated: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pop, setPop] = useState(false);
  const [bgVisible, setBgVisible] = useState(true);

  // Animate pop on live update
  React.useEffect(() => {
    setPop(true);
    const t = setTimeout(() => setPop(false), 600);
    return () => clearTimeout(t);
  }, [serviceData.status]);

  // Fade out background image after 4 seconds
  useEffect(() => {
    setBgVisible(true);
    const timer = setTimeout(() => setBgVisible(false), 4000);
    return () => clearInterval(timer);
  }, [service.id]);

  const handleClose = (e) => {
    e.stopPropagation();
    if (onClose) {
      onClose(service.id);
    }
  };

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

  const getStatusIndicator = (status) => {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower.includes('critical') || statusLower.includes('outage')) return 'critical';
    if (statusLower.includes('issues') || statusLower.includes('incident') || statusLower.includes('major')) return 'major';
    if (statusLower.includes('degraded') || statusLower.includes('maintenance') || statusLower.includes('minor')) return 'minor';
    if (statusLower.includes('operational') || statusLower.includes('resolved')) return 'none';
    return 'unknown';
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

  // Generate day indicators for the last 7 days
  function getLast7DaysUTC() {
    const days = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      d.setUTCDate(d.getUTCDate() - i);
      days.push(d);
    }
    return days;
  }

  function getDayIndicator(day) {
    // Check if any updates occurred on this day
    const hasEvent = serviceData.updates.some(update => {
      if (!update.date) return false;
      const updateDate = new Date(update.date);
      const dayStart = new Date(day);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(day);
      dayEnd.setHours(23, 59, 59, 999);
      return updateDate >= dayStart && updateDate <= dayEnd;
    });
    
    if (hasEvent) {
      // Check severity of events on this day
      const dayEvents = serviceData.updates.filter(update => {
        if (!update.date) return false;
        const updateDate = new Date(update.date);
        const dayStart = new Date(day);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(day);
        dayEnd.setHours(23, 59, 59, 999);
        return updateDate >= dayStart && updateDate <= dayEnd;
      });
      
      if (dayEvents.some(e => e.eventType === 'outage' || e.severity === 'critical')) {
        return 'critical';
      }
      if (dayEvents.some(e => e.eventType === 'incident' || e.severity === 'major')) {
        return 'major';
      }
      return 'minor';
    }
    
    return 'none';
  }

  const last7Days = getLast7DaysUTC();
  const dayEvents = last7Days.map(day => {
    const indicator = getDayIndicator(day);
    const dayStr = day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return {
      date: dayStr,
      indicator,
      statusText: indicator === 'none' ? 'No issues' : 'Issues reported'
    };
  });

  if (isClosed) {
    return null;
  }

  // Create headline content similar to other cards
  const headline = error ? 
    `⚠️ Failed to load RSS feed: ${error}` : 
    loading ? 
    `🔄 Loading ${service.name} status...` :
    serviceData.updates.length > 0 ? 
    `📡 ${serviceData.updates.length} recent updates from RSS feed` :
    `📡 Custom RSS monitoring active`;

  return (
    <div
      className={`live-pulse-card glass-card${pop ? ' live-update-pop' : ''}${showMore ? ' expanded' : ''}`}
      style={{
        perspective: '1000px',
        minHeight: showMore ? 'auto' : 180,
        minWidth: 280,
        position: 'relative',
        height: showMore ? 'auto' : undefined,
        transition: 'all 0.3s ease-in-out',
      }}
    >
      {/* Card background logo - use a generic RSS icon pattern */}
      <div
        className={`card-bg-logo${bgVisible ? '' : ' card-bg-logo-fade'}`}
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '120px',
          height: '120px',
          background: `linear-gradient(135deg, ${service.color}15 0%, ${service.color}08 100%)`,
          borderRadius: '0 20px 0 100px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '48px',
          opacity: 0.3,
          pointerEvents: 'none',
          zIndex: 1
        }}
        aria-hidden="true"
      >
        📡
      </div>
      
      <div
        className="card-flip-inner"
        style={{
          transition: 'transform 0.6s cubic-bezier(.4,2,.6,1)',
          transformStyle: 'preserve-3d',
          position: 'relative',
          width: '100%',
          height: showMore ? 'auto' : '100%',
          minHeight: showMore ? 'auto' : '100%',
        }}
      >
        {/* Front Side */}
        <div
          className="card-flip-front"
          style={{
            backfaceVisibility: 'hidden',
            position: showMore ? 'relative' : 'absolute',
            width: '100%',
            height: showMore ? 'auto' : '100%',
            minHeight: showMore ? 'auto' : '100%',
            top: 0,
            left: 0,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div className="card-header-modern" style={{
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            padding: '18px 20px 18px 0',
            borderRadius: '18px 18px 0 0',
            background: 'rgba(255,255,255,0.55)',
            boxShadow: '0 4px 24px 0 rgba(30,41,59,0.07)',
            backdropFilter: 'blur(12px)',
            position: 'relative',
            minHeight: 72,
            borderBottom: '1px solid rgba(148, 163, 184, 0.10)',
            zIndex: 2,
          }}>
            {/* Accent bar */}
            <div style={{
              width: 6,
              height: 48,
              borderRadius: 6,
              background: `linear-gradient(135deg, ${service.color} 0%, ${service.color}80 100%)`,
              marginRight: 18,
              boxShadow: '0 2px 8px rgba(30,41,59,0.10)'
            }} />
            
            {/* Logo in glassy circle */}
            <div style={{
              background: 'rgba(255,255,255,0.7)',
              borderRadius: '50%',
              boxShadow: '0 2px 8px rgba(15,23,42,0.10)',
              padding: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 56,
              height: 56,
              minWidth: 56,
              minHeight: 56,
              marginRight: 10,
            }}>
              {service.logo ? (
                <img 
                  src={service.logo} 
                  alt={`${service.name} logo`} 
                  style={{ width: 36, height: 36, borderRadius: 12 }}
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
                  display: service.logo ? 'none' : 'flex',
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px'
                }}
              >
                📡
              </div>
            </div>
            
            {/* Name and status row */}
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
              <span style={{ fontWeight: 900, fontSize: '1.45em', color: '#1e293b', letterSpacing: '-0.01em', lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {service.name}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
                <span 
                  className={`status-indicator ${getStatusIndicator(serviceData.status)}`} 
                  title={serviceData.status} 
                  style={{ boxShadow: '0 0 0 4px #f3f4f6, 0 2px 8px rgba(15,23,42,0.08)' }}
                ></span>
                <span className="status-text" style={{ fontWeight: 600, color: '#64748b', fontSize: '1.08em' }}>
                  {serviceData.status}
                  {loading && <span style={{ marginLeft: 8, fontSize: '0.9em' }}>Loading...</span>}
                </span>
              </span>
            </div>
            
            {/* Close button - top right, vertically centered */}
            <button
              className="card-close-btn"
              onClick={handleClose}
              aria-label="Close card"
              title="Close this service card"
              style={{
                position: 'absolute',
                top: '50%',
                right: 18,
                transform: 'translateY(-50%)',
                width: 22,
                height: 22,
                minWidth: 22,
                minHeight: 22,
                maxWidth: 22,
                maxHeight: 22,
                background: '#ff5f57',
                border: 'none',
                borderRadius: '50%',
                cursor: 'pointer',
                zIndex: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.18)',
                flexShrink: 0,
                padding: 0,
              }}
              onMouseEnter={e => {
                e.target.style.background = '#ff3b30';
                e.target.style.transform = 'translateY(-50%) scale(1.1)';
              }}
              onMouseLeave={e => {
                e.target.style.background = '#ff5f57';
                e.target.style.transform = 'translateY(-50%) scale(1)';
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 700, color: 'white', lineHeight: 1 }}>×</span>
            </button>
          </div>
          
          <div className="live-pulse-headline">{headline}</div>
          
          {/* 7-Day Service Timeline */}
          <ServiceTimeline 
            provider={service.id}
            incidents={serviceData.updates}
            updates={serviceData.updates}
            showLabels={true}
          />
          
          {/* Card content with actions - matches other cards exactly */}
          <div className="card-content" style={{ 
            flex: showMore ? 'none' : '1',
            display: 'flex',
            flexDirection: 'column',
            height: showMore ? 'auto' : undefined
          }}>
            {/* Card actions - always visible */}
            <div className="card-actions">
              <button 
                className="bug-report-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onReportIssue && onReportIssue(service.name);
                }}
              >
                Report Issue
              </button>
              <button 
                className="view-history-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleShowMore && onToggleShowMore(service.id);
                }}
              >
                {showMore ? 'Hide History' : 'View History'}
              </button>
            </div>
            
            {/* History section - matches other cards style */}
            {showMore && (
              <div className="card-history-section" style={{
                marginTop: '16px',
                padding: '16px',
                backgroundColor: 'rgba(248, 250, 252, 0.8)',
                borderRadius: '12px',
                border: '1px solid rgba(148, 163, 184, 0.15)',
                backdropFilter: 'blur(8px)',
                transition: 'all 0.3s ease-in-out',
                overflow: 'hidden'
              }}>
                {serviceData.updates.length > 0 ? (
                  <div className="updates-section">
                    <div className="history-header">
                      <h4>Recent History</h4>
                      <span className="history-count" style={{ backgroundColor: service.color }}>
                        {serviceData.updates.length} items
                      </span>
                    </div>
                    <div className="history-list">
                      {serviceData.updates.map((update, index) => (
                        <div key={update.id || index} className="history-item">
                          <div className="history-dot" style={{
                            background: update.eventType === 'incident' ? '#f59e0b' : '#10b981'
                          }}></div>
                          <div className="history-content">
                            <div className="history-title">{update.title}</div>
                            <div className="history-date">{formatDate(update.date)}</div>
                            {update.description && (
                              <div className="history-description">
                                {cleanAndTruncateHtml(update.description, 150)}
                              </div>
                            )}
                            {update.link && (
                              <a 
                                href={update.link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="history-link"
                                style={{ color: service.color }}
                              >
                                Read more →
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : !loading ? (
                  <div className="no-updates">
                    <span className="no-updates-icon">📋</span>
                    <p>No recent updates available</p>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomServiceCard;
