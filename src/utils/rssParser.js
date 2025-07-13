// RSS parsing utilities for custom RSS feeds
// Supports both RSS 2.0 and Atom formats

export function parseCustomRSS(xmlText, maxItems = 25) {
  try {
    const cleanXml = xmlText.trim().replace(/^\uFEFF/, '');
    const parser = new DOMParser();
    const xml = parser.parseFromString(cleanXml, 'text/xml');
    
    const parserError = xml.querySelector('parsererror');
    if (parserError) {
      throw new Error('XML parsing failed: ' + parserError.textContent);
    }
    
    let items = Array.from(xml.querySelectorAll('item')); // RSS 2.0
    if (items.length === 0) {
      items = Array.from(xml.querySelectorAll('entry')); // Atom
    }
    
    if (items.length === 0) {
      console.warn('[RSS] No items found in feed');
      return [];
    }
    
    return items.slice(0, maxItems).map((item, index) => {
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
      
      const cleanDescription = description.replace(/<[^>]*>/g, '').trim();
      
      return {
        id: `custom-${index}-${Date.now()}`,
        title,
        link,
        date,
        description: cleanDescription,
        eventType: categorizeEvent(title, cleanDescription),
        severity: determineSeverity(title, cleanDescription),
        reported_at: date, // Standardize date field name
        url: link // Standardize URL field name
      };
    }).filter(item => item.title);
    
  } catch (error) {
    console.error('[RSS] Error parsing RSS XML:', error);
    throw new Error(`RSS parsing failed: ${error.message}`);
  }
}

export function categorizeEvent(title, description) {
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

export function determineSeverity(title, description) {
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

export function determineStatusFromItems(items) {
  if (!items || items.length === 0) {
    return 'Operational';
  }
  
  // Check for unresolved critical/major issues
  const unresolved = items.filter(item => 
    item.eventType !== 'resolved' && 
    item.eventType !== 'maintenance'
  );
  
  if (unresolved.length === 0) {
    return 'Operational';
  }
  
  // Check severity of unresolved issues
  const hasCritical = unresolved.some(item => item.severity === 'critical');
  const hasMajor = unresolved.some(item => item.severity === 'major');
  
  if (hasCritical) {
    return 'Critical Issues';
  } else if (hasMajor) {
    return 'Major Issues';
  } else {
    return 'Minor Issues';
  }
}
