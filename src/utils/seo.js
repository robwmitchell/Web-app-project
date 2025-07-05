import { useEffect } from 'react';

/**
 * SEO Configuration for Stack Status IO
 * Vite + React optimized SEO configuration
 */

export const SEO_CONFIG = {
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

  social: {
    twitterHandle: '@stackstatusio',
    ogImage: '/logo.png',
    ogImageAlt: 'Stack Status IO - Service Status Monitoring Dashboard',
    twitterCard: 'summary_large_image'
  },

  analytics: {
    googleAnalyticsId: 'G-XXXXXXXXXX',
    googleTagManagerId: 'GTM-XXXXXXX',
    hotjarId: 'XXXXXX',
    microsoftClarityId: 'XXXXXXXXXX'
  },

  services: {
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
      description: 'Monitor Okta identity and access management services, SSO authentication, user directory status, and API availability.',
      keywords: 'Okta status, SSO outage, identity management, authentication issues, Okta API status, SAML issues',
      icon: '/logos/Okta-logo.svg',
      officialStatusPage: 'https://status.okta.com/'
    },
    zscaler: {
      name: 'Zscaler',
      description: 'Check Zscaler cloud security platform status including ZIA and ZPA services, internet access, and private access.',
      keywords: 'Zscaler status, cloud security, ZIA status, ZPA outage, internet access, private access',
      icon: '/logos/Zscaler.svg',
      officialStatusPage: 'https://trust.zscaler.com/'
    },
    sendgrid: {
      name: 'SendGrid',
      description: 'Monitor SendGrid email delivery service status, API availability, and SMTP performance for reliable email sending.',
      keywords: 'SendGrid status, email delivery issues, SMTP outage, email API, transactional email',
      icon: '/logos/SendGrid.svg',
      officialStatusPage: 'https://status.sendgrid.com/'
    },
    slack: {
      name: 'Slack',
      description: 'Track Slack workspace connectivity, messaging, file sharing, and collaboration platform status across all regions.',
      keywords: 'Slack status, workspace outage, messaging issues, Slack downtime, file sharing problems',
      icon: '/logos/slack-logo.png',
      officialStatusPage: 'https://status.slack.com/'
    },
    datadog: {
      name: 'Datadog',
      description: 'Monitor Datadog monitoring and analytics platform status including metrics collection, logging, APM, and dashboard availability.',
      keywords: 'Datadog status, monitoring platform, metrics collection, logging service, APM status, dashboard outage',
      icon: '/logos/datadog-logo.png',
      officialStatusPage: 'https://status.datadoghq.eu/'
    }
  },

  performance: {
    preconnectDomains: [
      'https://www.cloudflarestatus.com',
      'https://trust.zscaler.com',
      'https://status.okta.com',
      'https://status.sendgrid.com',
      'https://status.slack.com',
      'https://status.datadoghq.eu',
      'https://status.aws.amazon.com',
      'https://vitals.vercel-analytics.com',
      'https://www.googletagmanager.com',
      'https://www.google-analytics.com'
    ],
    criticalResources: [
      '/logo.png',
      '/manifest.json'
    ]
  },

  structuredData: {
    website: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Stack Status IO',
      url: 'https://stack-status.io',
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://stack-status.io/#search={search_term_string}',
        'query-input': 'required name=search_term_string'
      }
    },
    webApplication: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Stack Status IO',
      description: 'Real-time service status monitoring dashboard for critical cloud services',
      url: 'https://stack-status.io',
      applicationCategory: 'UtilityApplication',
      operatingSystem: 'Web Browser',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD'
      },
      creator: {
        '@type': 'Organization',
        name: 'Stack Status IO',
        url: 'https://stack-status.io'
      },
      featureList: [
        'Real-time status monitoring',
        'Service disruption alerts',
        'Multi-service dashboard',
        'Incident tracking',
        'Customizable notifications',
        'Historical data analysis',
        'Mobile-responsive design'
      ]
    },
    organization: {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Stack Status IO',
      url: 'https://stack-status.io',
      logo: 'https://stack-status.io/logo.png',
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'Customer Service',
        url: 'https://stack-status.io'
      }
    }
  }
};

/**
 * Generate service-specific structured data
 * @param {string} service - Service identifier
 * @param {string} status - Service status
 * @returns {Object|null} Structured data object
 */
export const generateServiceStructuredData = (service, status) => {
  const serviceData = SEO_CONFIG.services[service];
  if (!serviceData) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: serviceData.name,
    description: serviceData.description,
    url: serviceData.officialStatusPage,
    applicationCategory: 'WebApplication',
    image: `https://stack-status.io${serviceData.icon}`,
    aggregateRating: status === 'operational' ? {
      '@type': 'AggregateRating',
      ratingValue: '5',
      ratingCount: '1',
      bestRating: '5',
      worstRating: '1'
    } : undefined
  };
};

/**
 * Generate breadcrumb structured data
 * @param {string[]} selectedServices - Array of service IDs
 * @returns {Object|null} Breadcrumb structured data
 */
