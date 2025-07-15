import React, { useState, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './WorldMap.css';

// Fix for default markers in Leaflet with React
import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to handle map bounds changes and zoom controls
function MapBoundsHandler({ issues }) {
  const map = useMap();
  
  useEffect(() => {
    if (issues.length > 0) {
      const group = new L.featureGroup(
        issues.map(issue => L.circleMarker([issue.lat, issue.lng]))
      );
      map.fitBounds(group.getBounds().pad(0.1));
    }
  }, [issues, map]);
  
  // Add zoom control event listeners
  useEffect(() => {
    const handleZoomIn = () => map.zoomIn();
    const handleZoomOut = () => map.zoomOut();
    
    const zoomInBtn = document.querySelector('.zoom-in');
    const zoomOutBtn = document.querySelector('.zoom-out');
    
    if (zoomInBtn && zoomOutBtn) {
      zoomInBtn.addEventListener('click', handleZoomIn);
      zoomOutBtn.addEventListener('click', handleZoomOut);
      
      return () => {
        zoomInBtn.removeEventListener('click', handleZoomIn);
        zoomOutBtn.removeEventListener('click', handleZoomOut);
      };
    }
  }, [map]);
  
  return null;
}

// Group issues by location to handle overlapping markers - moved outside component
const groupIssuesByLocation = (issues) => {
  const locationGroups = {};
  const PROXIMITY_THRESHOLD = 0.5; // degrees (roughly 50km)
  
  issues.forEach(issue => {
    const key = `${Math.round(issue.lat / PROXIMITY_THRESHOLD) * PROXIMITY_THRESHOLD}_${Math.round(issue.lng / PROXIMITY_THRESHOLD) * PROXIMITY_THRESHOLD}`;
    
    if (!locationGroups[key]) {
      locationGroups[key] = {
        lat: issue.lat,
        lng: issue.lng,
        issues: [],
        maxSeverity: 'minor'
      };
    }
    
    locationGroups[key].issues.push(issue);
    
    // Update max severity for the group
    const severityOrder = { 'critical': 3, 'major': 2, 'minor': 1 };
    if (severityOrder[issue.severity] > severityOrder[locationGroups[key].maxSeverity]) {
      locationGroups[key].maxSeverity = issue.severity;
    }
  });
  
  return Object.values(locationGroups);
};

// Helper functions for cluster visualization
const getSeverityColor = (severity) => {
  switch (severity) {
    case 'critical': return '#dc2626';
    case 'major': return '#ea580c';
    case 'minor': return '#d97706';
    default: return '#6b7280';
  }
};

const getSeverityRadius = (severity) => {
  switch (severity) {
    case 'critical': return 15;
    case 'major': return 12;
    case 'minor': return 9;
    default: return 6;
  }
};

const getClusterRadius = (group) => {
  const baseRadius = getSeverityRadius(group.maxSeverity);
  const countMultiplier = Math.min(1 + (group.issues.length - 1) * 0.3, 2.5);
  return baseRadius * countMultiplier;
};

const getClusterColor = (group) => {
  const baseColor = getSeverityColor(group.maxSeverity);
  return baseColor;
};

const getServiceColor = (service) => {
  const colors = {
    'Cloudflare': '#f48120',
    'AWS': '#ff9900', 
    'Zscaler': '#00bfff',
    'Okta': '#007dc1',
    'SendGrid': '#1a82e2',
    'Slack': '#4a154b',
    'Datadog': '#632ca6'
  };
  return colors[service] || '#6b7280';
};

// Main LeafletWorldMap component
export default function LeafletWorldMap({ 
  cloudflareIncidents = [], 
  zscalerUpdates = [], 
  oktaUpdates = [], 
  sendgridUpdates = [], 
  slackUpdates = [], 
  datadogUpdates = [], 
  awsUpdates = [],
  selectedServices = [],
  showHistoric = false
}) {
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null); // New state for issue groups

// Utility functions for cleaning and formatting issue data
const cleanHtmlContent = (htmlString) => {
  if (!htmlString) return '';
  
  // Create a temporary div to parse HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlString;
  
  // Get text content and clean up
  let text = tempDiv.textContent || tempDiv.innerText || '';
  
  // Additional cleanup
  text = text
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/\n+/g, ' ') // Replace newlines with spaces
    .trim(); // Remove leading/trailing whitespace
  
  return text;
};

const formatDescription = (description, maxLength = 200) => {
  if (!description) return '';
  
  const cleaned = cleanHtmlContent(description);
  if (cleaned.length <= maxLength) return cleaned;
  
  // Find the last complete sentence within the limit
  const truncated = cleaned.substring(0, maxLength);
  const lastSentenceEnd = Math.max(
    truncated.lastIndexOf('.'),
    truncated.lastIndexOf('!'),
    truncated.lastIndexOf('?')
  );
  
  if (lastSentenceEnd > maxLength * 0.7) {
    return truncated.substring(0, lastSentenceEnd + 1);
  }
  
  // If no good sentence break, find last word
  const lastSpace = truncated.lastIndexOf(' ');
  return lastSpace > 0 ? truncated.substring(0, lastSpace) + '...' : truncated + '...';
};

const formatTitle = (title) => {
  if (!title) return 'Service Issue';
  
  const cleaned = cleanHtmlContent(title);
  // Capitalize first letter if needed
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
};

