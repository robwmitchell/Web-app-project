import React, { useEffect, useState, lazy, Suspense } from 'react';
import LivePulseCard from './features/services/components/LivePulseCard';
import LivePulseCardContainer from './features/services/containers/LivePulseCardContainer';
import ZscalerPulseCardContainer from './features/services/containers/ZscalerPulseCardContainer';
import CustomServiceCard from './features/custom-services/components/CustomServiceCard';
import Modal from './components/common/Modal';
import ErrorBoundary from './components/common/ErrorBoundary';
import ReportImpactForm from './components/forms/ReportImpactForm';
import NotificationChatbot from './components/notifications/NotificationChatbot';
import SearchFeedButton from './components/feeds/LiveFeedButton';
import SideDrawer from './components/SideDrawer';
import CookieConsent from './components/CookieConsent';
// import MiniHeatbarGrid from './components/charts/MiniHeatbarGrid';
import './styles/globals/App.css';
// import './components/charts/MiniHeatbarGrid.css';
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Analytics } from "@vercel/analytics/react";
import logoImage from './assets/stackstatus1.png';
import { parseCustomRSS } from './utils/rssParser';
import { optimizedFetch, CACHE_DURATIONS, RequestMonitor } from './utils/requestOptimizer';

// Lazy load heavy components
const UnifiedLiveFeedPanel = lazy(() => import('./components/feeds/UnifiedLiveFeedPanel'));
const ServiceSelectionSplash = lazy(() => import('./features/services/components/ServiceSelectionSplash'));
const AddCustomService = lazy(() => import('./features/custom-services/components/AddCustomService'));
const LeafletWorldMap = lazy(() => import('./components/maps/LeafletWorldMap'));
const WorldMapWidget = lazy(() => import('./components/maps/WorldMapWidget'));
const ServiceRadar = lazy(() => import('./components/radar/ServiceRadar'));

// Memoized components to prevent unnecessary re-renders
const MemoizedLivePulseCardContainer = React.memo(LivePulseCardContainer);
const MemoizedZscalerPulseCardContainer = React.memo(ZscalerPulseCardContainer);

// Alert banner throttling configuration
const ALERT_THROTTLE_CONFIG = {
  minIntervalMs: 2 * 60 * 1000, // 2 minutes minimum between API calls
  onPageRefreshDelay: 1000, // 1 second delay after page refresh to allow initial load
};

// Feature flags
const FEATURE_FLAGS = {
  reportIssueEnabled: false, // Temporarily disabled - feature not ready
};

