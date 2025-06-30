import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    // Get counts of issues for each service for today (calendar day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().slice(0, 10);
    
    // Define all services to ensure consistent response
    const allServices = ['Cloudflare', 'Okta', 'SendGrid', 'Zscaler', 'Slack', 'Datadog', 'AWS'];
    
    const result = await sql`
      SELECT service_name, COUNT(*) as count
      FROM issue_reports
      WHERE reported_at >= ${todayStr} AND reported_at < ${todayStr}::date + interval '1 day'
      GROUP BY service_name
    `;
    
    // Create a map of actual counts
    const countMap = {};
    result.forEach(row => {
      countMap[row.service_name] = Number(row.count);
    });
    
    // Ensure all services are present in the response
    const data = allServices.map(service => ({
      service_name: service,
      count: countMap[service] || 0
    }));
    
    res.status(200).json({ data });
  } catch (error) {
    res.status(500).json({ error: 'Database error', details: error.message });
  }
}

// No change needed here, as the query returns all services present in the DB for the last 24h.
