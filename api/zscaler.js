let cachedData = null;
let cachedAt = 0;
const CACHE_DURATION = process.env.ZSCALER_CACHE_MS
  ? parseInt(process.env.ZSCALER_CACHE_MS, 10)
  : 5 * 60 * 1000; // 5 minutes

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*'); // Replace '*' with your domain in production
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const now = Date.now();
  if (cachedData && (now - cachedAt < CACHE_DURATION)) {
    res.setHeader('Content-Type', 'application/xml');
    return res.status(200).send(cachedData);
  }

  try {
    const response = await fetch('https://trust.zscaler.com/blog-feed');
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch Zscaler RSS feed' });
    }
    const xml = await response.text();
    cachedData = xml;
    cachedAt = now;
    res.setHeader('Content-Type', 'application/xml');
    res.status(200).send(xml);
  } catch (error) {
    console.error('Zscaler RSS proxy error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}