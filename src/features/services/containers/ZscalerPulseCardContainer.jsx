import React, { useState } from 'react';
import Modal from '../../../components/common/Modal';
import ReportImpactForm from '../../../components/forms/ReportImpactForm';
import ServiceTimeline from '../../../components/charts/ServiceTimeline';
import { formatDate, htmlToText } from '../components/ServiceStatusCard';
import { cleanAndTruncateHtml } from '../../../utils/textFormatting';
import { getUTCMidnight } from '../../../utils/dateHelpers';
import { serviceLogos } from '../../../services/serviceLogos';
import '../components/LivePulseCard.css';

export default function ZscalerPulseCardContainer({ provider = "Zscaler", name, indicator, status, updates = [], onClose }) {
  const [bugModalOpen, setBugModalOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Helper: get the date string to use for an update (startTime > date)
  function getUpdateDate(update) {
    if (update.startTime) return getUTCMidnight(update.startTime);
    if (update.date) return getUTCMidnight(update.date);
    if (update.reported_at) return getUTCMidnight(update.reported_at);
    return null;
  }

  // For Zscaler, filter updates to only last 7 days for modal (show all updates, not just disruptions)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);
  const minDate = sevenDaysAgo.getTime();
  
  const filteredUpdates = updates.filter(u => {
    const updateDate = getUpdateDate(u);
    if (!updateDate) return false;
    return updateDate.getTime() >= minDate;
  });

  // Helper: get today's date string (YYYY-MM-DD)
  function getTodayStr() {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  }
  const todayStr = getTodayStr();

  // Count issues for today for Zscaler (only Service Degradation)
  const todayIssueCount = updates.filter(u => {
    const updateDate = getUpdateDate(u);
    if (!updateDate) return false;
    if (updateDate.toISOString().slice(0, 10) !== todayStr) return false;
    return u.eventType === "Service Degradation";
  }).length;

  // Headline: show issue count for today
  let headline = todayIssueCount > 0
    ? `${todayIssueCount} issue${todayIssueCount > 1 ? 's' : ''} logged today`
    : 'No issues logged today.';

  // Get last updated date from most recent update
  let lastUpdated = null;
  if (updates.length > 0) {
    const latest = updates[0];
    if (latest.startTime) {
      lastUpdated = formatDate(latest.startTime);
    } else if (latest.date) {
      lastUpdated = formatDate(latest.date);
    } else if (latest.reported_at) {
      lastUpdated = formatDate(latest.reported_at);
    }
  }

  const companyInfo = (
    <>
      <div style={{ marginBottom: 6 }}>
        <a href="https://www.zscaler.com" target="_blank" rel="noopener noreferrer">zscaler.com</a>
      </div>
      <div>Zscaler offers cloud-based information security, including secure web gateway, cloud firewall, and zero trust network access solutions.</div>
    </>
  );

  const historyItems = updates || [];

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
              <p className="service-description">{provider === 'Zscaler' ? 
                'Zscaler offers cloud-based information security, including secure web gateway, cloud firewall, and zero trust network access solutions.' :
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

        <div className="live-pulse-headline">{headline}</div>

        {/* 7-Day Service Timeline */}
        <ServiceTimeline 
          provider={provider}
          incidents={[]}
          updates={updates}
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
              Report Issue
            </button>
            <button 
              className="view-history-btn"
              onClick={(e) => {
                e.stopPropagation();
                setShowHistory(v => !v);
              }}
            >
              {showHistory ? 'Hide History' : 'View History'}
            </button>
          </div>
          
          {showHistory && historyItems.length > 0 && (
            <div className="card-history-section">
              <div className="updates-section">
                <div className="history-header">
                  <h4>Recent History (Last 7 Days)</h4>
                  <span className="history-count">{historyItems.length} items</span>
                </div>
                <div className="history-list">
                  {historyItems.map((item, idx) => (
                    <div key={item.id || item.title || idx} className="history-item">
                      <div className="history-dot" style={{
                        background: item.eventType === 'Service Degradation' ? '#f59e0b' : '#10b981'
                      }}></div>
                      <div className="history-content">
                        <div className="history-title">{item.title}</div>
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
                <p>No updates in the last 7 days</p>
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
