import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  // Remove all authentication for public access
  try {
    // Get counts of issues for each service for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().slice(0, 10);
    const result = await sql`
      SELECT service_name, COUNT(*) as count
      FROM issue_reports
      WHERE reported_at >= ${todayStr} AND reported_at < ${todayStr}::date + interval '1 day'
      GROUP BY service_name
    `;
    res.status(200).json({ data: result });
  } catch (error) {
    res.status(500).json({ error: 'Database error', details: error.message });
  }
}
