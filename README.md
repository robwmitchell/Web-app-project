# Service Status Dashboard (Vite + React)

This project is a modern, glassmorphic dashboard for monitoring the status of key SaaS providers including Cloudflare, Zscaler, SendGrid, Okta, Slack, Datadog, and AWS. It features real-time polling, animated status cards, customizable service selection, and a beautiful responsive UI built with Vite and React.

## ✨ Key Features

### 🎯 Service Monitoring & Selection
- **Multi-Service Support**: Monitor 7+ major SaaS providers (Cloudflare, Zscaler, SendGrid, Okta, Slack, Datadog, AWS)
- **Custom Service Selection**: Interactive splash screen to choose which services to monitor
- **Granular Alert Configuration**: Configure specific alert types for each service (incidents, maintenance, API issues, etc.)
- **Live Status Polling**: Real-time updates every 2 minutes with intelligent caching

### 🎨 Modern UI & UX
- **Glassmorphism Design**: Beautiful frosted glass effects with backdrop blur
- **Enhanced Service Selector**: Smooth scrolling modal with gradient scroll bars and visual indicators
- **Interactive Status Cards**: Floating provider logos with smooth hover effects
- **Responsive Layout**: Optimized for desktop, tablet, and mobile devices
- **Theme Switching**: Auto/light/dark theme support with service-specific color schemes

### 📊 Status Visualization
- **Real-time Indicators**: Color-coded status indicators and visual feedback
- **7-Day Timeline Visualization**: Beautiful horizontal timeline showing daily service status with color-coded alert types
- **Interactive World Map**: Real-world geographic visualization of service issues with toggleable time filters
- **Historical Analysis**: Visual representation of operational (green), minor issues (yellow), major issues (orange), and critical issues (red)
- **Uptime Percentage**: Calculated reliability metrics displayed prominently on each service card
- **Incident Timeline**: Detailed incident history with timestamps and descriptions
- **Unified Live Feed**: Consolidated real-time incident feed with advanced search and filtering

### 🔧 Technical Features
- **Private Browsing Support**: Graceful localStorage handling for incognito/private modes
- **API Proxying**: Serverless functions for CORS-free API access in production
- **Local Development**: Vite proxy configuration for seamless local development
- **Error Resilience**: Robust error handling and fallback mechanisms
- **Performance Optimized**: Efficient data fetching and caching strategies
- **Unified API Polling**: Consolidated polling system with intelligent request deduplication
- **Request Optimization**: Advanced caching and batching for improved performance

## 🚀 Recent Enhancements

### 🗺️ Interactive World Map (Latest)
- **Real Geographic Visualization**: Leaflet.js-powered interactive world map showing service issues by region
- **Time Filter Toggle**: Switch between "Last 7 Days" and "Currently Active" issues
- **Color-Coded Severity Markers**: Visual indicators for operational, minor, major, and critical issues
- **Side Panel Details**: Click any marker to view detailed issue information in a right-side panel
- **Responsive Design**: Optimized for all screen sizes with centered title and legend
- **No Overlap UI**: Clean interface design that prevents popup overlaps and page jumps

### 📡 Unified Live Feed & API Optimization
- **Consolidated Live Feed Panel**: Real-time incident aggregation from all monitored services
- **Advanced Search & Filtering**: Search incidents by service, severity, keywords, and date ranges
- **Optimized API Polling**: Single 2-minute polling interval with intelligent request deduplication
- **Shared RSS Parsing**: Unified RSS parsing utilities for consistent data processing
- **Request Caching**: Advanced caching system to reduce API calls and improve performance

### 7-Day Timeline Visualization
- **Horizontal Timeline Display**: Visual representation of service status over the last 7 days
- **Color-Coded Alert Types**: Green (operational), yellow (minor), orange (major), red (critical)
- **Interactive Tooltips**: Hover over timeline bars to see detailed day information
- **Uptime Percentage**: Real-time calculation and display of service reliability metrics
- **Responsive Design**: Timeline adapts beautifully to different screen sizes

### Enhanced Service Selector
- **Single Scroll Experience**: Optimized modal with unified scroll behavior
- **Gradient Scroll Bars**: Beautiful custom-styled scroll indicators
- **Scroll State Tracking**: Visual feedback for scrolling with smooth animations
- **Mobile Optimized**: Touch-friendly scrolling with momentum support

### Cloudflare Integration Improvements
- **Private Browsing Compatibility**: Fixed localStorage restrictions in incognito mode
- **Production API Proxying**: Serverless function for reliable Cloudflare API access
- **Local Development Proxy**: Vite configuration for seamless local testing
- **Error Handling**: Comprehensive error states and fallback messaging

### Service Customization
- **Alert Type Configuration**: Granular control over notification preferences
- **Service-Specific Settings**: Individual configuration for each monitored service
- **Persistent Preferences**: Settings saved across browser sessions

## 🛠 Technical Stack

- **Frontend**: React 18 + Vite
- **Mapping**: Leaflet.js for interactive world map visualization
- **Styling**: CSS3 with Glassmorphism effects
- **APIs**: RESTful service status APIs with serverless proxying
- **Deployment**: Vercel with automatic builds
- **Development**: Hot reload with Vite dev server
- **Optimization**: Request deduplication, caching, and unified API polling

## 📦 Installation & Usage

1. **Install dependencies**:
   ```sh
   npm install
   ```

2. **Development server**:
   ```sh
   npm run dev
   ```

3. **Production build**:
   ```sh
   npm run build
   ```

4. **Preview world map locally**:
   Navigate to the world map via the header navigation after starting the dev server

5. **Deploy to Vercel**:
   ```sh
   vercel --prod
   ```

