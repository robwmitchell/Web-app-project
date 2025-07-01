export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { feedUrl, serviceName, maxItems = 25 } = req.body;

    if (!feedUrl || !serviceName) {
      return res.status(400).json({ error: 'feedUrl and serviceName are required' });
    }

    // Validate URL format
    try {
      new URL(feedUrl);
    } catch {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    console.log(`[RSS] Fetching custom RSS feed: ${feedUrl} for service: ${serviceName}`);

    // Fetch the RSS feed
    const response = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'StackStatus-Bot/1.0',
        'Accept': 'application/rss+xml, application/xml, text/xml',
      },
      timeout: 10000,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const xmlText = await response.text();
    
    // Parse the RSS feed
    const items = parseCustomRSS(xmlText, maxItems);
    
    // Determine status based on recent items
    const status = determineStatusFromItems(items);
    
    console.log(`[RSS] Successfully parsed ${items.length} items for ${serviceName}, status: ${status}`);
    
    return res.status(200).json({
      serviceName,
      feedUrl,
      status,
      updates: items,
      lastUpdated: new Date().toISOString(),
      itemCount: items.length
    });

  } catch (error) {
    console.error('[RSS] Error fetching custom RSS feed:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch RSS feed',
      details: error.message 
    });
  }
}

function parseCustomRSS(xmlText, maxItems = 25) {
  try {
    // Remove any BOM or whitespace at the start
    const cleanXml = xmlText.trim().replace(/^\uFEFF/, '');
    
    const parser = new DOMParser();
    const xml = parser.parseFromString(cleanXml, 'text/xml');
    
    // Check for parsing errors
    const parserError = xml.querySelector('parsererror');
    if (parserError) {
      throw new Error('XML parsing failed: ' + parserError.textContent);
    }
    
    // Try different RSS formats
    let items = Array.from(xml.querySelectorAll('item')); // RSS 2.0
    if (items.length === 0) {
      items = Array.from(xml.querySelectorAll('entry')); // Atom
    }
    
    if (items.length === 0) {
      console.warn('[RSS] No items found in feed');
      return [];
    }
    
    return items.slice(0, maxItems).map((item, index) => {
      // Handle both RSS and Atom formats
      const isAtom = item.tagName === 'entry';
      
      const title = isAtom 
        ? item.querySelector('title')?.textContent?.trim() || ''
        : item.querySelector('title')?.textContent?.trim() || '';
        
      const link = isAtom
        ? item.querySelector('link')?.getAttribute('href') || item.querySelector('link')?.textContent?.trim() || ''
        : item.querySelector('link')?.textContent?.trim() || '';
        
      const dateEl = isAtom
        ? item.querySelector('updated, published')
        : item.querySelector('pubDate, dc\\:date, date');
      const date = dateEl?.textContent?.trim() || '';
      
      const description = isAtom
        ? item.querySelector('summary, content')?.textContent?.trim() || ''
        : item.querySelector('description, content\\:encoded')?.textContent?.trim() || '';
      
      // Clean up HTML from description
      const cleanDescription = description.replace(/<[^>]*>/g, '').trim();
      
      return {
        id: `custom-${index}-${Date.now()}`,
        title,
        link,
        date,
        description: cleanDescription,
        eventType: categorizeEvent(title, cleanDescription),
        severity: determineSeverity(title, cleanDescription)
      };
    }).filter(item => item.title); // Filter out items without titles
    
  } catch (error) {
    console.error('[RSS] Error parsing RSS XML:', error);
    throw new Error(`RSS parsing failed: ${error.message}`);
  }
}

function categorizeEvent(title, description) {
  const content = (title + ' ' + description).toLowerCase();
  
  if (content.includes('resolved') || content.includes('fixed') || content.includes('completed')) {
    return 'resolved';
  }
  if (content.includes('investigating') || content.includes('ongoing') || content.includes('incident')) {
    return 'incident';
  }
  if (content.includes('maintenance') || content.includes('scheduled') || content.includes('update')) {
    return 'maintenance';
  }
  if (content.includes('degraded') || content.includes('slow') || content.includes('performance')) {
    return 'degradation';
  }
  if (content.includes('outage') || content.includes('down') || content.includes('unavailable')) {
    return 'outage';
  }
  
  return 'update';
}

function determineSeverity(title, description) {
  const content = (title + ' ' + description).toLowerCase();
  
  if (content.includes('critical') || content.includes('outage') || content.includes('down')) {
    return 'critical';
  }
  if (content.includes('major') || content.includes('significant') || content.includes('widespread')) {
    return 'major';
  }
  if (content.includes('minor') || content.includes('partial') || content.includes('limited')) {
    return 'minor';
  }
  
  return 'info';
}

function determineStatusFromItems(items) {
  if (!items || items.length === 0) {
    return 'Operational';
  }
  
  // Get the most recent items (last 24 hours worth or first 5, whichever is less)
  const recentItems = items.slice(0, 5);
  
  // Check for active incidents
  const hasActiveIncident = recentItems.some(item => {
    const content = (item.title + ' ' + item.description).toLowerCase();
    return (
      item.eventType === 'incident' ||
      item.eventType === 'outage' ||
      item.severity === 'critical' ||
      (content.includes('investigating') && !content.includes('resolved')) ||
      (content.includes('ongoing') && !content.includes('resolved')) ||
      (content.includes('down') && !content.includes('resolved'))
    );
  });
  
  if (hasActiveIncident) {
    return 'Issues Detected';
  }
  
  // Check for degraded performance
  const hasDegradation = recentItems.some(item => {
    return item.eventType === 'degradation' || item.severity === 'major';
  });
  
  if (hasDegradation) {
    return 'Degraded Performance';
  }
  
  // Check for maintenance
  const hasMaintenance = recentItems.some(item => {
    return item.eventType === 'maintenance';
  });
  
  if (hasMaintenance) {
    return 'Under Maintenance';
  }
  
  return 'Operational';
}
