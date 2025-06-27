import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

// Helper to fetch Cloudflare open incidents
async function fetchCloudflareIncidents() {
  try {
    const res = await fetch('https://www.cloudflarestatus.com/api/v2/incidents/unresolved.json');
    const json = await res.json();
    return (json.incidents || []).map(inc => ({
      provider: 'Cloudflare',
      title: inc.name,
      description: inc.incident_updates?.[0]?.body || '',
      reported_at: inc.created_at,
      url: inc.shortlink || inc.url || '',
      id: `cloudflare-${inc.id}`,
    }));
  } catch {
    return [];
  }
}

// Helper to fetch and parse RSS feeds (Zscaler, Okta, SendGrid)
async function fetchRSSFeed(url, provider) {
  try {
    const res = await fetch(url);
    const text = await res.text();
    const parser = require('xml2js');
    let items = [];
    await parser.parseStringPromise(text).then(result => {
      items = result.rss.channel[0].item || [];
    });
    // Only keep items from last 24h
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    return items
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
        return !isNaN(date) && date >= last24h;
      });
  } catch {
    return [];
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    // 1. User-reported issues from DB (last 24h)
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last24hStr = last24h.toISOString();
    const dbIssues = await sql`
      SELECT id, service_name as provider, title, description, reported_at
      FROM issue_reports
      WHERE reported_at >= ${last24hStr}
      ORDER BY reported_at DESC
    `;

    // 2. Cloudflare open incidents (last 24h)
    const cloudflareIncidents = await fetchCloudflareIncidents();

    // 3. Zscaler, Okta, SendGrid RSS feeds (last 24h)
    const [zscaler, okta, sendgrid] = await Promise.all([
      fetchRSSFeed('https://trust.zscaler.com/rss', 'Zscaler'),
      fetchRSSFeed('https://status.okta.com/history.rss', 'Okta'),
      fetchRSSFeed('https://status.sendgrid.com/history.rss', 'SendGrid'),
    ]);

    // Merge all
    const all = [
      ...dbIssues,
      ...cloudflareIncidents,
      ...zscaler,
      ...okta,
      ...sendgrid,
    ];
    // Sort by reported_at desc
    all.sort((a, b) => new Date(b.reported_at) - new Date(a.reported_at));
    res.status(200).json({ data: all });
  } catch (error) {
    res.status(500).json({ error: 'Error aggregating notifications', details: error.message });
  }
}
