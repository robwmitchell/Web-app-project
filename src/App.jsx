import React, { useEffect, useState } from 'react';
import LivePulseCard from './LivePulseCard';
import LivePulseCardContainer from './LivePulseCardContainer';
import ZscalerPulseCardContainer from './ZscalerPulseCardContainer';
import Modal from './Modal';
import MiniHeatbarGrid from './MiniHeatbarGrid';
import './App.css';
import './MiniHeatbarGrid.css';
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Analytics } from "@vercel/analytics/react";
import { FaBell } from 'react-icons/fa';
import Button from './Button';

function parseZscalerRSS(xmlText, maxItems = 25) {
  const parser = new window.DOMParser();
  const xml = parser.parseFromString(xmlText, 'text/xml');
  const items = Array.from(xml.querySelectorAll('item'));
  // Only keep the most recent N items
  return items.slice(0, maxItems).map(item => ({
    title: item.querySelector('title')?.textContent || '',
    link: item.querySelector('link')?.textContent || '',
    date: item.querySelector('pubDate')?.textContent || '', // This must be present!
    description: item.querySelector('description')?.textContent || '',
    eventType: item.querySelector('eventType')?.textContent || '',
  }));
}

function getStatusFromZscalerUpdates(updates) {
  if (updates.length === 0) return 'Operational';
  const latest = updates[0];
  const resolvedKeywords = ['resolved', 'closed'];
  const openKeywords = [
    'open', 'investigating', 'degraded', 'outage', 'incident', 'partial', 'disruption', 'monitoring', 'in progress', 'under review', 'downtime', 'service disruption'
  ];
  if (resolvedKeywords.some(keyword =>
    (latest.title + ' ' + latest.description).toLowerCase().includes(keyword)
  )) {
    return 'Operational';
  }
  if (updates.some(update =>
    openKeywords.some(keyword =>
      (update.title + ' ' + update.description).toLowerCase().includes(keyword)
    )
  )) {
    return 'Issues Detected';
  }
  return 'Operational';
}

function getCloudflareStatusFromIncidents(incidents) {
  if (!Array.isArray(incidents) || incidents.length === 0) return { status: 'Operational', indicator: 'none' };
  // Only consider currently open (unresolved) incidents for pulsing/indicator
  const openIncidents = incidents.filter(inc => !['resolved', 'completed'].includes((inc.status || '').toLowerCase()));
  if (openIncidents.length > 0) {
    // Use the highest impact/indicator among open incidents
    const impactPriority = { critical: 3, major: 2, minor: 1, none: 0 };
    let maxImpact = 'minor';
    openIncidents.forEach(inc => {
      if (impactPriority[(inc.impact || '').toLowerCase()] > impactPriority[maxImpact]) {
        maxImpact = (inc.impact || '').toLowerCase();
      }
    });
    let indicator = maxImpact;
    if (!['critical', 'major', 'minor'].includes(indicator)) indicator = 'minor';
    return { status: 'Issues Detected', indicator };
  }
  // All incidents are resolved, so show green
  return { status: 'Operational', indicator: 'none' };
}

function getZscalerIndicator(status) {
  if (!status || status === 'Operational') return 'none';
  if (status === 'Issues Detected') return 'major';
  return 'minor';
}

function parseOktaRSS(xmlText, maxItems = 25) {
  const parser = new window.DOMParser();
  const xml = parser.parseFromString(xmlText, 'text/xml');
  const items = Array.from(xml.querySelectorAll('item'));
  // Only keep the most recent N items
  return items.slice(0, maxItems).map(item => ({
    title: item.querySelector('title')?.textContent || '',
    link: item.querySelector('link')?.textContent || '',
    date: item.querySelector('pubDate')?.textContent || '',
    description: item.querySelector('description')?.textContent || '',
    // Okta RSS does not have eventType, but you can parse from title/description if needed
  }));
}

