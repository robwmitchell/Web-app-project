export default async function handler(req, res) {
  try {
    const response = await fetch('https://trust.zscaler.com/blog-feed');
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch Zscaler RSS feed' });
    }
    const xml = await response.text();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).send(xml);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
