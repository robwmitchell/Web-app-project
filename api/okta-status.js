export default async function handler(req, res) {
  const response = await fetch('https://status.okta.com/api/v2/status.json');
  const data = await response.json();
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json(data);
}