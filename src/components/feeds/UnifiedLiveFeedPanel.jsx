import React, { useState, useEffect, useRef, useMemo } from 'react';
import { formatFeedTitle, formatFeedDescription, getReadablePreview } from '../../utils/htmlToText';
import './UnifiedLiveFeedPanel.css';

const UnifiedLiveFeedPanel = ({ 
  isOpen, 
  onClose, 
  selectedServices = [],
  cloudflareIncidents = [],
  zscalerUpdates = [],
  oktaUpdates = [],
  sendgridUpdates = [],
  slackUpdates = [],
  datadogUpdates = [],
  awsUpdates = [],
  customServices = []
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSources, setSelectedSources] = useState([]);
  const [sortBy, setSortBy] = useState('timestamp'); // timestamp, source, status
  const [showFilters, setShowFilters] = useState(false);
  const [displayCount, setDisplayCount] = useState(20);
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [newItemIds, setNewItemIds] = useState(new Set());
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());
  
  const panelRef = useRef(null);
  const feedContainerRef = useRef(null);

  // Utility function to get relative time
  const getRelativeTime = (timestamp) => {
    if (!timestamp) return 'Unknown';
    
    const now = new Date();
    const time = new Date(timestamp);
    const diff = now - time;
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return time.toLocaleDateString();
  };

  // Get source icon and type
  const getSourceInfo = (source, customServiceName = null) => {
    const sourceMap = {
      'cloudflare': { icon: '☁️', type: 'API', color: '#f38020' },
      'zscaler': { icon: '🛡️', type: 'RSS', color: '#0066cc' },
      'okta': { icon: '🔐', type: 'RSS', color: '#007dc1' },
      'sendgrid': { icon: '📧', type: 'RSS', color: '#1a82e2' },
      'slack': { icon: '💬', type: 'API', color: '#4a154b' },
      'datadog': { icon: '📊', type: 'API', color: '#632c41' },
      'aws': { icon: '☁️', type: 'API', color: '#ff9900' },
      'custom': { icon: '📰', type: 'RSS', color: '#6c757d' }
    };
    
    // Check if it's a known service first
    const knownService = sourceMap[source.toLowerCase()];
    if (knownService) {
      return knownService;
    }
    
    // If not found and we have a custom service name, it's a custom service
    if (customServiceName) {
      return { 
        icon: '📰', 
        type: 'RSS', 
        color: '#6c757d',
        displayName: customServiceName
      };
    }
    
    // For custom services in the filter buttons, find the service name
    const customService = customServices?.find(cs => cs.id === source);
    if (customService) {
      return {
        icon: '📰', 
        type: 'RSS', 
        color: '#6c757d',
        displayName: customService.name
      };
    }
    
    return sourceMap['custom'];
  };

  // Get status severity for sorting and styling
  const getStatusSeverity = (status) => {
    const severityMap = {
      'critical': 4,
      'major': 3,
      'minor': 2,
      'operational': 1,
      'resolved': 1,
      'issues detected': 3,
      'loading...': 0,
      'error loading': 0
    };
    return severityMap[status?.toLowerCase()] || 0;
  };

  // Unified feed data compilation
  const unifiedFeedData = useMemo(() => {
    const allItems = [];

    // Cloudflare incidents
    if (selectedServices.includes('cloudflare')) {
      cloudflareIncidents?.forEach(incident => {
        const rawTitle = incident.name || incident.title || '';
        const rawDescription = incident.body || incident.description || 'Cloudflare incident reported';
        
        allItems.push({
          id: `cloudflare-${incident.id}`,
          source: 'cloudflare',
          title: formatFeedTitle(rawTitle),
          description: formatFeedDescription(rawDescription, { maxLength: 200 }),
          timestamp: incident.updated_at || incident.created_at,
          status: incident.impact || incident.status || 'unknown',
          url: incident.shortlink || incident.url,
          type: 'incident',
          isResolved: !!incident.resolved_at,
          rawData: incident
        });
      });
    }

    // Zscaler updates
    if (selectedServices.includes('zscaler')) {
      zscalerUpdates?.forEach(update => {
        const rawTitle = update.title || '';
        const rawDescription = update.description || 'Zscaler service update';
        
        allItems.push({
          id: `zscaler-${update.title}-${update.date}`,
          source: 'zscaler',
          title: formatFeedTitle(rawTitle),
          description: formatFeedDescription(rawDescription, { maxLength: 200 }),
          timestamp: update.date,
          status: update.eventType || 'info',
          url: update.link,
          type: 'update',
          isResolved: false,
          rawData: update
        });
      });
    }

    // Okta updates
    if (selectedServices.includes('okta')) {
      oktaUpdates?.forEach(update => {
        const rawTitle = update.title || '';
        const rawDescription = update.description || 'Okta service update';
        
        allItems.push({
          id: `okta-${update.title}-${update.date}`,
          source: 'okta',
          title: formatFeedTitle(rawTitle),
          description: formatFeedDescription(rawDescription, { maxLength: 200 }),
          timestamp: update.date,
          status: 'info',
          url: update.link,
          type: 'update',
          isResolved: false,
          rawData: update
        });
      });
    }

    // SendGrid updates
    if (selectedServices.includes('sendgrid')) {
      sendgridUpdates?.forEach(update => {
        const rawTitle = update.title || '';
        const rawDescription = update.description || 'SendGrid service update';
        
        allItems.push({
          id: `sendgrid-${update.title}-${update.date}`,
          source: 'sendgrid',
          title: formatFeedTitle(rawTitle),
          description: formatFeedDescription(rawDescription, { maxLength: 200 }),
          timestamp: update.date,
          status: 'info',
          url: update.link,
          type: 'update',
          isResolved: false,
          rawData: update
        });
      });
    }

    // Slack updates
    if (selectedServices.includes('slack')) {
      slackUpdates?.forEach(update => {
        const rawTitle = update.title || '';
        const rawDescription = update.description || 'Slack service update';
        
        allItems.push({
          id: `slack-${update.title}-${update.reported_at}`,
          source: 'slack',
          title: formatFeedTitle(rawTitle),
          description: formatFeedDescription(rawDescription, { maxLength: 200 }),
          timestamp: update.reported_at,
          status: update.status || 'info',
          url: update.url,
          type: 'update',
          isResolved: false,
          rawData: update
        });
      });
    }

    // Datadog updates
    if (selectedServices.includes('datadog')) {
      datadogUpdates?.forEach(update => {
        const rawTitle = update.title || '';
        const rawDescription = update.description || 'Datadog service update';
        
        allItems.push({
          id: `datadog-${update.title}-${update.reported_at}`,
          source: 'datadog',
          title: formatFeedTitle(rawTitle),
          description: formatFeedDescription(rawDescription, { maxLength: 200 }),
          timestamp: update.reported_at,
          status: update.status || 'info',
          url: update.url,
          type: 'update',
          isResolved: false,
          rawData: update
        });
      });
    }

    // AWS updates
    if (selectedServices.includes('aws')) {
      awsUpdates?.forEach(update => {
        const rawTitle = update.title || '';
        const rawDescription = update.description || 'AWS service update';
        
        allItems.push({
          id: `aws-${update.title}-${update.reported_at}`,
          source: 'aws',
          title: formatFeedTitle(rawTitle),
          description: formatFeedDescription(rawDescription, { maxLength: 200 }),
          timestamp: update.reported_at,
          status: update.status || 'info',
          url: update.url,
          type: 'update',
          isResolved: false,
          rawData: update
        });
      });
    }

    // Custom RSS services
    customServices?.forEach(customService => {
      if (selectedServices.includes(customService.id) && customService.updates) {
        customService.updates.forEach(update => {
          const rawTitle = update.title || '';
          const rawDescription = update.description || `${customService.name} service update`;
          
          allItems.push({
            id: `custom-${customService.id}-${update.title}-${update.date || update.pubDate || update.timestamp}`,
            source: customService.id, // Use service ID as source for consistency
            title: formatFeedTitle(rawTitle),
            description: formatFeedDescription(rawDescription, { maxLength: 200 }),
            timestamp: update.date || update.pubDate || update.timestamp,
            status: update.status || 'info',
            url: update.link || update.url,
            type: 'update',
            isResolved: false,
            rawData: update,
            customServiceName: customService.name,
            customServiceId: customService.id
          });
        });
      }
    });

    // Sort items based on selected sort method
    return allItems.sort((a, b) => {
      switch (sortBy) {
        case 'source':
          return a.source.localeCompare(b.source);
        case 'status':
          return getStatusSeverity(b.status) - getStatusSeverity(a.status);
        case 'timestamp':
        default:
          return new Date(b.timestamp || 0) - new Date(a.timestamp || 0);
      }
    });
  }, [
    selectedServices,
    cloudflareIncidents,
    zscalerUpdates,
    oktaUpdates,
    sendgridUpdates,
    slackUpdates,
    datadogUpdates,
    awsUpdates,
    customServices,
    sortBy
  ]);

  // Filter feed data based on search and source filters
  const filteredFeedData = useMemo(() => {
    let filtered = unifiedFeedData;

    // Apply search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.title?.toLowerCase().includes(search) ||
        item.description?.toLowerCase().includes(search) ||
        item.source?.toLowerCase().includes(search) ||
        item.status?.toLowerCase().includes(search)
      );
    }

    // Apply source filter
    if (selectedSources.length > 0) {
      filtered = filtered.filter(item => selectedSources.includes(item.source));
    }

    return filtered.slice(0, displayCount);
  }, [unifiedFeedData, searchTerm, selectedSources, displayCount]);

  // Available sources for filtering
  const availableSources = useMemo(() => {
    const sources = new Set();
    
    // Add sources from actual data
    unifiedFeedData.forEach(item => sources.add(item.source));
    
    // Always include selected services even if they don't have data yet
    selectedServices.forEach(service => {
      sources.add(service); // Add the service ID directly
    });
    
    return Array.from(sources).sort();
  }, [unifiedFeedData, selectedServices]);

  // Handle outside click to close panel
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Track new items - simple approach without flashing
  useEffect(() => {
    if (!isOpen) return;
    
    const currentIds = new Set(filteredFeedData.map(item => item.id));
    const genuinelyNewIds = new Set();
    
    // Only mark items as new if they weren't in the previous set
    currentIds.forEach(id => {
      if (!newItemIds.has(id)) {
        genuinelyNewIds.add(id);
      }
    });

    if (genuinelyNewIds.size > 0) {
      setNewItemIds(prev => new Set([...prev, ...genuinelyNewIds]));
      
      // Remove "new" status after 10 seconds (no animation, just removes highlight)
      setTimeout(() => {
        setNewItemIds(prev => {
          const updated = new Set(prev);
          genuinelyNewIds.forEach(id => updated.delete(id));
          return updated;
        });
      }, 10000);
    }
  }, [filteredFeedData, isOpen]);

  // Update last update time only when data actually changes
  useEffect(() => {
    setLastUpdateTime(Date.now());
  }, [
    cloudflareIncidents,
    zscalerUpdates,
    oktaUpdates,
    sendgridUpdates,
    slackUpdates,
    datadogUpdates,
    awsUpdates,
    customServices
  ]);

  // Handle item expansion
  const toggleExpanded = (itemId) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  // Handle source filter toggle
  const toggleSourceFilter = (source) => {
    const newSources = selectedSources.includes(source)
      ? selectedSources.filter(s => s !== source)
      : [...selectedSources, source];
    setSelectedSources(newSources);
  };

  if (!isOpen) return null;

  return (
    <div className="unified-feed-overlay">
      <div className="unified-feed-panel" ref={panelRef}>
        {/* Header */}
        <div className="feed-header">
          <div className="feed-header-left">
            <h2 className="feed-title">
              🔴 Live Feed
              <span className="feed-count">({filteredFeedData.length})</span>
            </h2>
            <div className="live-indicator">
              <span className="live-dot"></span>
              <span className="live-text">LIVE</span>
            </div>
          </div>
          <div className="feed-header-right">
            <button
              className="filter-toggle-btn"
              onClick={() => setShowFilters(!showFilters)}
              title="Toggle filters"
            >
              🔍
            </button>
            <button
              className="close-panel-btn"
              onClick={onClose}
              title="Close panel"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="feed-filters">
            <div className="filter-row">
              <input
                type="text"
                placeholder="Search feed items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="sort-select"
              >
                <option value="timestamp">Sort by Time</option>
                <option value="source">Sort by Source</option>
                <option value="status">Sort by Status</option>
              </select>
            </div>
            
            <div className="source-filters">
              <span className="filter-label">Sources:</span>
              {availableSources.map(source => {
                const sourceInfo = getSourceInfo(source);
                return (
                  <button
                    key={source}
                    className={`source-filter-btn ${selectedSources.includes(source) ? 'active' : ''}`}
                    onClick={() => toggleSourceFilter(source)}
                    style={{ '--source-color': sourceInfo.color }}
                  >
                    <span className="source-icon">{sourceInfo.icon}</span>
                    <span className="source-name">
                      {sourceInfo.displayName || source}
                    </span>
                    <span className="source-type">{sourceInfo.type}</span>
                  </button>
                );
              })}
              {selectedSources.length > 0 && (
                <button
                  className="clear-filters-btn"
                  onClick={() => setSelectedSources([])}
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        )}

        {/* Feed Content */}
        <div className="feed-content" ref={feedContainerRef}>
          {filteredFeedData.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <h3>No feed items found</h3>
              <p>
                {searchTerm.trim() || selectedSources.length > 0
                  ? 'Try adjusting your search or filter criteria.'
                  : 'No recent updates from your selected services.'}
              </p>
            </div>
          ) : (
            <>
              {filteredFeedData.map(item => {
                const sourceInfo = getSourceInfo(item.source, item.customServiceName);
                const isExpanded = expandedItems.has(item.id);
                const isNew = newItemIds.has(item.id);
                
                return (
                  <div
                    key={item.id}
                    className={`feed-item ${isNew ? 'new-item' : ''} ${isExpanded ? 'expanded' : ''}`}
                    onClick={() => toggleExpanded(item.id)}
                  >
                    <div className="feed-item-header">
                      <div className="item-source">
                        <span 
                          className="source-badge"
                          style={{ backgroundColor: sourceInfo.color }}
                        >
                          <span className="source-icon">{sourceInfo.icon}</span>
                          <span className="source-name">
                            {sourceInfo.displayName || item.source}
                          </span>
                        </span>
                        <span className="source-type-badge">{sourceInfo.type}</span>
                        {isNew && <span className="new-badge">NEW</span>}
                      </div>
                      <div className="item-meta">
                        <span className="item-timestamp">{getRelativeTime(item.timestamp)}</span>
                        <span 
                          className={`item-status status-${getStatusSeverity(item.status)}`}
                        >
                          {item.status}
                        </span>
                      </div>
                    </div>
                    
                    <div className="feed-item-content">
                      <h4 className="item-title">{item.title}</h4>
                      <p className="item-description">
                        {isExpanded 
                          ? item.description 
                          : `${item.description?.slice(0, 120)}${item.description?.length > 120 ? '...' : ''}`
                        }
                      </p>
                      
                      {isExpanded && (
                        <div className="item-actions">
                          {item.url && (
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="view-details-btn"
                              onClick={(e) => e.stopPropagation()}
                            >
                              View Details ↗
                            </a>
                          )}
                          <span className="full-timestamp">
                            {new Date(item.timestamp).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="expand-indicator">
                      {isExpanded ? '▼' : '▶'}
                    </div>
                  </div>
                );
              })}
              
              {/* Load More */}
              {displayCount < unifiedFeedData.length && (
                <div className="load-more-container">
                  <button
                    className="load-more-btn"
                    onClick={() => setDisplayCount(prev => prev + 20)}
                  >
                    Load More ({unifiedFeedData.length - displayCount} remaining)
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="feed-footer">
          <div className="feed-stats">
            <span>Total: {unifiedFeedData.length} items</span>
            <span>•</span>
            <span>Showing: {filteredFeedData.length}</span>
            <span>•</span>
            <span>Last updated: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedLiveFeedPanel;
