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
  if (!html) return '';
  
  // Create a temporary element to parse HTML
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  
  // Remove script and style elements completely
  const scripts = tmp.querySelectorAll('script, style');
  scripts.forEach(element => element.remove());
  
  // Replace common HTML elements with readable text equivalents
  const replacements = [
    // Line breaks and paragraphs
    { tag: 'br', replacement: '\n' },
    { tag: 'p', replacement: '\n\n', isBlock: true },
    { tag: 'div', replacement: '\n', isBlock: true },
    
    // Headers
    { tag: 'h1', replacement: '\n\n### ', isBlock: true, suffix: ' ###\n' },
    { tag: 'h2', replacement: '\n\n## ', isBlock: true, suffix: ' ##\n' },
    { tag: 'h3', replacement: '\n\n# ', isBlock: true, suffix: ' #\n' },
    { tag: 'h4', replacement: '\n\n', isBlock: true, suffix: '\n' },
    { tag: 'h5', replacement: '\n\n', isBlock: true, suffix: '\n' },
    { tag: 'h6', replacement: '\n\n', isBlock: true, suffix: '\n' },
    
    // Lists
    { tag: 'ul', replacement: '\n', isBlock: true },
    { tag: 'ol', replacement: '\n', isBlock: true },
    { tag: 'li', replacement: '\n• ', isBlock: true },
    
    // Links
    { tag: 'a', replacement: '', suffix: '' },
    
    // Emphasis
    { tag: 'strong', replacement: '**', suffix: '**' },
    { tag: 'b', replacement: '**', suffix: '**' },
    { tag: 'em', replacement: '*', suffix: '*' },
    { tag: 'i', replacement: '*', suffix: '*' },
    
    // Code
    { tag: 'code', replacement: '`', suffix: '`' },
    { tag: 'pre', replacement: '\n```\n', suffix: '\n```\n', isBlock: true },
    
    // Separators
    { tag: 'hr', replacement: '\n---\n', isBlock: true },
    
    // Tables (basic)
    { tag: 'table', replacement: '\n', isBlock: true },
    { tag: 'tr', replacement: '\n', isBlock: true },
    { tag: 'td', replacement: ' | ', suffix: '' },
    { tag: 'th', replacement: ' | ', suffix: '' },
  ];
  
  // Apply replacements
  replacements.forEach(({ tag, replacement, suffix = '', isBlock = false }) => {
    const elements = tmp.querySelectorAll(tag);
    elements.forEach(element => {
      const content = element.textContent || '';
      const newContent = replacement + content + suffix;
      element.replaceWith(document.createTextNode(newContent));
    });
  });
  
  // Get the cleaned text
  let text = tmp.textContent || tmp.innerText || '';
  
  // Clean up extra whitespace and normalize line breaks
  text = text
    .replace(/\r\n/g, '\n')           // Normalize line endings
    .replace(/\r/g, '\n')             // Convert remaining \r to \n
    .replace(/\n{3,}/g, '\n\n')       // Replace multiple newlines with double
    .replace(/[ \t]+/g, ' ')          // Replace multiple spaces/tabs with single space
    .replace(/[ \t]*\n[ \t]*/g, '\n') // Remove spaces around newlines
    .trim();                          // Remove leading/trailing whitespace
  
  return text;
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

  // Zscaler: Only show issues from last 7 days AND have "Recent incident" category
  let recentZscalerIssues = [];
  if (provider === 'Zscaler' && Array.isArray(updates)) {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    recentZscalerIssues = updates.filter(u => {
      // Check date filter
      const date = new Date(u.date);
      const isWithinDateRange = !isNaN(date) && date >= sevenDaysAgo;
      
      // Check category filter - only include items with "Recent incident" category
      const hasRecentIncidentCategory = u.categories && 
        u.categories.some(category => 
          category && 
          category.toLowerCase().includes('recent incident')
        );
      
      return isWithinDateRange && hasRecentIncidentCategory;
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
          Showing only recent incidents from the last 7 days
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
            {showZscalerIssues ? 'Hide' : 'Show'} Recent Incidents from Last 7 Days ({recentZscalerIssues.length})
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
