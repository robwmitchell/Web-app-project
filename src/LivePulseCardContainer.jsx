import React, { useState } from 'react';
import LivePulseCard from './LivePulseCard';
import Modal from './Modal';
import ReportImpactForm from './ReportImpactForm';
import { formatDate, htmlToText } from './ServiceStatusCard';
import { getLast7Days } from './utils/dateHelpers';

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
          {/* Action buttons just below the content */}
          <div className="card-action-row" style={{ display: 'flex', flexDirection: 'row', gap: 10, marginTop: 18, justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
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
              style={{ marginLeft: 'auto' }}
            >
              View last 7 days
            </button>
          </div>
        </div>
      </LivePulseCard>
      {/* Modal and all closing tags */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={`${name || provider} Changelog`}>
        {provider === 'Cloudflare' && incidents.length > 0 ? (
          <ul style={{ paddingLeft: 0, listStyle: 'none' }}>
            {incidents.map((incident, idx) => (
              <li key={idx} style={{ marginBottom: 18 }}>
                <strong>{incident.name}</strong> <span style={{ color: '#888' }}>{formatDate(incident.updated_at || incident.updatedAt)}</span><br />
                <span style={{ color: '#444' }}>{incident.status.replace('_', ' ')}</span>
                {incident.shortlink && (
                  <div><a href={incident.shortlink} target="_blank" rel="noopener noreferrer">More details</a></div>
                )}
                {Array.isArray(incident.incident_updates) && incident.incident_updates.length > 0 && (
                  <ul style={{ margin: '4px 0 0 12px', padding: 0, listStyle: 'circle' }}>
                    {incident.incident_updates.map((update, uidx) => (
                      <li key={uidx} style={{ fontSize: '0.95em', color: '#555', marginBottom: 4 }}>
                        {htmlToText(update.body)}<br />
                        <span style={{ fontSize: '0.85em' }}>{formatDate(update.updated_at || update.updatedAt)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        ) : provider === 'Zscaler' && updates.length > 0 ? (
          <ul style={{ paddingLeft: 0, listStyle: 'none' }}>
            {updates.map((issue, idx) => (
              <li key={idx} style={{ marginBottom: 18 }}>
                <a href={issue.link} target="_blank" rel="noopener noreferrer"><strong>{issue.title}</strong></a><br />
                <span style={{ color: '#888' }}>{formatDate(issue.date)}</span><br />
                <span style={{ color: '#444' }}>{htmlToText(issue.description)}</span>
                {issue.eventType && (
                  <div style={{ fontSize: '0.95em', color: '#555', marginTop: 4 }}>
                    <strong>Event Type:</strong> {issue.eventType}
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : provider === 'Okta' && incidents.length > 0 ? (
          <ul style={{ paddingLeft: 0, listStyle: 'none' }}>
            {incidents.map((incident, idx) => (
              <li key={idx} style={{ marginBottom: 18 }}>
                <strong>{incident.name}</strong> <span style={{ color: '#888' }}>{formatDate(incident.updated_at || incident.updatedAt)}</span><br />
                <span style={{ color: '#444' }}>{incident.status.replace('_', ' ')}</span>
                {incident.link && (
                  <div><a href={incident.link} target="_blank" rel="noopener noreferrer">More details</a></div>
                )}
                {Array.isArray(incident.incident_updates) && incident.incident_updates.length > 0 && (
                  <ul style={{ margin: '4px 0 0 12px', padding: 0, listStyle: 'circle' }}>
                    {incident.incident_updates.map((update, uidx) => (
                      <li key={uidx} style={{ fontSize: '0.95em', color: '#555', marginBottom: 4 }}>
                        {htmlToText(update.body)}<br />
                        <span style={{ fontSize: '0.85em' }}>{formatDate(update.updated_at || update.updatedAt)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        ) : provider === 'SendGrid' && incidents.length > 0 ? (
          <ul style={{ paddingLeft: 0, listStyle: 'none' }}>
            {incidents.map((incident, idx) => (
              <li key={idx} style={{ marginBottom: 18 }}>
                <strong>{incident.name}</strong> <span style={{ color: '#888' }}>{formatDate(incident.updated_at || incident.updatedAt)}</span><br />
                <span style={{ color: '#444' }}>{incident.status.replace('_', ' ')}</span>
                {incident.shortlink && (
                  <div><a href={incident.shortlink} target="_blank" rel="noopener noreferrer">More details</a></div>
                )}
                {Array.isArray(incident.incident_updates) && incident.incident_updates.length > 0 && (
                  <ul style={{ margin: '4px 0 0 12px', padding: 0, listStyle: 'circle' }}>
                    {incident.incident_updates.map((update, uidx) => (
                      <li key={uidx} style={{ fontSize: '0.95em', color: '#555', marginBottom: 4 }}>
                        {htmlToText(update.body)}<br />
                        <span style={{ fontSize: '0.85em' }}>{formatDate(update.updated_at || update.updatedAt)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div style={{ color: '#888', padding: 16, textAlign: 'center' }}>No recent updates.</div>
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
