import React, { useState, useEffect, useRef } from 'react';
import './NotificationBell.css';
import { serviceLogos } from './serviceLogos';

export default function NotificationBell({ 
  cloudflareIncidents = [], 
  zscalerUpdates = [], 
  oktaUpdates = [], 
  sendgridUpdates = [] 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  // Get today's date string for filtering
  const getTodayStr = () => {
    return new Date().toISOString().slice(0, 10);
  };

  // Check if a date is today
  const isToday = (dateStr) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Process and combine all notifications for today
  useEffect(() => {
    const todayNotifications = [];

    // Process Cloudflare incidents
    if (cloudflareIncidents && Array.isArray(cloudflareIncidents)) {
      cloudflareIncidents.forEach(incident => {
        if (isToday(incident.created_at || incident.createdAt)) {
          todayNotifications.push({
            id: `cloudflare-${incident.id}`,
            service: 'Cloudflare',
            title: incident.name || incident.title || 'Incident',
            description: incident.impact || 'Service incident',
            timestamp: incident.created_at || incident.createdAt,
            status: incident.status || 'active',
            severity: incident.impact === 'critical' ? 'critical' : 
                     incident.impact === 'major' ? 'major' : 'minor',
            type: 'incident'
          });
        }
      });
    }

    // Process Zscaler updates
    if (zscalerUpdates && Array.isArray(zscalerUpdates)) {
      zscalerUpdates.forEach(update => {
        if (isToday(update.date || update.startTime)) {
          const isDisruption = update.title?.toLowerCase().includes('disruption') || 
                              update.description?.toLowerCase().includes('disruption') ||
                              update.title?.toLowerCase().includes('outage') ||
                              update.description?.toLowerCase().includes('outage');
          
          if (isDisruption) {
            todayNotifications.push({
              id: `zscaler-${update.title?.substring(0, 20) || Math.random()}`,
              service: 'Zscaler',
              title: update.title || 'Service Update',
              description: update.description?.substring(0, 100) + '...' || 'Service disruption detected',
              timestamp: update.date || update.startTime,
              status: 'active',
              severity: 'major',
              type: 'disruption'
            });
          }
        }
      });
    }

    // Process Okta updates (if any incidents today)
    if (oktaUpdates && Array.isArray(oktaUpdates)) {
      oktaUpdates.forEach(update => {
        if (isToday(update.created_at || update.date)) {
          todayNotifications.push({
            id: `okta-${update.id || Math.random()}`,
            service: 'Okta',
            title: update.name || update.title || 'Service Update',
            description: update.impact || update.description || 'Service incident',
            timestamp: update.created_at || update.date,
            status: update.status || 'active',
            severity: 'minor',
            type: 'incident'
          });
        }
      });
    }

    // Process SendGrid updates (if any incidents today)
    if (sendgridUpdates && Array.isArray(sendgridUpdates)) {
      sendgridUpdates.forEach(update => {
        if (isToday(update.created_at || update.date)) {
          todayNotifications.push({
            id: `sendgrid-${update.id || Math.random()}`,
            service: 'SendGrid',
            title: update.name || update.title || 'Service Update',
            description: update.impact || update.description || 'Service incident',
            timestamp: update.created_at || update.date,
            status: update.status || 'active',
            severity: 'minor',
            type: 'incident'
          });
        }
      });
    }

    // Sort by timestamp (newest first)
    todayNotifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    setNotifications(todayNotifications);
    setUnreadCount(todayNotifications.length);
  }, [cloudflareIncidents, zscalerUpdates, oktaUpdates, sendgridUpdates]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      // Mark as read when opening
      setTimeout(() => setUnreadCount(0), 500);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return '#dc2626';
      case 'major': return '#ea580c';
      case 'minor': return '#d97706';
      default: return '#6b7280';
    }
  };

  const getServiceIcon = (service) => {
    return serviceLogos[service] || '📢';
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString(undefined, { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="notification-bell" ref={dropdownRef}>
      <button 
        className="notification-bell-button"
        onClick={toggleDropdown}
        aria-label={`Notifications (${unreadCount} unread)`}
      >
        <span className="bell-icon">🔔</span>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Today's Alerts</h3>
            <span className="notification-count">
              {notifications.length} {notifications.length === 1 ? 'alert' : 'alerts'}
            </span>
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="no-notifications">
                <span className="no-notifications-icon">✅</span>
                <p>No alerts today</p>
                <small>All services are running smoothly</small>
              </div>
            ) : (
              notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className="notification-item"
                  style={{ borderLeftColor: getSeverityColor(notification.severity) }}
                >
                  <div className="notification-content">
                    <div className="notification-service">
                      <span className="service-icon">
                        {serviceLogos[notification.service] ? (
                          <img 
                            src={serviceLogos[notification.service]} 
                            alt={notification.service + ' logo'} 
                            style={{ width: 16, height: 16, objectFit: 'contain' }}
                          />
                        ) : (
                          '📢'
                        )}
                      </span>
                      <span className="service-name">{notification.service}</span>
                      <span className="notification-time">{formatTimestamp(notification.timestamp)}</span>
                    </div>
                    <div className="notification-title">{notification.title}</div>
                    <div className="notification-description">{notification.description}</div>
                    <div className="notification-meta">
                      <span className={`notification-type ${notification.type}`}>
                        {notification.type}
                      </span>
                      <span className={`notification-severity ${notification.severity}`}>
                        {notification.severity}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="notification-footer">
              <button 
                className="view-all-btn"
                onClick={() => setIsOpen(false)}
              >
                View Service Details
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
