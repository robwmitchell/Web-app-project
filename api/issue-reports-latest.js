import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const endpoint = req.query.endpoint || 'latest';

  try {
    if (endpoint === 'today') {
      // Get counts of issues for each service for today (calendar day)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().slice(0, 10);
      
      // Define all services to ensure consistent response
      const allServices = ['Cloudflare', 'Okta', 'SendGrid', 'Zscaler', 'Slack', 'Datadog', 'AWS'];
      
      const result = await sql`
        SELECT service_name, COUNT(*) as count
        FROM issue_reports
        WHERE DATE_TRUNC('day', reported_at) = ${todayStr}::date
        GROUP BY service_name
      `;

      // Create response object with all services, defaulting to 0
      const counts = {};
      allServices.forEach(service => {
        counts[service] = 0;
      });

      // Fill in actual counts
      result.forEach(row => {
        if (counts.hasOwnProperty(row.service_name)) {
          counts[row.service_name] = parseInt(row.count, 10);
        }
      });

      res.status(200).json({ today: todayStr, counts });
      
    } else if (endpoint === 'trend') {
      // Get 7-day trend data
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
      
    } else {
      // Default: Get all issues from the last 24 hours with title, description, and timestamp
      const now = new Date();
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const last24hStr = last24h.toISOString();
      const result = await sql`
        SELECT id, service_name, title, description, reported_at
        FROM issue_reports
        WHERE reported_at >= ${last24hStr}
        ORDER BY reported_at DESC
      `;
      res.status(200).json({ data: result });
    }
    
  } catch (error) {
    res.status(500).json({ error: 'Database error', details: error.message });
  }
}
