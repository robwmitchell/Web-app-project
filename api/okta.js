// pages/api/okta-summary.js
export default async function handler(req, res) {
  const response = await fetch('https://status.okta.com/api/v2/summary.json');
  const data = await response.json();
  res.status(200).json(data);

// Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*'); // Replace '*' with your domain in production
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}