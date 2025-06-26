import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  // Remove all authentication for public access
  try {
    // Get counts of issues for each service for the last 24 hours
    const now = new Date();
    const hours = [];
    for (let i = 23; i >= 0; i--) {
      const d = new Date(now);
      d.setMinutes(0, 0, 0);
      d.setHours(now.getHours() - i);
      // Build full ISO timestamp for the hour start and end
      const hourStart = new Date(d);
      const hourEnd = new Date(d);
      hourEnd.setHours(hourEnd.getHours() + 1);
      hours.push({
        start: hourStart.toISOString(),
        end: hourEnd.toISOString(),
      });
    }
    // Query for each hour and each service
    const trend = {};
    for (const hour of hours) {
      const rows = await sql`
        SELECT service_name, COUNT(*) as count
        FROM issue_reports
        WHERE reported_at >= ${hour.start} AND reported_at < ${hour.end}
        GROUP BY service_name
      `;
      for (const row of rows) {
        if (!trend[row.service_name]) trend[row.service_name] = [];
        trend[row.service_name].push(Number(row.count));
      }
    }
    res.status(200).json({ hours: hours.map(h => h.start), trend });
  } catch (error) {
    res.status(500).json({ error: 'Database error', details: error.message });
  }
}
