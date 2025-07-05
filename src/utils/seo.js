import { useEffect } from 'react';

// SEO Configuration - centralized configuration for the entire app
export const SEO_CONFIG = {
  // Site configuration
  site: {
    name: 'Stack Status IO',
    domain: 'https://stack-status.io',
    defaultTitle: 'Stack Status IO - Real-Time Service Status Monitoring Dashboard',
    defaultDescription: 'Monitor the real-time status of critical cloud services including AWS, Cloudflare, Okta, Zscaler, SendGrid, Slack, and Datadog. Get instant notifications about service disruptions, outages, and maintenance windows.',
    defaultKeywords: 'service status monitoring, cloud service dashboard, uptime tracker, service outage alerts, incident monitoring, DevOps tools, SaaS status, real-time monitoring',
    author: 'Stack Status IO',
    themeColor: '#667eea',
    backgroundColor: '#ffffff'
  },

  // Social media and sharing
  social: {
    twitterHandle: '@stackstatusio',
    ogImage: '/logo.png',
    ogImageAlt: 'Stack Status IO - Service Status Monitoring Dashboard',
    twitterCard: 'summary_large_image'
  },

  // Analytics and tracking IDs (replace with actual IDs)
  analytics: {
    googleAnalyticsId: 'G-XXXXXXXXXX', // Replace with actual GA4 ID
    googleTagManagerId: 'GTM-XXXXXXX', // Optional GTM ID
    hotjarId: 'XXXXXX', // Optional Hotjar ID
    microsoftClarityId: 'XXXXXXXXXX' // Optional Microsoft Clarity ID
  }
};

// Service-specific SEO data
const SERVICE_SEO_DATA = {
  aws: {
    name: 'Amazon Web Services (AWS)',
    description: 'Monitor Amazon Web Services status including EC2, S3, RDS, Lambda, CloudFront, and other AWS services. Get real-time alerts for AWS outages and service disruptions.',
    keywords: 'AWS status, Amazon Web Services outage, EC2 status, S3 status, AWS service health, CloudFront status, Lambda outage',
    icon: '/logos/aws-logo.png',
    officialStatusPage: 'https://status.aws.amazon.com/'
  },
  cloudflare: {
    name: 'Cloudflare',
    description: 'Track Cloudflare CDN, DNS, and security services status including edge locations and network performance. Monitor Cloudflare Workers and Pages.',
    keywords: 'Cloudflare status, CDN outage, DNS issues, Cloudflare edge locations, Workers status, Pages deployment',
    icon: '/logos/cloudflare-logo.svg',
    officialStatusPage: 'https://www.cloudflarestatus.com/'
  },
  okta: {
    name: 'Okta',
    description: 'Monitor Okta identity and access management services, SSO authentication, and user directory status. Track Okta login issues and authentication problems.',
    keywords: 'Okta status, SSO outage, identity management, authentication issues, Okta login problems, SAML issues',
    icon: '/logos/Okta-logo.svg',
    officialStatusPage: 'https://status.okta.com/'
  },
  zscaler: {
    name: 'Zscaler',
    description: 'Check Zscaler cloud security platform status including ZIA (Zscaler Internet Access) and ZPA (Zscaler Private Access) services.',
    keywords: 'Zscaler status, cloud security, ZIA status, ZPA outage, Zscaler Internet Access, Zscaler Private Access',
    icon: '/logos/Zscaler.svg',
    officialStatusPage: 'https://trust.zscaler.com/'
  },
  sendgrid: {
    name: 'SendGrid',
    description: 'Monitor SendGrid email delivery service status and API availability. Track email sending issues and SMTP problems.',
    keywords: 'SendGrid status, email delivery issues, SMTP outage, email API, SendGrid downtime, email service problems',
    icon: '/logos/SendGrid.svg',
    officialStatusPage: 'https://status.sendgrid.com/'
  },
  slack: {
    name: 'Slack',
    description: 'Track Slack workspace connectivity, messaging, and collaboration platform status. Monitor Slack API and notification issues.',
    keywords: 'Slack status, workspace outage, messaging issues, Slack downtime, collaboration platform, Slack API problems',
    icon: '/logos/slack-logo.png',
    officialStatusPage: 'https://status.slack.com/'
  },
  datadog: {
    name: 'Datadog',
    description: 'Monitor Datadog monitoring and analytics platform status including metrics collection, logging, and APM services.',
    keywords: 'Datadog status, monitoring platform, metrics collection, logging service, APM outage, Datadog downtime',
    icon: '/logos/datadog-logo.png',
    officialStatusPage: 'https://status.datadoghq.eu/'
  }
};

