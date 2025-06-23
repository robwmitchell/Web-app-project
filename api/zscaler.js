export default async function handler(req, res) {
  try {
    const response = await fetch('https://trust.zscaler.com/api/v1/components');
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch Zscaler data' });
    }
    const data = await response.json();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
}