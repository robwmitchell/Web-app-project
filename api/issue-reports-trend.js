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
    // Query for each day and each service
    const trend = {};
    for (const day of days) {
      const rows = await sql`
        SELECT service_name, COUNT(*) as count
        FROM issue_reports
        WHERE reported_at >= ${day} AND reported_at < ${day}::date + interval '1 day'
        GROUP BY service_name
      `;
      for (const row of rows) {
        if (!trend[row.service_name]) trend[row.service_name] = [];
        trend[row.service_name].push(Number(row.count));
      }
    }
    res.status(200).json({ days, trend });
  } catch (error) {
    res.status(500).json({ error: 'Database error', details: error.message });
  }
}
