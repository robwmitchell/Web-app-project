// Force redeploy
export default async function handler(req, res) {
  const response = await fetch('https://trust.zscaler.com/api/v1/components');
  const data = await response.json();
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json(data);
}