function getStatusFromOktaUpdates(updates) {
  if (updates.length === 0) return 'Operational';
  const latest = updates[0];
  const resolvedKeywords = ['resolved', 'closed'];
  const openKeywords = [
    'open', 'investigating', 'degraded', 'outage', 'incident', 'partial', 'disruption', 'monitoring', 'in progress', 'under review', 'downtime', 'service disruption'
  ];
  if (resolvedKeywords.some(keyword =>
    (latest.title + ' ' + latest.description).toLowerCase().includes(keyword)
  )) {
    return 'Operational';
  }
  if (updates.some(update =>
    openKeywords.some(keyword =>
      (update.title + ' ' + update.description).toLowerCase().includes(keyword)
    )
  )) {
    return 'Issues Detected';
  }
  return 'Operational';
}

function getOktaIndicator(status) {
  if (!status || status === 'Operational') return 'none';
  if (status === 'Issues Detected') return 'major';
  return 'minor';
}

function parseSendgridRSS(xmlText, maxItems = 25) {
  const parser = new window.DOMParser();
  const xml = parser.parseFromString(xmlText, 'text/xml');
  const items = Array.from(xml.querySelectorAll('item'));
  // Only keep the most recent N items
  return items.slice(0, maxItems).map(item => ({
    title: item.querySelector('title')?.textContent || '',
    link: item.querySelector('link')?.textContent || '',
    date: item.querySelector('pubDate')?.textContent || '',
    description: item.querySelector('description')?.textContent || '',
    // SendGrid RSS does not have eventType, but you can parse from title/description if needed
  }));
}

function getStatusFromSendgridUpdates(updates) {
  if (updates.length === 0) return 'Operational';
  const latest = updates[0];
  const resolvedKeywords = ['resolved', 'closed'];
  const openKeywords = [
    'open', 'investigating', 'degraded', 'outage', 'incident', 'partial', 'disruption', 'monitoring', 'in progress', 'under review', 'downtime', 'service disruption'
  ];
  if (resolvedKeywords.some(keyword =>
    (latest.title + ' ' + latest.description).toLowerCase().includes(keyword)
  )) {
    return 'Operational';
  }
  if (updates.some(update =>
    openKeywords.some(keyword =>
      (update.title + ' ' + update.description).toLowerCase().includes(keyword)
    )
  )) {
    return 'Issues Detected';
  }
  return 'Operational';
}

function getSendgridIndicator(status) {
  if (!status || status === 'Operational') return 'none';
  if (status === 'Issues Detected') return 'major';
  return 'minor';
}

// Helper function to get provider-specific colors
function getProviderColor(provider) {
  const colors = {
    'Cloudflare': '#f38020',
    'Zscaler': '#0066cc',
    'Okta': '#007dc1',
    'SendGrid': '#1a82e2',
    'default': '#6c757d'
  };
  return colors[provider] || colors.default;
}

