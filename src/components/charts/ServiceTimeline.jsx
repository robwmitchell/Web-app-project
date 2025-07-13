import React from 'react';
import './ServiceTimeline.css';

// Status type mapping for timeline
const STATUS_TYPES = {
  operational: { color: '#10b981', label: 'Operational' },
  minor: { color: '#f59e0b', label: 'Minor Issues' },
  major: { color: '#ef4444', label: 'Major Issues' },
  critical: { color: '#dc2626', label: 'Critical Issues' },
  unknown: { color: '#6b7280', label: 'Unknown' }
};

// Get the last 7 days
function getLast7Days() {
  const days = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    days.push(date);
  }
  return days;
}

// Analyze incidents/updates for a specific day
function analyzeDay(date, incidents = [], updates = [], provider) {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  let dayStatus = 'operational';
  let issueCount = 0;

  // Ensure we have valid arrays
  const validIncidents = Array.isArray(incidents) ? incidents : [];
  const validUpdates = Array.isArray(updates) ? updates : [];

  // Helper function to get date from various possible fields
  function getItemDate(item) {
    if (!item) return null;
    
    // Try different date field names
    const possibleDateFields = [
      'date', 'reported_at', 'created_at', 'createdAt', 
      'updated_at', 'updatedAt', 'startTime', 'timestamp'
    ];
    
    for (const field of possibleDateFields) {
      if (item[field]) {
        const date = new Date(item[field]);
        if (!isNaN(date)) {
          // Debug logging for SendGrid specifically
          if (provider === 'SendGrid') {
            console.log(`[ServiceTimeline] Parsed SendGrid date:`, {
              field,
              rawValue: item[field],
              parsedDate: date,
              isValid: !isNaN(date)
            });
          }
          return date;
        }
      }
    }
    
    return null;
  }

  if (provider === 'Cloudflare') {
    // Check Cloudflare incidents
    const dayIncidents = validIncidents.filter(inc => {
      if (!inc) return false;
      const created = new Date(inc.created_at || inc.createdAt);
      const resolved = inc.resolved_at ? new Date(inc.resolved_at) : null;
      
      if (isNaN(created)) return false;
      
      // Check if incident was active during this day
      if (resolved && !isNaN(resolved)) {
        return created <= dayEnd && resolved >= dayStart;
      } else {
        return created <= dayEnd;
      }
    });

    issueCount = dayIncidents.length;
    
    if (dayIncidents.length > 0) {
      // Determine severity based on impact
      const hasCritical = dayIncidents.some(inc => 
        (inc.impact || '').toLowerCase() === 'critical'
      );
      const hasMajor = dayIncidents.some(inc => 
        (inc.impact || '').toLowerCase() === 'major'
      );
      const hasMinor = dayIncidents.some(inc => 
        (inc.impact || '').toLowerCase() === 'minor'
      );

      if (hasCritical) dayStatus = 'critical';
      else if (hasMajor) dayStatus = 'major';
      else if (hasMinor) dayStatus = 'minor';
      else dayStatus = 'major'; // Default for any unclassified incident
    }
  } else {
    // For other providers using RSS updates or different data formats
    const dayUpdates = validUpdates.filter(update => {
      const updateDate = getItemDate(update);
      if (!updateDate) return false;
      
      // Debug logging for SendGrid specifically
      if (provider === 'SendGrid') {
        const dayDateString = date.toISOString().split('T')[0];
        const updateDateString = updateDate.toISOString().split('T')[0];
        console.log(`[ServiceTimeline] SendGrid update check:`, {
          title: update.title,
          date: update.date,
          updateDate,
          dayDateString,
          updateDateString,
          matches: dayDateString === updateDateString
        });
      }
      
      // Use ISO date string comparison to handle timezone issues reliably
      const dayDateString = date.toISOString().split('T')[0]; // YYYY-MM-DD
      const updateDateString = updateDate.toISOString().split('T')[0]; // YYYY-MM-DD
      
      return dayDateString === updateDateString;
    });

    issueCount = dayUpdates.length;

    if (provider === 'SendGrid') {
      console.log(`[ServiceTimeline] SendGrid day analysis for ${date.toDateString()}:`, {
        totalUpdates: validUpdates.length,
        dayUpdates: dayUpdates.length,
        dayUpdatesDetails: dayUpdates.map(u => ({ title: u.title, date: u.date }))
      });
    }

    if (dayUpdates.length > 0) {
      // Analyze update content for severity
      const hasResolved = dayUpdates.some(update => {
        const text = `${update.title || ''} ${update.description || ''}`.toLowerCase();
        return text.includes('resolved') || text.includes('closed') || text.includes('completed');
      });

      const hasCritical = dayUpdates.some(update => {
        const text = `${update.title || ''} ${update.description || ''}`.toLowerCase();
        return text.includes('critical') || text.includes('outage') || text.includes('down');
      });

      const hasMajor = dayUpdates.some(update => {
        const text = `${update.title || ''} ${update.description || ''}`.toLowerCase();
        return text.includes('major') || text.includes('degraded') || text.includes('disruption');
      });

      const hasMinor = dayUpdates.some(update => {
        const text = `${update.title || ''} ${update.description || ''}`.toLowerCase();
        return text.includes('minor') || text.includes('investigating') || text.includes('monitoring');
      });

      // For providers like Slack, Datadog, AWS - if there's any update, it's likely an issue
      const isIssueProvider = ['Slack', 'Datadog', 'AWS'].includes(provider);
      
      // If all issues are resolved, show as operational
      if (hasResolved && dayUpdates.every(update => {
        const text = `${update.title || ''} ${update.description || ''}`.toLowerCase();
        return text.includes('resolved') || text.includes('closed') || text.includes('completed');
      })) {
        dayStatus = 'operational';
      } else if (hasCritical) {
        dayStatus = 'critical';
      } else if (hasMajor) {
        dayStatus = 'major';
      } else if (hasMinor) {
        dayStatus = 'minor';
      } else if (isIssueProvider) {
        // For Slack, Datadog, AWS - default to major since any update likely indicates an issue
        dayStatus = 'major';
      } else {
        dayStatus = 'minor'; // Default for other providers
      }
    }
  }

  return { status: dayStatus, issueCount };
}

