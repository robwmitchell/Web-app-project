import React, { useState } from 'react';
import LivePulseCard from './LivePulseCard';
import Modal from './Modal';
import { formatDate, htmlToText } from './ServiceStatusCard';
import { getUTCMidnight } from './utils/dateHelpers';

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

  // Helper: get the date string to use for an update (startTime > date)
  function getUpdateDate(update) {
    if (update.startTime) return getUTCMidnight(update.startTime);
    if (update.date) return getUTCMidnight(update.date);
    return null;
  }

  function getDayIndicator(day) {
    const disruptionKeywords = [
      'disruption', 'outage', 'service disruption', 'service interruption', 'service issue', 'incident', 'degraded', 'problem', 'error', 'failure', 'downtime'
    ];
    // Only show indicator if a disruption is present for this day
    const dayDisruptions = updates.filter(u => {
      const updateDate = getUpdateDate(u);
      if (!updateDate) return false;
      // Compare UTC midnight
      if (updateDate.getTime() !== day.getTime()) return false;
      // Check for disruption in eventType, title, or description
      const text = `${u.eventType || ''} ${u.title || ''} ${u.description || ''}`.toLowerCase();
      return disruptionKeywords.some(k => text.includes(k));
    });
    if (dayDisruptions.length > 0) {
      return 'major'; // Show orange for service interruptions
    }
    return 'none'; // Green if no disruption
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

  // Count issues for today for Zscaler
  const disruptionKeywords = [
    'disruption', 'outage', 'service disruption', 'service interruption', 'service issue', 'incident', 'degraded', 'problem', 'error', 'failure', 'downtime'
  ];
  const todayIssueCount = updates.filter(u => {
    const updateDate = getUpdateDate(u);
    if (!updateDate) return false;
    if (updateDate.toISOString().slice(0, 10) !== todayStr) return false;
    const text = `${u.eventType || ''} ${u.title || ''} ${u.description || ''}`.toLowerCase();
    return disruptionKeywords.some(k => text.includes(k));
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
      </LivePulseCard>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={`${name || provider} Changelog`}>
        {provider === 'Zscaler' && filteredUpdates.length > 0 ? (
          <ul style={{ paddingLeft: 0, listStyle: 'none' }}>
            {filteredUpdates.map((issue, idx) => (
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
        ) : provider === 'SendGrid' && updates.length > 0 ? (
          <ul style={{ paddingLeft: 0, listStyle: 'none' }}>
            {updates.map((issue, idx) => (
              <li key={idx} style={{ marginBottom: 18 }}>
                <a href={issue.link} target="_blank" rel="noopener noreferrer"><strong>{issue.title}</strong></a><br />
                <span style={{ color: '#888' }}>{formatDate(issue.date)}</span><br />
                <span style={{ color: '#444' }}>{htmlToText(issue.description)}</span>
              </li>
            ))}
          </ul>
        ) : provider === 'Okta' && updates.length > 0 ? (
          <ul style={{ paddingLeft: 0, listStyle: 'none' }}>
            {updates.map((issue, idx) => (
              <li key={idx} style={{ marginBottom: 18 }}>
                <a href={issue.link} target="_blank" rel="noopener noreferrer"><strong>{issue.title}</strong></a><br />
                <span style={{ color: '#888' }}>{formatDate(issue.date)}</span><br />
                <span style={{ color: '#444' }}>{htmlToText(issue.description)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div style={{ color: '#888', padding: 24, textAlign: 'center' }}>No recent updates.</div>
        )}
      </Modal>
    </>
  );
}