function App() {
  const [cloudflare, setCloudflare] = useState({ status: 'Loading...', indicator: '', incidents: [] });
  const [zscaler, setZscaler] = useState({ status: 'Loading...', updates: [] });
  const [sendgrid, setSendgrid] = useState({ status: 'Loading...', indicator: '', updates: [], name: 'SendGrid' });
  const [okta, setOkta] = useState({ status: 'Loading...', indicator: '', updates: [], name: 'Okta' });
  const [today, setToday] = useState(() => new Date());
  const [lastUpdated, setLastUpdated] = useState(() => new Date());
  const [loading, setLoading] = useState(false);
  const [criticalMode, setCriticalMode] = useState({ active: false, details: [] });
  const [tickerIndex, setTickerIndex] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState(null);
  const demoIssues = [
    { provider: 'Cloudflare', name: 'API Gateway Outage', status: 'critical', updated: new Date().toISOString(), url: 'https://www.cloudflarestatus.com/' },
    { provider: 'Zscaler', name: 'Authentication Failure', status: 'major', updated: new Date().toISOString(), url: 'https://trust.zscaler.com/' },
    { provider: 'Okta', name: 'Service Disruption', status: 'critical', updated: new Date().toISOString(), url: 'https://status.okta.com/' },
  ];

  // Utility: get and set Cloudflare incidents in localStorage
  function getStoredCloudflareIncidents() {
    try {
      const raw = localStorage.getItem('cloudflare_incidents');
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }
  function setStoredCloudflareIncidents(incidents) {
    try {
      localStorage.setItem('cloudflare_incidents', JSON.stringify(incidents));
    } catch {}
  }

  // Fetch all statuses (extracted for reuse)
  const fetchAllStatuses = React.useCallback(() => {
    setLoading(true);
    // Cloudflare status (based on open incidents)
    fetch('https://www.cloudflarestatus.com/api/v2/status.json')
      .then(res => res.json())
      .then(statusData => {
        fetch('https://www.cloudflarestatus.com/api/v2/summary.json')
          .then(res => res.json())
          .then(summaryData => {
            const name = summaryData.page?.name || 'Cloudflare';
            // Only include incidents updated in the last 7 days
            const now = new Date();
            const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const apiIncidents = (summaryData.incidents || []).filter(inc => {
              const updatedAt = inc.updated_at || inc.updatedAt;
              if (!updatedAt) return false;
              const updatedDate = new Date(updatedAt);
              return !isNaN(updatedDate) && updatedDate >= sevenDaysAgo;
            });
            // --- Merge with localStorage ---
            let stored = getStoredCloudflareIncidents();
            // Remove old stored incidents
            stored = stored.filter(inc => {
              const updatedAt = inc.updated_at || inc.updatedAt;
              if (!updatedAt) return false;
              const updatedDate = new Date(updatedAt);
              return !isNaN(updatedDate) && updatedDate >= sevenDaysAgo;
            });
            // Merge: update or add any from API, keep any not present in API
            const merged = [...apiIncidents];
            stored.forEach(storedInc => {
              if (!merged.some(apiInc => apiInc.id === storedInc.id)) {
                merged.push(storedInc);
              }
            });
            setStoredCloudflareIncidents(merged);
            const { status, indicator } = getCloudflareStatusFromIncidents(merged);
            setCloudflare({ status, indicator, incidents: merged, name });
          })
          .catch(() => setCloudflare({ status: 'Error loading status', indicator: '', incidents: [], name: 'Cloudflare' }));
      })
      .catch(() => setCloudflare({ status: 'Error loading status', indicator: '', incidents: [], name: 'Cloudflare' }));
    // Zscaler RSS fetch via local proxy to avoid CORS
    fetch('/api/zscaler')
      .then(res => res.text())
      .then(data => {
        const updates = parseZscalerRSS(data, 25); // Only keep 25 most recent
        // Filter for last 7 days
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const filteredUpdates = updates.filter(update => {
          const updateDate = new Date(update.date);
          return !isNaN(updateDate) && updateDate >= sevenDaysAgo;
        });
        const status = getStatusFromZscalerUpdates(filteredUpdates);
        setZscaler({ status, updates: filteredUpdates });
      })
      .catch(() => setZscaler({ status: 'Error loading feed', updates: [] }));
    // Okta RSS fetch via local proxy to avoid CORS
    fetch('/api/okta-status')
      .then(res => res.text())
      .then(data => {
        const updates = parseOktaRSS(data, 25); // Only keep 25 most recent
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const filteredUpdates = updates.filter(update => {
          const updateDate = new Date(update.date);
          return !isNaN(updateDate) && updateDate >= sevenDaysAgo;
        });
        const status = getStatusFromOktaUpdates(filteredUpdates);
        setOkta({ status, indicator: getOktaIndicator(status), updates: filteredUpdates, name: 'Okta' });
      })
      .catch(() => setOkta({ status: 'Error loading feed', indicator: '', updates: [], name: 'Okta' }));
    // SendGrid RSS fetch via local proxy to avoid CORS
    fetch('/api/sendgrid')
      .then(res => res.text())
      .then(data => {
        const updates = parseSendgridRSS(data, 25); // Only keep 25 most recent
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const filteredUpdates = updates.filter(update => {
          const updateDate = new Date(update.date);
          return !isNaN(updateDate) && updateDate >= sevenDaysAgo;
        });
        const status = getStatusFromSendgridUpdates(filteredUpdates);
        setSendgrid({ status, indicator: getSendgridIndicator(status), updates: filteredUpdates, name: 'SendGrid' });
      })
      .catch(() => setSendgrid({ status: 'Error loading feed', indicator: '', updates: [], name: 'SendGrid' }))
      .finally(() => {
        setLastUpdated(new Date());
        setLoading(false);
      });
  }, []);

  // Check for any major/critical outage across all providers
  useEffect(() => {
    const criticals = [];
    // Cloudflare
    if (cloudflare && cloudflare.indicator === 'critical' && cloudflare.incidents && cloudflare.incidents.length > 0) {
      cloudflare.incidents.forEach(inc => {
        if ((inc.impact || '').toLowerCase() === 'critical' && !['resolved', 'completed'].includes((inc.status || '').toLowerCase())) {
          criticals.push({ provider: 'Cloudflare', name: inc.name, status: inc.status, updated: inc.updated_at || inc.updatedAt, url: inc.shortlink || inc.url });
        }
      });
    }
    // Zscaler
    if (zscaler && getZscalerIndicator(zscaler.status) === 'major' && zscaler.updates && zscaler.updates.length > 0) {
      zscaler.updates.forEach(upd => {
        const text = `${upd.title || ''} ${upd.description || ''}`.toLowerCase();
        if (text.includes('outage') || text.includes('critical')) {
          criticals.push({ provider: 'Zscaler', name: upd.title, status: zscaler.status, updated: upd.date, url: upd.link });
        }
      });
    }
    // Okta
    if (okta && okta.indicator === 'major' && okta.updates && okta.updates.length > 0) {
      okta.updates.forEach(upd => {
        const text = `${upd.title || ''} ${upd.description || ''}`.toLowerCase();
        if (text.includes('outage') || text.includes('critical')) {
          criticals.push({ provider: 'Okta', name: upd.title, status: okta.status, updated: upd.date, url: upd.link });
        }
      });
    }
    // SendGrid
    if (sendgrid && sendgrid.indicator === 'major' && sendgrid.updates && sendgrid.updates.length > 0) {
      sendgrid.updates.forEach(upd => {
        const text = `${upd.title || ''} ${upd.description || ''}`.toLowerCase();
        if (text.includes('outage') || text.includes('critical')) {
          criticals.push({ provider: 'SendGrid', name: upd.title, status: sendgrid.status, updated: upd.date, url: upd.link });
        }
      });
    }
    setCriticalMode({ active: criticals.length > 0, details: criticals });
  }, [cloudflare, zscaler, okta, sendgrid]);

  useEffect(() => {
    setToday(new Date()); // Update on mount (in case of SSR)
    fetchAllStatuses();
    const interval = setInterval(fetchAllStatuses, 2 * 60 * 1000); // 2 minutes
    return () => clearInterval(interval);
  }, [fetchAllStatuses]);

  // Ticker logic: cycle through issues if more than one
  useEffect(() => {
    const issues = criticalMode.active ? criticalMode.details : demoIssues;
    if (issues.length > 1) {
      const interval = setInterval(() => {
        setTickerIndex(i => (i + 1) % issues.length);
      }, 5000); // 5 seconds per issue
      return () => clearInterval(interval);
    } else {
      setTickerIndex(0);
    }
  }, [criticalMode.active, criticalMode.details.length]);

  // Fetch notifications (issues from last 24h + provider incidents)
  const fetchNotifications = React.useCallback(async () => {
    setNotificationsLoading(true);
    setNotificationsError(null);
    try {
      const res = await fetch('/api/notifications-latest');
      const json = await res.json();
      if (json.data) {
        setNotifications(json.data);
      } else {
        setNotifications([]);
      }
    } catch (err) {
      setNotificationsError('Failed to load notifications');
      setNotifications([]);
    } finally {
      setNotificationsLoading(false);
    }
  }, []);

  // Auto-fetch notifications on page load and every 5 minutes
  useEffect(() => {
    fetchNotifications(); // Initial fetch
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000); // Every 5 minutes
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Handle bell click
  const handleBellClick = () => {
    setNotificationsOpen((open) => {
      if (!open) fetchNotifications(); // Refresh when opening
      return !open;
    });
  };

  // Handle clear notifications (client-side only)
  const handleClearNotifications = () => {
    setNotifications([]);
    setNotificationsOpen(false);
  };

  return (
    <>
      <div style={{
        width: '100%',
        background: '#fff',
        borderBottom: '1px solid #e0e0e0',
        padding: '0 0 0 0',
        marginBottom: 18,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 56,
        boxShadow: '0 2px 8px #0001',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ fontWeight: 700, fontSize: '1.22em', paddingLeft: 24, letterSpacing: 1 }}>
          Stack Status IO
        </div>
        <div style={{ paddingRight: 24, position: 'relative' }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <button
              onClick={handleBellClick}
              title="Notifications"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '12px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.2s ease',
                position: 'relative'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(0,0,0,0.05)'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              <FaBell
                size={24}
                color={notifications.length > 0 ? "#f57c00" : "#1976d2"}
                style={{ 
                  transition: 'all 0.3s ease',
                  transform: notificationsOpen ? 'scale(1.1)' : 'scale(1)',
                  filter: notifications.length > 0 ? 'drop-shadow(0 0 8px rgba(245,124,0,0.4))' : 'none'
                }}
              />
            </button>
            {notifications.length > 0 && (
              <span style={{
                position: 'absolute',
                top: -6,
                right: -6,
                background: 'linear-gradient(135deg, #ff4444, #cc0000)',
                color: '#fff',
                borderRadius: '50%',
                minWidth: 20,
                height: 20,
                fontSize: 11,
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid #fff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                animation: notifications.length > 0 ? 'pulse 2s infinite' : 'none',
                zIndex: 2,
              }}>
                {notifications.length > 99 ? '99+' : notifications.length}
              </span>
            )}
          </div>
          {notificationsOpen && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: 32,
              minWidth: 380,
              maxWidth: 420,
              background: '#fff',
              border: '1px solid #e0e0e0',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              borderRadius: 12,
              zIndex: 1000,
              padding: 0,
              animation: 'slideIn 0.2s ease-out',
              maxHeight: '70vh',
              overflow: 'hidden',
            }}>
              <div style={{ 
                padding: '16px 20px', 
                borderBottom: '1px solid #f0f0f0', 
                fontWeight: 600, 
                fontSize: 16,
                background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
                borderRadius: '12px 12px 0 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span>🔔 Service Alerts (last 7 days)</span>
                <button 
                  onClick={() => setNotificationsOpen(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: 18,
                    cursor: 'pointer',
                    color: '#666',
                    padding: 4
                  }}
                >×</button>
              </div>
              {notificationsLoading ? (
                <div style={{ padding: 24, textAlign: 'center', color: '#666' }}>
                  <div style={{ fontSize: 14 }}>🔄 Loading alerts...</div>
                </div>
              ) : notificationsError ? (
                <div style={{ padding: 24, color: '#d32f2f', textAlign: 'center' }}>
                  <div style={{ fontSize: 14 }}>❌ {notificationsError}</div>
                </div>
              ) : notifications.length === 0 ? (
                <div style={{ padding: 24, color: '#888', textAlign: 'center' }}>
                  <div style={{ fontSize: 16, marginBottom: 8 }}>✅</div>
                  <div style={{ fontSize: 14 }}>All systems operational</div>
                  <div style={{ fontSize: 12, color: '#aaa', marginTop: 4 }}>No new alerts in the last 7 days</div>
                </div>
              ) : (
                <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                  {notifications.map((n, index) => (
                    <div key={n.id} style={{ 
                      borderBottom: index < notifications.length - 1 ? '1px solid #f5f5f5' : 'none', 
                      padding: '16px 20px',
                      transition: 'background-color 0.2s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    onClick={() => n.url && window.open(n.url, '_blank')}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        <div style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: getProviderColor(n.provider),
                          marginTop: 6,
                          flexShrink: 0
                        }}></div>
                        <div style={{ flex: 1 }}>
                          <div style={{ 
                            fontWeight: 600, 
                            marginBottom: 4,
                            fontSize: 14,
                            color: '#2c3e50'
                          }}>
                            [{n.provider}] {n.title || n.provider}
                          </div>
                          <div style={{ 
                            fontSize: 13, 
                            color: '#666', 
                            marginBottom: 6,
                            lineHeight: 1.4,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}>
                            {n.description || 'No description available'}
                          </div>
                          <div style={{ 
                            fontSize: 11, 
                            color: '#999',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8
                          }}>
                            <span>🕒 {n.reported_at ? new Date(n.reported_at).toLocaleString() : 'Unknown time'}</span>
                            {n.url && <span style={{ color: '#1976d2' }}>🔗 View details</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ 
                padding: '12px 20px', 
                borderTop: '1px solid #f0f0f0', 
                background: '#fafafa',
                borderRadius: '0 0 12px 12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: 12, color: '#666' }}>
                  Auto-refresh every 5min
                </span>
                <Button 
                  onClick={handleClearNotifications} 
                  style={{ 
                    fontSize: 12, 
                    padding: '6px 12px',
                    background: 'linear-gradient(135deg, #6c757d, #495057)',
                    border: 'none',
                    borderRadius: 6
                  }}
                >
                  Clear All
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
        {/* Responsive: stack date and refresh on mobile */}
        <div className="app-top-bar">
          <div className="app-date">
            {today.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
          <div className="app-refresh">
            <span style={{ fontSize: 14, color: '#888' }}>Last updated: {lastUpdated.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          </div>
        </div>
        {/* Critical Mode Strip (with example for demo) */}
        {(
          criticalMode.active || process.env.NODE_ENV === 'development'
        ) && (
          <div style={{
            width: '100%',
            background: 'linear-gradient(90deg, #d32f2f 0%, #b71c1c 100%)',
            color: '#fff',
            fontWeight: 600,
            fontSize: 17,
            padding: '8px 0',
            marginBottom: 18,
            display: 'flex',
            alignItems: 'center',
            overflow: 'hidden',
            position: 'relative',
            zIndex: 10,
            minHeight: 32,
          }}>
            <div style={{
              width: '100%',
              textAlign: 'center',
              transition: 'opacity 0.6s',
              opacity: 1,
              position: 'relative',
            }}>
              {(() => {
                const issues = criticalMode.active ? criticalMode.details : demoIssues;
                const idx = tickerIndex % issues.length;
                const c = issues[idx];
                return (
                  <span key={idx} style={{ display: 'inline-block', transition: 'opacity 0.6s' }}>
                    [{c.provider}] <b>{c.name}</b> - {c.status} {c.updated ? `(${new Date(c.updated).toLocaleString()})` : ''}
                    {c.url && (
                      <a href={c.url} target="_blank" rel="noopener noreferrer" style={{ color: '#fff', textDecoration: 'underline', marginLeft: 8 }}>Details</a>
                    )}
                  </span>
                );
              })()}
            </div>
          </div>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
          <LivePulseCardContainer
            provider="Cloudflare"
            name={cloudflare.name}
            indicator={cloudflare.indicator}
            status={cloudflare.status}
            incidents={cloudflare.incidents}
          />
          <ZscalerPulseCardContainer
            provider="Zscaler"
            name="Zscaler"
            indicator={getZscalerIndicator(zscaler.status)}
            status={zscaler.status}
            updates={zscaler.updates}
          />
          <ZscalerPulseCardContainer
            provider="SendGrid"
            name="SendGrid"
            indicator={sendgrid.indicator}
            status={sendgrid.status}
            updates={sendgrid.updates}
            incidents={sendgrid.updates} // Pass updates as incidents for SendGrid modal
          />
          <ZscalerPulseCardContainer
            provider="Okta"
            name="Okta"
            indicator={okta.indicator}
            status={okta.status}
            updates={okta.updates}
          />
        </div>
        {/* Mini Heatbar Grid at the bottom of the page */}
        <MiniHeatbarGrid />
        <SpeedInsights />
        <Analytics />
      </div>
    </>
  );
}

export default App;
