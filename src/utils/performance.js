// Performance and SEO utilities for Stack Status IO
// This file contains utilities for performance optimization and SEO enhancement

// Lazy loading images with proper SEO attributes
export function createOptimizedImage(src, alt, width = null, height = null) {
  const img = document.createElement('img');
  img.src = src;
  img.alt = alt;
  img.loading = 'lazy';
  img.decoding = 'async';
  
  if (width) img.width = width;
  if (height) img.height = height;
  
  // Add structured data for images
  img.setAttribute('itemProp', 'image');
  
  return img;
}

// Preload critical resources
export function preloadCriticalResources() {
  const criticalResources = [
    { href: '/logo.png', as: 'image', type: 'image/png' },
    { href: '/manifest.json', as: 'fetch', type: 'application/json' },
    { href: '/src/main.jsx', as: 'script', type: 'application/javascript' }
  ];

  criticalResources.forEach(resource => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = resource.href;
    link.as = resource.as;
    if (resource.type) link.type = resource.type;
    document.head.appendChild(link);
  });
}

// Generate service-specific canonical URLs
export function updateCanonicalUrl(selectedServices = []) {
  let canonicalUrl = 'https://stack-status.io';
  
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
}

// Add hreflang tags for international SEO (if needed in future)
export function addHreflangTags() {
  const hreflangs = [
    { lang: 'en', href: 'https://stack-status.io' },
    { lang: 'x-default', href: 'https://stack-status.io' }
    // Add more languages as needed:
    // { lang: 'es', href: 'https://stack-status.io/es' },
    // { lang: 'fr', href: 'https://stack-status.io/fr' }
  ];

  hreflangs.forEach(item => {
    const link = document.createElement('link');
    link.rel = 'alternate';
    link.hreflang = item.lang;
    link.href = item.href;
    document.head.appendChild(link);
  });
}

// Generate rich snippets for service status
export function generateServiceStatusSnippet(service, status, lastUpdated) {
  return {
    '@context': 'https://schema.org',
    '@type': 'MonitoringService',
    name: `${service} Status Monitor`,
    description: `Real-time status monitoring for ${service}`,
    provider: {
      '@type': 'Organization',
      name: 'Stack Status IO'
    },
    serviceType: 'Status Monitoring',
    areaServed: 'Worldwide',
    availableAtOrFrom: {
      '@type': 'WebSite',
      url: 'https://stack-status.io'
    },
    potentialAction: {
      '@type': 'MonitorAction',
      name: `Monitor ${service} Status`,
      target: `https://stack-status.io/#${service}`
    },
    result: {
      '@type': 'StatusUpdate',
      name: status,
      dateModified: lastUpdated
    }
  };
}

// Performance monitoring and reporting
export function initPerformanceMonitoring() {
  // Monitor Core Web Vitals
  if ('web-vital' in window) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(console.log);
      getFID(console.log);
      getFCP(console.log);
      getLCP(console.log);
      getTTFB(console.log);
    });
  }

  // Monitor resource loading
  if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        // Log slow resources
        if (entry.duration > 1000) {
          console.warn('Slow resource:', entry.name, entry.duration);
        }
      }
    });
    observer.observe({ entryTypes: ['resource'] });
  }
}

// Cache management for better performance
export class ServiceWorkerCache {
  static async cacheResources() {
    if ('serviceWorker' in navigator && 'caches' in window) {
      const cache = await caches.open('stack-status-v1');
      const resourcesToCache = [
        '/',
        '/logo.png',
        '/manifest.json',
        '/logos/aws-logo.png',
        '/logos/cloudflare-logo.svg',
        '/logos/Okta-logo.svg',
        '/logos/Zscaler.svg',
        '/logos/SendGrid.svg',
        '/logos/slack-logo.png',
        '/logos/datadog-logo.png'
      ];
      
      await cache.addAll(resourcesToCache);
    }
  }

  static async clearOldCaches() {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      const oldCaches = cacheNames.filter(name => name !== 'stack-status-v1');
      
      await Promise.all(
        oldCaches.map(name => caches.delete(name))
      );
    }
  }
}

// SEO-friendly URL management
export class SEOUrlManager {
  static updateUrlWithoutReload(selectedServices, incidentId = null) {
    if (!window.history?.pushState) return;

    let newUrl = window.location.origin;
    const params = new URLSearchParams();
    
    if (selectedServices?.length > 0) {
      params.set('services', selectedServices.join(','));
    }
    
    if (incidentId) {
      params.set('incident', incidentId);
    }
    
    const queryString = params.toString();
    if (queryString) {
      newUrl += `?${queryString}`;
    }
    
    window.history.pushState(
      { selectedServices, incidentId },
      document.title,
      newUrl
    );
  }

  static parseUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const services = params.get('services')?.split(',').filter(Boolean) || [];
    const incidentId = params.get('incident');
    
    return { services, incidentId };
  }
}

export default {
  createOptimizedImage,
  preloadCriticalResources,
  updateCanonicalUrl,
  addHreflangTags,
  generateServiceStatusSnippet,
  initPerformanceMonitoring,
  ServiceWorkerCache,
  SEOUrlManager
};
