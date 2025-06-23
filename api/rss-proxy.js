export default async function handler(req, res) {
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
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).send(xml);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