// SEO utility functions
export const SEOUtils = {
  // Generate page title based on context
  generatePageTitle(selectedServices = [], incidentCount = 0) {
    const { site } = SEO_CONFIG;
    
    if (selectedServices.length === 0) {
      return site.defaultTitle;
    }
    
    if (selectedServices.length === 1) {
      const service = SERVICE_SEO_DATA[selectedServices[0]];
      const statusText = incidentCount > 0 ? `${incidentCount} Issue${incidentCount > 1 ? 's' : ''}` : 'Status';
      return `${service?.name || selectedServices[0]} ${statusText} - Real-Time Monitoring | ${site.name}`;
    }
    
    const serviceNames = selectedServices.slice(0, 3).map(s => SERVICE_SEO_DATA[s]?.name || s).join(', ');
    const moreText = selectedServices.length > 3 ? ` +${selectedServices.length - 3} more` : '';
    return `${serviceNames}${moreText} Status Monitor | ${site.name}`;
  },

  // Generate meta description
  generateDescription(selectedServices = [], incidentCount = 0) {
    const { site } = SEO_CONFIG;
    
    if (selectedServices.length === 0) {
      return site.defaultDescription;
    }
    
    if (selectedServices.length === 1) {
      const service = SERVICE_SEO_DATA[selectedServices[0]];
      const statusText = incidentCount > 0 ? 
        `Currently tracking ${incidentCount} incident${incidentCount > 1 ? 's' : ''}.` : 
        'All systems operational.';
      return `${service?.description || `Monitor ${service?.name || selectedServices[0]} status.`} ${statusText}`;
    }
    
    const serviceNames = selectedServices.map(s => SERVICE_SEO_DATA[s]?.name || s).join(', ');
    return `Monitor ${serviceNames} in real-time. Get instant notifications about service disruptions, outages, and maintenance windows.`;
  },

  // Generate keywords
  generateKeywords(selectedServices = []) {
    const { site } = SEO_CONFIG;
    
    if (selectedServices.length === 0) {
      return site.defaultKeywords;
    }
    
    const serviceKeywords = selectedServices
      .map(service => SERVICE_SEO_DATA[service]?.keywords || '')
      .filter(Boolean)
      .join(', ');
    
    return `${serviceKeywords}, ${site.defaultKeywords}`;
  },

  // Generate structured data
  generateStructuredData(selectedServices = [], serviceStatuses = {}) {
    const { site } = SEO_CONFIG;
    
    const baseStructuredData = {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: site.name,
      description: this.generateDescription(selectedServices),
      url: site.domain,
      applicationCategory: 'UtilityApplication',
      operatingSystem: 'Web Browser',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD'
      },
      creator: {
        '@type': 'Organization',
        name: site.name,
        url: site.domain
      },
      featureList: [
        'Real-time status monitoring',
        'Service disruption alerts',
        'Multi-service dashboard',
        'Incident tracking',
        'Customizable notifications',
        'Historical incident data',
        'Mobile-friendly interface'
      ]
    };

    // Add service-specific data if services are selected
    if (selectedServices.length > 0) {
      baseStructuredData.about = selectedServices.map(serviceId => {
        const service = SERVICE_SEO_DATA[serviceId];
        const status = serviceStatuses[serviceId];
        
        return {
          '@type': 'Service',
          name: service?.name || serviceId,
          description: service?.description || `${service?.name || serviceId} status monitoring`,
          provider: {
            '@type': 'Organization',
            name: service?.name || serviceId,
            url: service?.officialStatusPage
          },
          serviceType: 'Status Monitoring',
          areaServed: 'Worldwide',
          ...(status && {
            serviceOutput: {
              '@type': 'StatusUpdate',
              name: status.status || 'Unknown',
              dateModified: status.lastUpdated || new Date().toISOString()
            }
          })
        };
      });
    }

    return baseStructuredData;
  },

  // Update all meta tags at once
  updateAllMetaTags(selectedServices = [], serviceStatuses = {}, incidentCount = 0) {
    const title = this.generatePageTitle(selectedServices, incidentCount);
    const description = this.generateDescription(selectedServices, incidentCount);
    const keywords = this.generateKeywords(selectedServices);
    
    // Update document title
    document.title = title;
    
    // Update meta tags
    this.updateMetaTag('name', 'description', description);
    this.updateMetaTag('name', 'keywords', keywords);
    
    // Update Open Graph
    this.updateMetaTag('property', 'og:title', title);
    this.updateMetaTag('property', 'og:description', description);
    
    // Update Twitter Cards
    this.updateMetaTag('name', 'twitter:title', title);
    this.updateMetaTag('name', 'twitter:description', description);
    
    // Update canonical URL
    this.updateCanonicalUrl(selectedServices);
    
    // Update structured data
    this.updateStructuredData(selectedServices, serviceStatuses);
  },

  // Helper function to update meta tags
  updateMetaTag(attribute, attributeValue, content) {
    let meta = document.querySelector(`meta[${attribute}="${attributeValue}"]`);
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute(attribute, attributeValue);
      document.getElementsByTagName('head')[0].appendChild(meta);
    }
    meta.content = content;
  },

  // Update canonical URL based on selected services
  updateCanonicalUrl(selectedServices = []) {
    const { site } = SEO_CONFIG;
    let canonicalUrl = site.domain;
    
    if (selectedServices.length === 1) {
      canonicalUrl += `/#${selectedServices[0]}`;
    } else if (selectedServices.length > 1) {
      canonicalUrl += `/#services=${selectedServices.join(',')}`;
    }
    
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalUrl;
  },

  // Update structured data
  updateStructuredData(selectedServices = [], serviceStatuses = {}) {
    // Remove existing structured data
    const existingStructuredData = document.querySelector('#dynamic-structured-data');
    if (existingStructuredData) {
      existingStructuredData.remove();
    }

    // Create new structured data
    const structuredData = this.generateStructuredData(selectedServices, serviceStatuses);
    
    const script = document.createElement('script');
    script.id = 'dynamic-structured-data';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(structuredData, null, 2);
    document.head.appendChild(script);
  },

  // Get service data
  getServiceData(serviceId) {
    return SERVICE_SEO_DATA[serviceId] || null;
  },

  // Get all service data
  getAllServiceData() {
    return SERVICE_SEO_DATA;
  }
};

// SEO component for managing meta tags and structured data
export const SEOHead = ({ 
  selectedServices = [],
  serviceStatuses = {},
  incidentCount = 0,
  customTitle = null,
  customDescription = null,
  customKeywords = null
}) => {
  useEffect(() => {
    // Use custom values if provided, otherwise generate dynamically
    if (customTitle || customDescription || customKeywords) {
      // Handle custom values
      if (customTitle) document.title = customTitle;
      if (customDescription) SEOUtils.updateMetaTag('name', 'description', customDescription);
      if (customKeywords) SEOUtils.updateMetaTag('name', 'keywords', customKeywords);
    } else {
      // Use dynamic generation
      SEOUtils.updateAllMetaTags(selectedServices, serviceStatuses, incidentCount);
    }
    
  }, [selectedServices, serviceStatuses, incidentCount, customTitle, customDescription, customKeywords]);

  return null; // This component doesn't render anything
};

// Export service data for use in other components
export { SERVICE_SEO_DATA };

// Default export
export default {
  SEO_CONFIG,
  SEOUtils,
  SEOHead,
  SERVICE_SEO_DATA
};
