export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*'); // Replace '*' with your domain in production
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const url = req.query.url || req.body?.url || req.headers['x-rss-url'];
    if (!url) {
      return res.status(400).json({ error: 'Missing RSS feed URL' });
    }
    const response = await fetch(url);
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch RSS feed' });
    }
    const xml = await response.text();
    res.status(200).send(xml);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
