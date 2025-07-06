import React, { useState, useMemo } from 'react';
import Modal from '../../../components/common/Modal';
import ReportImpactForm from '../../../components/forms/ReportImpactForm';
import ServiceTimeline from '../../../components/charts/ServiceTimeline';
import { formatDate, htmlToText } from '../components/ServiceStatusCard';
import { cleanAndTruncateHtml } from '../../../utils/textFormatting';
import { serviceLogos } from '../../../services/serviceLogos';
import '../components/LivePulseCard.css';

export default function LivePulseCardContainer({
  provider,
  name,
  indicator,
  status,
  incidents = [],
  updates = [],
  onClose,
}) {
  const [bugModalOpen, setBugModalOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Helper: get today's date string (YYYY-MM-DD)
  function getTodayStr() {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  }
  const todayStr = getTodayStr();

  // Count issues for today for each provider
  let todayIssueCount = 0;
  if (provider === 'Cloudflare' && incidents.length > 0) {
    todayIssueCount = incidents.filter(inc => {
      const started = new Date(inc.created_at || inc.createdAt);
      const ended = inc.resolved_at ? new Date(inc.resolved_at) : null;
      const todayStart = new Date(todayStr);
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(todayStr);
      todayEnd.setHours(23, 59, 59, 999);
      if (isNaN(started)) return false;
      if (ended) {
        return started <= todayEnd && ended >= todayStart;
      } else {
        return started <= todayEnd;
      }
    }).length;
  }

  // Headline: latest incident/update or fallback
  let headline = 'All systems operational.';
  let lastUpdated = null;
  let headlineStyle = { marginBottom: 4, minHeight: 22, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', width: '100%' };
  if (provider === 'Cloudflare') {
    headline = todayIssueCount === 0
      ? 'No issues reported today.'
      : `${todayIssueCount} issue${todayIssueCount > 1 ? 's' : ''} reported today.`;
    // Get most recent incident date for last updated
    if (incidents.length > 0) {
      const latest = incidents[0];
      lastUpdated = formatDate(latest.updated_at || latest.updatedAt);
    }
    // Move left and reduce margin below
    headlineStyle = { marginBottom: 4, minHeight: 22, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', width: '100%' };
  } else if (provider === 'Zscaler' && updates.length > 0) {
    const latest = updates[0];
    headline = latest.title;
    lastUpdated = formatDate(latest.date);
  } else if (provider === 'SendGrid' && incidents.length > 0) {
    const latest = incidents[0];
    headline = `${latest.name} ${latest.status.replace('_', ' ')}`;
    lastUpdated = formatDate(latest.updated_at || latest.updatedAt);
  } else if (provider === 'Okta' && incidents.length > 0) {
    const latest = incidents[0];
    headline = `${latest.name} ${latest.status.replace('_', ' ')}`;
    lastUpdated = formatDate(latest.updated_at || latest.updatedAt);
  }

  // Company info for each provider
  const companyInfoMap = {
    Cloudflare: (
      <>
        <div style={{ marginBottom: 6 }}>
          <a href="https://www.cloudflare.com" target="_blank" rel="noopener noreferrer">cloudflare.com</a>
        </div>
        <div>Cloudflare provides content delivery network (CDN), DDoS mitigation, Internet security, and distributed domain name server services.</div>
      </>
    ),
    Zscaler: (
      <>
        <div style={{ marginBottom: 6 }}>
          <a href="https://www.zscaler.com" target="_blank" rel="noopener noreferrer">zscaler.com</a>
        </div>
        <div>Zscaler offers cloud-based information security, including secure web gateway, cloud firewall, and zero trust network access solutions.</div>
      </>
    ),
    SendGrid: (
      <>
        <div style={{ marginBottom: 6 }}>
          <a href="https://sendgrid.com" target="_blank" rel="noopener noreferrer">sendgrid.com</a>
        </div>
        <div>SendGrid is a cloud-based email delivery service for transactional and marketing email, offering reliable email API and SMTP relay solutions.</div>
      </>
    ),
    Okta: (
      <>
        <div style={{ marginBottom: 6 }}>
          <a href="https://www.okta.com" target="_blank" rel="noopener noreferrer">okta.com</a>
        </div>
        <div>Okta provides identity and access management services, including single sign-on, multi-factor authentication, and lifecycle management.</div>
      </>
    ),
  };

  // Memoize the headline JSX to prevent unnecessary re-renders that cause pulsing
  const memoizedHeadline = useMemo(() => {
    return <div style={headlineStyle}>{headline}</div>;
  }, [headline, JSON.stringify(headlineStyle)]);

  // Compose history data for all providers
  let historyItems = [];
  
  // Use incidents if available, otherwise use updates
  if (incidents && incidents.length > 0) {
    historyItems = incidents;
  } else if (updates && updates.length > 0) {
    historyItems = updates;
  }

  return (
    <>
      <div className="live-pulse-card">
        <div className="card-header">
          <div className="service-info">
            <div className="service-logo-container">
              <img 
                src={serviceLogos[provider]} 
                alt={`${provider} logo`} 
                className="service-logo"
              />
            </div>
            <div className="service-details">
              <h3 className="service-name">{name || provider}</h3>
              <p className="service-description">{companyInfoMap[provider] ? 
                companyInfoMap[provider].props.children[1].props.children : 
                `${provider} service monitoring`}
              </p>
              <div className="status-indicator-container">
                <span className={`status-indicator ${indicator}`}></span>
                <span className="status-text">{status}</span>
              </div>
            </div>
          </div>
          <div className="status-section">
            {onClose && (
              <button 
                className="close-card-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose(provider);
                }}
                title={`Hide ${provider} card`}
                aria-label={`Hide ${provider} card`}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="10" cy="10" r="9" fill="#e2e8f0"/>
                  <path d="M7 7L13 13M13 7L7 13" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            )}
          </div>
        </div>

        <div className="live-pulse-headline">{memoizedHeadline}</div>

        {/* 7-Day Service Timeline */}
        <ServiceTimeline 
          provider={provider}
          incidents={incidents}
          updates={updates}
          showPercentage={true}
          showLabels={true}
        />

        <div className="card-content">
          {/* Card actions - always visible */}
          <div className="card-actions">
            <button 
              className="bug-report-btn"
              onClick={(e) => {
                e.stopPropagation();
                setBugModalOpen(true);
              }}
            >
              🐛 Report Issue
            </button>
            <button 
              className="view-history-btn"
              onClick={(e) => {
                e.stopPropagation();
                setShowHistory(v => !v);
              }}
            >
              📋 {showHistory ? 'Hide History' : 'View History'}
            </button>
          </div>
          
          {showHistory && historyItems.length > 0 && (
            <div className="card-history-section">
              <div className="updates-section">
                <div className="history-header">
                  <h4>Recent History</h4>
                  <span className="history-count">{historyItems.length} items</span>
                </div>
                <div className="history-list">
                  {historyItems.map((item, idx) => (
                    <div key={item.id || item.title || item.name || idx} className="history-item">
                      <div className="history-dot" style={{
                        background: item.eventType === 'Service Degradation' || item.status === 'investigating' ? '#f59e0b' : 
                                   item.status === 'resolved' ? '#10b981' : '#6b7280'
                      }}></div>
                      <div className="history-content">
                        <div className="history-title">{item.title || item.name}</div>
                        <div className="history-date">{formatDate(item.date || item.updated_at || item.updatedAt || item.reported_at)}</div>
                        {item.description && (
                          <div className="history-description">
                            {cleanAndTruncateHtml(item.description, 150)}
                          </div>
                        )}
                        {(item.link || item.shortlink || item.url) && (
                          <a 
                            href={item.link || item.shortlink || item.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="history-link"
                          >
                            Read more →
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {showHistory && historyItems.length === 0 && (
            <div className="card-history-section">
              <div className="no-updates">
                <span className="no-updates-icon">📋</span>
                <p>No recent updates available</p>
              </div>
            </div>
          )}
        </div>
      </div>
      <Modal 
        open={bugModalOpen} 
        onClose={() => setBugModalOpen(false)} 
        title={`Report Issue - ${name || provider}`}
        enhanced={true}
      >
        <ReportImpactForm 
          serviceName={name || provider} 
          onClose={() => setBugModalOpen(false)} 
        />
      </Modal>
    </>
  );
}