## 📱 Service Support

| Service | Status API | Alert Types | Features |
|---------|------------|-------------|----------|
| **Cloudflare** | ✅ Native | Incidents, Maintenance, Performance | Full incident history, geographic impact |
| **Zscaler** | ✅ RSS Feed | Disruptions, Updates, Performance | 7-day timeline, regional outages |
| **Okta** | ✅ RSS Feed | Incidents, Maintenance, Security | Authentication focus, global regions |
| **SendGrid** | ✅ RSS Feed | Delivery, API, Maintenance | Email delivery status, enhanced severity detection |
| **Slack** | ✅ RSS Feed | Messaging, Calls, Files | Communication tools, workspace impacts |
| **Datadog** | ✅ RSS Feed | Monitoring, Dashboard, API | Analytics platform, multi-region support |
| **AWS** | ✅ RSS Feed | Compute, Storage, Network, Database | Cloud infrastructure, region-specific issues |

## 🗺️ World Map Feature

The interactive world map provides a geographic visualization of service issues across global regions:

### Key Features
- **Real-world Geography**: Uses Leaflet.js with OpenStreetMap tiles for accurate geographic representation
- **Issue Markers**: Color-coded markers show incident severity by region:
  - 🟢 **Green**: Operational or resolved issues
  - 🟡 **Yellow**: Minor issues or degraded performance  
  - 🟠 **Orange**: Major service disruptions
  - 🔴 **Red**: Critical outages or widespread issues
- **Time Filtering**: Toggle between "Last 7 Days" and "Currently Active" incidents
- **Interactive Details**: Click any marker to view detailed issue information in the side panel
- **Responsive Design**: Adapts to all screen sizes with optimized mobile experience

### Geographic Coverage
The map displays issues for supported regions including:
- **North America**: US, Canada, Mexico
- **Europe**: UK, Germany, France, Netherlands, and more
- **Asia Pacific**: Japan, Australia, Singapore, India
- **Global**: Worldwide incidents affecting multiple regions

### Usage
1. Access the world map via the "🗺️ World Map" link in the main header
2. Use the time filter toggle to switch between historical and current issues
3. Click any colored marker to view detailed incident information
4. Use the legend to understand marker color meanings
5. The side panel will show incident details without overlapping the map

## 🎨 Customization

### Adding New Services
```javascript
// Add to AVAILABLE_SERVICES in ServiceSelectionSplash.jsx
{
  id: 'new-service',
  name: 'New Service',
  description: 'Service description',
  logo: serviceLogos.NewService,
  color: '#color-hex',
  alertTypes: [
    { id: 'incidents', name: 'Incidents', description: 'Service disruptions', default: true }
  ]
}
```

### Styling Customization
- **Theme Colors**: Update CSS custom properties in component styles
- **Glassmorphism**: Modify backdrop-filter and transparency values
- **Transitions**: Adjust transition timings for smooth interactions
- **Responsive**: Update media queries for different screen sizes
- **Map Styling**: Customize Leaflet.js map themes and marker styles

## 🔧 Configuration

### Environment Variables
```env
# Add any API keys or configuration
VITE_API_BASE_URL=https://your-api-base.com
```

### Feature Flags
The application includes several feature flags for enabling/disabling functionality:
```javascript
// Current active features
const FEATURES = {
  WORLD_MAP: true,           // World Map feature (enabled)
  UNIFIED_FEED: true,        // Unified Live Feed (enabled)
  API_OPTIMIZATION: true,    // Request optimization (enabled)
  TIMELINE_VISUALIZATION: true, // 7-day timeline (enabled)
  
  // Disabled features for performance and UX
  REPORT_ISSUE: false,       // Report Issue form (disabled)
  ALERT_PULSE: false,        // Pulse animations (disabled for performance)
};
```

### Proxy Configuration
Development API proxying is configured in `vite.config.js` for seamless local development.

## 📊 Status Indicators

| Color | Status | Description |
|-------|--------|-------------|
| 🟢 **Green** | Operational | All systems running normally |
| 🟡 **Yellow** | Minor Issues | Some degradation or maintenance |
| 🔴 **Red** | Major Issues | Significant service disruption |
| ⚫ **Gray** | Unknown | Unable to determine status |

## 🚀 Deployment

The application is automatically deployed to Vercel with:
- **Serverless Functions**: API proxying for production
- **Edge Optimization**: Global CDN distribution
- **Automatic Builds**: Triggered on git push
- **Preview Deployments**: For pull requests

## 🐛 Recent Bug Fixes & Improvements

### Timeline & Data Accuracy
- **SendGrid Day Indicator**: Fixed timezone-related bug causing incorrect day highlighting
- **Enhanced Severity Detection**: Improved keyword matching for better incident classification
- **ISO Date Handling**: Standardized date comparison logic across all timeline components

### Performance Optimizations
- **API Request Deduplication**: Prevents duplicate API calls with intelligent caching
- **Unified Polling**: Consolidated all service polling to a single 2-minute interval
- **RSS Parsing Optimization**: Shared utilities for consistent and efficient RSS processing
- **Memory Management**: Improved cleanup and garbage collection for long-running sessions

### UI/UX Enhancements
- **Clean Interface Design**: Removed performance-heavy animations for better responsiveness
- **Side Panel Implementation**: Replaced popups with clean side panel for better user experience
- **Map Title Centering**: Improved visual hierarchy and layout consistency
- **Mobile Responsiveness**: Enhanced touch interactions and responsive design
- **Feature Cleanup**: Removed deprecated features to streamline user experience

---

Built with ❤️ using modern React best practices, focusing on performance, accessibility, and user experience.
