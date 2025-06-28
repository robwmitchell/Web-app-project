import React, { useState } from 'react';
import LivePulseCard from './LivePulseCard';
import Modal from './Modal';
import ReportImpactForm from './ReportImpactForm';
import { formatDate, htmlToText } from './ServiceStatusCard';
import { getLast7Days } from './utils/dateHelpers';
import { serviceLogos } from './serviceLogos';

export default function LivePulseCardContainer({
  provider,
  name,
  indicator,
  status,
  incidents = [],
  updates = [],
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [bugModalOpen, setBugModalOpen] = useState(false);

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
  let headlineStyle = { marginBottom: 4, minHeight: 22, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', width: '100%' };
  if (provider === 'Cloudflare') {
    headline = todayIssueCount === 0
      ? 'No issues reported today.'
      : `${todayIssueCount} issue${todayIssueCount > 1 ? 's' : ''} reported today.`;
    // Move left and reduce margin below
    headlineStyle = { marginBottom: 4, minHeight: 22, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', width: '100%' };
  } else if (provider === 'Zscaler' && updates.length > 0) {
    const latest = updates[0];
    headline = `${latest.title} (${formatDate(latest.date)})`;
  } else if (provider === 'SendGrid' && incidents.length > 0) {
    const latest = incidents[0];
    headline = `${latest.name} ${latest.status.replace('_', ' ')} (${formatDate(latest.updated_at || latest.updatedAt)})`;
  } else if (provider === 'Okta' && incidents.length > 0) {
    const latest = incidents[0];
    headline = `${latest.name} ${latest.status.replace('_', ' ')} (${formatDate(latest.updated_at || latest.updatedAt)})`;
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

  // Helper: get indicator for a given day
  function getDayIndicator(day) {
    const dayStart = new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), 0, 0, 0, 0));
    const dayEnd = new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), 23, 59, 59, 999));
    if (provider === 'Cloudflare' && incidents.length > 0) {
      // Collect all incidents open during this day
      const openIncidents = incidents.filter(inc => {
        const started = inc.created_at ? new Date(inc.created_at) : (inc.createdAt ? new Date(inc.createdAt) : null);
        const ended = inc.resolved_at ? new Date(inc.resolved_at) : null;
        if (!started || isNaN(started)) return false;
        // Use UTC for comparison
        const startedUTC = new Date(Date.UTC(started.getUTCFullYear(), started.getUTCMonth(), started.getUTCDate(), started.getUTCHours(), started.getUTCMinutes(), started.getUTCSeconds(), started.getUTCMilliseconds()));
        let endedUTC = null;
        if (ended && !isNaN(ended)) {
          endedUTC = new Date(Date.UTC(ended.getUTCFullYear(), ended.getUTCMonth(), ended.getUTCDate(), ended.getUTCHours(), ended.getUTCMinutes(), ended.getUTCSeconds(), ended.getUTCMilliseconds()));
        }
        if (endedUTC) {
          return startedUTC <= dayEnd && endedUTC >= dayStart;
        } else {
          return startedUTC <= dayEnd;
        }
      });
      if (openIncidents.length > 0) {
        // Show the highest impact for the day
        const impactPriority = { critical: 3, major: 2, minor: 1, none: 0 };
        let maxImpact = 'minor';
        openIncidents.forEach(inc => {
          const impact = (inc.impact || '').toLowerCase();
          if (impactPriority[impact] > impactPriority[maxImpact]) {
            maxImpact = impact;
          }
        });
        let indicator = maxImpact;
        if (!['critical', 'major', 'minor'].includes(indicator)) indicator = 'minor';
        return indicator;
      }
    } else if (provider === 'Zscaler' && updates.length > 0) {
      // Only show indicator if a service interruption/disruption is present for this day
      const disruptionKeywords = [
        'disruption', 'outage', 'service disruption', 'service interruption', 'service issue', 'incident', 'degraded', 'problem', 'error', 'failure', 'downtime'
      ];
      const dayDisruptions = updates.filter(u => {
        // Parse the date robustly and align to midnight
        const updateDate = new Date(u.date);
        updateDate.setHours(0, 0, 0, 0);
        // Compare to the indicator day
        if (updateDate.getTime() !== day.getTime()) return false;
        // Check for disruption in eventType, title, or description
        const text = `${u.eventType || ''} ${u.title || ''} ${u.description || ''}`.toLowerCase();
        return disruptionKeywords.some(k => text.includes(k));
      });
      if (dayDisruptions.length > 0) {
        return 'major'; // Show orange for service interruptions
      }
      return 'none'; // Green if no disruption
    } else if ((provider === 'SendGrid' || provider === 'Okta') && incidents.length > 0) {
      const found = incidents.find(inc => (inc.updated_at || inc.updatedAt || '').slice(0, 10) === dayStr);
      if (found) return (found.impact || 'minor').toLowerCase();
    }
    return 'none';
  }
  // Day labels
  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const last7 = getLast7Days();

  // For Zscaler, filter updates to only last 7 days for modal (show all updates, not just disruptions)
  let filteredUpdates = updates;
  if (provider === 'Zscaler' && updates.length > 0) {
    const minDate = last7[0].getTime();
    filteredUpdates = updates.filter(u => {
      // Parse the date robustly
      const updateDate = new Date(u.date);
      updateDate.setHours(0, 0, 0, 0);
      return updateDate.getTime() >= minDate;
    });
  }

  return (
    <>
      <LivePulseCard
        name={name}
        provider={provider}
        indicator={indicator}
        status={status}
        headline={<div style={headlineStyle}>{headline}</div>}
        companyInfo={companyInfoMap[provider]}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {/* Service history bar now beneath the button */}
          <div style={{ marginTop: 0, width: '100%' }}>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 0, width: '100%' }}>
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
        </div>
      </LivePulseCard>
      {/* Modal and all closing tags */}
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
        {provider === 'Cloudflare' && incidents.length > 0 ? (
          <div>
            {incidents.map((incident, idx) => (
              <div key={idx} style={{ 
                borderBottom: idx < incidents.length - 1 ? '1px solid #f5f5f5' : 'none', 
                padding: '16px 20px',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: incident.status === 'resolved' ? '#4caf50' : '#f57c00',
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
                      {incident.name}
                    </div>
                    <div style={{ 
                      fontSize: 13, 
                      color: '#666', 
                      marginBottom: 6,
                      lineHeight: 1.4
                    }}>
                      Status: {incident.status.replace('_', ' ')}
                    </div>
                    <div style={{ 
                      fontSize: 11, 
                      color: '#999',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 8
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <img src={serviceLogos[provider]} alt="time" style={{ width: 12, height: 12 }} />
                        {formatDate(incident.updated_at || incident.updatedAt)}
                      </span>
                      {incident.shortlink && <span style={{ color: '#1976d2' }}>🔗 View details</span>}
                    </div>
                    {Array.isArray(incident.incident_updates) && incident.incident_updates.length > 0 && (
                      <div style={{ marginTop: 8, paddingLeft: 12, borderLeft: '2px solid #f0f0f0' }}>
                        {incident.incident_updates.slice(0, 2).map((update, uidx) => (
                          <div key={uidx} style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>
                            {htmlToText(update.body).slice(0, 100)}...
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : provider === 'Zscaler' && filteredUpdates.length > 0 ? (
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
                    background: issue.eventType === 'Service Degradation' ? '#f57c00' : '#2196f3',
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
                      {issue.link && <span style={{ color: '#1976d2' }}>🔗 View details</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : provider === 'Okta' && incidents.length > 0 ? (
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {incidents.map((incident, idx) => (
              <div key={idx} style={{ 
                borderBottom: idx < incidents.length - 1 ? '1px solid #f5f5f5' : 'none', 
                padding: '16px 20px',
                transition: 'background-color 0.2s ease',
                cursor: incident.link ? 'pointer' : 'default'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              onClick={() => incident.link && window.open(incident.link, '_blank')}
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
                      {incident.name}
                    </div>
                    <div style={{ 
                      fontSize: 13, 
                      color: '#666', 
                      marginBottom: 6,
                      lineHeight: 1.4
                    }}>
                      {incident.status.replace('_', ' ')}
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
                        {formatDate(incident.updated_at || incident.updatedAt)}
                      </span>
                      {incident.link && <span style={{ color: '#1976d2' }}>🔗 View details</span>}
                    </div>
                    {Array.isArray(incident.incident_updates) && incident.incident_updates.length > 0 && (
                      <div style={{ marginTop: 8, paddingLeft: 12, borderLeft: '2px solid #f0f0f0' }}>
                        {incident.incident_updates.slice(0, 2).map((update, uidx) => (
                          <div key={uidx} style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>
                            {htmlToText(update.body).slice(0, 100)}...
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : provider === 'SendGrid' && incidents.length > 0 ? (
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {incidents.map((incident, idx) => (
              <div key={idx} style={{ 
                borderBottom: idx < incidents.length - 1 ? '1px solid #f5f5f5' : 'none', 
                padding: '16px 20px',
                transition: 'background-color 0.2s ease',
                cursor: incident.shortlink ? 'pointer' : 'default'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              onClick={() => incident.shortlink && window.open(incident.shortlink, '_blank')}
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
                      {incident.name}
                    </div>
                    <div style={{ 
                      fontSize: 13, 
                      color: '#666', 
                      marginBottom: 6,
                      lineHeight: 1.4
                    }}>
                      {incident.status.replace('_', ' ')}
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
                        {formatDate(incident.updated_at || incident.updatedAt)}
                      </span>
                      {incident.shortlink && <span style={{ color: '#1976d2' }}>🔗 View details</span>}
                    </div>
                    {Array.isArray(incident.incident_updates) && incident.incident_updates.length > 0 && (
                      <div style={{ marginTop: 8, paddingLeft: 12, borderLeft: '2px solid #f0f0f0' }}>
                        {incident.incident_updates.slice(0, 2).map((update, uidx) => (
                          <div key={uidx} style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>
                            {htmlToText(update.body).slice(0, 100)}...
                          </div>
                        ))}
                      </div>
                    )}
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
      {/* Bug/Issue Submission Modal (same as other cards) */}
      <Modal open={bugModalOpen} onClose={() => setBugModalOpen(false)} title={`Report Service Impact: ${name || provider}`}>
        <p>Let us know if you're currently impacted by an issue with <strong>{name || provider}</strong>.</p>
        <ReportImpactForm serviceName={name || provider} onClose={() => setBugModalOpen(false)} />
      </Modal>
    </>
  );
}