const formatTitleForTooltip = (title, maxLength = 80) => {
  if (!title) return 'Service Issue';
  
  const cleaned = cleanHtmlContent(title);
  const capitalized = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  
  if (capitalized.length <= maxLength) return capitalized;
  
  // Find the last complete word within the limit
  const truncated = capitalized.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  return lastSpace > maxLength * 0.6 
    ? truncated.substring(0, lastSpace) + '...' 
    : truncated + '...';
};

const formatTime = (timeString) => {
  if (!timeString) return 'Unknown time';
  
  try {
    const date = new Date(timeString);
    if (isNaN(date)) return 'Invalid date';
    
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 60) {
      return diffMins <= 1 ? 'Just now' : `${diffMins} mins ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  } catch (e) {
    return 'Invalid date';
  }
};

// Known service provider data center locations
const serviceLocations = {
  'Cloudflare': [
    { region: 'us-east-1', lat: 39.0458, lng: -76.6413, keywords: ['us-east', 'virginia', 'washington dc', 'ashburn', 'iad'] },
    { region: 'us-west-1', lat: 37.7749, lng: -122.4194, keywords: ['us-west', 'california', 'san francisco', 'sfo'] },
    { region: 'us-west-2', lat: 45.5152, lng: -122.6784, keywords: ['us-west-2', 'oregon', 'portland', 'pdx'] },
    { region: 'eu-west-1', lat: 53.3498, lng: -6.2603, keywords: ['eu-west', 'ireland', 'dublin', 'dub'] },
    { region: 'eu-central-1', lat: 50.1109, lng: 8.6821, keywords: ['eu-central', 'germany', 'frankfurt', 'fra'] },
    { region: 'ap-southeast-1', lat: 1.3521, lng: 103.8198, keywords: ['ap-southeast', 'singapore', 'sin'] },
    { region: 'ap-northeast-1', lat: 35.6762, lng: 139.6503, keywords: ['ap-northeast', 'japan', 'tokyo', 'nrt'] },
    { region: 'ap-southeast-2', lat: -33.8688, lng: 151.2093, keywords: ['ap-southeast-2', 'australia', 'sydney', 'syd'] },
    { region: 'eu-west-2', lat: 51.5074, lng: -0.1278, keywords: ['eu-west-2', 'uk', 'london', 'lhr'] },
    { region: 'sa-east-1', lat: -23.5505, lng: -46.6333, keywords: ['sa-east', 'brazil', 'sao paulo', 'gru'] }
  ],
  'AWS': [
    { region: 'us-east-1', lat: 39.0458, lng: -76.6413, keywords: ['us-east-1', 'n. virginia', 'virginia', 'iad'] },
    { region: 'us-west-1', lat: 37.7749, lng: -122.4194, keywords: ['us-west-1', 'n. california', 'california', 'sfo'] },
    { region: 'us-west-2', lat: 45.5152, lng: -122.6784, keywords: ['us-west-2', 'oregon', 'pdx'] },
    { region: 'eu-west-1', lat: 53.3498, lng: -6.2603, keywords: ['eu-west-1', 'ireland', 'dublin'] },
    { region: 'eu-central-1', lat: 50.1109, lng: 8.6821, keywords: ['eu-central-1', 'frankfurt', 'germany'] },
    { region: 'ap-southeast-1', lat: 1.3521, lng: 103.8198, keywords: ['ap-southeast-1', 'singapore'] },
    { region: 'ap-northeast-1', lat: 35.6762, lng: 139.6503, keywords: ['ap-northeast-1', 'tokyo', 'japan'] },
    { region: 'ap-southeast-2', lat: -33.8688, lng: 151.2093, keywords: ['ap-southeast-2', 'sydney', 'australia'] },
    { region: 'eu-west-2', lat: 51.5074, lng: -0.1278, keywords: ['eu-west-2', 'london', 'uk'] },
    { region: 'sa-east-1', lat: -23.5505, lng: -46.6333, keywords: ['sa-east-1', 'sao paulo', 'brazil'] },
    { region: 'ca-central-1', lat: 43.6532, lng: -79.3832, keywords: ['ca-central-1', 'canada', 'toronto'] }
  ],
  'Okta': [
    { region: 'us-production', lat: 37.7749, lng: -122.4194, keywords: ['us', 'united states', 'america', 'production'] },
    { region: 'eu-production', lat: 52.3676, lng: 4.9041, keywords: ['eu', 'europe', 'amsterdam', 'production'] },
    { region: 'preview', lat: 47.6062, lng: -122.3321, keywords: ['preview', 'seattle', 'staging'] }
  ],
  'SendGrid': [
    { region: 'us-west', lat: 37.7749, lng: -122.4194, keywords: ['us-west', 'west coast'] },
    { region: 'us-east', lat: 40.7128, lng: -74.0060, keywords: ['us-east', 'east coast'] },
    { region: 'eu', lat: 53.3498, lng: -6.2603, keywords: ['eu', 'europe', 'ireland'] },
    { region: 'ap', lat: 1.3521, lng: 103.8198, keywords: ['ap', 'asia pacific', 'singapore'] }
  ],
  'Slack': [
    { region: 'us', lat: 37.7749, lng: -122.4194, keywords: ['us', 'united states'] },
    { region: 'eu', lat: 53.3498, lng: -6.2603, keywords: ['eu', 'europe'] },
    { region: 'au', lat: -33.8688, lng: 151.2093, keywords: ['au', 'australia'] },
    { region: 'jp', lat: 35.6762, lng: 139.6503, keywords: ['jp', 'japan'] }
  ],
  'Datadog': [
    { region: 'us1', lat: 40.7128, lng: -74.0060, keywords: ['us1', 'us east'] },
    { region: 'us3', lat: 37.7749, lng: -122.4194, keywords: ['us3', 'us west'] },
    { region: 'eu', lat: 53.3498, lng: -6.2603, keywords: ['eu', 'europe', 'ireland'] },
    { region: 'eu1', lat: 52.5200, lng: 13.4050, keywords: ['eu1', 'germany'] },
    { region: 'ap1', lat: 35.6762, lng: 139.6503, keywords: ['ap1', 'japan'] }
  ],
  'Zscaler': [
    { region: 'americas', lat: 37.7749, lng: -122.4194, keywords: ['americas', 'us', 'america'] },
    { region: 'emea', lat: 51.5074, lng: -0.1278, keywords: ['emea', 'europe', 'middle east', 'africa'] },
    { region: 'apac', lat: 35.6762, lng: 139.6503, keywords: ['apac', 'asia pacific'] }
  ]
};

// Process issues and map them to geographic coordinates
const processedIssues = useMemo(() => {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const issues = [];

  // Helper to check if issue is relevant
  const isRelevant = (issue, date) => {
    try {
      const issueDate = new Date(date);
      if (isNaN(issueDate)) return false;
      
      if (showHistoric) {
        return issueDate >= sevenDaysAgo;
      } else {
        const text = `${issue.title || issue.name || ''} ${issue.description || ''}`.toLowerCase();
        const resolvedKeywords = ['resolved', 'closed', 'completed', 'fixed', 'restored', 'resolved at'];
        return !resolvedKeywords.some(keyword => text.includes(keyword));
      }
    } catch (e) {
      return false;
    }
  };

  // Helper to get severity
  const getSeverity = (issue) => {
    const text = `${issue.title || issue.name || ''} ${issue.description || ''}`.toLowerCase();
    if (text.match(/\b(critical|emergency|outage|down|offline|complete failure|total)\b/)) return 'critical';
    if (text.match(/\b(major|significant|degraded|disruption|partial|slow|performance)\b/)) return 'major';
    return 'minor';
  };

  // Enhanced geographical location database
  const geographicalDatabase = {
    // Major cities and their coordinates
    cities: {
      'new york': { lat: 40.7128, lng: -74.0060, region: 'New York, USA' },
      'nyc': { lat: 40.7128, lng: -74.0060, region: 'New York, USA' },
      'manhattan': { lat: 40.7831, lng: -73.9712, region: 'Manhattan, NY' },
      'san francisco': { lat: 37.7749, lng: -122.4194, region: 'San Francisco, USA' },
      'los angeles': { lat: 34.0522, lng: -118.2437, region: 'Los Angeles, USA' },
      'chicago': { lat: 41.8781, lng: -87.6298, region: 'Chicago, USA' },
      'london': { lat: 51.5074, lng: -0.1278, region: 'London, UK' },
      'paris': { lat: 48.8566, lng: 2.3522, region: 'Paris, France' },
      'tokyo': { lat: 35.6762, lng: 139.6503, region: 'Tokyo, Japan' },
      'sydney': { lat: -33.8688, lng: 151.2093, region: 'Sydney, Australia' },
      'singapore': { lat: 1.3521, lng: 103.8198, region: 'Singapore' },
      'mumbai': { lat: 19.0760, lng: 72.8777, region: 'Mumbai, India' },
      'bangalore': { lat: 12.9716, lng: 77.5946, region: 'Bangalore, India' },
      'sao paulo': { lat: -23.5505, lng: -46.6333, region: 'São Paulo, Brazil' },
      'toronto': { lat: 43.6532, lng: -79.3832, region: 'Toronto, Canada' },
      'amsterdam': { lat: 52.3676, lng: 4.9041, region: 'Amsterdam, Netherlands' },
      'frankfurt': { lat: 50.1109, lng: 8.6821, region: 'Frankfurt, Germany' },
      'dublin': { lat: 53.3498, lng: -6.2603, region: 'Dublin, Ireland' },
      'stockholm': { lat: 59.3293, lng: 18.0686, region: 'Stockholm, Sweden' },
      'seoul': { lat: 37.5665, lng: 126.9780, region: 'Seoul, South Korea' },
      'hong kong': { lat: 22.3193, lng: 114.1694, region: 'Hong Kong' },
      'cape town': { lat: -33.9249, lng: 18.4241, region: 'Cape Town, South Africa' },
      'cairo': { lat: 30.0444, lng: 31.2357, region: 'Cairo, Egypt' },
      'istanbul': { lat: 41.0082, lng: 28.9784, region: 'Istanbul, Turkey' },
      'moscow': { lat: 55.7558, lng: 37.6176, region: 'Moscow, Russia' },
      'beijing': { lat: 39.9042, lng: 116.4074, region: 'Beijing, China' },
      'shanghai': { lat: 31.2304, lng: 121.4737, region: 'Shanghai, China' },
      'mexico city': { lat: 19.4326, lng: -99.1332, region: 'Mexico City, Mexico' },
      'buenos aires': { lat: -34.6118, lng: -58.3960, region: 'Buenos Aires, Argentina' },
      'lima': { lat: -12.0464, lng: -77.0428, region: 'Lima, Peru' },
      'lagos': { lat: 6.5244, lng: 3.3792, region: 'Lagos, Nigeria' },
      'nairobi': { lat: -1.2921, lng: 36.8219, region: 'Nairobi, Kenya' },
      // Additional major cities
      'boston': { lat: 42.3601, lng: -71.0589, region: 'Boston, USA' },
      'atlanta': { lat: 33.7490, lng: -84.3880, region: 'Atlanta, USA' },
      'miami': { lat: 25.7617, lng: -80.1918, region: 'Miami, USA' },
      'seattle': { lat: 47.6062, lng: -122.3321, region: 'Seattle, USA' },
      'dallas': { lat: 32.7767, lng: -96.7970, region: 'Dallas, USA' },
      'denver': { lat: 39.7392, lng: -104.9903, region: 'Denver, USA' },
      'phoenix': { lat: 33.4484, lng: -112.0740, region: 'Phoenix, USA' },
      'las vegas': { lat: 36.1699, lng: -115.1398, region: 'Las Vegas, USA' },
      'montreal': { lat: 45.5017, lng: -73.5673, region: 'Montreal, Canada' },
      'vancouver': { lat: 49.2827, lng: -123.1207, region: 'Vancouver, Canada' },
      'berlin': { lat: 52.5200, lng: 13.4050, region: 'Berlin, Germany' },
      'zurich': { lat: 47.3769, lng: 8.5417, region: 'Zurich, Switzerland' },
      'vienna': { lat: 48.2082, lng: 16.3738, region: 'Vienna, Austria' },
      'oslo': { lat: 59.9139, lng: 10.7522, region: 'Oslo, Norway' },
      'copenhagen': { lat: 55.6761, lng: 12.5683, region: 'Copenhagen, Denmark' },
      'helsinki': { lat: 60.1699, lng: 24.9384, region: 'Helsinki, Finland' },
      'warsaw': { lat: 52.2297, lng: 21.0122, region: 'Warsaw, Poland' },
      'prague': { lat: 50.0755, lng: 14.4378, region: 'Prague, Czech Republic' },
      'budapest': { lat: 47.4979, lng: 19.0402, region: 'Budapest, Hungary' },
      'delhi': { lat: 28.7041, lng: 77.1025, region: 'Delhi, India' },
      'hyderabad': { lat: 17.3850, lng: 78.4867, region: 'Hyderabad, India' },
      'pune': { lat: 18.5204, lng: 73.8567, region: 'Pune, India' },
      'chennai': { lat: 13.0827, lng: 80.2707, region: 'Chennai, India' },
      'kolkata': { lat: 22.5726, lng: 88.3639, region: 'Kolkata, India' },
      'manila': { lat: 14.5995, lng: 120.9842, region: 'Manila, Philippines' },
      'jakarta': { lat: -6.2088, lng: 106.8456, region: 'Jakarta, Indonesia' },
      'kuala lumpur': { lat: 3.1390, lng: 101.6869, region: 'Kuala Lumpur, Malaysia' },
      'bangkok': { lat: 13.7563, lng: 100.5018, region: 'Bangkok, Thailand' },
      'ho chi minh': { lat: 10.8231, lng: 106.6297, region: 'Ho Chi Minh City, Vietnam' },
      'taipei': { lat: 25.0330, lng: 121.5654, region: 'Taipei, Taiwan' }
    },
    
    // Countries and regions
    regions: {
      'united states': { lat: 39.8283, lng: -98.5795, region: 'United States' },
      'usa': { lat: 39.8283, lng: -98.5795, region: 'United States' },
      'canada': { lat: 56.1304, lng: -106.3468, region: 'Canada' },
      'united kingdom': { lat: 55.3781, lng: -3.4360, region: 'United Kingdom' },
      'uk': { lat: 55.3781, lng: -3.4360, region: 'United Kingdom' },
      'germany': { lat: 51.1657, lng: 10.4515, region: 'Germany' },
      'france': { lat: 46.2276, lng: 2.2137, region: 'France' },
      'italy': { lat: 41.8719, lng: 12.5674, region: 'Italy' },
      'spain': { lat: 40.4637, lng: -3.7492, region: 'Spain' },
      'netherlands': { lat: 52.1326, lng: 5.2913, region: 'Netherlands' },
      'sweden': { lat: 60.1282, lng: 18.6435, region: 'Sweden' },
      'norway': { lat: 60.4720, lng: 8.4689, region: 'Norway' },
      'japan': { lat: 36.2048, lng: 138.2529, region: 'Japan' },
      'south korea': { lat: 35.9078, lng: 127.7669, region: 'South Korea' },
      'china': { lat: 35.8617, lng: 104.1954, region: 'China' },
      'india': { lat: 20.5937, lng: 78.9629, region: 'India' },
      'australia': { lat: -25.2744, lng: 133.7751, region: 'Australia' },
      'brazil': { lat: -14.2350, lng: -51.9253, region: 'Brazil' },
      'south africa': { lat: -30.5595, lng: 22.9375, region: 'South Africa' },
      'russia': { lat: 61.5240, lng: 105.3188, region: 'Russia' },
      'mexico': { lat: 23.6345, lng: -102.5528, region: 'Mexico' },
      'argentina': { lat: -38.4161, lng: -63.6167, region: 'Argentina' },
      'chile': { lat: -35.6751, lng: -71.5430, region: 'Chile' },
      'peru': { lat: -9.1900, lng: -75.0152, region: 'Peru' },
      'colombia': { lat: 4.5709, lng: -74.2973, region: 'Colombia' },
      'turkey': { lat: 38.9637, lng: 35.2433, region: 'Turkey' },
      'egypt': { lat: 26.8206, lng: 30.8025, region: 'Egypt' },
      'nigeria': { lat: 9.0820, lng: 8.6753, region: 'Nigeria' },
      'kenya': { lat: -0.0236, lng: 37.9062, region: 'Kenya' },
      'ethiopia': { lat: 9.1450, lng: 40.4897, region: 'Ethiopia' }
    },
    
    // US States
    usStates: {
      'california': { lat: 36.7783, lng: -119.4179, region: 'California, USA' },
      'texas': { lat: 31.9686, lng: -99.9018, region: 'Texas, USA' },
      'florida': { lat: 27.7663, lng: -82.6404, region: 'Florida, USA' },
      'new york state': { lat: 42.1657, lng: -74.9481, region: 'New York State, USA' },
      'illinois': { lat: 40.3363, lng: -89.0022, region: 'Illinois, USA' },
      'pennsylvania': { lat: 41.2033, lng: -77.1945, region: 'Pennsylvania, USA' },
      'ohio': { lat: 40.3888, lng: -82.7649, region: 'Ohio, USA' },
      'georgia': { lat: 33.0406, lng: -83.6431, region: 'Georgia, USA' },
      'north carolina': { lat: 35.5397, lng: -79.8431, region: 'North Carolina, USA' },
      'michigan': { lat: 43.3266, lng: -84.5361, region: 'Michigan, USA' },
      'virginia': { lat: 37.7693, lng: -78.2057, region: 'Virginia, USA' },
      'washington': { lat: 47.0379, lng: -121.1187, region: 'Washington, USA' },
      'oregon': { lat: 44.5672, lng: -122.1269, region: 'Oregon, USA' },
      'colorado': { lat: 39.0598, lng: -105.3111, region: 'Colorado, USA' },
      'arizona': { lat: 33.7298, lng: -111.4312, region: 'Arizona, USA' },
      'nevada': { lat: 38.3135, lng: -117.0554, region: 'Nevada, USA' },
      'utah': { lat: 40.1500, lng: -111.8947, region: 'Utah, USA' }
    },
    
    // Cloud regions and data centers
    cloudRegions: {
      'us-east-1': { lat: 39.0458, lng: -76.6413, region: 'US East (N. Virginia)' },
      'us-east-2': { lat: 39.9612, lng: -82.9988, region: 'US East (Ohio)' },
      'us-west-1': { lat: 37.7749, lng: -122.4194, region: 'US West (N. California)' },
      'us-west-2': { lat: 45.5152, lng: -122.6784, region: 'US West (Oregon)' },
      'eu-west-1': { lat: 53.3498, lng: -6.2603, region: 'Europe (Ireland)' },
      'eu-west-2': { lat: 51.5074, lng: -0.1278, region: 'Europe (London)' },
      'eu-west-3': { lat: 48.8566, lng: 2.3522, region: 'Europe (Paris)' },
      'eu-central-1': { lat: 50.1109, lng: 8.6821, region: 'Europe (Frankfurt)' },
      'eu-north-1': { lat: 59.3293, lng: 18.0686, region: 'Europe (Stockholm)' },
      'ap-southeast-1': { lat: 1.3521, lng: 103.8198, region: 'Asia Pacific (Singapore)' },
      'ap-southeast-2': { lat: -33.8688, lng: 151.2093, region: 'Asia Pacific (Sydney)' },
      'ap-northeast-1': { lat: 35.6762, lng: 139.6503, region: 'Asia Pacific (Tokyo)' },
      'ap-northeast-2': { lat: 37.5665, lng: 126.9780, region: 'Asia Pacific (Seoul)' },
      'ap-south-1': { lat: 19.0760, lng: 72.8777, region: 'Asia Pacific (Mumbai)' },
      'sa-east-1': { lat: -23.5505, lng: -46.6333, region: 'South America (São Paulo)' },
      'ca-central-1': { lat: 43.6532, lng: -79.3832, region: 'Canada (Central)' },
      'af-south-1': { lat: -33.9249, lng: 18.4241, region: 'Africa (Cape Town)' },
      'me-south-1': { lat: 26.0667, lng: 50.5577, region: 'Middle East (Bahrain)' }
    }
  };

  // Enhanced function to extract coordinates from text using multiple data sources
  const getCoordinates = (text, provider) => {
    const textLower = text.toLowerCase();
    const locations = serviceLocations[provider] || [];
    const foundLocations = [];

    // Helper function for fuzzy matching
    const fuzzyMatch = (text, keyword) => {
      // Simple fuzzy matching for typos and variations
      const distance = (a, b) => {
        const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));
        for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
        for (let j = 0; j <= b.length; j++) matrix[j][0] = j;
        for (let j = 1; j <= b.length; j++) {
          for (let i = 1; i <= a.length; i++) {
            if (a[i - 1] === b[j - 1]) {
              matrix[j][i] = matrix[j - 1][i - 1];
            } else {
              matrix[j][i] = Math.min(
                matrix[j - 1][i - 1] + 1,
                matrix[j][i - 1] + 1,
                matrix[j - 1][i] + 1
              );
            }
          }
        }
        return matrix[b.length][a.length];
      };
      
      // Allow 1-2 character differences for fuzzy matching
      const maxDistance = Math.floor(keyword.length * 0.2);
      return distance(text, keyword) <= maxDistance || text.includes(keyword);
    };

    // Enhanced location aliases and variations
    const locationAliases = {
      'nyc': ['new york', 'manhattan'],
      'sf': ['san francisco', 'bay area'],
      'la': ['los angeles'],
      'dc': ['washington', 'washington dc'],
      'eu': ['europe'],
      'apac': ['asia pacific', 'asia-pacific'],
      'emea': ['europe middle east africa'],
      'americas': ['north america', 'south america'],
      'west coast': ['us-west', 'california', 'oregon', 'washington'],
      'east coast': ['us-east', 'virginia', 'new york'],
      'midwest': ['chicago', 'ohio', 'illinois'],
      'northeast': ['boston', 'new york'],
      'southeast': ['atlanta', 'florida', 'georgia'],
      'southwest': ['texas', 'arizona']
    };

    // Check for aliases and variations
    const expandedText = textLower;
    for (const [alias, expansions] of Object.entries(locationAliases)) {
      if (textLower.includes(alias)) {
        expansions.forEach(expansion => {
          if (!expandedText.includes(expansion)) {
            // Add expansion to search text for better matching
          }
        });
      }
    }

    // 1. First, try to match cloud regions (highest priority for technical services)
    for (const [region, coords] of Object.entries(geographicalDatabase.cloudRegions)) {
      if (textLower.includes(region.toLowerCase()) || 
          textLower.includes(region.replace('-', ' ').toLowerCase()) ||
          fuzzyMatch(textLower, region.toLowerCase())) {
        foundLocations.push({ 
          lat: coords.lat, 
          lng: coords.lng, 
          region: coords.region,
          confidence: 'high'
        });
      }
    }

    // 2. Try to match specific cities mentioned in the text
    for (const [city, coords] of Object.entries(geographicalDatabase.cities)) {
      if (textLower.includes(city) || fuzzyMatch(textLower, city)) {
        foundLocations.push({ 
          lat: coords.lat, 
          lng: coords.lng, 
          region: coords.region,
          confidence: 'high'
        });
      }
    }

    // 3. Try to match US states
    for (const [state, coords] of Object.entries(geographicalDatabase.usStates)) {
      if (textLower.includes(state) || fuzzyMatch(textLower, state)) {
        foundLocations.push({ 
          lat: coords.lat, 
          lng: coords.lng, 
          region: coords.region,
          confidence: 'medium'
        });
      }
    }

    // 4. Try to match countries/regions
    for (const [region, coords] of Object.entries(geographicalDatabase.regions)) {
      if (textLower.includes(region) || fuzzyMatch(textLower, region)) {
        foundLocations.push({ 
          lat: coords.lat, 
          lng: coords.lng, 
          region: coords.region,
          confidence: 'medium'
        });
      }
    }

    // 5. Try provider-specific keyword matching (existing logic)
    for (const location of locations) {
      if (location.keywords.some(keyword => 
        textLower.includes(keyword) || fuzzyMatch(textLower, keyword)
      )) {
        foundLocations.push({ 
          lat: location.lat, 
          lng: location.lng, 
          region: location.region,
          confidence: 'medium'
        });
      }
    }

    // 6. Enhanced pattern matching for common outage descriptions
    const patterns = [
      { pattern: /data center[s]?\s+in\s+([a-zA-Z\s]+)/gi, confidence: 'high' },
      { pattern: /availability zone[s]?\s+([a-z0-9-]+)/gi, confidence: 'high' },
      { pattern: /region[s]?\s+([a-zA-Z0-9-\s]+)/gi, confidence: 'medium' },
      { pattern: /users?\s+in\s+([a-zA-Z\s]+)/gi, confidence: 'medium' },
      { pattern: /customers?\s+in\s+([a-zA-Z\s]+)/gi, confidence: 'medium' },
      { pattern: /outage\s+in\s+([a-zA-Z\s]+)/gi, confidence: 'high' },
      { pattern: /issues?\s+in\s+([a-zA-Z\s]+)/gi, confidence: 'medium' },
      { pattern: /affecting\s+([a-zA-Z\s]+)/gi, confidence: 'medium' }
    ];

    patterns.forEach(({ pattern, confidence }) => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const location = match[1].trim().toLowerCase();
        // Check if this location exists in our databases
        const found = 
          geographicalDatabase.cities[location] ||
          geographicalDatabase.regions[location] ||
          geographicalDatabase.usStates[location] ||
          geographicalDatabase.cloudRegions[location];
        
        if (found) {
          foundLocations.push({
            lat: found.lat,
            lng: found.lng,
            region: found.region,
            confidence: confidence
          });
        }
      }
    });

    // 7. Handle global/worldwide issues
    if (textLower.includes('global') || textLower.includes('worldwide') || 
        textLower.includes('all regions') || textLower.includes('multiple regions')) {
      return locations.slice(0, 3).map(loc => ({ 
        lat: loc.lat, 
        lng: loc.lng, 
        region: loc.region + ' (Global)',
        confidence: 'low'
      }));
    }

    // Return found locations, prioritizing high confidence matches
    if (foundLocations.length > 0) {
      // Sort by confidence and remove duplicates
      const uniqueLocations = foundLocations.filter((location, index, self) => 
        index === self.findIndex(l => 
          Math.abs(l.lat - location.lat) < 0.1 && Math.abs(l.lng - location.lng) < 0.1
        )
      );
      
      // Sort by confidence: high -> medium -> low
      uniqueLocations.sort((a, b) => {
        const confidenceOrder = { 'high': 3, 'medium': 2, 'low': 1 };
        return confidenceOrder[b.confidence] - confidenceOrder[a.confidence];
      });
      
      // Return top 3 most relevant locations
      return uniqueLocations.slice(0, 3);
    }

    // Fallback to provider default location
    if (locations.length > 0) {
      return [{ 
        lat: locations[0].lat, 
        lng: locations[0].lng, 
        region: locations[0].region + ' (Default)',
        confidence: 'low'
      }];
    }

    // Ultimate fallback (San Francisco)
    return [{ 
      lat: 37.7749, 
      lng: -122.4194, 
      region: 'Global (Fallback)',
      confidence: 'low'
    }];
  };

  // Process each service
  const services = [
    { name: 'Cloudflare', data: cloudflareIncidents, dateField: 'created_at' },
    { name: 'Zscaler', data: zscalerUpdates, dateField: 'date' },
    { name: 'Okta', data: oktaUpdates, dateField: 'date' },
    { name: 'SendGrid', data: sendgridUpdates, dateField: 'date' },
    { name: 'Slack', data: slackUpdates, dateField: 'date' },
    { name: 'Datadog', data: datadogUpdates, dateField: 'date' },
    { name: 'AWS', data: awsUpdates, dateField: 'date' }
  ];

  services.forEach(service => {
    if (!selectedServices.includes(service.name.toLowerCase())) return;
    if (!Array.isArray(service.data)) return;

    service.data.forEach((item, index) => {
      const date = item[service.dateField] || item.date || item.created_at;
      if (!isRelevant(item, date)) return;

      // Use both title and description for better location detection
      const titleText = item.title || item.name || '';
      const descriptionText = item.description || item.body || '';
      const fullText = `${titleText} ${descriptionText}`;
      
      const coordinates = getCoordinates(fullText, service.name);

      coordinates.forEach(coord => {
        issues.push({
          id: `${service.name}-${index}-${coord.region}`,
          provider: service.name,
          title: formatTitle(titleText || 'Service Issue'),
          description: formatDescription(descriptionText),
          severity: getSeverity(item),
          date: date,
          lat: coord.lat,
          lng: coord.lng,
          region: coord.region,
          confidence: coord.confidence || 'medium',
          url: item.html_url || item.link || item.url
        });
      });
    });
  });

  return issues;
}, [cloudflareIncidents, zscalerUpdates, oktaUpdates, sendgridUpdates, slackUpdates, datadogUpdates, awsUpdates, selectedServices, showHistoric]);

// Group issues by location after processing
const groupedIssues = useMemo(() => groupIssuesByLocation(processedIssues), [processedIssues]);

return (
  <div className="world-map-container">
    <div className="world-map-header">
      <div className="header-content">
        <h2>Global Service Status Map</h2>
        <div className="map-legend">
          <div className="legend-item">
            <div className="legend-dot" style={{ backgroundColor: '#dc2626' }}></div>
            <span>Critical ({processedIssues.filter(i => i.severity === 'critical').length})</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot" style={{ backgroundColor: '#ea580c' }}></div>
            <span>Major ({processedIssues.filter(i => i.severity === 'major').length})</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot" style={{ backgroundColor: '#d97706' }}></div>
            <span>Minor ({processedIssues.filter(i => i.severity === 'minor').length})</span>
          </div>
          <div className="legend-item legend-cluster-info">
            <div className="legend-cluster-icon">
              <div className="legend-dot clustered" style={{ backgroundColor: '#6b7280' }}></div>
              <span className="cluster-count-example">3</span>
            </div>
            <span>Multiple issues ({groupedIssues.filter(g => g.issues.length > 1).length} areas)</span>
          </div>
        </div>
      </div>
    </div>

    <div className="map-content-layout">
      <div className="leaflet-map-wrapper">
        <MapContainer
          center={[20, 0]}
          zoom={2}
          style={{ height: '100%', width: '100%', borderRadius: '12px' }}
          worldCopyJump={true}
          maxBounds={[[-90, -180], [90, 180]]}
          maxBoundsViscosity={1.0}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            detectRetina={true}
          />
          
          <MapBoundsHandler issues={processedIssues} />
          
          {groupedIssues.map((group, index) => (
            <CircleMarker
              key={`group-${index}`}
              center={[group.lat, group.lng]}
              radius={getClusterRadius(group)}
              fillColor={getClusterColor(group)}
              color="white"
              weight={group.issues.length > 1 ? 3 : 2}
              opacity={1}
              fillOpacity={group.issues.length > 1 ? 0.9 : 0.8}
              className={`issue-marker-${group.maxSeverity} ${group.issues.length > 1 ? 'clustered' : ''}`}
              eventHandlers={{
                click: () => {
                  // Always open in side panel, pass the entire group
                  setSelectedGroup(group);
                  setSelectedIssue(null); // Clear single issue selection
                }
              }}
            >
              {/* Tooltip for markers */}
              {group.issues.length > 1 ? (
                <Tooltip permanent className="cluster-tooltip" direction="center">
                  <span className="cluster-count">{group.issues.length}</span>
                </Tooltip>
              ) : (
                <Tooltip className="single-issue-tooltip" direction="top" sticky={true}>
                  <div className="tooltip-content">
                    <strong>{group.issues[0].provider}</strong>
                    <div className="tooltip-title">
                      {formatTitleForTooltip(group.issues[0].title)}
                    </div>
                    <em>Click to view details</em>
                  </div>
                </Tooltip>
              )}
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      {/* Side Panel for Issue Details */}
      {(selectedGroup || selectedIssue) && (
        <div className="issue-side-panel">
          <div className="side-panel-header">
            <div className="panel-title-section">
              {selectedGroup ? (
                <>
                  <div className="provider-badge">
                    <strong>{selectedGroup.issues.length} Issues in this Area</strong>
                  </div>
                  <div 
                    className="severity-badge"
                    style={{ 
                      backgroundColor: getSeverityColor(selectedGroup.maxSeverity),
                      color: 'white'
                    }}
                  >
                    Highest: {selectedGroup.maxSeverity}
                  </div>
                </>
              ) : (
                <>
                  <div className="provider-badge">
                    <strong>{selectedIssue.provider}</strong>
                  </div>
                  <div 
                    className="severity-badge"
                    style={{ 
                      backgroundColor: getSeverityColor(selectedIssue.severity),
                      color: 'white'
                    }}
                  >
                    {selectedIssue.severity}
                  </div>
                </>
              )}
            </div>
            <button 
              className="close-side-panel"
              onClick={() => {
                setSelectedGroup(null);
                setSelectedIssue(null);
              }}
              title="Close details"
            >
              ×
            </button>
          </div>
          
          <div className="side-panel-content">
            {selectedGroup ? (
              // Multiple issues view
              <div className="multiple-issues-view">
                <div className="issues-summary">
                  <h3>Service Issues in this Region</h3>
                  <p className="issues-count">{selectedGroup.issues.length} active issues detected</p>
                </div>
                
                <div className="issues-list-panel">
                  {selectedGroup.issues.map((issue, index) => (
                    <div key={issue.id} className="issue-card">
                      <div className="issue-card-header">
                        <div className="service-info">
                          <div className="service-badge" style={{ backgroundColor: getServiceColor(issue.provider) }}>
                            {issue.provider}
                          </div>
                          <div className={`severity-badge severity-${issue.severity}`}>
                            {issue.severity}
                          </div>
                        </div>
                        <div className="issue-time">
                          {formatTime(issue.date)}
                        </div>
                      </div>
                      
                      <div className="issue-card-content">
                        <h4 className="issue-card-title">{formatTitle(issue.title)}</h4>
                        {issue.description && (
                          <p className="issue-card-description">
                            {formatDescription(issue.description)}
                          </p>
                        )}
                        
                        <div className="issue-card-meta">
                          {issue.region && (
                            <span className="meta-region">Region: {issue.region}</span>
                          )}
                        </div>
                        
                        {issue.url && (
                          <a 
                            href={issue.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="issue-card-link"
                          >
                            View Details ↗
                          </a>
                        )}
                      </div>
                      
                      {index < selectedGroup.issues.length - 1 && (
                        <hr className="issue-card-divider" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              // Single issue view
              <div className="single-issue-view">
                <div className="issue-title-section">
                  <h3>{selectedIssue.title}</h3>
                </div>
                
                <div className="issue-meta-section">
                  <div className="meta-item">
                    <span className="meta-label">Region:</span>
                    <span className="meta-value">{selectedIssue.region}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Date:</span>
                    <span className="meta-value">{new Date(selectedIssue.date).toLocaleString()}</span>
                  </div>
                </div>

                {selectedIssue.description && (
                  <div className="issue-description-section">
                    <div className="section-label">Description</div>
                    <div className="description-content">{selectedIssue.description}</div>
                  </div>
                )}
                
                {selectedIssue.url && (
                  <div className="issue-actions-section">
                    <a 
                      href={selectedIssue.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="view-details-btn"
                    >
                      <span>View Full Details</span>
                      <span className="external-link-icon">↗</span>
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>

    {/* Summary stats */}
    <div className="map-summary">
      <div className="summary-item">
        <span className="summary-label">Total Issues</span>
        <span className="summary-value">{processedIssues.length}</span>
      </div>
      <div className="summary-item">
        <span className="summary-label">Critical</span>
        <span className="summary-value critical">
          {processedIssues.filter(i => i.severity === 'critical').length}
        </span>
      </div>
      <div className="summary-item">
        <span className="summary-label">Major</span>
        <span className="summary-value major">
          {processedIssues.filter(i => i.severity === 'major').length}
        </span>
      </div>
      <div className="summary-item">
        <span className="summary-label">Mode</span>
        <span className="summary-value">
          {showHistoric ? 'Last 7 Days' : 'Current Active'}
        </span>
      </div>
    </div>
  </div>
);
}
