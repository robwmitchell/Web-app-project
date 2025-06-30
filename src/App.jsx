import React, { useEffect, useState } from 'react';
import LivePulseCard from './LivePulseCard';
import LivePulseCardContainer from './LivePulseCardContainer';
import ZscalerPulseCardContainer from './ZscalerPulseCardContainer';
import Modal from './Modal';
import MiniHeatbarGrid from './MiniHeatbarGrid';
import ServiceSelectionSplash from './ServiceSelectionSplash';
import './App.css';
import './MiniHeatbarGrid.css';
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Analytics } from "@vercel/analytics/react";
import NotificationChatbot from './NotificationChatbot';
import logoImage from './assets/stackstatus1.png';

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
    'Slack': '#4a154b',
    'Datadog': '#632c41',
    'AWS': '#ff9900',
    'default': '#6c757d'
  };
  return colors[provider] || colors.default;
}

function App() {
  // Service selection state
  const [selectedServices, setSelectedServices] = useState(() => {
    try {
      const saved = localStorage.getItem('selectedServices');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [showSplash, setShowSplash] = useState(selectedServices === null);

  // Existing state
  const [cloudflare, setCloudflare] = useState({ status: 'Loading...', indicator: '', incidents: [] });
  const [zscaler, setZscaler] = useState({ status: 'Loading...', updates: [] });
  const [sendgrid, setSendgrid] = useState({ status: 'Loading...', indicator: '', updates: [], name: 'SendGrid' });
  const [okta, setOkta] = useState({ status: 'Loading...', indicator: '', updates: [], name: 'Okta' });
  const [slack, setSlack] = useState({ status: 'Loading...', updates: [], name: 'Slack' });
  const [datadog, setDatadog] = useState({ status: 'Loading...', updates: [], name: 'Datadog' });
  const [aws, setAws] = useState({ status: 'Loading...', updates: [], name: 'AWS' });
  const [today, setToday] = useState(() => new Date());
  const [lastUpdated, setLastUpdated] = useState(() => new Date());
  const [loading, setLoading] = useState(false);
  const [criticalMode, setCriticalMode] = useState({ active: false, details: [] });
  const [tickerIndex, setTickerIndex] = useState(0);
  const demoIssues = [
    { provider: 'Cloudflare', name: 'API Gateway Outage', status: 'critical', updated: new Date().toISOString(), url: 'https://www.cloudflarestatus.com/' },
    { provider: 'Zscaler', name: 'Authentication Failure', status: 'major', updated: new Date().toISOString(), url: 'https://trust.zscaler.com/' },
    { provider: 'Okta', name: 'Service Disruption', status: 'critical', updated: new Date().toISOString(), url: 'https://status.okta.com/' },
  ];

  // Configuration for splash screen behavior
const SPLASH_CONFIG = {
  autoRefreshOnSelection: true, // Set to false to disable auto-refresh
  refreshDelay: 300, // Delay before refresh in ms
  showRefreshMessage: true // Show loading message during refresh
};

// Utility: get and set Cloudflare incidents in localStorage
  function getStoredCloudflareIncidents() {
    try {
      // Check if localStorage is available (may be disabled in private browsing)
      if (typeof Storage === 'undefined' || !window.localStorage) {
        return [];
      }
      const raw = localStorage.getItem('cloudflare_incidents');
      if (!raw) return [];
      return JSON.parse(raw);
    } catch (error) {
      console.warn('Unable to access localStorage for Cloudflare incidents:', error);
      return [];
    }
  }
  function setStoredCloudflareIncidents(incidents) {
    try {
      // Check if localStorage is available (may be disabled in private browsing)
      if (typeof Storage === 'undefined' || !window.localStorage) {
        console.warn('localStorage not available, skipping incident storage');
        return;
      }
      localStorage.setItem('cloudflare_incidents', JSON.stringify(incidents));
    } catch (error) {
      console.warn('Unable to store Cloudflare incidents in localStorage:', error);
    }
  }

  // Fetch all statuses (extracted for reuse)
  const fetchAllStatuses = React.useCallback(() => {
    if (!selectedServices || selectedServices.length === 0) return;
    
    // Create AbortController for cancelling requests if component unmounts
    const abortController = new AbortController();
    const signal = abortController.signal;
    
    setLoading(true);
    
    // Cloudflare status (based on open incidents)
    if (isServiceSelected('cloudflare')) {
      fetch('/api/cloudflare?endpoint=status', { signal })
        .then(res => res.json())
        .then(statusData => {
          if (signal.aborted) return;
          fetch('/api/cloudflare?endpoint=summary', { signal })
            .then(res => res.json())
            .then(summaryData => {
              if (signal.aborted) return;
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
              // Remove any resolved incidents from localStorage and merged list
              const unresolved = merged.filter(inc => !inc.resolved_at);
              setStoredCloudflareIncidents(unresolved);
              const { status, indicator } = getCloudflareStatusFromIncidents(unresolved);
              setCloudflare({ status, indicator, incidents: unresolved, name });
            })
            .catch((error) => {
              if (error.name !== 'AbortError') {
                setCloudflare({ status: 'Error loading status', indicator: '', incidents: [], name: 'Cloudflare' });
              }
            });
        })
        .catch((error) => {
          if (error.name !== 'AbortError') {
            setCloudflare({ status: 'Error loading status', indicator: '', incidents: [], name: 'Cloudflare' });
          }
        });
    }
    
    // Zscaler RSS fetch via local proxy to avoid CORS
    if (isServiceSelected('zscaler')) {
      fetch('/api/zscaler', { signal })
        .then(res => res.text())
        .then(data => {
          if (signal.aborted) return;
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
        .catch((error) => {
          if (error.name !== 'AbortError') {
            setZscaler({ status: 'Error loading feed', updates: [] });
          }
        });
    }
    
    // Okta RSS fetch via local proxy to avoid CORS
    if (isServiceSelected('okta')) {
      fetch('/api/okta-status', { signal })
        .then(res => res.text())
        .then(data => {
          if (signal.aborted) return;
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
        .catch((error) => {
          if (error.name !== 'AbortError') {
            setOkta({ status: 'Error loading feed', indicator: '', updates: [], name: 'Okta' });
          }
        });
    }
    
    // SendGrid RSS fetch via local proxy to avoid CORS
    if (isServiceSelected('sendgrid')) {
      fetch('/api/sendgrid', { signal })
        .then(res => res.text())
        .then(data => {
          if (signal.aborted) return;
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
        .catch((error) => {
          if (error.name !== 'AbortError') {
            setSendgrid({ status: 'Error loading feed', indicator: '', updates: [], name: 'SendGrid' });
          }
        });
    }
    
    // Slack, Datadog, AWS RSS fetch
    if (isServiceSelected('slack') || isServiceSelected('datadog') || isServiceSelected('aws')) {
      fetch('/api/notifications-latest', { signal })
        .then(res => res.json())
        .then(({ data }) => {
          if (isServiceSelected('slack')) {
            setSlack({ status: 'Issues Detected', updates: data.filter(i => i.provider === 'Slack'), name: 'Slack' });
          }
          if (isServiceSelected('datadog')) {
            setDatadog({ status: 'Issues Detected', updates: data.filter(i => i.provider === 'Datadog'), name: 'Datadog' });
          }
          if (isServiceSelected('aws')) {
            setAws({ status: 'Issues Detected', updates: data.filter(i => i.provider === 'AWS'), name: 'AWS' });
          }
        })
        .catch((error) => {
          if (error.name !== 'AbortError') {
            if (isServiceSelected('slack')) {
              setSlack({ status: 'Error loading feed', updates: [] });
            }
            if (isServiceSelected('datadog')) {
              setDatadog({ status: 'Error loading feed', updates: [] });
            }
            if (isServiceSelected('aws')) {
              setAws({ status: 'Error loading feed', updates: [] });
            }
          }
        });
    }
    
    setLastUpdated(new Date());
    setLoading(false);
  }, [selectedServices]);

  // Check for any open/unresolved issue across all providers
  useEffect(() => {
    const openIssues = [];
    // Cloudflare: all unresolved incidents
    if (cloudflare && cloudflare.incidents && cloudflare.incidents.length > 0) {
      cloudflare.incidents.forEach(inc => {
        if (!inc.resolved_at) {
          openIssues.push({ provider: 'Cloudflare', name: inc.title || inc.name, status: inc.impact || inc.status, updated: inc.updated_at || inc.updatedAt, url: inc.shortlink || inc.url });
        }
      });
    }
    // Zscaler: all open issues (not resolved/closed/completed and not operational)
    if (zscaler && zscaler.updates && zscaler.updates.length > 0) {
      zscaler.updates.forEach(upd => {
        const text = `${upd.title || ''} ${upd.description || ''}`.toLowerCase();
        const isResolved = text.includes('resolved') || text.includes('closed') || text.includes('completed');
        const isOperational = (zscaler.status || '').toLowerCase() === 'operational';
        if (!isResolved && !isOperational) {
          openIssues.push({ provider: 'Zscaler', name: upd.title, status: zscaler.status, updated: upd.date, url: upd.link });
        }
      });
    }
    // Okta: all open issues (not resolved/closed/completed)
    if (okta && okta.updates && okta.updates.length > 0) {
      okta.updates.forEach(upd => {
        const text = `${upd.title || ''} ${upd.description || ''}`.toLowerCase();
        const isResolved = text.includes('resolved') || text.includes('closed') || text.includes('completed');
        if (!isResolved) {
          openIssues.push({ provider: 'Okta', name: upd.title, status: okta.status, updated: upd.date, url: upd.link });
        }
      });
    }
    // SendGrid: all open issues (not resolved/closed/completed)
    if (sendgrid && sendgrid.updates && sendgrid.updates.length > 0) {
      sendgrid.updates.forEach(upd => {
        const text = `${upd.title || ''} ${upd.description || ''}`.toLowerCase();
        const isResolved = text.includes('resolved') || text.includes('closed') || text.includes('completed');
        if (!isResolved) {
          openIssues.push({ provider: 'SendGrid', name: upd.title, status: sendgrid.status, updated: upd.date, url: upd.link });
        }
      });
    }
    // Slack: all open issues
    if (slack && slack.updates && slack.updates.length > 0) {
      slack.updates.forEach(upd => {
        openIssues.push({ provider: 'Slack', name: upd.title, status: slack.status, updated: upd.reported_at, url: upd.url });
      });
    }
    // Datadog: all open issues
    if (datadog && datadog.updates && datadog.updates.length > 0) {
      datadog.updates.forEach(upd => {
        openIssues.push({ provider: 'Datadog', name: upd.title, status: datadog.status, updated: upd.reported_at, url: upd.url });
      });
    }
    // AWS: all open issues
    if (aws && aws.updates && aws.updates.length > 0) {
      aws.updates.forEach(upd => {
        openIssues.push({ provider: 'AWS', name: upd.title, status: aws.status, updated: upd.reported_at, url: upd.url });
      });
    }
    setCriticalMode({ active: openIssues.length > 0, details: openIssues });
  }, [cloudflare, zscaler, okta, sendgrid, slack, datadog, aws]);

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

  // Handle service selection
  function handleServiceSelect(services) {
    setSelectedServices(services);
    localStorage.setItem('selectedServices', JSON.stringify(services));
    setShowSplash(false);
    
    // Optionally refresh the page for a clean state
    if (SPLASH_CONFIG.autoRefreshOnSelection) {
      setTimeout(() => {
        if (SPLASH_CONFIG.showRefreshMessage) {
          // Add a subtle loading indicator before refresh
          const refreshMessage = document.createElement('div');
          refreshMessage.innerHTML = `
            <div style="
              position: fixed; 
              top: 50%; 
              left: 50%; 
              transform: translate(-50%, -50%); 
              background: white; 
              padding: 20px 40px; 
              border-radius: 8px; 
              box-shadow: 0 4px 12px rgba(0,0,0,0.15);
              z-index: 10000;
              text-align: center;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            ">
              <div style="margin-bottom: 10px;">🔄</div>
              <div>Refreshing dashboard...</div>
            </div>
          `;
          document.body.appendChild(refreshMessage);
          
          // Refresh after showing the message
          setTimeout(() => {
            window.location.reload();
          }, 800);
        } else {
          window.location.reload();
        }
      }, SPLASH_CONFIG.refreshDelay);
    } else {
      // Just trigger a data refresh without page reload
      fetchAllStatuses();
    }
  }

  // Helper function to check if service is selected
  const isServiceSelected = (serviceId) => {
    if (!selectedServices) return true; // Show all if no selection yet
    return selectedServices.includes(serviceId);
  };

  // Show splash screen if no services selected
  if (showSplash) {
    return <ServiceSelectionSplash onServicesSelected={handleServiceSelect} />;
  }

  return (
    <>
      {/* Remove white space at top by setting margin and padding to 0 on body and root container */}
      <style>{`
        body, #root {
          margin: 0 !important;
          padding: 0 !important;
          background: #fafbff;
        }
      `}</style>
      {/* Modern Enhanced Header */}
      <header className="site-header">
        <div className="header-container">
          <div className="header-brand">
            <div className="logo-container">
            <img 
              src={logoImage} 
              alt="Stack Status IO Logo" 
              className="header-logo"
            />
            </div>
            <div className="brand-info">
              <h1 className="brand-title">
                Stack Status
                <span className="brand-subtitle">IO</span>
              </h1>
              <div className="status-indicators">
                <div className="status-dot operational"></div>
                <span className="status-text">All Systems Operational</span>
                <div className="live-indicator">
                  <span className="live-pulse"></span>
                  <span className="live-text">LIVE</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="header-actions">
            <div className="action-group">
              <button
                className="action-btn settings-btn"
                onClick={() => setShowSplash(true)}
                title="Configure Services"
                aria-label="Configure service monitoring"
              >
                <svg className="settings-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
                <span className="btn-tooltip">Settings</span>
              </button>
              
              <div className="notification-wrapper">
                <NotificationChatbot
                  selectedServices={selectedServices}
                  cloudflareIncidents={cloudflare.incidents}
                  zscalerUpdates={zscaler.updates}
                  oktaUpdates={okta.updates}
                  sendgridUpdates={sendgrid.updates}
                  slackUpdates={slack.updates}
                  datadogUpdates={datadog.updates}
                  awsUpdates={aws.updates}
                  headerMode={true}
                  usePortal={true}
                  modalZIndex={20000}
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Subtle animated background elements */}
        <div className="header-bg-effects">
          <div className="bg-gradient-1"></div>
          <div className="bg-gradient-2"></div>
          <div className="floating-orb orb-1"></div>
          <div className="floating-orb orb-2"></div>
        </div>
      </header>
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        position: 'relative',
        width: '100%',
        maxWidth: '100vw',
        overflowX: 'hidden',
        padding: '0 16px',
        boxSizing: 'border-box'
      }}>
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
        {/* Service selection splash screen */}
        {showSplash ? (
          <ServiceSelectionSplash 
            onSelect={handleServiceSelect}
            selected={selectedServices}
          />
        ) : (
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            justifyContent: 'center', 
            width: '100%',
            maxWidth: '1200px',
            gap: '16px',
            padding: '0 8px'
          }}>
            {isServiceSelected('cloudflare') && (
              <LivePulseCardContainer
                provider="Cloudflare"
                name={cloudflare.name}
                indicator={cloudflare.indicator}
                status={cloudflare.status}
                incidents={cloudflare.incidents}
              />
            )}
            {isServiceSelected('zscaler') && (
              <ZscalerPulseCardContainer
                provider="Zscaler"
                name="Zscaler"
                indicator={getZscalerIndicator(zscaler.status)}
                status={zscaler.status}
                updates={zscaler.updates}
              />
            )}
            {isServiceSelected('sendgrid') && (
              <ZscalerPulseCardContainer
                provider="SendGrid"
                name="SendGrid"
                indicator={sendgrid.indicator}
                status={sendgrid.status}
                updates={sendgrid.updates}
                incidents={sendgrid.updates} // Pass updates as incidents for SendGrid modal
              />
            )}
            {isServiceSelected('okta') && (
              <ZscalerPulseCardContainer
                provider="Okta"
                name="Okta"
                indicator={okta.indicator}
                status={okta.status}
                updates={okta.updates}
              />
            )}
            {isServiceSelected('slack') && (
              <ZscalerPulseCardContainer
                provider="Slack"
                name="Slack"
                indicator={slack.updates.length > 0 ? 'major' : 'none'}
                status={slack.status}
                updates={slack.updates}
              />
            )}
            {isServiceSelected('datadog') && (
              <ZscalerPulseCardContainer
                provider="Datadog"
                name="Datadog"
                indicator={datadog.updates.length > 0 ? 'major' : 'none'}
                status={datadog.status}
                updates={datadog.updates}
              />
            )}
            {isServiceSelected('aws') && (
              <ZscalerPulseCardContainer
                provider="AWS"
                name="AWS"
                indicator={aws.updates.length > 0 ? 'major' : 'none'}
                status={aws.status}
                updates={aws.updates}
              />
            )}
          </div>
        )}
        {/* Mini Heatbar Grid at the bottom of the page */}
        <MiniHeatbarGrid selectedServices={selectedServices} />
        <SpeedInsights />
        <Analytics />
      </div>
    </>
  );
}

export default App;
