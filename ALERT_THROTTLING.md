# Alert Banner Throttling Implementation

## Overview
The alert banner has been updated to implement proper throttling and only show active/unresolved status items from selected service providers.

## Key Features

### 1. API Call Throttling
- **Minimum Interval**: 2 minutes between alert-specific API calls
- **Page Refresh Delay**: 1 second delay after page refresh to allow initial load
- **Separate Intervals**: Live feed data fetching continues normally (for real-time updates), while alert banner specifically throttles its data requests

### 2. Active Issues Only
The alert banner now includes improved logic to detect truly active/unresolved issues:

#### Issue Detection Logic
- **Cloudflare**: Checks `resolved_at` field first, then fallback to text analysis
- **All Providers**: Scans for resolved keywords: `resolved`, `closed`, `completed`, `fixed`, `restored`
- **Status Field**: Additional check for resolution status in dedicated status fields
- **Text Analysis**: Comprehensive analysis of title and description content

#### Filtered Demo Issues
- Demo issues have been reduced to only show critical, active incidents
- Removed resolved/minor demo issues to better simulate production behavior

### 3. User Feedback
- **Loading Indicator**: Small pulsing dot with "Checking for updates..." text appears during API calls
- **Visual Feedback**: Users can see when the system is actively checking for new alerts
- **Throttling Respect**: No excessive polling or API calls that could impact performance

## Technical Implementation

### State Management
```javascript
const [lastAlertFetchTime, setLastAlertFetchTime] = useState(0);
const [alertFetchInProgress, setAlertFetchInProgress] = useState(false);
```

### Throttling Configuration
```javascript
const ALERT_THROTTLE_CONFIG = {
  minIntervalMs: 2 * 60 * 1000, // 2 minutes minimum between API calls
  onPageRefreshDelay: 1000, // 1 second delay after page refresh
};
```

### Core Functions
- `fetchAlertsThrottled()`: Handles throttled API calls specifically for alerts
- `isIssueActive()`: Determines if an issue/incident is actually active/unresolved
- Enhanced `criticalMode` calculation with improved filtering

## Benefits

1. **Performance**: Reduces unnecessary API calls while maintaining data freshness
2. **Accuracy**: Only shows genuine active issues, reducing false alerts
3. **User Experience**: Clear feedback when checking for updates
4. **Resource Efficiency**: Respects API rate limits and reduces server load
5. **Reliability**: Separates alert checking from live feed updates for better reliability

## Usage

The throttling works automatically:
- Initial load: Fetches data after 1 second delay
- Subsequent checks: Every 2 minutes maximum for alert banner
- Live feed: Continues regular 2-minute intervals for real-time data
- Manual refresh: Respects throttling rules to prevent abuse

## Future Enhancements

- Exponential backoff for error conditions
- User-configurable throttling intervals
- Smart throttling based on issue severity
- Background sync with service worker for offline support
