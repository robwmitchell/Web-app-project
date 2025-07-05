// Service logos using absolute public URLs for reliable web access
export const serviceLogos = {
  // Proper case versions
  'Cloudflare': '/logos/cloudflare-logo.svg',
  'Okta': '/logos/Okta-logo.svg',
  'SendGrid': '/logos/SendGrid.svg',
  'Zscaler': '/logos/Zscaler.svg',
  'Slack': '/logos/slack-logo.png',
  'Datadog': '/logos/datadog-logo.png',
  'AWS': '/logos/aws-logo.png',
  // Lowercase versions to handle case variations
  'cloudflare': '/logos/cloudflare-logo.svg',
  'okta': '/logos/Okta-logo.svg',
  'sendgrid': '/logos/SendGrid.svg',
  'zscaler': '/logos/Zscaler.svg',
  'slack': '/logos/slack-logo.png',
  'datadog': '/logos/datadog-logo.png',
  'aws': '/logos/aws-logo.png',
};

// Helper function to get service logo with fallback
export const getServiceLogo = (serviceName) => {
  if (!serviceName) return null;
  
  // Try exact match first
  let logo = serviceLogos[serviceName];
  if (logo) return logo;
  
  // Try lowercase match
  logo = serviceLogos[serviceName.toLowerCase()];
  if (logo) return logo;
  
  // Try finding partial matches
  const keys = Object.keys(serviceLogos);
  const partialMatch = keys.find(key => 
    key.toLowerCase().includes(serviceName.toLowerCase()) ||
    serviceName.toLowerCase().includes(key.toLowerCase())
  );
  
  return partialMatch ? serviceLogos[partialMatch] : null;
};
