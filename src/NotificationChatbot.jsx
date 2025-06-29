import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import './NotificationBell.css'; // Reuse notification styles for consistency
import { htmlToText } from './ServiceStatusCard';

export default function NotificationChatbot({
  cloudflareIncidents = [],
  zscalerUpdates = [],
  oktaUpdates = [],
  sendgridUpdates = [],
  slackUpdates = [],
  datadogUpdates = [],
  awsUpdates = [],
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
    ...slackUpdates.map(item => ({ ...item, service: 'Slack', date: item.reported_at || item.date, id: `slack-${item.title || item.id}` })),
    ...datadogUpdates.map(item => ({ ...item, service: 'Datadog', date: item.reported_at || item.date, id: `datadog-${item.title || item.id}` })),
    ...awsUpdates.map(item => ({ ...item, service: 'AWS', date: item.reported_at || item.date, id: `aws-${item.title || item.id}` })),
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
      ...slackUpdates.map(item => `slack-${item.title || item.id}`),
      ...datadogUpdates.map(item => `datadog-${item.title || item.id}`),
      ...awsUpdates.map(item => `aws-${item.title || item.id}`),
    ].filter(id => {
      const alert = [
        ...cloudflareIncidents.map(item => ({ ...item, date: item.updated_at || item.created_at })),
        ...zscalerUpdates, ...oktaUpdates, ...sendgridUpdates,
        ...slackUpdates.map(item => ({ ...item, date: item.reported_at || item.date })),
        ...datadogUpdates.map(item => ({ ...item, date: item.reported_at || item.date })),
        ...awsUpdates.map(item => ({ ...item, date: item.reported_at || item.date })),
      ].find(a => 
        id === `cloudflare-${a.id || a.name}` || 
        id === `zscaler-${a.title || a.link}` || 
        id === `okta-${a.title || a.link}` || 
        id === `sendgrid-${a.title || a.link}` ||
        id === `slack-${a.title || a.id}` ||
        id === `datadog-${a.title || a.id}` ||
        id === `aws-${a.title || a.id}`
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
    const isMobile = window.innerWidth <= 600;
    if (isMobile) {
      // On mobile, center the modal and position it from the top
      return {
        top: 80,
        left: '50%',
        transform: 'translateX(-50%)',
        right: 'auto'
      };
    }
    if (!buttonRef.current) return { top: 70, right: 16 };
    const rect = buttonRef.current.getBoundingClientRect();
    return {
      top: rect.bottom + 8,
      right: Math.max(8, window.innerWidth - rect.right)
    };
  };

  // Responsive modal width and padding
  const getModalStyle = () => {
    const isMobile = window.innerWidth <= 600;
    const position = getModalPosition();
    
    return {
      position: 'fixed',
      top: position.top,
      left: position.left,
      right: position.right,
      transform: position.transform,
      bottom: !usePortal && !headerMode && !aboveHeader && !isMobile ? 90 : undefined,
      width: isMobile ? '90vw' : 400,
      maxWidth: isMobile ? '90vw' : 400,
      minWidth: isMobile ? 'unset' : 320,
      maxHeight: isMobile ? '70vh' : 540,
      background: 'rgba(255,255,255,0.98)',
      borderRadius: isMobile ? 16 : 22,
      boxShadow: '0 16px 48px 0 rgba(80,80,180,0.18), 0 2px 8px rgba(99,102,241,0.10)',
      zIndex: modalZIndex,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      border: '1.5px solid #e0e7ef',
      animation: 'slideDown 0.22s cubic-bezier(0.4,0,0.2,1)',
      backdropFilter: 'blur(16px)',
      margin: isMobile ? '0 auto' : undefined
    };
  };

  // Modal content
  const modalContent = open && (
    <div
      ref={panelRef}
      style={getModalStyle()}
    >
      <div style={{ padding: window.innerWidth <= 600 ? '14px 10px 10px 14px' : '22px 28px 16px 28px', borderBottom: '1px solid #f1f5f9', background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(99,102,241,0.04)' }}>
        <span style={{ fontWeight: 800, fontSize: window.innerWidth <= 600 ? '1em' : '1.18em', color: '#3730a3', letterSpacing: 0.2 }}>Today's Issues</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {allAlerts.length > 0 && (
            <button 
              onClick={clearAllNotifications}
              style={{ 
                background: 'rgba(239, 68, 68, 0.1)', 
                border: '1px solid rgba(239, 68, 68, 0.2)', 
                borderRadius: 8, 
                padding: window.innerWidth <= 600 ? '2px 8px' : '4px 12px', 
                fontSize: window.innerWidth <= 600 ? 11 : 12, 
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
          <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', fontSize: window.innerWidth <= 600 ? 22 : 26, cursor: 'pointer', color: '#64748b', fontWeight: 700, transition: 'color 0.2s' }} aria-label="Close">&times;</button>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: window.innerWidth <= 600 ? '10px 0' : '18px 0', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
        {allAlerts.length === 0 ? (
          <div style={{ padding: window.innerWidth <= 600 ? 24 : 48, textAlign: 'center', color: '#64748b', fontSize: window.innerWidth <= 600 ? 14 : 16 }}>
            <span style={{ fontSize: window.innerWidth <= 600 ? 24 : 36, display: 'block', marginBottom: 14 }}>✅</span>
            <div style={{ fontWeight: 700, color: '#3730a3', fontSize: window.innerWidth <= 600 ? 15 : 18 }}>
              {clearedAlerts.size > 0 ? 'All notifications cleared' : 'No issues today'}
            </div>
            <small style={{ color: '#9ca3af', fontSize: window.innerWidth <= 600 ? 11 : 14 }}>
              {clearedAlerts.size > 0 ? 'You\'ve cleared all today\'s notifications' : 'All systems operational'}
            </small>
          </div>
        ) : (
          allAlerts.map((alert, i) => {
            const description = alert.description ? htmlToText(alert.description) : '';
            return (
              <div key={alert.id} style={{ margin: window.innerWidth <= 600 ? '0 0 12px 0' : '0 0 18px 0', background: '#fff', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.04)', padding: window.innerWidth <= 600 ? '10px 12px' : '16px 22px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <span style={{ fontSize: window.innerWidth <= 600 ? 16 : 18, fontWeight: 700 }}>{alert.service}</span>
                  <span style={{ fontSize: window.innerWidth <= 600 ? 11 : 12, color: '#64748b', fontWeight: 600, marginLeft: 2 }}>{new Date(alert.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <button onClick={() => clearNotification(alert.id)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#888', fontSize: window.innerWidth <= 600 ? 15 : 18, cursor: 'pointer' }} aria-label="Clear notification">×</button>
                  {alert.status && (
                    <span style={{ background: '#f3f4f6', color: '#64748b', borderRadius: 8, padding: window.innerWidth <= 600 ? '1px 6px' : '2px 10px', fontSize: window.innerWidth <= 600 ? 10 : 12, fontWeight: 700, textTransform: 'capitalize', letterSpacing: 0.2, marginLeft: 6 }}>{alert.status.replace('_', ' ')}</span>
                  )}
                </div>
                <div style={{ fontWeight: 700, color: '#1e293b', fontSize: window.innerWidth <= 600 ? 13 : 16, marginBottom: 2, lineHeight: 1.3 }}>
                  {alert.name || alert.title}
                </div>
                {description && (
                  <div style={{ color: '#64748b', fontSize: window.innerWidth <= 600 ? 12 : 14, marginBottom: 2, lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                    {description}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 2 }}>
                  {alert.link && (
                    <a href={alert.link} target="_blank" rel="noopener noreferrer" style={{ color: '#6366f1', fontWeight: 600, fontSize: window.innerWidth <= 600 ? 11 : 13, textDecoration: 'underline', marginLeft: 2 }}>View Source ↗</a>
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
      {/* Mobile backdrop overlay */}
      {open && window.innerWidth <= 600 && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.4)',
            zIndex: modalZIndex - 1,
            animation: 'fadeIn 0.2s ease-out'
          }}
          onClick={() => setOpen(false)}
        />
      )}
      
      {/* Chatbot Button */}
      <div style={aboveHeader ? { width: '100%', display: 'flex', justifyContent: 'flex-end', position: 'relative', zIndex: 200 } : {}}>
        <button
          ref={buttonRef}
          className="notification-bell-button"
          style={headerMode || aboveHeader ? {
            position: 'relative',
            right: 0,
            top: 0,
            marginLeft: 0,
            marginRight: 0,
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            color: '#fff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
            zIndex: 2000,
            border: '1px solid rgba(255, 255, 255, 0.2)',
            width: 44,
            height: 44,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
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
