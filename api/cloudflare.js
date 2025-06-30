export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const endpoint = req.query.endpoint || 'status';
    let url;
    
    switch (endpoint) {
      case 'status':
        url = 'https://www.cloudflarestatus.com/api/v2/status.json';
        break;
      case 'summary':
        url = 'https://www.cloudflarestatus.com/api/v2/summary.json';
        break;
      default:
        return res.status(400).json({ error: 'Invalid endpoint. Use "status" or "summary"' });
    }

    const response = await fetch(url);
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch Cloudflare API' });
    }
    
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Cloudflare API proxy error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
