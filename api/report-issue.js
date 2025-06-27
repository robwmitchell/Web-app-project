import { neon } from '@neondatabase/serverless';

// Use the environment variable for your connection string
const sql = neon(process.env.DATABASE_URL);

function sanitizeString(str, maxLen = 500) {
  if (typeof str !== 'string') return '';
  return str.replace(/[<>$;]/g, '').trim().slice(0, maxLen);
}

function isValidEmail(email) {
  return typeof email === 'string' && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

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

  // Honeypot spam protection
  if (req.body.website && req.body.website.trim() !== "") {
    res.status(400).json({ error: "Spam detected." });
    return;
  }

  // Validate required fields
  if (!service_name || !description) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  // Sanitize inputs
  const safeService = sanitizeString(service_name, 100);
  const safeProvider = sanitizeString(impacted_provider, 100);
  const safeDesc = sanitizeString(description, 1000);
  const safeEmail = user_email && isValidEmail(user_email) ? user_email : null;
  const safeStatus = sanitizeString(status, 20);
  const safeMeta = metadata && typeof metadata === 'object' ? JSON.stringify(metadata) : null;

  try {
    const result = await sql`
      INSERT INTO issue_reports (service_name, impacted_provider, description, user_email, status, metadata)
      VALUES (
        ${safeService},
        ${safeProvider || null},
        ${safeDesc},
        ${safeEmail},
        ${safeStatus || 'open'},
        ${safeMeta}
      )
      RETURNING id, reported_at;
    `;
    res.status(200).json({ success: true, id: result[0].id, reported_at: result[0].reported_at });
  } catch (error) {
    res.status(500).json({ error: 'Database error', details: error.message });
  }
}
