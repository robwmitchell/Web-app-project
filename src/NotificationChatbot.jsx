import React, { useState, useEffect, useRef } from 'react';
import './NotificationBell.css'; // Reuse notification styles for consistency
import { htmlToText } from './ServiceStatusCard';

export default function NotificationChatbot({
  cloudflareIncidents = [],
  zscalerUpdates = [],
  oktaUpdates = [],
  sendgridUpdates = []
}) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  // Aggregate today's issues
  const today = new Date();
  const isToday = (date) => {
    const d = new Date(date);
    return d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear();
  };
  const allAlerts = [
    ...cloudflareIncidents.map(item => ({ ...item, service: 'Cloudflare', date: item.updated_at || item.created_at })),
    ...zscalerUpdates.map(item => ({ ...item, service: 'Zscaler', date: item.date })),
    ...oktaUpdates.map(item => ({ ...item, service: 'Okta', date: item.date })),
    ...sendgridUpdates.map(item => ({ ...item, service: 'SendGrid', date: item.date })),
  ].filter(alert => isToday(alert.date));

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (open && panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <>
      {/* Floating Chatbot Button */}
      <button
        className="notification-bell-button"
        style={{
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

      {/* Chatbot Panel */}
      {open && (
        <div
          ref={panelRef}
          style={{
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
            backdropFilter: 'blur(16px)',
          }}
        >
          <div style={{ padding: '22px 28px 16px 28px', borderBottom: '1px solid #f1f5f9', background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(99,102,241,0.04)' }}>
            <span style={{ fontWeight: 800, fontSize: '1.18em', color: '#3730a3', letterSpacing: 0.2 }}>Today's Issues</span>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', fontSize: 26, cursor: 'pointer', color: '#64748b', fontWeight: 700, transition: 'color 0.2s' }} aria-label="Close">&times;</button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '18px 0', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
            {allAlerts.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>
                <span style={{ fontSize: 36, display: 'block', marginBottom: 14 }}>✅</span>
                <div style={{ fontWeight: 700, color: '#3730a3', fontSize: 18 }}>No issues today</div>
                <small style={{ color: '#9ca3af', fontSize: 14 }}>All systems operational</small>
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
                    <div key={i} className="notification-item" style={{ borderLeft: '4px solid #6366f1', margin: '0 0 14px 0', background: 'rgba(255,255,255,0.92)', borderRadius: 14, boxShadow: '0 1px 6px rgba(99,102,241,0.08)', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 6 }}>
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
                  <div key={i} className="notification-item" style={{ borderLeft: '4px solid #6366f1', margin: '0 0 14px 0', background: 'rgba(255,255,255,0.92)', borderRadius: 14, boxShadow: '0 1px 6px rgba(99,102,241,0.08)', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 6 }}>
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
      )}
    </>
  );
}
