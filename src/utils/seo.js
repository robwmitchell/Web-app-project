import React, { useEffect } from 'react';

// SEO component for managing meta tags and structured data
export const SEOHead = ({ 
  title = 'Stack Status IO - Real-Time Service Status Monitoring Dashboard',
  description = 'Monitor the real-time status of critical cloud services including AWS, Cloudflare, Okta, Zscaler, SendGrid, Slack, and Datadog. Get instant notifications about service disruptions, outages, and maintenance windows.',
  keywords = 'service status, monitoring, dashboard, AWS status, Cloudflare status, Okta status, Zscaler status, SendGrid status, Slack status, Datadog status, cloud services, uptime monitoring, service outage, incident tracking',
  selectedServices = null,
  serviceStatuses = {}
}) => {
  useEffect(() => {
    // Update document title
    document.title = title;

    // Update meta description
    updateMetaTag('name', 'description', description);
    updateMetaTag('name', 'keywords', keywords);

    // Update Open Graph tags
    updateMetaTag('property', 'og:title', title);
    updateMetaTag('property', 'og:description', description);

    // Update Twitter tags
    updateMetaTag('name', 'twitter:title', title);
    updateMetaTag('name', 'twitter:description', description);

    // Update structured data for selected services
    updateStructuredData(selectedServices, serviceStatuses);
  }, [title, description, keywords, selectedServices, serviceStatuses]);

  return null; // This component doesn't render anything
};

// Helper function to update meta tags
function updateMetaTag(attribute, attributeValue, content) {
  let meta = document.querySelector(`meta[${attribute}="${attributeValue}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute(attribute, attributeValue);
    document.getElementsByTagName('head')[0].appendChild(meta);
  }
  meta.content = content;
}

// Update structured data for better SEO
function updateStructuredData(selectedServices, serviceStatuses) {
  // Remove existing structured data
  const existingStructuredData = document.querySelector('#seo-structured-data');
  if (existingStructuredData) {
    existingStructuredData.remove();
  }

  // Create new structured data
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Stack Status IO",
    "description": "Real-time service status monitoring dashboard for critical cloud services",
    "url": "https://stack-status-io.vercel.app",
    "applicationCategory": "UtilityApplication",
    "operatingSystem": "Web Browser",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "creator": {
      "@type": "Organization",
      "name": "Stack Status IO"
    },
    "featureList": [
      "Real-time status monitoring",
      "Service disruption alerts",
      "Multi-service dashboard",
      "Incident tracking",
      "Customizable notifications"
    ]
  };

  // Add monitored services information
  if (selectedServices && selectedServices.length > 0) {
    const serviceInfo = selectedServices.map(serviceId => {
      const serviceNames = {
        'aws': 'Amazon Web Services',
        'cloudflare': 'Cloudflare',
        'okta': 'Okta',
        'zscaler': 'Zscaler',
        'sendgrid': 'SendGrid',
        'slack': 'Slack',
        'datadog': 'Datadog'
      };

      const serviceUrls = {
        'aws': 'https://status.aws.amazon.com/',
        'cloudflare': 'https://www.cloudflarestatus.com/',
        'okta': 'https://status.okta.com/',
        'zscaler': 'https://trust.zscaler.com/',
        'sendgrid': 'https://status.sendgrid.com/',
        'slack': 'https://status.slack.com/',
        'datadog': 'https://status.datadoghq.com/'
      };

      const status = serviceStatuses[serviceId];
      return {
        "@type": "Service",
        "name": serviceNames[serviceId] || serviceId,
        "url": serviceUrls[serviceId],
        "serviceType": "Cloud Service",
        "areaServed": "Global",
        "availableChannel": {
          "@type": "ServiceChannel",
          "serviceUrl": serviceUrls[serviceId],
          "serviceName": `${serviceNames[serviceId]} Status Page`
        },
        ...(status && {
          "serviceOutput": {
            "@type": "Thing",
            "name": "Service Status",
            "description": status.status || "Unknown"
          }
        })
      };
    });

    structuredData.about = serviceInfo;
    structuredData.mainEntity = {
      "@type": "ItemList",
      "itemListElement": serviceInfo.map((service, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": service
      }))
    };
  }

  // Add availability information
  const currentTime = new Date().toISOString();
  structuredData.availabilityStarts = currentTime;
  structuredData.availabilityEnds = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(); // 1 year from now

  // Create and inject the structured data script
  const script = document.createElement('script');
  script.id = 'seo-structured-data';
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(structuredData, null, 2);
  document.getElementsByTagName('head')[0].appendChild(script);
}

// Generate dynamic SEO content based on selected services and their statuses
export function generateSEOContent(selectedServices, serviceStatuses) {
  if (!selectedServices || selectedServices.length === 0) {
    return {
      title: 'Stack Status IO - Real-Time Service Status Monitoring Dashboard',
      description: 'Monitor the real-time status of critical cloud services including AWS, Cloudflare, Okta, Zscaler, SendGrid, Slack, and Datadog. Get instant notifications about service disruptions, outages, and maintenance windows.',
      keywords: 'service status, monitoring, dashboard, AWS status, Cloudflare status, Okta status, Zscaler status, SendGrid status, Slack status, Datadog status, cloud services, uptime monitoring, service outage, incident tracking'
    };
  }

  const serviceNames = selectedServices.map(service => {
    const nameMap = {
      'aws': 'AWS',
      'cloudflare': 'Cloudflare',
      'okta': 'Okta',
      'zscaler': 'Zscaler',
      'sendgrid': 'SendGrid',
      'slack': 'Slack',
      'datadog': 'Datadog'
    };
    return nameMap[service] || service.charAt(0).toUpperCase() + service.slice(1);
  });

  // Check for any issues
  const hasIssues = selectedServices.some(serviceId => {
    const status = serviceStatuses[serviceId];
    return status && status.status && !status.status.toLowerCase().includes('operational');
  });

  const servicesText = serviceNames.join(', ');
  const statusText = hasIssues ? 'Service Issues Detected' : 'All Systems Operational';
  
  const title = `${servicesText} Status - ${statusText} | Stack Status IO`;
  const description = `Current status of ${servicesText}: ${statusText}. Monitor real-time service health, get instant notifications about outages, incidents, and maintenance windows.`;
  const keywords = `${servicesText.toLowerCase().replace(/,/g, ' status,')} status, ${servicesText.toLowerCase().replace(/,/g, ' monitoring,')} monitoring, service health, uptime tracking, incident alerts, ${serviceNames.map(name => name.toLowerCase()).join(' outage, ')} outage, cloud services status`;

  return { title, description, keywords };
}

export default SEOHead;
