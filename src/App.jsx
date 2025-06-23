import React, { useEffect, useState } from 'react';
import LivePulseCard from './LivePulseCard';
import LivePulseCardContainer from './LivePulseCardContainer';
import ZscalerPulseCardContainer from './ZscalerPulseCardContainer';
import Modal from './Modal';
import './App.css';

function parseZscalerRSS(xmlText) {
  const parser = new window.DOMParser();
  const xml = parser.parseFromString(xmlText, 'text/xml');
  const items = Array.from(xml.querySelectorAll('item'));
  return items.map(item => ({
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

function getOktaIndicator(status) {
  if (!status || /operational/i.test(status)) return 'none';
  if (/major|critical|issues detected/i.test(status)) return 'major';
  if (/minor/i.test(status)) return 'minor';
  return 'none';
}

function App() {
  const [cloudflare, setCloudflare] = useState({ status: 'Loading...', indicator: '', incidents: [] });
  const [zscaler, setZscaler] = useState({ status: 'Loading...', updates: [] });
  const [sendgrid, setSendgrid] = useState({ status: 'Loading...', indicator: '', incidents: [], name: 'SendGrid' });
  const [okta, setOkta] = useState({ status: 'Loading...', indicator: '', incidents: [], name: 'Okta' });

  useEffect(() => {
    function fetchAllStatuses() {
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
              const incidents = (summaryData.incidents || []).filter(inc => {
                const updatedAt = inc.updated_at || inc.updatedAt;
                if (!updatedAt) return false;
                const updatedDate = new Date(updatedAt);
                return !isNaN(updatedDate) && updatedDate >= sevenDaysAgo;
              });
              const { status, indicator } = getCloudflareStatusFromIncidents(incidents);
              setCloudflare({ status, indicator, incidents, name });
            })
            .catch(() => setCloudflare({ status: 'Error loading status', indicator: '', incidents: [], name: 'Cloudflare' }));
        })
        .catch(() => setCloudflare({ status: 'Error loading status', indicator: '', incidents: [], name: 'Cloudflare' }));
      // Zscaler RSS fetch via local proxy to avoid CORS
      fetch('/api/zscaler')
        .then(res => res.text())
        .then(data => {
          const updates = parseZscalerRSS(data);
          const status = getStatusFromZscalerUpdates(updates);
          setZscaler({ status, updates });
        })
        .catch(() => setZscaler({ status: 'Error loading feed', updates: [] }));
      // SendGrid status
      fetch('https://status.sendgrid.com/api/v2/summary.json')
        .then(res => res.json())
        .then(summary => {
          fetch('https://status.sendgrid.com/api/v2/status.json')
            .then(res => res.json())
            .then(statusData => {
              const name = summary.page?.name || 'SendGrid';
              const now = new Date();
              const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
              const incidents = (summary.incidents || []).filter(inc => {
                const updatedAt = inc.updated_at || inc.updatedAt;
                if (!updatedAt) return false;
                const updatedDate = new Date(updatedAt);
                return !isNaN(updatedDate) && updatedDate >= sevenDaysAgo;
              });
              setSendgrid({
                status: statusData.status?.description || 'Unknown',
                indicator: statusData.status?.indicator || 'none',
                incidents,
                name,
              });
            })
            .catch(() => setSendgrid({ status: 'Error loading status', indicator: '', incidents: [], name: 'SendGrid' }));
        })
        .catch(() => setSendgrid({ status: 'Error loading status', indicator: '', incidents: [], name: 'SendGrid' }));
      // Okta status
      fetch('/api/okta')
        .then(res => res.json())
        .then(summary => {
          fetch('/api/okta-status')
            .then(res => res.json())
            .then(statusData => {
              const name = summary.page?.name || 'Okta';
              const now = new Date();
              const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
              const incidents = (summary.incidents || []).filter(inc => {
                const updatedAt = inc.updated_at || inc.updatedAt;
                if (!updatedAt) return false;
                const updatedDate = new Date(updatedAt);
                return !isNaN(updatedDate) && updatedDate >= sevenDaysAgo;
              });
              setOkta({
                status: statusData.status?.description || 'Unknown',
                indicator: statusData.status?.indicator || 'none',
                incidents,
                name,
              });
            })
            .catch(() => setOkta({ status: 'Error loading status', indicator: '', incidents: [], name: 'Okta' }));
        })
        .catch(() => setOkta({ status: 'Error loading status', indicator: '', incidents: [], name: 'Okta' }));
    }
    fetchAllStatuses();
    const interval = setInterval(fetchAllStatuses, 60000); // 60 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
      <h1 style={{ marginBottom: 24 }}>Service Status Dashboard</h1>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
        <LivePulseCardContainer
          provider="Cloudflare"
          name={cloudflare.name}
          indicator={cloudflare.indicator}
          status={cloudflare.status}
          incidents={cloudflare.incidents}
        />
        <ZscalerPulseCardContainer
          name="Zscaler"
          indicator={getZscalerIndicator(zscaler.status)}
          status={zscaler.status}
          updates={zscaler.updates}
        />
        <LivePulseCardContainer
          provider="SendGrid"
          name={sendgrid.name}
          indicator={sendgrid.indicator}
          status={sendgrid.status}
          incidents={sendgrid.incidents}
        />
        <LivePulseCardContainer
          provider="Okta"
          name={okta.name}
          indicator={getOktaIndicator(okta.status)}
          status={okta.status}
          incidents={okta.incidents}
        />
      </div>
    </div>
  );
}

export default App;