export const generateBreadcrumbStructuredData = (selectedServices) => {
  if (!selectedServices?.length) return null;

  const itemListElement = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: 'https://stack-status.io'
    }
  ];

  selectedServices.forEach((service, index) => {
    const serviceData = SEO_CONFIG.services[service];
    if (serviceData) {
      itemListElement.push({
        '@type': 'ListItem',
        position: index + 2,
        name: `${serviceData.name} Status`,
        item: `https://stack-status.io/#${service}`
      });
    }
  });

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement
  };
};

/**
 * Generate dynamic page title
 * @param {string[]} selectedServices - Array of service IDs
 * @returns {string} Optimized page title
 */
export const generatePageTitle = (selectedServices = []) => {
  if (selectedServices.length === 0) {
    return SEO_CONFIG.site.defaultTitle;
  }
  
  const serviceNames = selectedServices
    .map(service => SEO_CONFIG.services[service]?.name)
    .filter(Boolean)
    .slice(0, 3);
  
  const title = `${serviceNames.join(', ')} Status | ${SEO_CONFIG.site.name}`;
  return title.length > 60 ? `${serviceNames[0]} Status | ${SEO_CONFIG.site.name}` : title;
};

/**
 * Generate dynamic meta description
 * @param {string[]} selectedServices - Array of service IDs
 * @param {number} incidentCount - Number of active incidents
 * @returns {string} Optimized meta description
 */
export const generateMetaDescription = (selectedServices = [], incidentCount = 0) => {
  if (selectedServices.length === 0) {
    return SEO_CONFIG.site.defaultDescription;
  }
  
  const serviceNames = selectedServices
    .map(service => SEO_CONFIG.services[service]?.name)
    .filter(Boolean);
  
  const statusText = incidentCount > 0 
    ? `${incidentCount} active incident${incidentCount > 1 ? 's' : ''} detected` 
    : 'All services operational';
    
  return `Monitor ${serviceNames.join(', ')} status in real-time. ${statusText}. Get instant alerts for service disruptions and outages.`;
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
      const service = SEO_CONFIG.services[selectedServices[0]];
      const statusText = incidentCount > 0 ? `${incidentCount} Issue${incidentCount > 1 ? 's' : ''}` : 'Status';
      return `${service?.name || selectedServices[0]} ${statusText} - Real-Time Monitoring | ${site.name}`;
    }
    
    const serviceNames = selectedServices.slice(0, 3).map(s => SEO_CONFIG.services[s]?.name || s).join(', ');
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
      const service = SEO_CONFIG.services[selectedServices[0]];
      const statusText = incidentCount > 0 ? 
        `Currently tracking ${incidentCount} incident${incidentCount > 1 ? 's' : ''}.` : 
        'All systems operational.';
      return `${service?.description || `Monitor ${service?.name || selectedServices[0]} status.`} ${statusText}`;
    }
    
    const serviceNames = selectedServices.map(s => SEO_CONFIG.services[s]?.name || s).join(', ');
    return `Monitor ${serviceNames} in real-time. Get instant notifications about service disruptions, outages, and maintenance windows.`;
  },

  // Generate keywords
  generateKeywords(selectedServices = []) {
    const { site } = SEO_CONFIG;
    
    if (selectedServices.length === 0) {
      return site.defaultKeywords;
    }
    
    const serviceKeywords = selectedServices
      .map(service => SEO_CONFIG.services[service]?.keywords || '')
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
      description: SEOUtils.generateDescription(selectedServices),
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
        const service = SEO_CONFIG.services[serviceId];
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
    const title = SEOUtils.generatePageTitle(selectedServices, incidentCount);
    const description = SEOUtils.generateDescription(selectedServices, incidentCount);
    const keywords = SEOUtils.generateKeywords(selectedServices);
    
    // Update document title
    document.title = title;
    
    // Update meta tags
    SEOUtils.updateMetaTag('name', 'description', description);
    SEOUtils.updateMetaTag('name', 'keywords', keywords);
    
    // Update Open Graph
    SEOUtils.updateMetaTag('property', 'og:title', title);
    SEOUtils.updateMetaTag('property', 'og:description', description);
    
    // Update Twitter Cards
    SEOUtils.updateMetaTag('name', 'twitter:title', title);
    SEOUtils.updateMetaTag('name', 'twitter:description', description);
    
    // Update canonical URL
    SEOUtils.updateCanonicalUrl(selectedServices);
    
    // Update structured data
    SEOUtils.updateStructuredData(selectedServices, serviceStatuses);
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
    const structuredData = SEOUtils.generateStructuredData(selectedServices, serviceStatuses);
    
    const script = document.createElement('script');
    script.id = 'dynamic-structured-data';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(structuredData, null, 2);
    document.head.appendChild(script);
  },

  // Get service data
  getServiceData(serviceId) {
    return SEO_CONFIG.services[serviceId] || null;
  },

  // Get all service data
  getAllServiceData() {
    return SEO_CONFIG.services;
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
export const SERVICE_SEO_DATA = SEO_CONFIG.services;

export default SEO_CONFIG;
