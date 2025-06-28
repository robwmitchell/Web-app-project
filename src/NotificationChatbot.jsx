import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import './NotificationBell.css'; // Reuse notification styles for consistency
import { htmlToText } from './ServiceStatusCard';

export default function NotificationChatbot({
  cloudflareIncidents = [],
  zscalerUpdates = [],
  oktaUpdates = [],
  sendgridUpdates = [],
  headerMode = false,
  aboveHeader = false,
  usePortal = false,
  modalZIndex = 20000
}) {
  const [open, setOpen] = useState(false);
  const [clearedAlerts, setClearedAlerts] = useState(() => {
    // Load cleared alerts from localStorage for today
    try {
      const today = new Date().toDateString();
      const stored = localStorage.getItem(`clearedAlerts_${today}`);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });
  const panelRef = useRef(null);
  const buttonRef = useRef(null);

  // Aggregate today's issues
  const today = new Date();
  const isToday = (date) => {
    const d = new Date(date);
    return d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear();
  };
  const allAlerts = [
    ...cloudflareIncidents.map(item => ({ ...item, service: 'Cloudflare', date: item.updated_at || item.created_at, id: `cloudflare-${item.id || item.name}` })),
    ...zscalerUpdates.map(item => ({ ...item, service: 'Zscaler', date: item.date, id: `zscaler-${item.title || item.link}` })),
    ...oktaUpdates.map(item => ({ ...item, service: 'Okta', date: item.date, id: `okta-${item.title || item.link}` })),
    ...sendgridUpdates.map(item => ({ ...item, service: 'SendGrid', date: item.date, id: `sendgrid-${item.title || item.link}` })),
  ].filter(alert => isToday(alert.date) && !clearedAlerts.has(alert.id));

  // Clear individual notification
  const clearNotification = (alertId) => {
    setClearedAlerts(prev => {
      const newSet = new Set([...prev, alertId]);
      // Save to localStorage for today
      try {
        const today = new Date().toDateString();
        localStorage.setItem(`clearedAlerts_${today}`, JSON.stringify([...newSet]));
      } catch (e) {
        console.warn('Failed to save cleared alerts to localStorage:', e);
      }
      return newSet;
    });
  };

  // Clear all notifications
  const clearAllNotifications = () => {
    const alertIds = [
      ...cloudflareIncidents.map(item => `cloudflare-${item.id || item.name}`),
      ...zscalerUpdates.map(item => `zscaler-${item.title || item.link}`),
      ...oktaUpdates.map(item => `okta-${item.title || item.link}`),
      ...sendgridUpdates.map(item => `sendgrid-${item.title || item.link}`),
    ].filter(id => {
      const alert = [
        ...cloudflareIncidents.map(item => ({ ...item, date: item.updated_at || item.created_at })),
        ...zscalerUpdates, ...oktaUpdates, ...sendgridUpdates
      ].find(a => 
        id === `cloudflare-${a.id || a.name}` || 
        id === `zscaler-${a.title || a.link}` || 
        id === `okta-${a.title || a.link}` || 
        id === `sendgrid-${a.title || a.link}`
      );
      return alert && isToday(alert.date);
    });
    setClearedAlerts(new Set(alertIds));
    // Save to localStorage for today
    try {
      const today = new Date().toDateString();
      localStorage.setItem(`clearedAlerts_${today}`, JSON.stringify(alertIds));
    } catch (e) {
      console.warn('Failed to save cleared alerts to localStorage:', e);
    }
  };

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (open && panelRef.current && !panelRef.current.contains(e.target) && 
          buttonRef.current && !buttonRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Calculate modal position when using portal
  const getModalPosition = () => {
    if (!buttonRef.current) return { top: 70, right: 32 };
    const rect = buttonRef.current.getBoundingClientRect();
    return {
      top: rect.bottom + 8,
      right: window.innerWidth - rect.right
    };
  };

  // Modal content
  const modalContent = open && (
    <div
      ref={panelRef}
      style={usePortal ? {
        position: 'fixed',
        ...getModalPosition(),
        width: 400,
        maxHeight: 540,
        background: 'rgba(255,255,255,0.98)',
        borderRadius: 22,
        boxShadow: '0 16px 48px 0 rgba(80,80,180,0.18), 0 2px 8px rgba(99,102,241,0.10)',
        zIndex: modalZIndex,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        border: '1.5px solid #e0e7ef',
        animation: 'slideDown 0.22s cubic-bezier(0.4,0,0.2,1)',
        backdropFilter: 'blur(16px)'
      } : aboveHeader ? {
        position: 'absolute',
        top: 54,
        right: 0,
        width: 400,
        maxHeight: 540,
        background: 'rgba(255,255,255,0.98)',
        borderRadius: 22,
        boxShadow: '0 16px 48px 0 rgba(80,80,180,0.18), 0 2px 8px rgba(99,102,241,0.10)',
        zIndex: 2100,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        border: '1.5px solid #e0e7ef',
        animation: 'slideDown 0.22s cubic-bezier(0.4,0,0.2,1)',
        backdropFilter: 'blur(16px)'
      } : headerMode ? {
        position: 'absolute',
        top: 54,
        right: 0,
        width: 400,
        maxHeight: 540,
        background: 'rgba(255,255,255,0.98)',
        borderRadius: 22,
        boxShadow: '0 16px 48px 0 rgba(80,80,180,0.18), 0 2px 8px rgba(99,102,241,0.10)',
        zIndex: 2100,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        border: '1.5px solid #e0e7ef',
        animation: 'slideDown 0.22s cubic-bezier(0.4,0,0.2,1)',
        backdropFilter: 'blur(16px)'
      } : {
        position: 'fixed',
        bottom: 90,
        right: 32,
        width: 400,
        maxHeight: 540,
        background: 'rgba(255,255,255,0.98)',
        borderRadius: 22,
        boxShadow: '0 16px 48px 0 rgba(80,80,180,0.18), 0 2px 8px rgba(99,102,241,0.10)',
        zIndex: 2100,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        border: '1.5px solid #e0e7ef',
        animation: 'slideDown 0.22s cubic-bezier(0.4,0,0.2,1)',
        backdropFilter: 'blur(16px)'
      }}
    >
      <div style={{ padding: '22px 28px 16px 28px', borderBottom: '1px solid #f1f5f9', background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(99,102,241,0.04)' }}>
        <span style={{ fontWeight: 800, fontSize: '1.18em', color: '#3730a3', letterSpacing: 0.2 }}>Today's Issues</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {allAlerts.length > 0 && (
            <button 
              onClick={clearAllNotifications}
              style={{ 
                background: 'rgba(239, 68, 68, 0.1)', 
                border: '1px solid rgba(239, 68, 68, 0.2)', 
                borderRadius: 8, 
                padding: '4px 12px', 
                fontSize: 12, 
                fontWeight: 600, 
                color: '#dc2626', 
                cursor: 'pointer',
                transition: 'all 0.2s',
                ':hover': { background: 'rgba(239, 68, 68, 0.15)' }
              }}
              onMouseEnter={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.15)'}
              onMouseLeave={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.1)'}
              aria-label="Clear all notifications"
            >
              Clear All
            </button>
          )}
          <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', fontSize: 26, cursor: 'pointer', color: '#64748b', fontWeight: 700, transition: 'color 0.2s' }} aria-label="Close">&times;</button>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '18px 0', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
        {allAlerts.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>
            <span style={{ fontSize: 36, display: 'block', marginBottom: 14 }}>✅</span>
            <div style={{ fontWeight: 700, color: '#3730a3', fontSize: 18 }}>
              {clearedAlerts.size > 0 ? 'All notifications cleared' : 'No issues today'}
            </div>
            <small style={{ color: '#9ca3af', fontSize: 14 }}>
              {clearedAlerts.size > 0 ? 'You\'ve cleared all today\'s notifications' : 'All systems operational'}
            </small>
          </div>
        ) : (
          allAlerts.map((alert, i) => {
            // Clean up description and meta
            const description = htmlToText(alert.description || (alert.incident_updates && alert.incident_updates[0]?.body) || '', { wordwrap: false });
            const statusColor = alert.status && alert.status.toLowerCase().includes('critical') ? '#fee2e2' : '#fef9c3';
            const statusTextColor = alert.status && alert.status.toLowerCase().includes('critical') ? '#b91c1c' : '#92400e';
            // Special formatting for Zscaler
            if (alert.service === 'Zscaler') {
              return (
                <div key={i} className="notification-item" style={{ borderLeft: '4px solid #6366f1', margin: '0 0 14px 0', background: 'rgba(255,255,255,0.92)', borderRadius: 14, boxShadow: '0 1px 6px rgba(99,102,241,0.08)', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 6, position: 'relative' }}>
                  <button 
                    onClick={() => clearNotification(alert.id)}
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: 'none',
                      borderRadius: '50%',
                      width: 20,
                      height: 20,
                      fontSize: 12,
                      color: '#dc2626',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.2)'}
                    onMouseLeave={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.1)'}
                    aria-label="Dismiss notification"
                  >
                    ×
                  </button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2, flexWrap: 'wrap' }}>
                    <span style={{ background: 'rgba(99,102,241,0.08)', color: '#6366f1', fontWeight: 800, fontSize: 13, borderRadius: 8, padding: '2px 10px', textTransform: 'uppercase', letterSpacing: 0.5 }}>{alert.service}</span>
                    <span style={{ color: '#64748b', fontSize: 13, marginLeft: 2, fontWeight: 500 }}>
                      {new Date(alert.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {alert.status && (
                      <span style={{
                        background: statusColor,
                        color: statusTextColor,
                        borderRadius: 8,
                        padding: '2px 10px',
                        fontSize: 12,
                        fontWeight: 700,
                        textTransform: 'capitalize',
                        letterSpacing: 0.2,
                        marginLeft: 6
                      }}>{alert.status.replace('_', ' ')}</span>
                    )}
                    {alert.eventType && (
                      <span style={{
                        background: '#e0e7ef',
                        color: '#3730a3',
                        borderRadius: 8,
                        padding: '2px 10px',
                        fontSize: 12,
                        fontWeight: 700,
                        marginLeft: 6,
                        letterSpacing: 0.2
                      }}>{alert.eventType}</span>
                    )}
                    {alert.customerImpact && (
                      <span style={{
                        background: '#fef9c3',
                        color: '#92400e',
                        borderRadius: 8,
                        padding: '2px 10px',
                        fontSize: 12,
                        fontWeight: 700,
                        marginLeft: 6,
                        letterSpacing: 0.2
                      }}>{alert.customerImpact}</span>
                    )}
                  </div>
                  <div style={{ fontWeight: 700, color: '#1e293b', fontSize: 16, marginBottom: 2, lineHeight: 1.3 }}>
                    {alert.title}
                  </div>
                  {description && (
                    <div style={{ color: '#64748b', fontSize: 14, marginBottom: 2, lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                      {description}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 2 }}>
                    {alert.link && (
                      <a href={alert.link} target="_blank" rel="noopener noreferrer" style={{ color: '#6366f1', fontWeight: 600, fontSize: 13, textDecoration: 'underline', marginLeft: 2 }}>View Source ↗</a>
                    )}
                  </div>
                </div>
              );
            }
            // Default rendering for other services
            return (
              <div key={i} className="notification-item" style={{ borderLeft: '4px solid #6366f1', margin: '0 0 14px 0', background: 'rgba(255,255,255,0.92)', borderRadius: 14, boxShadow: '0 1px 6px rgba(99,102,241,0.08)', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 6, position: 'relative' }}>
                <button 
                  onClick={() => clearNotification(alert.id)}
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: 'none',
                    borderRadius: '50%',
                    width: 20,
                    height: 20,
                    fontSize: 12,
                    color: '#dc2626',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.2)'}
                  onMouseLeave={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.1)'}
                  aria-label="Dismiss notification"
                >
                  ×
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2, flexWrap: 'wrap' }}>
                  <span style={{ background: 'rgba(99,102,241,0.08)', color: '#6366f1', fontWeight: 800, fontSize: 13, borderRadius: 8, padding: '2px 10px', textTransform: 'uppercase', letterSpacing: 0.5 }}>{alert.service}</span>
                  <span style={{ color: '#64748b', fontSize: 13, marginLeft: 2, fontWeight: 500 }}>
                    {new Date(alert.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {alert.status && (
                    <span style={{
                      background: statusColor,
                      color: statusTextColor,
                      borderRadius: 8,
                      padding: '2px 10px',
                      fontSize: 12,
                      fontWeight: 700,
                      textTransform: 'capitalize',
                      letterSpacing: 0.2,
                      marginLeft: 6
                    }}>{alert.status.replace('_', ' ')}</span>
                  )}
                </div>
                <div style={{ fontWeight: 700, color: '#1e293b', fontSize: 16, marginBottom: 2, lineHeight: 1.3 }}>
                  {alert.name || alert.title}
                </div>
                {description && (
                  <div style={{ color: '#64748b', fontSize: 14, marginBottom: 2, lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                    {description}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 2 }}>
                  {alert.link && (
                    <a href={alert.link} target="_blank" rel="noopener noreferrer" style={{ color: '#6366f1', fontWeight: 600, fontSize: 13, textDecoration: 'underline', marginLeft: 2 }}>View Source ↗</a>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Chatbot Button */}
      <div style={aboveHeader ? { width: '100%', display: 'flex', justifyContent: 'flex-end', position: 'relative', zIndex: 200 } : {}}>
        <button
          ref={buttonRef}
          className="notification-bell-button"
          style={headerMode || aboveHeader ? {
            position: 'relative',
            right: 0,
            top: 0,
            marginLeft: 8,
            marginRight: 32,
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            color: '#fff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
            zIndex: 2000
          } : {
            position: 'fixed',
            bottom: 32,
            right: 32,
            zIndex: 2000,
            boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            color: '#fff',
          }}
          onClick={() => setOpen(o => !o)}
          aria-label="Show today's issues"
        >
          <span className="bell-icon" style={{ fontSize: 28 }}>🔔</span>
          {allAlerts.length > 0 && (
            <span className="notification-badge">{allAlerts.length}</span>
          )}
        </button>
        {/* Render modal content */}
        {usePortal && modalContent ? ReactDOM.createPortal(modalContent, document.body) : !usePortal && modalContent}
      </div>
    </>
  );
}
