// Polyfill fetch for Node.js < 18
let fetchImpl = globalThis.fetch;
if (!fetchImpl) {
  fetchImpl = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
}

import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

// Helper to fetch Cloudflare open incidents (optionally filter by last 24h)
async function fetchCloudflareIncidents(last24hDate = null) {
  try {
    const res = await fetchImpl('https://www.cloudflarestatus.com/api/v2/incidents/unresolved.json');
    const json = await res.json();
    let incidents = (json.incidents || []).map(inc => ({
      provider: 'Cloudflare',
      title: inc.name,
      description: inc.incident_updates?.[0]?.body || '',
      reported_at: inc.created_at,
      url: inc.shortlink || inc.url || '',
      id: `cloudflare-${inc.id}`,
    }));
    if (last24hDate) {
      incidents = incidents.filter(inc => {
        const date = new Date(inc.reported_at);
        return !isNaN(date) && date >= last24hDate;
      });
    }
    return incidents;
  } catch (err) {
    console.error('Cloudflare fetch error:', err);
    return [];
  }
}

// Helper to determine if an RSS item is open/unresolved
function isOpenRssItem(item) {
  const closedKeywords = [
    'resolved', 'closed', 'completed', 'restored', 'fixed', 'monitoring', 'mitigated', 'ended', 'recovered', 'restoration', 'no further issues', 'postmortem', 'post-mortem', 'final update'
  ];
  const text = ((item.title?.[0] || '') + ' ' + (item.description?.[0] || '')).toLowerCase();
  const isOpen = !closedKeywords.some(keyword => text.includes(keyword));
  console.log(`RSS item "${item.title?.[0] || 'No title'}" - is open: ${isOpen}`);
  return isOpen;
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
    // Only keep open/unresolved items from last N days
    const now = new Date();
    const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return items
      .filter(isOpenRssItem)
      .map(item => ({
        provider,
        title: item.title?.[0] || provider,
        description: item.description?.[0] || '',
        reported_at: item.pubDate?.[0] || '',
        url: item.link?.[0] || '',
        id: `${provider.toLowerCase()}-${item.guid?.[0]?._ || item.title?.[0]}`,
      }))
      .filter(item => {
        const date = new Date(item.reported_at);
        return !isNaN(date) && date >= since;
      });
  } catch (err) {
    console.error(`${provider} RSS fetch error:`, err);
    return [];
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    // Get time range for last 7 days
    const now = new Date();
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // 1. Cloudflare open incidents (created in last 7 days only)
    const cloudflareIncidents = await fetchCloudflareIncidents(last7d);
    console.log(`Cloudflare incidents found: ${cloudflareIncidents.length}`);

    // 2. Zscaler, Okta, SendGrid RSS feeds (last 7 days)
    const [zscaler, okta, sendgrid] = await Promise.all([
      fetchRSSFeed('https://trust.zscaler.com/rss', 'Zscaler', 7),
      fetchRSSFeed('https://status.okta.com/history.rss', 'Okta', 7),
      fetchRSSFeed('https://status.sendgrid.com/history.rss', 'SendGrid', 7),
    ]);

    console.log(`RSS results - Zscaler: ${zscaler.length}, Okta: ${okta.length}, SendGrid: ${sendgrid.length}`);

    // Merge all (only RSS feeds and Cloudflare API)
    const all = [
      ...cloudflareIncidents,
      ...zscaler,
      ...okta,
      ...sendgrid,
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
