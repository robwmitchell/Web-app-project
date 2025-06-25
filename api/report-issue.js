import { neon } from '@neondatabase/serverless';

// Use the environment variable for your connection string
const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Debug: log the incoming request body
  console.log('Incoming report-issue body:', req.body);

  const { service_name, impacted_provider, description, user_email, status, metadata } = req.body;

  // Debug: log the extracted service_name and impacted_provider
  console.log('Extracted service_name:', service_name);
  console.log('Extracted impacted_provider:', impacted_provider);

  if (!service_name || !description) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  try {
    const result = await sql`
      INSERT INTO issue_reports (service_name, impacted_provider, description, user_email, status, metadata)
      VALUES (
        ${service_name},
        ${impacted_provider || null},
        ${description},
        ${user_email || null},
        ${status || 'open'},
        ${metadata ? JSON.stringify(metadata) : null}
      )
      RETURNING id, reported_at;
    `;
    res.status(200).json({ success: true, id: result[0].id, reported_at: result[0].reported_at });
  } catch (error) {
    res.status(500).json({ error: 'Database error', details: error.message });
  }
}