export default function ServiceTimeline({ 
  provider, 
  incidents = [], 
  updates = [], 
  showLabels = true 
}) {
  // Validate provider
  if (!provider) {
    return null;
  }

  const days = getLast7Days();
  const dayAnalysis = days.map(day => ({
    date: day,
    ...analyzeDay(day, incidents, updates, provider)
  }));

  return (
    <div className="service-timeline">
      {showLabels && (
        <div className="timeline-header">
          <span className="timeline-title">
            {provider} {updates.length > 0 && `(${updates.length} updates)`}
          </span>
          <span className="timeline-status">
            <span 
              className="status-dot" 
              style={{ backgroundColor: STATUS_TYPES[dayAnalysis[6]?.status || 'operational'].color }}
            ></span>
            {STATUS_TYPES[dayAnalysis[6]?.status || 'operational'].label}
          </span>
        </div>
      )}
      
      <div className="timeline-bars">
        {dayAnalysis.map((day, index) => (
          <div
            key={index}
            className="timeline-day"
            title={`${day.date.toLocaleDateString()}: ${STATUS_TYPES[day.status].label}${day.issueCount > 0 ? ` (${day.issueCount} issue${day.issueCount > 1 ? 's' : ''})` : ''}`}
          >
            <div
              className="timeline-bar"
              style={{
                backgroundColor: STATUS_TYPES[day.status].color,
                height: day.status === 'operational' ? '100%' : 
                       day.status === 'minor' ? '80%' :
                       day.status === 'major' ? '60%' : '40%'
              }}
            />
            {showLabels && (
              <div className="timeline-day-label">
                {day.date.toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
