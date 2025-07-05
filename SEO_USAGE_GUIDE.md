# SEO Utils Usage Guide

## How to Use the Consolidated SEO System

The new `src/utils/seo.js` file contains everything you need for SEO management in a single, well-organized file.

### 1. Basic Usage in Components

```jsx
import { SEOHead, SEOUtils } from '../utils/seo';

function MyComponent({ selectedServices, serviceStatuses }) {
  const incidentCount = Object.values(serviceStatuses).reduce((count, status) => {
    return count + (status.incidents?.length || 0);
  }, 0);

  return (
    <div>
      {/* This component automatically updates all SEO meta tags */}
      <SEOHead 
        selectedServices={selectedServices}
        serviceStatuses={serviceStatuses}
        incidentCount={incidentCount}
      />
      
      {/* Your component content */}
    </div>
  );
}
```

### 2. Manual SEO Updates

```jsx
import { SEOUtils } from '../utils/seo';

// Update all meta tags at once
SEOUtils.updateAllMetaTags(['aws', 'cloudflare'], serviceStatuses, 2);

// Or update specific elements
const title = SEOUtils.generatePageTitle(['aws'], 1);
const description = SEOUtils.generateDescription(['aws', 'cloudflare'], 0);
const keywords = SEOUtils.generateKeywords(['aws']);

document.title = title;
SEOUtils.updateMetaTag('name', 'description', description);
```

### 3. Custom SEO Content

```jsx
<SEOHead 
  customTitle="AWS Service Outage - Live Updates"
  customDescription="Real-time updates on the current AWS service disruption affecting EC2 and S3 services."
  customKeywords="AWS outage, EC2 down, S3 issues, Amazon Web Services problems"
/>
```

### 4. Configuration

All configuration is centralized in `SEO_CONFIG`:

```jsx
import { SEO_CONFIG } from '../utils/seo';

// Access configuration
console.log(SEO_CONFIG.site.domain); // https://stack-status.io
console.log(SEO_CONFIG.analytics.googleAnalyticsId); // G-XXXXXXXXXX
```

### 5. Service Data

```jsx
import { SEOUtils } from '../utils/seo';

// Get service information
const awsData = SEOUtils.getServiceData('aws');
console.log(awsData.name); // "Amazon Web Services (AWS)"
console.log(awsData.description); // Full description
console.log(awsData.keywords); // SEO keywords

// Get all services
const allServices = SEOUtils.getAllServiceData();
```

## Key Features

### ✅ What's Included:
- **Centralized Configuration**: All SEO settings in one place
- **Dynamic Meta Tags**: Automatically generated based on selected services
- **Structured Data**: Rich snippets for better search visibility
- **Service-Specific Content**: Tailored descriptions and keywords for each service
- **Canonical URLs**: Proper URL management for SPA
- **Analytics Integration**: Ready for Google Analytics, Hotjar, etc.

### 🔧 Configuration Options:
- Site metadata (title, description, domain)
- Social media settings (Twitter, Open Graph)
- Analytics tracking IDs
- Service-specific SEO data

### 📈 SEO Features:
- Dynamic title generation based on selected services and incident count
- Context-aware meta descriptions
- Service-specific keywords
- Comprehensive structured data (JSON-LD)
- Canonical URL management
- Open Graph and Twitter Card optimization

## Integration Examples

### In App.jsx:
```jsx
import { SEOHead } from './utils/seo';

function App() {
  const [selectedServices, setSelectedServices] = useState(['aws', 'cloudflare']);
  const [serviceStatuses, setServiceStatuses] = useState({});
  
  return (
    <div>
      <SEOHead 
        selectedServices={selectedServices}
        serviceStatuses={serviceStatuses}
        incidentCount={calculateIncidentCount(serviceStatuses)}
      />
      {/* Rest of your app */}
    </div>
  );
}
```

### In Service Cards:
```jsx
import { SEOUtils } from './utils/seo';

function ServiceCard({ serviceId }) {
  const serviceData = SEOUtils.getServiceData(serviceId);
  
  return (
    <div>
      <img src={serviceData.icon} alt={serviceData.name} />
      <h3>{serviceData.name}</h3>
      <p>{serviceData.description}</p>
    </div>
  );
}
```

## Migration Notes

### What Changed:
- ❌ Removed: Duplicate `src/config/seo.js` file
- ✅ Added: Comprehensive `src/utils/seo.js` with all functionality
- ✅ Enhanced: Better structured data and meta tag management
- ✅ Improved: More service-specific SEO content

### No Breaking Changes:
The API is designed to be backward compatible. Existing imports should continue to work.

## Next Steps

1. **Replace Analytics ID**: Update `SEO_CONFIG.analytics.googleAnalyticsId` with your real Google Analytics 4 ID
2. **Test in Production**: Verify meta tags are updating correctly
3. **Submit Sitemap**: Add sitemap to Google Search Console
4. **Monitor Performance**: Track SEO improvements with tools like Lighthouse

This consolidated approach makes SEO management much cleaner and more maintainable!
