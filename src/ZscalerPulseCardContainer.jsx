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

function ReportImpactForm({ serviceName, onClose }) {
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [impactedProvider] = React.useState(serviceName || '');
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    try {
      const res = await fetch('/api/report-issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_name: impactedProvider, // always send the provider as service_name
          impacted_provider: impactedProvider,
          description,
          user_email: email || undefined,
          status: 'open',
          metadata: name ? { name } : undefined
        })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Submission failed');
      }
      setSuccess(true);
      setName('');
      setEmail('');
      setDescription('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (success) return (
    <div style={{ color: '#388e3c', padding: 12, textAlign: 'center' }}>
      Thank you for reporting your issue!
      <br />
      <button onClick={onClose} style={{ marginTop: 16, background: '#eee', color: '#333', border: 'none', borderRadius: 4, padding: '6px 14px', cursor: 'pointer' }}>Close</button>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <input type="hidden" name="service_name" value={impactedProvider} />
      <input type="text" name="impacted_provider" value={impactedProvider} readOnly style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc', background: '#f5f5f5', color: '#888' }} />
      <input type="text" placeholder="Your name (optional)" value={name} onChange={e => setName(e.target.value)} style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc' }} />
      <input type="email" placeholder="Your email (optional)" value={email} onChange={e => setEmail(e.target.value)} style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc' }} />
      <textarea placeholder="Describe your issue..." required value={description} onChange={e => setDescription(e.target.value)} style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc', minHeight: 60 }} />
      {error && <div style={{ color: '#b71c1c', fontSize: '0.98em' }}>{error}</div>}
      <button type="submit" disabled={loading} style={{ background: '#b71c1c', color: '#fff', border: 'none', borderRadius: 4, padding: '8px 18px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}>{loading ? 'Submitting...' : 'Submit'}</button>
      <button type="button" onClick={onClose} style={{ background: '#eee', color: '#333', border: 'none', borderRadius: 4, padding: '6px 14px', cursor: 'pointer' }}>Cancel</button>
    </form>
  );
}

export default function ZscalerPulseCardContainer({ provider = "Zscaler", name, indicator, status, updates = [] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [bugModalOpen, setBugModalOpen] = useState(false);

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
        {/* Add the action buttons below the day indicator for all providers */}
        <div className="card-action-row" style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
          <button
            className="view-7days-btn"
            onClick={() => setModalOpen(true)}
          >
            View last 7 days
          </button>
          <button
            className="bug-btn"
            aria-label="Report an issue with this service"
            onClick={() => setBugModalOpen(true)}
          >
            <span className="bug-icon" role="img" aria-label="report issue">⚠️</span>
            <span className="bug-text">Report an issue</span>
          </button>
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
      <Modal open={bugModalOpen} onClose={() => setBugModalOpen(false)} title={`Report Service Impact: ${name || provider}`}>
        <p>Let us know if you're currently impacted by an issue with <strong>{name || provider}</strong>.</p>
        <ReportImpactForm serviceName={name || provider} onClose={() => setBugModalOpen(false)} />
      </Modal>
    </>
  );
}
