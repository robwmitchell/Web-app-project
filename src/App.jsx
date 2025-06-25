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
  // If any incident is not resolved, return Issues Detected
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
          Service Status Dashboard
        </div>
        <div style={{ paddingRight: 24 }}>
          <FaBell size={22} color="#1976d2" style={{ cursor: 'pointer' }} title="Notifications" />
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
