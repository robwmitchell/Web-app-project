import React, { useState } from 'react';
import LivePulseCard from './LivePulseCard';
import Modal from './Modal';
import { formatDate, htmlToText } from './ServiceStatusCard';

export default function LivePulseCardContainer({
  provider,
  name,
  indicator,
  status,
  incidents = [],
  updates = [],
  themeOverride = 'auto', // add default
}) {
  const [modalOpen, setModalOpen] = useState(false);

  // Headline: latest incident/update or fallback
  let headline = 'All systems operational.';
  let timelineEvents = [];
  if (provider === 'Cloudflare' && incidents.length > 0) {
    const latest = incidents[0];
    headline = `${latest.name} – ${latest.status.replace('_', ' ')} (${formatDate(latest.updated_at || latest.updatedAt)})`;
    timelineEvents = incidents.map(inc => ({
      date: formatDate(inc.updated_at || inc.updatedAt),
      indicator: (inc.impact || '').toLowerCase(),
      statusText: inc.status,
      status: inc.name,
    }));
  } else if (provider === 'Zscaler' && updates.length > 0) {
    const latest = updates[0];
    headline = `${latest.title} (${formatDate(latest.date)})`;
    timelineEvents = updates.map(u => ({
      date: formatDate(u.date),
      indicator: /resolved|closed/i.test(u.title + ' ' + u.description) ? 'none' : 'major',
      statusText: u.title,
      status: u.title,
    }));
  } else if (provider === 'SendGrid' && incidents.length > 0) {
    timelineEvents = incidents.map(inc => ({
      date: formatDate(inc.updated_at || inc.updatedAt),
      indicator: (inc.impact || '').toLowerCase(),
      statusText: inc.status,
      status: inc.name,
    }));
  } else if (provider === 'Okta' && incidents.length > 0) {
    timelineEvents = incidents.map(inc => ({
      date: formatDate(inc.updated_at || inc.updatedAt),
      indicator: (inc.impact || '').toLowerCase(),
      statusText: inc.status,
      status: inc.name,
    }));
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

  // Helper: get last 7 days (Sun-Sat)
  function getLast7Days() {
    const days = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      days.push(d);
    }
    return days;
  }
  // Helper: get indicator for a given day
  function getDayIndicator(day) {
    // For each provider, check if any incident/update on that day, else 'none'
    const dayStr = day.toISOString().slice(0, 10);
    if (provider === 'Cloudflare' && incidents.length > 0) {
      const found = incidents.find(inc => (inc.updated_at || inc.updatedAt || '').slice(0, 10) === dayStr);
      if (found) return (found.impact || 'minor').toLowerCase();
    } else if (provider === 'Zscaler' && updates.length > 0) {
      // If any update on this day, show 'minor' (yellow) regardless of resolved/closed
      const dayUpdates = updates.filter(u => {
        // Defensive: support both Date and string for u.date
        const updateDate = u.date instanceof Date ? u.date : new Date(u.date);
        return updateDate.toISOString().slice(0, 10) === dayStr;
      });
      if (dayUpdates.length > 0) {
        return 'minor'; // yellow for any update, even if resolved
      }
    } else if ((provider === 'SendGrid' || provider === 'Okta') && incidents.length > 0) {
      const found = incidents.find(inc => (inc.updated_at || inc.updatedAt || '').slice(0, 10) === dayStr);
      if (found) return (found.impact || 'minor').toLowerCase();
    }
    return 'none';
  }
  // Day labels
  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const last7 = getLast7Days();

  return (
    <>
      <LivePulseCard
        name={name}
        provider={provider}
        indicator={indicator}
        status={status}
        headline={headline}
        onExpand={() => setModalOpen(true)}
        themeOverride={themeOverride}
        companyInfo={companyInfoMap[provider]}
      >
        {/* Service history bar at bottom */}
        <div style={{ marginTop: 18, width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
            {last7.map((d, i) => {
              const isToday = (new Date().toDateString() === d.toDateString());
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
                  {dayLabels[d.getDay()]}
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {last7.map((d, i) => (
              <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                <span className={`status-indicator ${getDayIndicator(d)}`} style={{ margin: '0 auto', display: 'inline-block' }} title={getDayIndicator(d)}></span>
              </div>
            ))}
          </div>
        </div>
      </LivePulseCard>
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
        ) : provider === 'Okta' && incidents.length > 0 ? (
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
          <div>No recent updates.</div>
        )}
      </Modal>
    </>
  );
}
