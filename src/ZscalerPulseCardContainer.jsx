import React, { useState } from 'react';
import LivePulseCard from './LivePulseCard';
import Modal from './Modal';
import ReportImpactForm from './ReportImpactForm';
import { formatDate, htmlToText } from './ServiceStatusCard';
import { getUTCMidnight } from './utils/dateHelpers';
import { serviceLogos } from './serviceLogos';

// Zscaler-specific: get last 7 days using UTC midnight
function getLast7DaysUTC() {
  const days = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    d.setUTCDate(d.getUTCDate() - i);
    days.push(d);
  }
  return days;
}

export default function ZscalerPulseCardContainer({ provider = "Zscaler", name, indicator, status, updates = [] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [bugModalOpen, setBugModalOpen] = useState(false);

  // Helper: get the date string to use for an update (startTime > date)
  function getUpdateDate(update) {
    if (update.startTime) return getUTCMidnight(update.startTime);
    if (update.date) return getUTCMidnight(update.date);
    if (update.reported_at) return getUTCMidnight(update.reported_at);
    return null;
  }

  function getDayIndicator(day) {
    if (["SendGrid", "Slack", "Datadog", "AWS"].includes(provider) && updates.length > 0) {
      // For these providers, highlight any day with an event (RSS event)
      const hasEvent = updates.some(u => {
        const updateDate = getUpdateDate(u);
        if (!updateDate) return false;
        return updateDate.getTime() === day.getTime();
      });
      if (hasEvent) return 'major'; // Orange for any event
      return 'none';
    }
    // Only show indicator if a Service Degradation is present for this day
    const dayDegradations = updates.filter(u => {
      const updateDate = getUpdateDate(u);
      if (!updateDate) return false;
      // Compare UTC midnight
      if (updateDate.getTime() !== day.getTime()) return false;
      // Only consider eventType === "Service Degradation"
      return u.eventType === "Service Degradation";
    });
    if (dayDegradations.length > 0) {
      return 'major';
    }
    return 'none';
  }

  // For Zscaler, filter updates to only last 7 days for modal (show all updates, not just disruptions)
  const last7 = getLast7DaysUTC();
  const minDate = last7[0].getTime();
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

  const companyInfo = (
    <>
      <div style={{ marginBottom: 6 }}>
        <a href="https://www.zscaler.com" target="_blank" rel="noopener noreferrer">zscaler.com</a>
      </div>
      <div>Zscaler offers cloud-based information security, including secure web gateway, cloud firewall, and zero trust network access solutions.</div>
    </>
  );

  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <>
      <LivePulseCard
        name={name}
        provider={provider}
        indicator={indicator}
        status={status}
        headline={headline}
        onExpand={() => setModalOpen(true)}
        companyInfo={companyInfo}
        onBugClick={() => setBugModalOpen(true)}
      >
        <div style={{ marginTop: 18, width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
            {last7.map((d, i) => {
              const isToday = (new Date().toUTCString().slice(0, 16) === d.toUTCString().slice(0, 16));
              return (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    fontSize: 13,
                    fontWeight: 500,
                    color: isToday ? '#1976d2' : '#888',
                    textDecoration: isToday ? 'underline' : 'none',
                    letterSpacing: 1,
                  }}
                >
                  {dayLabels[d.getUTCDay()]}
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {last7.map((d, i) => (
              <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                <span
                  className={`status-indicator ${getDayIndicator(d)}`}
                  style={{ margin: '0 auto', display: 'inline-block' }}
                  title={getDayIndicator(d)}
                ></span>
              </div>
            ))}
          </div>
        </div>
        {/* Action buttons positioned at bottom of card */}
        <div className="card-bottom-row">
          <button
            className="bug-btn"
            aria-label="Report an issue with this service"
            onClick={() => setBugModalOpen(true)}
          >
            <span className="bug-icon" role="img" aria-label="report issue">⚠️</span>
            <span className="bug-text">Report an issue</span>
          </button>
          <button
            className="view-7days-btn"
            onClick={() => setModalOpen(true)}
          >
            View last 7 days
          </button>
        </div>
      </LivePulseCard>
      <Modal 
        open={modalOpen} 
        onClose={() => setModalOpen(false)} 
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img 
              src={serviceLogos[provider]} 
              alt={`${provider} logo`} 
              style={{ width: 24, height: 24, objectFit: 'contain' }}
            />
            {name || provider} Changelog
          </div>
        }
        enhanced={true}
      >
        {provider === 'Zscaler' && filteredUpdates.length > 0 ? (
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {filteredUpdates.map((issue, idx) => (
              <div key={idx} style={{ 
                borderBottom: idx < filteredUpdates.length - 1 ? '1px solid #f5f5f5' : 'none', 
                padding: '16px 20px',
                transition: 'background-color 0.2s ease',
                cursor: issue.link ? 'pointer' : 'default'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              onClick={() => issue.link && window.open(issue.link, '_blank')}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: issue.eventType === 'Service Degradation' ? '#f57c00' : '#0066cc',
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
                      {issue.title}
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
                      {htmlToText(issue.description) || 'No description available'}
                    </div>
                    <div style={{ 
                      fontSize: 11, 
                      color: '#999',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <img src={serviceLogos[provider]} alt="time" style={{ width: 12, height: 12 }} />
                        {formatDate(issue.date)}
                      </span>
                      {issue.eventType && <span style={{ color: '#f57c00' }}>⚠️ {issue.eventType}</span>}
                      {issue.link && (
                        <a 
                          href={issue.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ 
                            color: '#1976d2', 
                            textDecoration: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          🔗 View details
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : provider === 'SendGrid' && updates.length > 0 ? (
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {updates.map((issue, idx) => (
              <div key={idx} style={{ 
                borderBottom: idx < updates.length - 1 ? '1px solid #f5f5f5' : 'none', 
                padding: '16px 20px',
                transition: 'background-color 0.2s ease',
                cursor: issue.link ? 'pointer' : 'default'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              onClick={() => issue.link && window.open(issue.link, '_blank')}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: '#1a82e2',
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
                      {issue.title}
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
                      {htmlToText(issue.description) || 'No description available'}
                    </div>
                    <div style={{ 
                      fontSize: 11, 
                      color: '#999',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8
                    }}>
                      <span>🕒 {formatDate(issue.date)}</span>
                      {issue.link && (
                        <a 
                          href={issue.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ 
                            color: '#1976d2', 
                            textDecoration: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          🔗 View details
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : provider === 'Okta' && updates.length > 0 ? (
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {updates.map((issue, idx) => (
              <div key={idx} style={{ 
                borderBottom: idx < updates.length - 1 ? '1px solid #f5f5f5' : 'none', 
                padding: '16px 20px',
                transition: 'background-color 0.2s ease',
                cursor: issue.link ? 'pointer' : 'default'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              onClick={() => issue.link && window.open(issue.link, '_blank')}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: '#007dc1',
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
                      {issue.title}
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
                      {htmlToText(issue.description) || 'No description available'}
                    </div>
                    <div style={{ 
                      fontSize: 11, 
                      color: '#999',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8
                    }}>
                      <span>🕒 {formatDate(issue.date)}</span>
                      {issue.link && (
                        <a 
                          href={issue.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ 
                            color: '#1976d2', 
                            textDecoration: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          🔗 View details
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: 24, color: '#888', textAlign: 'center' }}>
            <div style={{ fontSize: 16, marginBottom: 8, display: 'flex', justifyContent: 'center' }}>
              <img src={serviceLogos[provider]} alt={`${provider} operational`} style={{ width: 32, height: 32 }} />
            </div>
            <div style={{ fontSize: 14 }}>No recent updates</div>
            <div style={{ fontSize: 12, color: '#aaa', marginTop: 4 }}>All systems operational in the last 7 days</div>
          </div>
        )}
      </Modal>
      <Modal open={bugModalOpen} onClose={() => setBugModalOpen(false)} title={`Report Service Impact: ${name || provider}`}>
        <p>Let us know if you're currently impacted by an issue with <strong>{name || provider}</strong>.</p>
        <ReportImpactForm serviceName={name || provider} onClose={() => setBugModalOpen(false)} />
      </Modal>
    </>
  );
}
