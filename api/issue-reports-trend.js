import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const services = ['Cloudflare', 'Okta', 'SendGrid', 'Zscaler', 'Slack', 'Datadog', 'AWS'];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      days.push(d.toISOString().slice(0, 10));
    }

    // Query all counts in one go
    const rows = await sql`
      SELECT service_name, DATE_TRUNC('day', reported_at) AS day, COUNT(*) as count
      FROM issue_reports
      WHERE reported_at >= NOW() - INTERVAL '6 days'
      GROUP BY service_name, day
      ORDER BY service_name, day
    `;

    // Build trend object
    const trend = {};
    services.forEach(service => {
      trend[service] = new Array(7).fill(0);
    });

    for (const row of rows) {
      const service = row.service_name;
      const dayStr = row.day.toISOString().slice(0, 10);
      const dayIndex = days.indexOf(dayStr);
      if (trend[service] && dayIndex !== -1) {
        trend[service][dayIndex] = Number(row.count);
      }
    }

    res.status(200).json({ days, trend });
  } catch (error) {
    res.status(500).json({ error: 'Database error', details: error.message });
  }
}
