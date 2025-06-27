import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    // Get all issues from the last 24 hours with title, description, and timestamp
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
  } catch (error) {
    res.status(500).json({ error: 'Database error', details: error.message });
  }
}
