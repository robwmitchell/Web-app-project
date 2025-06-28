import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    // Get counts of issues for each service for the last 7 days
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      days.push(d.toISOString().slice(0, 10));
    }

    // Initialize trend object to ensure all services have complete arrays
    const trend = {};
    const services = ['Cloudflare', 'Okta', 'SendGrid', 'Zscaler', 'Slack', 'Datadog', 'AWS'];
    
    // Initialize all services with zeros
    services.forEach(service => {
      trend[service] = new Array(7).fill(0);
    });

    // Query for each day and populate actual counts
    for (let dayIndex = 0; dayIndex < days.length; dayIndex++) {
      const day = days[dayIndex];
      const rows = await sql`
        SELECT service_name, COUNT(*) as count
        FROM issue_reports
        WHERE reported_at >= ${day} AND reported_at < ${day}::date + interval '1 day'
        GROUP BY service_name
      `;
      
      // Update counts for services that have issues on this day
      for (const row of rows) {
        if (trend[row.service_name]) {
          trend[row.service_name][dayIndex] = Number(row.count);
        }
      }
    }
    
    res.status(200).json({ days, trend });
  } catch (error) {
    res.status(500).json({ error: 'Database error', details: error.message });
  }
}