function parseZscalerRSS(xmlText, maxItems = 25) {
  const parser = new window.DOMParser();
  const xml = parser.parseFromString(xmlText, 'text/xml');
  const items = Array.from(xml.querySelectorAll('item'));
  // Only keep the most recent N items
  return items.slice(0, maxItems).map(item => {
    // Extract categories from the XML
    const categoryElements = item.querySelectorAll('category');
    const categories = Array.from(categoryElements).map(cat => cat.textContent || '');
    
    return {
      title: item.querySelector('title')?.textContent || '',
      link: item.querySelector('link')?.textContent || '',
      date: item.querySelector('pubDate')?.textContent || '', // This must be present!
      description: item.querySelector('description')?.textContent || '',
      eventType: item.querySelector('eventType')?.textContent || '',
      categories: categories, // Add categories array
    };
  });
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
  const [showFeedSearchPanel, setShowFeedSearchPanel] = useState(false);
  const [showWorldMap, setShowWorldMap] = useState(false);
  const [showRadar, setShowRadar] = useState(false);
  const [worldMapHistoric, setWorldMapHistoric] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

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
    // Feature temporarily disabled
    if (!FEATURE_FLAGS.reportIssueEnabled) {
      console.log('Report Issue feature is currently disabled');
      return;
    }
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

  const demoIssues = React.useMemo(() => [
    // Only include demo issues for selected services that would be considered "active"
    // These simulate major issues with today's date for testing alert banner functionality
    ...(isServiceSelected('cloudflare') ? [{ 
      provider: 'Cloudflare', 
      name: 'API Gateway Service Disruption', 
      status: 'critical', 
      updated: new Date().toISOString(), 
      url: 'https://www.cloudflarestatus.com/',
      impact: 'major'
    }] : []),
    ...(isServiceSelected('okta') ? [{ 
      provider: 'Okta', 
      name: 'Authentication Service Outage', 
      status: 'critical', 
      updated: new Date().toISOString(), 
      url: 'https://status.okta.com/',
      impact: 'critical'
    }] : []),
    ...(isServiceSelected('aws') ? [{ 
      provider: 'AWS', 
      name: 'EC2 Instance Connectivity Issues', 
      status: 'major', 
      updated: new Date().toISOString(), 
      url: 'https://status.aws.amazon.com/',
      impact: 'major'
    }] : []),
    // Note: Removed maintenance/minor demo issues to simulate major-only filtering
  ], [selectedServices]);

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

  // Check if an issue/incident is actually active/unresolved and meets alert criteria
  const isIssueActive = (issue, provider) => {
    if (!issue) return false;
    
    const issueText = `${issue.title || ''} ${issue.description || ''}`.toLowerCase();
    const resolvedKeywords = ['resolved', 'closed', 'completed', 'fixed', 'restored'];
    const maintenanceKeywords = ['maintenance', 'scheduled', 'planned', 'update', 'upgrade'];
    
    // For Cloudflare: check resolved_at field first
    if (provider === 'cloudflare' && issue.resolved_at) {
      return false;
    }
    
    // For all providers: check for resolved keywords in text
    const isTextuallyResolved = resolvedKeywords.some(keyword => issueText.includes(keyword));
    if (isTextuallyResolved) {
      return false;
    }
    
    // Additional check for status field
    if (issue.status) {
      const statusText = issue.status.toLowerCase();
      if (resolvedKeywords.some(keyword => statusText.includes(keyword))) {
        return false;
      }
    }
    
    // Filter out maintenance and non-critical updates for alert banner
    const isMaintenance = maintenanceKeywords.some(keyword => issueText.includes(keyword));
    if (isMaintenance) {
      return false;
    }
    
    // Check if issue has been updated today (for alert banner relevance)
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000 - 1);
    
    let issueDate = null;
    if (issue.updated_at || issue.updatedAt) {
      issueDate = new Date(issue.updated_at || issue.updatedAt);
    } else if (issue.date) {
      issueDate = new Date(issue.date);
    } else if (issue.reported_at) {
      issueDate = new Date(issue.reported_at);
    }
    
    // Only include issues that have been updated today
    if (!issueDate || isNaN(issueDate) || issueDate < todayStart || issueDate > todayEnd) {
      return false;
    }
    
    // Only include major/critical issues for alert banner
    const isMajorIssue = (
      issueText.includes('outage') ||
      issueText.includes('critical') ||
      issueText.includes('major') ||
      issueText.includes('incident') ||
      issueText.includes('disruption') ||
      issueText.includes('degraded') ||
      issueText.includes('down') ||
      issueText.includes('unavailable') ||
      (issue.impact && ['critical', 'major'].includes(issue.impact.toLowerCase())) ||
      (issue.status && ['critical', 'major', 'issues detected', 'degraded performance'].includes(issue.status.toLowerCase()))
    );
    
    return isMajorIssue;
  };

  // Fetch all statuses (extracted for reuse)
  const fetchAllStatuses = React.useCallback(() => {
    if (!selectedServices || selectedServices.length === 0) return;
    
    // Create AbortController for cancelling requests if component unmounts
    const abortController = new AbortController();
    const signal = abortController.signal;
    
    setLoading(true);
    
    // Cloudflare status (based on open incidents)
    if (isServiceSelected('cloudflare')) {
      optimizedFetch('/api/cloudflare?endpoint=status', { signal }, 60000) // 1 minute cache
        .then(res => res.json())
        .then(statusData => {
          if (signal.aborted) return;
          optimizedFetch('/api/cloudflare?endpoint=summary', { signal }, 60000) // 1 minute cache
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
              let stored = get
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
      optimizedFetch('/api/zscaler', { signal }, 120000) // 2 minute cache
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
      optimizedFetch('/api/okta-status', { signal }, 120000) // 2 minute cache
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
      optimizedFetch('/api/sendgrid', { signal }, 120000) // 2 minute cache
        .then(res => res.text())
        .then(data => {
          if (signal.aborted) return;
          const updates = parseSendgridRSS(data, 25); // Only keep 25 most recent
          
          const now = new Date();
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          
          const filteredUpdates = updates.filter(update => {
            const updateDate = new Date(update.date);
            const isValid = !isNaN(updateDate);
            const isRecent = updateDate >= sevenDaysAgo;
            return isValid && isRecent;
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
      optimizedFetch('/api/notifications-latest', { signal }, 120000) // 2 minute cache
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
    
    // Custom RSS services fetch
    if (customServices && customServices.length > 0) {
      const selectedCustomServices = customServices.filter(service => 
        isServiceSelected(service.id)
      );
      
      selectedCustomServices.forEach(async (customService) => {
        try {
          const proxyUrl = 'https://api.allorigins.win/raw?url=';
          const targetUrl = encodeURIComponent(customService.feedUrl);
          const fetchUrl = `${proxyUrl}${targetUrl}`;
          
          const response = await optimizedFetch(fetchUrl, { signal }, 120000); // 2 minute cache
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: Failed to fetch RSS feed`);
          }
          
          const xmlText = await response.text();
          const items = parseCustomRSS(xmlText, 25); // Use proper custom RSS parser
          
          // Update the custom service with RSS data
          setCustomServices(prevServices => 
            prevServices.map(service => 
              service.id === customService.id 
                ? { ...service, updates: items, lastUpdated: new Date() }
                : service
            )
          );
          
        } catch (error) {
          if (error.name !== 'AbortError') {
            console.error(`Error fetching custom RSS for ${customService.name}:`, error);
            // Update the custom service with error state
            setCustomServices(prevServices => 
              prevServices.map(service => 
                service.id === customService.id 
                  ? { ...service, updates: [], error: error.message }
                  : service
              )
            );
          }
        }
      });
    }
    
    setLastUpdated(new Date());
    setLoading(false);
  }, [selectedServices, customServices]);

  // Check for any open/unresolved issue across selected providers only
  useEffect(() => {
    const openIssues = [];
    
    // Cloudflare: only unresolved incidents (only if selected)
    if (isServiceSelected('cloudflare') && cloudflare && cloudflare.incidents) {
      cloudflare.incidents.forEach(incident => {
        if (isIssueActive(incident, 'cloudflare')) {
          const issueObject = { 
            provider: 'Cloudflare', 
            name: incident.name || incident.title || 'Cloudflare Service Issue', 
            status: incident.impact || incident.status || 'major', 
            updated: incident.updated_at || incident.updatedAt || incident.date, 
            url: incident.shortlink || incident.url || 'https://www.cloudflarestatus.com/' 
          };
          
          // Only add if we have a valid name/title
          if (issueObject.name && issueObject.name.trim() !== '') {
            openIssues.push(issueObject);
          }
        }
      });
    }
    
    // Zscaler: only active issues (only if selected)
    if (isServiceSelected('zscaler') && zscaler && zscaler.updates) {
      zscaler.updates.forEach(update => {
        if (isIssueActive(update, 'zscaler')) {
          const issueObject = { 
            provider: 'Zscaler', 
            name: update.title || update.name || 'Zscaler Service Issue', 
            status: zscaler.status || 'unknown', 
            updated: update.date || update.updated_at || update.reported_at, 
            url: update.link || update.url || 'https://trust.zscaler.com/' 
          };
          
          // Only add if we have a valid name/title
          if (issueObject.name && issueObject.name.trim() !== '') {
            openIssues.push(issueObject);
          }
        }
      });
    }
    
    // Okta: only active issues (only if selected)
    if (isServiceSelected('okta') && okta && okta.updates) {
      okta.updates.forEach(update => {
        if (isIssueActive(update, 'okta')) {
          const issueObject = { 
            provider: 'Okta', 
            name: update.title || update.name || 'Okta Service Issue', 
            status: okta.status || 'unknown', 
            updated: update.date || update.updated_at || update.reported_at, 
            url: update.link || update.url || 'https://status.okta.com/' 
          };
          
          // Only add if we have a valid name/title
          if (issueObject.name && issueObject.name.trim() !== '') {
            openIssues.push(issueObject);
          }
        }
      });
    }
    
    // SendGrid: only active issues (only if selected)
    if (isServiceSelected('sendgrid') && sendgrid && sendgrid.updates) {
      sendgrid.updates.forEach(update => {
        if (isIssueActive(update, 'sendgrid')) {
          const issueObject = { 
            provider: 'SendGrid', 
            name: update.title || update.name || 'SendGrid Service Issue', 
            status: sendgrid.status || 'unknown', 
            updated: update.date || update.updated_at || update.reported_at, 
            url: update.link || update.url || 'https://status.sendgrid.com/' 
          };
          
          // Only add if we have a valid name/title
          if (issueObject.name && issueObject.name.trim() !== '') {
            openIssues.push(issueObject);
          }
        }
      });
    }
    
    // Slack: only active issues (only if selected)
    if (isServiceSelected('slack') && slack && slack.updates) {
      slack.updates.forEach(update => {
        if (isIssueActive(update, 'slack')) {
          const issueObject = { 
            provider: 'Slack', 
            name: update.title || update.name || 'Slack Service Issue', 
            status: slack.status || 'unknown', 
            updated: update.reported_at || update.date || update.updated_at, 
            url: update.url || 'https://status.slack.com/' 
          };
          
          // Only add if we have a valid name/title
          if (issueObject.name && issueObject.name.trim() !== '') {
            openIssues.push(issueObject);
          }
        }
      });
    }
    
    // Datadog: only active issues (only if selected)
    if (isServiceSelected('datadog') && datadog && datadog.updates) {
      datadog.updates.forEach(update => {
        if (isIssueActive(update, 'datadog')) {
          const issueObject = { 
            provider: 'Datadog', 
            name: update.title || update.name || 'Datadog Service Issue', 
            status: datadog.status || 'unknown', 
            updated: update.reported_at || update.date || update.updated_at, 
            url: update.url || update.link || 'https://status.datadoghq.com/' 
          };
          
          // Only add if we have a valid name/title
          if (issueObject.name && issueObject.name.trim() !== '') {
            openIssues.push(issueObject);
          }
        }
      });
    }
    
    // AWS: only active issues (only if selected)
    if (isServiceSelected('aws') && aws && aws.updates) {
      aws.updates.forEach(update => {
        if (isIssueActive(update, 'aws')) {
          const issueObject = { 
            provider: 'AWS', 
            name: update.title || update.name || 'AWS Service Issue', 
            status: aws.status || 'unknown', 
            updated: update.reported_at || update.date || update.updated_at, 
            url: update.url || update.link || 'https://status.aws.amazon.com/' 
          };
          
          // Only add if we have a valid name/title
          if (issueObject.name && issueObject.name.trim() !== '') {
            openIssues.push(issueObject);
          }
        }
      });
    }
    
    setCriticalMode({ active: openIssues.length > 0, details: openIssues });
  }, [cloudflare, zscaler, okta, sendgrid, slack, datadog, aws, selectedServices]);

  // Calculate total feed items count for search
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
    
    // Initial load after a small delay to allow component to settle
    setTimeout(() => {
      fetchAllStatuses();
    }, ALERT_THROTTLE_CONFIG.onPageRefreshDelay);
    
    // Single unified interval for all data fetching (every 2 minutes)
    const dataInterval = setInterval(() => {
      fetchAllStatuses();
    }, ALERT_THROTTLE_CONFIG.minIntervalMs); // 2 minutes
    
    return () => {
      clearInterval(dataInterval);
    };
  }, [fetchAllStatuses]);

  // Ticker logic: cycle through issues every 10 seconds
  useEffect(() => {
    const issues = criticalMode.active ? criticalMode.details : demoIssues;
    
    if (issues.length <= 1) {
      setTickerIndex(0);
      return;
    }
    
    // Start cycling through issues every 10 seconds
    const tickerInterval = setInterval(() => {
      setTickerIndex(prevIndex => (prevIndex + 1) % issues.length);
    }, 10000); // 10 seconds
    
    return () => clearInterval(tickerInterval);
  }, [criticalMode.active, criticalMode.details, demoIssues]);

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
      {/* Modern Header with Hamburger Menu */}
      <header className="modern-header" style={{
        width: '100%',
        background: 'rgba(255,255,255,0.95)',
        boxShadow: '0 2px 20px 0 rgba(30,41,59,0.08)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(148, 163, 184, 0.08)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        padding: 0,
        marginBottom: 18
      }}>
        <div className="header-container" style={{
          maxWidth: 1280,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          minHeight: 70,
          position: 'relative',
        }}>
          {/* Hamburger Menu Button */}
          <button 
            className="hamburger-menu"
            onClick={() => setIsDrawerOpen(true)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '12px',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              transition: 'all 0.2s ease',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
            }}
            onMouseEnter={e => {
              e.target.style.backgroundColor = 'rgba(59, 130, 246, 0.15)';
              e.target.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={e => {
              e.target.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
              e.target.style.transform = 'scale(1)';
            }}
            aria-label="Open menu"
          >
            <span style={{
              width: '20px',
              height: '2px',
              backgroundColor: '#374151',
              borderRadius: '1px',
              transition: 'all 0.2s ease'
            }}></span>
            <span style={{
              width: '20px',
              height: '2px',
              backgroundColor: '#374151',
              borderRadius: '1px',
              transition: 'all 0.2s ease'
            }}></span>
            <span style={{
              width: '20px',
              height: '2px',
              backgroundColor: '#374151',
              transition: 'all 0.2s ease'
            }}></span>
          </button>

          {/* Brand/Logo Section - Centered */}
          <div className="header-brand" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 16,
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)'
          }}>
            <div className="logo-container" style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.6) 100%)',
              borderRadius: 14,
              boxShadow: '0 3px 12px rgba(30,41,59,0.08)',
              padding: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 50,
              height: 50,
              border: '1px solid rgba(255,255,255,0.2)',
            }}>
              <img 
                src={logoImage} 
                alt="Stack Status IO Logo" 
                className="header-logo"
                style={{ width: 30, height: 30, borderRadius: 8 }}
              />
            </div>
            <div className="brand-info" style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <h1 className="brand-title" style={{
                fontWeight: 800,
                fontSize: '1.8em',
                color: '#1e293b',
                letterSpacing: '-0.02em',
                margin: 0,
                lineHeight: 1.1,
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}>
                Stack Status
                <span className="brand-subtitle" style={{
                  fontWeight: 600,
                  fontSize: '0.55em',
                  color: '#3b82f6',
                  marginLeft: 3,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  background: 'linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  display: 'inline-block'
                }}>IO</span>
              </h1>
              <div className="status-compact" style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8
              }}>
                <div className="status-dot" style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                  boxShadow: '0 0 6px 1px #10b98130',
                }}></div>
                <span className="status-text" style={{ 
                  fontWeight: 600, 
                  color: '#64748b', 
                  fontSize: '0.85em' 
                }}>
                  All Systems Operational
                </span>
                <div className="live-indicator" style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 3, 
                  marginLeft: 6 
                }}>
                  <span className="live-pulse" style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#ef4444',
                    boxShadow: '0 0 0 0 #ef4444',
                    animation: 'pulseLive 1.5s infinite cubic-bezier(0.66,0,0,1)'
                  }}></span>
                  <span className="live-text" style={{ 
                    fontWeight: 700, 
                    color: '#ef4444', 
                    fontSize: 10, 
                    letterSpacing: 0.8 
                  }}>LIVE</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Status Indicator - Right Side */}
          <div className="quick-status" style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: '14px',
            color: '#64748b'
          }}>
            <span style={{ fontSize: '16px' }}>🟢</span>
            <span>All OK</span>
          </div>
        </div>

        {/* Subtle background effects */}
        <div className="header-bg-effects" style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: -1,
          pointerEvents: 'none',
        }}>
          <div className="bg-gradient-1" style={{
            position: 'absolute',
            top: '-20px',
            left: '-40px',
            width: 200,
            height: 200,
            background: 'radial-gradient(circle at 30% 30%, #3b82f620 0%, transparent 70%)',
            filter: 'blur(20px)',
          }}></div>
          <div className="bg-gradient-2" style={{
            position: 'absolute',
            bottom: '-30px',
            right: '-60px',
            width: 250,
            height: 150,
            background: 'radial-gradient(circle at 70% 70%, #1d4ed820 0%, transparent 70%)',
            filter: 'blur(25px)',
          }}></div>
        </div>
      </header>

      {/* Side Drawer */}
      <SideDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onWorldMapClick={() => setShowWorldMap(true)}
        onAddRSSClick={() => setShowAddCustomModal(true)}
        onSettingsClick={() => setShowSplash(true)}
        onFeedSearchClick={() => setShowFeedSearchPanel(true)}
        onRadarClick={() => setShowRadar(true)}
        showWorldMap={showWorldMap}
        showAddCustomModal={showAddCustomModal}
        showSplash={showSplash}
        showFeedSearchPanel={showFeedSearchPanel}
        showRadar={showRadar}
        totalFeedItemsCount={totalFeedItemsCount}
        selectedServices={selectedServices}
        cloudflare={cloudflare}
        zscaler={zscaler}
        okta={okta}
        sendgrid={sendgrid}
        slack={slack}
        datadog={datadog}
        aws={aws}
      />
      
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
                  if (!issues || issues.length === 0) {
                    return (
                      <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        gap: 4,
                        animation: 'fadeIn 0.6s ease-out'
                      }}>
                        <span style={{ fontWeight: 700 }}>No active issues detected</span>
                      </div>
                    );
                  }
                  const idx = tickerIndex % issues.length;
                  const c = issues[idx];
                  
                  // Safety check to ensure the issue object has required properties
                  if (!c || !c.provider || !c.name) {
                    return (
                      <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        gap: 4,
                        animation: 'fadeIn 0.6s ease-out'
                      }}>
                        <span style={{ fontWeight: 700 }}>Loading issue details...</span>
                      </div>
                    );
                  }
                  
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
                  if (!issues || issues.length === 0) return null;
                  const idx = tickerIndex % issues.length;
                  const c = issues[idx];
                  
                  // Safety check to ensure the issue object exists and has required properties
                  if (!c || !c.url) return null;
                  
                  return (
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
                if (!issues || issues.length <= 1) return null;
                return (
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
            
            {/* World Map Widget */}
            {selectedServices.length > 0 && (
              <Suspense fallback={
                <div style={{
                  width: '100%',
                  height: '350px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '16px',
                  color: 'white'
                }}>
                  <div>Loading world map...</div>
                </div>
              }>
                <WorldMapWidget
                  cloudflareIncidents={cloudflare.incidents}
                  zscalerUpdates={zscaler.updates}
                  oktaUpdates={okta.updates}
                  sendgridUpdates={sendgrid.updates}
                  slackUpdates={slack.updates}
                  datadogUpdates={datadog.updates}
                  awsUpdates={aws.updates}
                  selectedServices={selectedServices}
                  showHistoric={false}
                />
              </Suspense>
            )}
            
            {isServiceSelected('cloudflare') && !isCardClosed('cloudflare') && (
              <MemoizedLivePulseCardContainer
                provider="Cloudflare"
                name={cloudflare.name}
                indicator={cloudflare.indicator}
                status={cloudflare.status}
                incidents={cloudflare.incidents}
                onClose={closeCard}
              />
            )}
            {isServiceSelected('zscaler') && !isCardClosed('zscaler') && (
              <MemoizedZscalerPulseCardContainer
                provider="Zscaler"
                name="Zscaler"
                indicator={getZscalerIndicator(zscaler.status)}
                status={zscaler.status}
                updates={zscaler.updates}
                onClose={closeCard}
              />
            )}
            {isServiceSelected('okta') && !isCardClosed('okta') && (
              <MemoizedZscalerPulseCardContainer
                provider="Okta"
                name="Okta"
                indicator={okta.indicator}
                status={okta.status}
                updates={okta.updates}
                onClose={closeCard}
              />
            )}
            {isServiceSelected('sendgrid') && !isCardClosed('sendgrid') && (
              <MemoizedZscalerPulseCardContainer
                provider="SendGrid"
                name="SendGrid"
                indicator={sendgrid.indicator}
                status={sendgrid.status}
                updates={sendgrid.updates}
                onClose={closeCard}
              />
            )}
            {isServiceSelected('slack') && !isCardClosed('slack') && (
              <MemoizedZscalerPulseCardContainer
                provider="Slack"
                name="Slack"
                indicator={slack.updates.length > 0 ? 'major' : 'none'}
                status={slack.status}
                updates={slack.updates}
                onClose={closeCard}
              />
            )}
            {isServiceSelected('datadog') && !isCardClosed('datadog') && (
              <MemoizedZscalerPulseCardContainer
                provider="Datadog"
                name="Datadog"
                indicator={datadog.updates.length > 0 ? 'major' : 'none'}
                status={datadog.status}
                updates={datadog.updates}
                onClose={closeCard}
              />
            )}
            {isServiceSelected('aws') && !isCardClosed('aws') && (
              <MemoizedZscalerPulseCardContainer
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
        
        {/* Bug Report Modal - temporarily disabled */}
        {FEATURE_FLAGS.reportIssueEnabled && (
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
        )}
        
        {/* World Map Modal */}
        {showWorldMap && (
          <div style={{
            position: 'fixed', 
            top: 0, 
            left: 0, 
            width: '100vw', 
            height: '100vh',
            background: 'rgba(0,0,0,0.7)', 
            zIndex: 2000, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            padding: '20px',
            boxSizing: 'border-box'
          }}>
            <div style={{ 
              background: 'transparent', 
              borderRadius: 16, 
              width: '95vw',
              maxWidth: '1200px',
              height: '85vh',
              minHeight: '600px',
              position: 'relative',
              overflow: 'hidden',
              animation: 'slideIn 0.3s ease-out'
            }}>
              {/* Close button */}
              <button 
                onClick={() => setShowWorldMap(false)}
                style={{
                  position: 'absolute',
                  top: '16px',
                  left: '16px',
                  zIndex: 15,
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  color: 'white',
                  fontSize: '20px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={e => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                }}
                onMouseLeave={e => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                }}
              >
                ×
              </button>

              {/* Toggle for historic vs current */}
              <div style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                zIndex: 10,
                display: 'flex',
                gap: '8px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '4px',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                <button
                  onClick={() => setWorldMapHistoric(false)}
                  style={{
                    background: !worldMapHistoric ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Current Active
                </button>
                <button
                  onClick={() => setWorldMapHistoric(true)}
                  style={{
                    background: worldMapHistoric ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Last 7 Days
                </button>
              </div>

              <Suspense fallback={
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  height: '100%',
                  color: 'white',
                  fontSize: '18px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '16px'
                }}>
                  Loading world map...
                </div>
              }>
                <ErrorBoundary>
                <LeafletWorldMap
                    cloudflareIncidents={cloudflare.incidents}
                    zscalerUpdates={zscaler.updates}
                    oktaUpdates={okta.updates}
                    sendgridUpdates={sendgrid.updates}
                    slackUpdates={slack.updates}
                    datadogUpdates={datadog.updates}
                    awsUpdates={aws.updates}
                    selectedServices={selectedServices}
                    showHistoric={worldMapHistoric}
                  />
                </ErrorBoundary>
              </Suspense>
            </div>
          </div>
        )}

        {/* Service Radar Modal */}
        {showRadar && (
          <Suspense fallback={
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10000,
              color: 'white',
              fontSize: '18px'
            }}>
              Loading radar...
            </div>
          }>
            <ErrorBoundary>
              <ServiceRadar
                cloudflare={cloudflare}
                zscaler={zscaler}
                okta={okta}
                sendgrid={sendgrid}
                slack={slack}
                datadog={datadog}
                aws={aws}
                customServices={customServices}
                selectedServices={selectedServices}
                onClose={() => setShowRadar(false)}
              />
            </ErrorBoundary>
          </Suspense>
        )}

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
        
        
        <SpeedInsights />
        <Analytics />
      </div>
      
      {/* Feed Search Panel */}
      <Suspense fallback={<div>Loading feed search...</div>}>
        <UnifiedLiveFeedPanel
          isOpen={showFeedSearchPanel}
          onClose={() => setShowFeedSearchPanel(false)}
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
      </Suspense>
      
      {/* Cookie Consent Banner */}
      <CookieConsent />
    </>;
}

export default App;
