import React, { useState } from 'react';
import { serviceLogos } from '../../../services/serviceLogos';

// Helper to extract country from component name (e.g., "API - US" -> "US")
function getCountryFromName(name) {
  const match = name.match(/-\s*([A-Z]{2,})$/);
  return match ? match[1] : 'Other';
}

function groupByCountry(components) {
  return components.reduce((acc, c) => {
    const country = getCountryFromName(c.name);
    if (!acc[country]) acc[country] = [];
    acc[country].push(c);
    return acc;
  }, {});
}

export function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const d = new Date(dateString);
  return isNaN(d.getTime()) ? 'N/A' : d.toLocaleString();
}

export function htmlToText(html) {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

function ServiceStatusCard({ provider, status, indicator, incidents, updates, name }) {
  const [showIncidents, setShowIncidents] = useState(false);
  const [showZscalerIssues, setShowZscalerIssues] = useState(false);
  const indicatorColor = {
    none: '#4caf50', // green
    minor: '#ff9800', // orange
    major: '#f44336', // red
    critical: '#b71c1c', // dark red
    unknown: '#757575',
  }[indicator] || '#757575';

  // Cloudflare: Only show incidents from last 7 days
  const recentIncidents = Array.isArray(incidents) ? incidents : [];

  // Zscaler: Only show issues from last 7 days
  let recentZscalerIssues = [];
  if (provider === 'Zscaler' && Array.isArray(updates)) {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    recentZscalerIssues = updates.filter(u => {
      const date = new Date(u.date);
      return !isNaN(date) && date >= sevenDaysAgo;
    });
  }

  return (
    <div style={{ border: '1px solid #ccc', borderRadius: 8, padding: 16, margin: 16, width: 350, textAlign: 'left' }}>
      {/* Horizontal header: logo, name, status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        {/* Logo: use actual service logo */}
        <div style={{ width: 32, height: 32, borderRadius: 8, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {serviceLogos[provider] ? (
            <img 
              src={serviceLogos[provider]} 
              alt={provider + ' logo'} 
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          ) : (
            <div style={{ background: '#f3f4f6', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700 }}>
              {provider.charAt(0)}
            </div>
          )}
        </div>
        <div style={{ fontSize: '1.1em', color: '#333', fontWeight: 700, flex: 1 }}>
          {name || provider}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: indicatorColor, fontWeight: 700 }}>{status}</span>
          {indicator && (
            <span style={{
              display: 'inline-block',
              marginLeft: 2,
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: indicatorColor,
              verticalAlign: 'middle',
            }} title={indicator}></span>
          )}
        </div>
      </div>
      {provider === 'Cloudflare' && (
        <div style={{ fontSize: '0.95em', color: '#888', marginBottom: 4 }}>
          Showing only incidents updated in the last 7 days
        </div>
      )}
      {provider === 'Zscaler' && (
        <div style={{ fontSize: '0.95em', color: '#888', marginBottom: 4 }}>
          Showing only issues from the last 7 days
        </div>
      )}
      {provider === 'Cloudflare' && recentIncidents.length > 0 && (
        <div>
          <button
            style={{ marginBottom: 8, cursor: 'pointer', background: '#eee', border: 'none', borderRadius: 4, padding: '4px 8px' }}
            onClick={() => setShowIncidents(v => !v)}
          >
            {showIncidents ? 'Hide' : 'Show'} Incidents from Last 7 Days ({recentIncidents.length})
          </button>
          {showIncidents && (
            <ul style={{ margin: '4px 0 0 12px', padding: 0, listStyle: 'disc' }}>
              {recentIncidents.map((incident, idx) => (
                <li key={idx} style={{ textAlign: 'left', marginBottom: 8 }}>
                  <strong>{incident.name}</strong><br />
                  <span style={{ fontSize: '0.9em', color: '#555' }}>{formatDate(incident.updated_at || incident.updatedAt)}</span><br />
                  <span style={{ fontSize: '0.95em', color: '#444' }}>{incident.status.replace('_', ' ')}</span>
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
          )}
        </div>
      )}
      {provider === 'Zscaler' && recentZscalerIssues.length > 0 && (
        <div>
          <button
            style={{ marginBottom: 8, cursor: 'pointer', background: '#eee', border: 'none', borderRadius: 4, padding: '4px 8px' }}
            onClick={() => setShowZscalerIssues(v => !v)}
          >
            {showZscalerIssues ? 'Hide' : 'Show'} Issues from Last 7 Days ({recentZscalerIssues.length})
          </button>
          {showZscalerIssues && (
            <ul style={{ margin: '4px 0 0 12px', padding: 0, listStyle: 'disc' }}>
              {recentZscalerIssues.map((issue, idx) => (
                <li key={idx} style={{ textAlign: 'left', marginBottom: 8 }}>
                  <a href={issue.link} target="_blank" rel="noopener noreferrer"><strong>{issue.title}</strong></a><br />
                  <span style={{ fontSize: '0.9em', color: '#555' }}>{formatDate(issue.date)}</span><br />
                  <span style={{ fontSize: '0.95em', color: '#444' }}>{htmlToText(issue.description)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default ServiceStatusCard;
