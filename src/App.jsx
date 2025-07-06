import React, { useEffect, useState } from 'react';
import LivePulseCard from './features/services/components/LivePulseCard';
import LivePulseCardContainer from './features/services/containers/LivePulseCardContainer';
import ZscalerPulseCardContainer from './features/services/containers/ZscalerPulseCardContainer';
import CustomServiceCard from './features/custom-services/components/CustomServiceCard';
import Modal from './components/common/Modal';
import ReportImpactForm from './components/forms/ReportImpactForm';
// import MiniHeatbarGrid from './components/charts/MiniHeatbarGrid';
import ServiceSelectionSplash from './features/services/components/ServiceSelectionSplash';
import AddCustomService from './features/custom-services/components/AddCustomService';
import UnifiedLiveFeedPanel from './components/feeds/UnifiedLiveFeedPanel';
import LiveFeedButton from './components/feeds/LiveFeedButton';
import './styles/globals/App.css';
// import './components/charts/MiniHeatbarGrid.css';
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Analytics } from "@vercel/analytics/react";
import NotificationChatbot from './components/notifications/NotificationChatbot';
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
  
  // Custom services state
  const [customServices, setCustomServices] = useState(() => {
    try {
      const saved = localStorage.getItem('customServices');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  
  const [today, setToday] = useState(() => new Date());
  const [lastUpdated, setLastUpdated] = useState(() => new Date());
  const [loading, setLoading] = useState(false);
  const [criticalMode, setCriticalMode] = useState({ active: false, details: [] });
  const [showMore, setShowMore] = useState({});
  const [tickerIndex, setTickerIndex] = useState(0);
  const [closedCards, setClosedCards] = useState(() => {
    try {
      const saved = localStorage.getItem('closedServiceCards');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [showAddCustomModal, setShowAddCustomModal] = useState(false);
  const [showBugModal, setShowBugModal] = useState(false);
  const [bugReportService, setBugReportService] = useState('');
  const [showLiveFeedPanel, setShowLiveFeedPanel] = useState(false);
  const [liveFeedHasNewItems, setLiveFeedHasNewItems] = useState(false);
  const [previousDataSnapshot, setPreviousDataSnapshot] = useState(null);

  // Manual navigation functions for alert banner
  const nextAlert = () => {
    const issues = criticalMode.active ? criticalMode.details : demoIssues;
    setTickerIndex(i => (i + 1) % issues.length);
  };

  const prevAlert = () => {
    const issues = criticalMode.active ? criticalMode.details : demoIssues;
    setTickerIndex(i => (i - 1 + issues.length) % issues.length);
  };

  // Card close/restore functions
  const closeCard = (provider) => {
    const newClosedCards = [...closedCards, provider.toLowerCase()];
    setClosedCards(newClosedCards);
    localStorage.setItem('closedServiceCards', JSON.stringify(newClosedCards));
  };

  const restoreCard = (provider) => {
    const newClosedCards = closedCards.filter(card => card !== provider.toLowerCase());
    setClosedCards(newClosedCards);
    localStorage.setItem('closedServiceCards', JSON.stringify(newClosedCards));
  };

  const restoreAllCards = () => {
    setClosedCards([]);
    localStorage.removeItem('closedServiceCards');
  };

  const toggleShowMore = (serviceId) => {
    setShowMore(prev => ({
      ...prev,
      [serviceId]: !prev[serviceId]
    }));
  };

  const handleReportIssue = (serviceName) => {
    setBugReportService(serviceName);
    setShowBugModal(true);
  };

  const isCardClosed = (provider) => {
    return closedCards.includes(provider.toLowerCase());
  };

  // Helper function to check if service is selected
  const isServiceSelected = (serviceId) => {
    if (!selectedServices) return true; // Show all if no selection yet
    return selectedServices.includes(serviceId);
  };

  const demoIssues = [
    // Only include demo issues for selected services
    ...(isServiceSelected('cloudflare') ? [{ provider: 'Cloudflare', name: 'API Gateway Outage', status: 'critical', updated: new Date().toISOString(), url: 'https://www.cloudflarestatus.com/' }] : []),
    ...(isServiceSelected('zscaler') ? [{ provider: 'Zscaler', name: 'Authentication Failure', status: 'major', updated: new Date().toISOString(), url: 'https://trust.zscaler.com/' }] : []),
    ...(isServiceSelected('okta') ? [{ provider: 'Okta', name: 'Service Disruption', status: 'critical', updated: new Date().toISOString(), url: 'https://status.okta.com/' }] : []),
    ...(isServiceSelected('sendgrid') ? [{ provider: 'SendGrid', name: 'Email Delivery Issues', status: 'major', updated: new Date().toISOString(), url: 'https://status.sendgrid.com/' }] : []),
    ...(isServiceSelected('slack') ? [{ provider: 'Slack', name: 'Message Sync Issues', status: 'minor', updated: new Date().toISOString(), url: 'https://status.slack.com/' }] : []),
    ...(isServiceSelected('datadog') ? [{ provider: 'Datadog', name: 'Monitoring Delays', status: 'major', updated: new Date().toISOString(), url: 'https://status.datadoghq.com/' }] : []),
    ...(isServiceSelected('aws') ? [{ provider: 'AWS', name: 'EC2 Instance Issues', status: 'critical', updated: new Date().toISOString(), url: 'https://status.aws.amazon.com/' }] : []),
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
            const slackUpdates = data.filter(i => i.provider === 'Slack');
            setSlack({ 
              status: slackUpdates.length > 0 ? 'Issues Detected' : 'Operational', 
              updates: slackUpdates, 
              name: 'Slack' 
            });
          }
          if (isServiceSelected('datadog')) {
            const datadogUpdates = data.filter(i => i.provider === 'Datadog');
            setDatadog({ 
              status: datadogUpdates.length > 0 ? 'Issues Detected' : 'Operational', 
              updates: datadogUpdates, 
              name: 'Datadog' 
            });
          }
          if (isServiceSelected('aws')) {
            const awsUpdates = data.filter(i => i.provider === 'AWS');
            setAws({ 
              status: awsUpdates.length > 0 ? 'Issues Detected' : 'Operational', 
              updates: awsUpdates, 
              name: 'AWS' 
            });
          }
        })
        .catch((error) => {
          if (error.name !== 'AbortError') {
            if (isServiceSelected('slack')) {
              setSlack({ status: 'Error loading feed', updates: [], name: 'Slack' });
            }
            if (isServiceSelected('datadog')) {
              setDatadog({ status: 'Error loading feed', updates: [], name: 'Datadog' });
            }
            if (isServiceSelected('aws')) {
              setAws({ status: 'Error loading feed', updates: [], name: 'AWS' });
            }
          }
        });
    }
    
    setLastUpdated(new Date());
    setLoading(false);
  }, [selectedServices]);

  // Check for any open/unresolved issue across selected providers only
  useEffect(() => {
    const openIssues = [];
    // Only check for issues from selected services
    // Cloudflare: all unresolved incidents (only if selected)
    if (isServiceSelected('cloudflare') && cloudflare && cloudflare.incidents && cloudflare.incidents.length > 0) {
      cloudflare.incidents.forEach(inc => {
        if (!inc.resolved_at) {
          openIssues.push({ provider: 'Cloudflare', name: inc.title || inc.name, status: inc.impact || inc.status, updated: inc.updated_at || inc.updatedAt, url: inc.shortlink || inc.url });
        }
      });
    }
    // Zscaler: all open issues (not resolved/closed/completed and not operational) (only if selected)
    if (isServiceSelected('zscaler') && zscaler && zscaler.updates && zscaler.updates.length > 0) {
      zscaler.updates.forEach(upd => {
        const text = `${upd.title || ''} ${upd.description || ''}`.toLowerCase();
        const isResolved = text.includes('resolved') || text.includes('closed') || text.includes('completed');
        const isOperational = (zscaler.status || '').toLowerCase() === 'operational';
        if (!isResolved && !isOperational) {
          openIssues.push({ provider: 'Zscaler', name: upd.title, status: zscaler.status, updated: upd.date, url: upd.link });
        }
      });
    }
    // Okta: all open issues (not resolved/closed/completed) (only if selected)
    if (isServiceSelected('okta') && okta && okta.updates && okta.updates.length > 0) {
      okta.updates.forEach(upd => {
        const text = `${upd.title || ''} ${upd.description || ''}`.toLowerCase();
        const isResolved = text.includes('resolved') || text.includes('closed') || text.includes('completed');
        if (!isResolved) {
          openIssues.push({ provider: 'Okta', name: upd.title, status: okta.status, updated: upd.date, url: upd.link });
        }
      });
    }
    // SendGrid: all open issues (not resolved/closed/completed) (only if selected)
    if (isServiceSelected('sendgrid') && sendgrid && sendgrid.updates && sendgrid.updates.length > 0) {
      sendgrid.updates.forEach(upd => {
        const text = `${upd.title || ''} ${upd.description || ''}`.toLowerCase();
        const isResolved = text.includes('resolved') || text.includes('closed') || text.includes('completed');
        if (!isResolved) {
          openIssues.push({ provider: 'SendGrid', name: upd.title, status: sendgrid.status, updated: upd.date, url: upd.link });
        }
      });
    }
    // Slack: all open issues (only if selected)
    if (isServiceSelected('slack') && slack && slack.updates && slack.updates.length > 0) {
      slack.updates.forEach(upd => {
        openIssues.push({ provider: 'Slack', name: upd.title, status: slack.status, updated: upd.reported_at, url: upd.url });
      });
    }
    // Datadog: all open issues (only if selected)
    if (isServiceSelected('datadog') && datadog && datadog.updates && datadog.updates.length > 0) {
      datadog.updates.forEach(upd => {
        openIssues.push({ provider: 'Datadog', name: upd.title, status: datadog.status, updated: upd.reported_at, url: upd.url });
      });
    }
    // AWS: all open issues (only if selected)
    if (isServiceSelected('aws') && aws && aws.updates && aws.updates.length > 0) {
      aws.updates.forEach(upd => {
        openIssues.push({ provider: 'AWS', name: upd.title, status: aws.status, updated: upd.reported_at, url: upd.url });
      });
    }
    setCriticalMode({ active: openIssues.length > 0, details: openIssues });
  }, [cloudflare, zscaler, okta, sendgrid, slack, datadog, aws, selectedServices]);

  // Check for new items in live feed
  useEffect(() => {
    const currentSnapshot = {
      cloudflareCount: cloudflare.incidents?.length || 0,
      zscalerCount: zscaler.updates?.length || 0,
      oktaCount: okta.updates?.length || 0,
      sendgridCount: sendgrid.updates?.length || 0,
      slackCount: slack.updates?.length || 0,
      datadogCount: datadog.updates?.length || 0,
      awsCount: aws.updates?.length || 0,
    };

    if (previousDataSnapshot) {
      const hasNewItems = 
        currentSnapshot.cloudflareCount > previousDataSnapshot.cloudflareCount ||
        currentSnapshot.zscalerCount > previousDataSnapshot.zscalerCount ||
        currentSnapshot.oktaCount > previousDataSnapshot.oktaCount ||
        currentSnapshot.sendgridCount > previousDataSnapshot.sendgridCount ||
        currentSnapshot.slackCount > previousDataSnapshot.slackCount ||
        currentSnapshot.datadogCount > previousDataSnapshot.datadogCount ||
        currentSnapshot.awsCount > previousDataSnapshot.awsCount;

      if (hasNewItems) {
        setLiveFeedHasNewItems(true);
        // Auto-clear new items indicator after 5 seconds
        setTimeout(() => setLiveFeedHasNewItems(false), 5000);
      }
    }

    setPreviousDataSnapshot(currentSnapshot);
  }, [cloudflare, zscaler, okta, sendgrid, slack, datadog, aws, previousDataSnapshot]);

  // Calculate total feed items count
  const totalFeedItemsCount = 
    (cloudflare.incidents?.length || 0) +
    (zscaler.updates?.length || 0) +
    (okta.updates?.length || 0) +
    (sendgrid.updates?.length || 0) +
    (slack.updates?.length || 0) +
    (datadog.updates?.length || 0) +
    (aws.updates?.length || 0);

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
      }, 30000); // 30 seconds per issue
      return () => clearInterval(interval);
    } else {
      setTickerIndex(0);
    }
  }, [criticalMode.active, criticalMode.details.length]);

  // Handle service selection
  function handleServiceSelect(services) {
    setSelectedServices(services);
    localStorage.setItem('selectedServices', JSON.stringify(services));
    
    // Clean up closed cards for services that are no longer selected
    const currentClosedCards = JSON.parse(localStorage.getItem('closedServiceCards') || '[]');
    const serviceNamesLower = services.map(s => s.toLowerCase());
    const filteredClosedCards = currentClosedCards.filter(card => 
      serviceNamesLower.includes(card.toLowerCase())
    );
    
    // Update both state and localStorage
    setClosedCards(filteredClosedCards);
    localStorage.setItem('closedServiceCards', JSON.stringify(filteredClosedCards));
    
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

  // Handle adding custom services
  function handleAddCustomService(customService) {
    const updatedCustomServices = [...customServices, customService];
    setCustomServices(updatedCustomServices);
    localStorage.setItem('customServices', JSON.stringify(updatedCustomServices));
    
    // Automatically add the new custom service to selected services
    const updatedSelectedServices = [...(selectedServices || []), customService.id];
    setSelectedServices(updatedSelectedServices);
    localStorage.setItem('selectedServices', JSON.stringify(updatedSelectedServices));
    
    // Close the modal
    setShowAddCustomModal(false);
  }

  // Show splash screen if no services selected
  if (showSplash) {
    return <ServiceSelectionSplash 
      onServicesSelected={handleServiceSelect} 
      selected={selectedServices} 
      customServices={customServices}
      onAddCustomService={handleAddCustomService}
    />;
  }

  return <>
      {/* Remove white space at top by setting margin and padding to 0 on body and root container */}
      <style>{`
        body, #root {
          margin: 0 !important;
          padding: 0 !important;
          background: #fafbff;
        }
      `}</style>
      {/* Modern Enhanced Header */}
      <header className="site-header-modern" style={{
        width: '100%',
        background: 'rgba(255,255,255,0.85)',
        boxShadow: '0 4px 32px 0 rgba(30,41,59,0.09)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(148, 163, 184, 0.10)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        padding: 0,
        marginBottom: 18
      }}>
        <div className="header-container-modern" style={{
          maxWidth: 1280,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
          minHeight: 74,
          position: 'relative',
        }}>
          {/* Brand/Logo */}
          <div className="header-brand-modern" style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <div className="logo-container-modern" style={{
              background: 'rgba(255,255,255,0.7)',
              borderRadius: 16,
              boxShadow: '0 2px 8px rgba(30,41,59,0.10)',
              padding: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 56,
              height: 56,
              minWidth: 56,
              minHeight: 56,
            }}>
              <img 
                src={logoImage} 
                alt="Stack Status IO Logo" 
                className="header-logo-modern"
                style={{ width: 36, height: 36, borderRadius: 12 }}
              />
            </div>
            <div className="brand-info-modern" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <h1 className="brand-title-modern" style={{
                fontWeight: 900,
                fontSize: '2.1em',
                color: '#1e293b',
                letterSpacing: '-0.01em',
                margin: 0,
                lineHeight: 1.1,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                Stack Status
                <span className="brand-subtitle-modern" style={{
                  fontWeight: 700,
                  fontSize: '0.6em',
                  color: '#60a5fa',
                  marginLeft: 2,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  background: 'linear-gradient(90deg, #60a5fa 0%, #1976d2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  display: 'inline-block'
                }}>IO</span>
              </h1>
              <div className="status-indicators-modern" style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 2 }}>
                <div className="status-dot-modern" style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                  boxShadow: '0 0 8px 2px #10b98144',
                  marginRight: 4
                }}></div>
                <span className="status-text-modern" style={{ fontWeight: 600, color: '#64748b', fontSize: '1.08em' }}>All Systems Operational</span>
                <div className="live-indicator-modern" style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 10 }}>
                  <span className="live-pulse-modern" style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: '#ef4444',
                    boxShadow: '0 0 0 0 #ef4444',
                    animation: 'pulseLive 1.5s infinite cubic-bezier(0.66,0,0,1)'
                  }}></span>
                  <span className="live-text-modern" style={{ fontWeight: 700, color: '#ef4444', fontSize: 12, letterSpacing: 1 }}>LIVE</span>
                </div>
              </div>
            </div>
          </div>
          {/* Actions */}
          <div className="header-actions-modern" style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <LiveFeedButton
              onClick={() => setShowLiveFeedPanel(true)}
              hasNewItems={liveFeedHasNewItems}
              itemCount={totalFeedItemsCount}
              isActive={showLiveFeedPanel}
            />
            <button
              className="action-btn-modern settings-btn-modern"
              onClick={() => setShowSplash(true)}
              title="Configure Services"
              aria-label="Configure service monitoring"
              style={{
                background: 'linear-gradient(90deg, #1976d2 0%, #60a5fa 100%)',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                padding: '8px 16px',
                fontWeight: 700,
                fontSize: 15,
                boxShadow: '0 2px 8px rgba(30,41,59,0.10)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => e.target.style.background = 'linear-gradient(90deg, #60a5fa 0%, #1976d2 100%)'}
              onMouseLeave={e => e.target.style.background = 'linear-gradient(90deg, #1976d2 0%, #60a5fa 100%)'}
            >
              <span className="settings-icon-modern" style={{ fontSize: '20px' }}>⚙️</span>
              <span>Settings</span>
            </button>
            <div className="notification-wrapper-modern">
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
        {/* Subtle animated background elements */}
        <div className="header-bg-effects-modern" style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          pointerEvents: 'none',
        }}>
          <div className="bg-gradient-modern-1" style={{
            position: 'absolute',
            top: '-40px',
            left: '-80px',
            width: 240,
            height: 240,
            background: 'radial-gradient(circle at 30% 30%, #60a5fa55 0%, transparent 80%)',
            filter: 'blur(24px)',
            zIndex: 0
          }}></div>
          <div className="bg-gradient-modern-2" style={{
            position: 'absolute',
            bottom: '-60px',
            right: '-100px',
            width: 320,
            height: 180,
            background: 'radial-gradient(circle at 70% 70%, #1976d255 0%, transparent 80%)',
            filter: 'blur(32px)',
            zIndex: 0
          }}></div>
          <div className="floating-orb-modern orb-1" style={{
            position: 'absolute',
            top: 18,
            left: 120,
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #60a5fa 0%, #1976d2 100%)',
            opacity: 0.18,
            filter: 'blur(2px)',
            zIndex: 1,
            animation: 'floatOrb 6s ease-in-out infinite alternate'
          }}></div>
          <div className="floating-orb-modern orb-2" style={{
            position: 'absolute',
            bottom: 12,
            right: 80,
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #1976d2 0%, #60a5fa 100%)',
            opacity: 0.13,
            filter: 'blur(1.5px)',
            zIndex: 1,
            animation: 'floatOrb 7s ease-in-out infinite alternate-reverse'
          }}></div>
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
          !alertDismissed && (criticalMode.active || process.env.NODE_ENV === 'development')
        ) && (
          <div className="alert-banner-container">
            <div className="alert-banner-content" style={{
              background: 'linear-gradient(135deg, #ff4757 0%, #ff3742 50%, #c44569 100%)',
              color: '#fff',
              fontWeight: 600,
              fontSize: 16,
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              position: 'relative',
              zIndex: 10,
              minHeight: 48,
              borderRadius: 12,
              boxShadow: '0 4px 20px rgba(255, 71, 87, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}>
            {/* Dismiss button */}
            <button
              aria-label="Dismiss alert banner"
              title="Dismiss alert banner"
              onClick={() => setAlertDismissed(true)}
              style={{
                position: 'absolute',
                top: 10,
                right: 10,
                width: 22,
                height: 22,
                minWidth: 22,
                minHeight: 22,
                maxWidth: 22,
                maxHeight: 22,
                background: '#ff5f57',
                border: 'none',
                borderRadius: '50%',
                cursor: 'pointer',
                zIndex: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.18)',
                flexShrink: 0,
                padding: 0,
              }}
              onMouseEnter={e => {
                e.target.style.background = '#ff3b30';
                e.target.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={e => {
                e.target.style.background = '#ff5f57';
                e.target.style.transform = 'scale(1)';
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 700, color: 'white', lineHeight: 1 }}>×</span>
            </button>
            {/* Main Content Row */}
            <div className="alert-main-content" style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 12
            }}>
              {/* Alert Icon */}
              <div style={{
                fontSize: 20,
                filter: 'drop-shadow(0 0 4px rgba(255, 255, 255, 0.3))',
                flexShrink: 0
              }}>
                ⚠️
              </div>
              
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
            </div>
            
            {/* Bottom Action Row - Mobile Friendly */}
            <div className="alert-bottom-actions alert-action-row" style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              paddingTop: 8,
              borderTop: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              {/* View Details Button */}
              <div className="alert-view-details" style={{
                display: 'flex',
                alignItems: 'center'
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
                        padding: '6px 12px',
                        borderRadius: 16,
                        fontSize: 12,
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        transition: 'all 0.2s ease',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        backdropFilter: 'blur(10px)'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = 'none';
                      }}
                    >
                      View Details
                      <span style={{ fontSize: 10 }}>↗</span>
                    </a>
                  );
                })()}
              </div>
              
              {/* Navigation Controls - only show if more than one issue */}
              {(() => {
                const issues = criticalMode.active ? criticalMode.details : demoIssues;
                return issues.length > 1 && (
                  <div className="alert-navigation" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}>
                    <button
                      onClick={prevAlert}
                      style={{
                        background: 'rgba(255, 255, 255, 0.2)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        color: '#fff',
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontSize: 12,
                        transition: 'all 0.2s ease',
                        backdropFilter: 'blur(10px)'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                        e.target.style.transform = 'scale(1.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                        e.target.style.transform = 'scale(1)';
                      }}
                      aria-label="Previous alert"
                      title="Previous alert"
                    >
                      ‹
                    </button>
                    <button
                      onClick={nextAlert}
                      style={{
                        background: 'rgba(255, 255, 255, 0.2)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        color: '#fff',
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontSize: 12,
                        transition: 'all 0.2s ease',
                        backdropFilter: 'blur(10px)'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                        e.target.style.transform = 'scale(1.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                        e.target.style.transform = 'scale(1)';
                      }}
                      aria-label="Next alert"
                      title="Next alert"
                    >
                      ›
                    </button>
                    <div style={{
                      fontSize: 10,
                      color: 'rgba(255, 255, 255, 0.8)',
                      marginLeft: 4,
                      fontWeight: 500
                    }}>
                      {tickerIndex + 1}/{issues.length}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
          </div>
        )}
        {/* Service selection splash screen and main dashboard */}
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
            {/* Show restore button if any cards are closed */}
            {closedCards.length > 0 && (
              <div style={{ 
                width: '100%', 
                display: 'flex', 
                justifyContent: 'center', 
                marginBottom: '16px',
                gap: '8px'
              }}>
                <button
                  onClick={restoreAllCards}
                  style={{
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={e => e.target.style.background = '#059669'}
                  onMouseLeave={e => e.target.style.background = '#10b981'}
                >
                  Restore All Cards ({closedCards.length})
                </button>
              </div>
            )}
            
            {isServiceSelected('cloudflare') && !isCardClosed('cloudflare') && (
              <LivePulseCardContainer
                provider="Cloudflare"
                name={cloudflare.name}
                indicator={cloudflare.indicator}
                status={cloudflare.status}
                incidents={cloudflare.incidents}
                onClose={closeCard}
              />
            )}
            {isServiceSelected('zscaler') && !isCardClosed('zscaler') && (
              <ZscalerPulseCardContainer
                provider="Zscaler"
                name="Zscaler"
                indicator={getZscalerIndicator(zscaler.status)}
                status={zscaler.status}
                updates={zscaler.updates}
                onClose={closeCard}
              />
            )}
            {isServiceSelected('okta') && !isCardClosed('okta') && (
              <ZscalerPulseCardContainer
                provider="Okta"
                name="Okta"
                indicator={okta.indicator}
                status={okta.status}
                updates={okta.updates}
                onClose={closeCard}
              />
            )}
            {isServiceSelected('sendgrid') && !isCardClosed('sendgrid') && (
              <ZscalerPulseCardContainer
                provider="SendGrid"
                name="SendGrid"
                indicator={sendgrid.indicator}
                status={sendgrid.status}
                updates={sendgrid.updates}
                onClose={closeCard}
              />
            )}
            {isServiceSelected('slack') && !isCardClosed('slack') && (
              <ZscalerPulseCardContainer
                provider="Slack"
                name="Slack"
                indicator={slack.updates.length > 0 ? 'major' : 'none'}
                status={slack.status}
                updates={slack.updates}
                onClose={closeCard}
              />
            )}
            {isServiceSelected('datadog') && !isCardClosed('datadog') && (
              <ZscalerPulseCardContainer
                provider="Datadog"
                name="Datadog"
                indicator={datadog.updates.length > 0 ? 'major' : 'none'}
                status={datadog.status}
                updates={datadog.updates}
                onClose={closeCard}
              />
            )}
            {isServiceSelected('aws') && !isCardClosed('aws') && (
              <ZscalerPulseCardContainer
                provider="AWS"
                name="AWS"
                indicator={aws.updates.length > 0 ? 'major' : 'none'}
                status={aws.status}
                updates={aws.updates}
                onClose={closeCard}
              />
            )}
            
            {/* Custom Service Cards */}
            {customServices.map(customService => (
              isServiceSelected(customService.id) && !isCardClosed(customService.id) && (
                <CustomServiceCard
                  key={customService.id}
                  service={customService}
                  onClose={closeCard}
                  isClosed={isCardClosed(customService.id)}
                  onToggleShowMore={toggleShowMore}
                  showMore={showMore[customService.id] || false}
                  onReportIssue={handleReportIssue}
                />
              )
            ))}
            
            {/* Add Custom Service Button */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              width: '100%',
              padding: '20px 0',
              marginTop: '16px'
            }}>
              <button
                className="add-custom-service-main-btn"
                onClick={() => setShowAddCustomModal(true)}
              >
                <span style={{ fontSize: '18px' }}>+</span>
                Add Custom RSS Service
              </button>
            </div>
          </div>
        )}
        {/* Mini Heatbar Grid at the bottom of the page - TEMPORARILY DISABLED */}
        {/* 
        <MiniHeatbarGrid 
          selectedServices={selectedServices} 
          customServices={customServices}
          closedCards={closedCards}
          onCloseCard={closeCard}
          onRestoreCard={restoreCard}
          onRestoreAllCards={restoreAllCards}
        />
        */}
        
        {/* Add Custom Service Modal */}
        {showAddCustomModal && (
          <AddCustomService 
            onAddService={handleAddCustomService}
            onCancel={() => setShowAddCustomModal(false)}
            existingServices={[...Array.from(new Set([
              'cloudflare', 'zscaler', 'okta', 'sendgrid', 'slack', 'datadog', 'aws'
            ].concat(customServices.map(s => s.id)))).map(id => {
              // Find the service by ID from built-in services or custom services
              const builtInService = ['cloudflare', 'zscaler', 'okta', 'sendgrid', 'slack', 'datadog', 'aws'].find(s => s === id);
              if (builtInService) {
                return { id: builtInService, name: builtInService.charAt(0).toUpperCase() + builtInService.slice(1) };
              }
              const customService = customServices.find(s => s.id === id);
              return customService ? { id: customService.id, name: customService.name } : null;
            }).filter(Boolean)]}
          />
        )}
        
        
        {/* Bug Report Modal */}
        <Modal 
          open={showBugModal} 
          onClose={() => setShowBugModal(false)} 
          title={`Report Issue - ${bugReportService}`}
          enhanced={true}
        >
          <ReportImpactForm 
            serviceName={bugReportService} 
            onClose={() => setShowBugModal(false)} 
          />
        </Modal>
        
        <SpeedInsights />
        <Analytics />
      </div>
      
      {/* Unified Live Feed Panel */}
      <UnifiedLiveFeedPanel
        isOpen={showLiveFeedPanel}
        onClose={() => setShowLiveFeedPanel(false)}
        selectedServices={selectedServices}
        cloudflareIncidents={cloudflare.incidents}
        zscalerUpdates={zscaler.updates}
        oktaUpdates={okta.updates}
        sendgridUpdates={sendgrid.updates}
        slackUpdates={slack.updates}
        datadogUpdates={datadog.updates}
        awsUpdates={aws.updates}
        customServices={customServices}
      />
    </>;
}

export default App;
