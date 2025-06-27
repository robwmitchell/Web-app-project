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
      <div className="header-gradient" style={{
        width: '100%',
        color: '#fff',
        padding: '0',
        marginBottom: 18,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 64,
        boxShadow: '0 8px 32px rgba(102, 126, 234, 0.15), 0 4px 16px rgba(0,0,0,0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
      }}>
        <div className="header-title" style={{ 
          fontWeight: 800, 
          fontSize: '1.4em', 
          paddingLeft: 28, 
          letterSpacing: 0.5,
          display: 'flex',
          alignItems: 'center',
          gap: 12
        }}>
          <div className="header-status-dot" style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#4ade80',
          }}></div>
          Stack Status IO
          <div className="header-live-badge" style={{
            background: 'rgba(255,255,255,0.15)',
            padding: '2px 8px',
            borderRadius: 12,
            fontSize: '0.6em',
            fontWeight: 500,
            letterSpacing: 0.5,
            marginLeft: 8
          }}>
            LIVE
          </div>
        </div>
        <div className="header-notification" style={{ paddingRight: 28, position: 'relative', zIndex: 1001 }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <button
              onClick={handleBellClick}
              title="Service Notifications"
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                cursor: 'pointer',
                padding: '14px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
                position: 'relative',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255,255,255,0.2)';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255,255,255,0.1)';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)';
              }}
            >
              <FaBell
                size={20}
                color="#fff"
                style={{ 
                  transition: 'all 0.3s ease',
                  transform: notificationsOpen ? 'scale(1.1) rotate(15deg)' : 'scale(1)',
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
                }}
              />
            </button>
            {notifications.length > 0 && (
              <span style={{
                position: 'absolute',
                top: -8,
                right: -8,
                background: 'linear-gradient(135deg, #ff6b6b, #ee5a52)',
                color: '#fff',
                borderRadius: '50%',
                minWidth: 22,
                height: 22,
                fontSize: 11,
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid rgba(255,255,255,0.9)',
                boxShadow: '0 4px 12px rgba(255, 107, 107, 0.4), 0 2px 4px rgba(0,0,0,0.2)',
                animation: 'pulse 2s infinite',
                zIndex: 2,
                backdropFilter: 'blur(10px)'
              }}>
                {notifications.length > 99 ? '99+' : notifications.length}
              </span>
            )}
          </div>
          {notificationsOpen && (
            <div className="notification-flyout" style={{
              minWidth: 380,
              maxWidth: 420,
              background: '#fff',
              border: '1px solid #e0e0e0',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              borderRadius: 12,
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
        {/* Enhanced Critical Alert Banner */}
        {(
          criticalMode.active || process.env.NODE_ENV === 'development'
        ) && (
          <div className="alert-banner-container">
            <div className="alert-banner-content" style={{
              background: 'linear-gradient(135deg, #ff4757 0%, #ff3742 50%, #c44569 100%)',
              color: '#fff',
              fontWeight: 600,
              fontSize: 16,
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              overflow: 'hidden',
              position: 'relative',
              zIndex: 10,
              minHeight: 48,
              borderRadius: 12,
              boxShadow: '0 4px 20px rgba(255, 71, 87, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)',
              animation: 'alertPulse 3s ease-in-out infinite',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}>
            {/* Alert Icon */}
            <div style={{
              marginRight: 12,
              fontSize: 20,
              animation: 'alertIcon 2s ease-in-out infinite',
              filter: 'drop-shadow(0 0 4px rgba(255, 255, 255, 0.3))'
            }}>
              ⚠️
            </div>
            
            {/* Content Container */}
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16
            }}>
              {/* Alert Content */}
              <div style={{
                flex: 1,
                minWidth: 0,
                textAlign: 'left'
              }}>
                {(() => {
                  const issues = criticalMode.active ? criticalMode.details : demoIssues;
                  const idx = tickerIndex % issues.length;
                  const c = issues[idx];
                  return (
                    <div key={idx} style={{ 
                      display: 'flex', 
                      flexDirection: 'column',
                      gap: 4,
                      animation: 'fadeIn 0.6s ease-out'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        flexWrap: 'wrap'
                      }}>
                        <span style={{
                          background: 'rgba(255, 255, 255, 0.2)',
                          padding: '2px 8px',
                          borderRadius: 12,
                          fontSize: 12,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          {c.provider}
                        </span>
                        <span style={{ fontWeight: 700 }}>{c.name}</span>
                        <span style={{
                          background: c.status === 'critical' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 193, 7, 0.8)',
                          color: c.status === 'critical' ? '#fff' : '#000',
                          padding: '2px 6px',
                          borderRadius: 8,
                          fontSize: 11,
                          fontWeight: 600,
                          textTransform: 'capitalize'
                        }}>
                          {c.status}
                        </span>
                      </div>
                      {c.updated && (
                        <div style={{
                          fontSize: 12,
                          opacity: 0.9,
                          fontWeight: 400
                        }}>
                          Last updated: {new Date(c.updated).toLocaleString()}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
              
              {/* Action Button */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                flexShrink: 0
              }}>
                {(() => {
                  const issues = criticalMode.active ? criticalMode.details : demoIssues;
                  const idx = tickerIndex % issues.length;
                  const c = issues[idx];
                  return c.url && (
                    <a 
                      href={c.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      style={{ 
                        background: 'rgba(255, 255, 255, 0.2)',
                        color: '#fff',
                        textDecoration: 'none',
                        padding: '8px 16px',
                        borderRadius: 20,
                        fontSize: 13,
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        transition: 'all 0.2s ease',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        backdropFilter: 'blur(10px)'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                        e.target.style.transform = 'translateY(-1px)';
                        e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = 'none';
                      }}
                    >
                      View Details
                      <span style={{ fontSize: 11 }}>↗</span>
                    </a>
                  );
                })()}
              </div>
            </div>
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
