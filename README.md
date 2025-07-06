# Service Status Dashboard (Vite + React)

This project is a modern, glassmorphic dashboard for monitoring the status of key SaaS providers including Cloudflare, Zscaler, SendGrid, Okta, Slack, Datadog, and AWS. It features real-time polling, animated status cards, customizable service selection, and a beautiful responsive UI built with Vite and React.

## ✨ Key Features

### 🎯 Service Monitoring & Selection
- **Multi-Service Support**: Monitor 7+ major SaaS providers (Cloudflare, Zscaler, SendGrid, Okta, Slack, Datadog, AWS)
- **Custom Service Selection**: Interactive splash screen to choose which services to monitor
- **Granular Alert Configuration**: Configure specific alert types for each service (incidents, maintenance, API issues, etc.)
- **Live Status Polling**: Real-time updates every 60 seconds with intelligent caching

### 🎨 Modern UI & UX
- **Glassmorphism Design**: Beautiful frosted glass effects with backdrop blur
- **Enhanced Service Selector**: Smooth scrolling modal with gradient scroll bars and visual indicators
- **Animated Status Cards**: Floating provider logos with pop effects on status changes
- **Responsive Layout**: Optimized for desktop, tablet, and mobile devices
- **Theme Switching**: Auto/light/dark theme support with service-specific color schemes

### 📊 Status Visualization
- **Real-time Indicators**: Live pulse animations and color-coded status indicators
- **7-Day Timeline Visualization**: Beautiful horizontal timeline showing daily service status with color-coded alert types
- **Historical Analysis**: Visual representation of operational (green), minor issues (yellow), major issues (orange), and critical issues (red)
- **Uptime Percentage**: Calculated reliability metrics displayed prominently on each service card
- **Incident Timeline**: Detailed incident history with timestamps and descriptions
- **Service Impact Reporting**: Report service impacts directly from the dashboard

### 🔧 Technical Features
- **Private Browsing Support**: Graceful localStorage handling for incognito/private modes
- **API Proxying**: Serverless functions for CORS-free API access in production
- **Local Development**: Vite proxy configuration for seamless local development
- **Error Resilience**: Robust error handling and fallback mechanisms
- **Performance Optimized**: Efficient data fetching and caching strategies

## 🚀 Recent Enhancements

### 7-Day Timeline Visualization (Latest)
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
- **Styling**: CSS3 with Glassmorphism effects
- **APIs**: RESTful service status APIs with serverless proxying
- **Deployment**: Vercel with automatic builds
- **Development**: Hot reload with Vite dev server

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

4. **Deploy to Vercel**:
   ```sh
   vercel --prod
   ```

## 📱 Service Support

| Service | Status API | Alert Types | Features |
|---------|------------|-------------|----------|
| **Cloudflare** | ✅ Native | Incidents, Maintenance, Performance | Full incident history |
| **Zscaler** | ✅ RSS Feed | Disruptions, Updates, Performance | 7-day timeline |
| **Okta** | ✅ RSS Feed | Incidents, Maintenance, Security | Authentication focus |
| **SendGrid** | ✅ RSS Feed | Delivery, API, Maintenance | Email delivery status |
| **Slack** | ✅ RSS Feed | Messaging, Calls, Files | Communication tools |
| **Datadog** | ✅ RSS Feed | Monitoring, Dashboard, API | Analytics platform |
| **AWS** | ✅ RSS Feed | Compute, Storage, Network, Database | Cloud infrastructure |

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
- **Animations**: Adjust keyframes and transition timings
- **Responsive**: Update media queries for different screen sizes

## 🔧 Configuration

### Environment Variables
```env
# Add any API keys or configuration
VITE_API_BASE_URL=https://your-api-base.com
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

---

Built with ❤️ using modern React best practices, focusing on performance, accessibility, and user experience.
