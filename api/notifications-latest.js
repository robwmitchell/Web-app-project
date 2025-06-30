// Polyfill fetch for Node.js < 18
let fetchImpl = globalThis.fetch;
if (!fetchImpl) {
  fetchImpl = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
}

import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

// Helper to fetch Cloudflare incidents (all in last 7 days, regardless of resolved status)
async function fetchCloudflareIncidents(days = 7) {
  try {
    const res = await fetchImpl('https://www.cloudflarestatus.com/api/v2/summary.json');
    const json = await res.json();
    const now = new Date();
    const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    let incidents = (json.incidents || [])
      .filter(inc => {
        // Include if created or updated in last 7 days
        const created = new Date(inc.created_at);
        const updated = new Date(inc.updated_at);
        return (!isNaN(created) && created >= since) || (!isNaN(updated) && updated >= since);
      })
      .map(inc => ({
        provider: 'Cloudflare',
        title: inc.name,
        description: inc.incident_updates?.[0]?.body || '',
        reported_at: inc.created_at,
        url: inc.shortlink || inc.url || '',
        id: `cloudflare-${inc.id}`,
        impact: inc.impact,
        status: inc.status,
        resolved_at: inc.resolved_at,
        updated_at: inc.updated_at,
      }));
    return incidents;
  } catch (err) {
    console.error('Cloudflare fetch error:', err);
    return [];
  }
}

// Helper to determine if an RSS item is open/unresolved (less restrictive)
function isOpenRssItem(item) {
  const closedKeywords = [
    'resolved', 'closed', 'completed', 'restored', 'postmortem', 'post-mortem', 'final update', 'no further issues'
  ];
  const text = ((item.title?.[0] || '') + ' ' + (item.description?.[0] || '')).toLowerCase();
  return !closedKeywords.some(keyword => text.includes(keyword));
}

// Helper to fetch and parse RSS feeds (Zscaler, Okta, SendGrid)
async function fetchRSSFeed(url, provider, days = 1) {
  try {
    const res = await fetchImpl(url);
    const text = await res.text();
    const parser = require('xml2js');
    let items = [];
    await parser.parseStringPromise(text).then(result => {
      items = result.rss.channel[0].item || [];
    });
    
    // Get time range
    const now = new Date();
    const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    
    // Map all items first, then filter by date only (no keyword filtering for now)
    const mappedItems = items.map(item => {
      // Handle different RSS structures
      const title = Array.isArray(item.title) ? item.title[0] : item.title || '';
      const description = Array.isArray(item.description) ? item.description[0] : item.description || '';
      const pubDate = Array.isArray(item.pubDate) ? item.pubDate[0] : item.pubDate || '';
      const link = Array.isArray(item.link) ? item.link[0] : item.link || '';
      const guid = item.guid && typeof item.guid === 'object' ? (item.guid._ || item.guid['#text']) : 
                   Array.isArray(item.guid) ? item.guid[0] : item.guid || '';
      
      return {
        provider,
        title: title || provider,
        description: description,
        reported_at: pubDate,
        url: link,
        id: `${provider.toLowerCase()}-${guid || title}`,
      };
    });
    
    // Filter by date only for now to see all recent items
    const filtered = mappedItems.filter(item => {
      const date = new Date(item.reported_at);
      return !isNaN(date) && date >= since;
    });
    
    console.log(`${provider} RSS: Found ${items.length} total items, ${filtered.length} within ${days} days`);
    return filtered;
  } catch (err) {
    console.error(`${provider} RSS fetch error:`, err);
    return [];
  }
}

export default async function handler(req, res) {
  res.setHeader('x-content-type-options', 'nosniff');
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    // Get time range for last 7 days
    const now = new Date();
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // 1. Cloudflare incidents (all in last 14 days)
    const cloudflareIncidents = await fetchCloudflareIncidents(14);
    console.log(`Cloudflare incidents found: ${cloudflareIncidents.length}`);

    // 2. RSS feeds (last 14 days to catch more incidents)
    const [zscaler, slack, datadog, aws] = await Promise.all([
      fetchRSSFeed('https://trust.zscaler.com/blog-feed', 'Zscaler', 14),
      fetchRSSFeed('https://status.slack.com/feed/rss', 'Slack', 14),
      fetchRSSFeed('https://status.datadoghq.eu/history.rss', 'Datadog', 14),
      fetchRSSFeed('https://status.aws.amazon.com/rss/all.rss', 'AWS', 14),
    ]);

    console.log(`RSS results - Zscaler: ${zscaler.length}, Slack: ${slack.length}, Datadog: ${datadog.length}, AWS: ${aws.length}`);

    // Merge all (Cloudflare API and all RSS feeds)
    const all = [
      ...cloudflareIncidents,
      ...zscaler,
      ...slack,
      ...datadog,
      ...aws,
    ];
    console.log(`Total notifications: ${all.length}`);
    
    // Sort by reported_at desc
    all.sort((a, b) => new Date(b.reported_at) - new Date(a.reported_at));
    res.status(200).json({ data: all });
  } catch (error) {
    console.error('Notifications API error:', error);
    res.status(500).json({ error: 'Error aggregating notifications', details: error.message });
  }
}
