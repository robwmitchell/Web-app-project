# Alert Banner Filtering System

## Overview
The alert banner now implements sophisticated filtering to ensure only relevant, active, and critical issues are displayed to users.

## Filtering Criteria

### 1. Active Issues Only
- Issues must not be resolved, closed, completed, fixed, or restored
- For Cloudflare: checks `resolved_at` field
- For all providers: scans title and description for resolved keywords

### 2. Today's Updates Only
- Issues must have been updated within the current day
- Checks multiple date fields: `updated_at`, `updatedAt`, `date`, `reported_at`
- Ensures alert relevance and recency

### 3. Major Service Issues Only
- Filters out maintenance, scheduled updates, and planned upgrades
- Only includes critical service disruptions:
  - Outages
  - Critical incidents
  - Major service disruptions
  - Degraded performance
  - Service unavailability

### 4. Throttled API Calls
- Alert banner data fetching is throttled to maximum every 2 minutes
- Prevents excessive API calls while maintaining data freshness
- Visual indicator shows when checking for updates

## Implementation Details

### Keywords Filtering
- **Resolved Keywords**: resolved, closed, completed, fixed, restored
- **Maintenance Keywords**: maintenance, scheduled, planned, update, upgrade
- **Major Issue Keywords**: outage, critical, major, incident, disruption, degraded, down, unavailable

### Date Validation
```javascript
const today = new Date();
const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000 - 1);
```

### Status/Impact Validation
- Checks `impact` field for 'critical' or 'major' values
- Validates `status` field for critical service states
- Cross-references multiple data points for accuracy

## User Benefits
1. **Reduced Alert Fatigue**: Only critical issues trigger alerts
2. **Improved Relevance**: Today's updates ensure current information
3. **Better Performance**: Throttled requests reduce server load
4. **Clear Prioritization**: Focus on service-impacting issues only

## Development Mode
Demo issues are configured to simulate the same filtering criteria for consistent testing experience.
