import fs from 'fs';
import path from 'path';

// Use /tmp for Vercel, ./data for local
const DATA_DIR = process.env.VERCEL ? '/tmp' : path.join(process.cwd(), 'data');
const SUBMISSIONS_FILE = path.join(DATA_DIR, 'impact-submissions.json');
const RATE_LIMIT_FILE = path.join(DATA_DIR, 'impact-rate-limit.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getClientIp(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.ip ||
    'unknown'
  );
}

export default async function handler(req, res) {
  try {
    ensureDataDir();

    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      return res.status(200).json({ ok: true });
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    let body = req.body;
    if (!body || typeof body !== 'object') {
      try {
        body = JSON.parse(req.body);
      } catch {
        try {
          const buffers = [];
          for await (const chunk of req) buffers.push(chunk);
          body = JSON.parse(Buffer.concat(buffers).toString());
        } catch {
          return res.status(400).json({ error: 'Invalid JSON body.' });
        }
      }
    }

    let { provider, name, email, description } = body || {};
    provider = (provider || '').trim();
    name = (name || '').trim();
    email = (email || '').trim();
    description = (description || '').trim();

    if (!provider || !description) {
      return res.status(400).json({ error: 'Provider and description are required.' });
    }

    // Rate limit: 1 submission per provider per hour per IP
    let rateLimit = {};
    if (fs.existsSync(RATE_LIMIT_FILE)) {
      try {
        rateLimit = JSON.parse(fs.readFileSync(RATE_LIMIT_FILE, 'utf8'));
      } catch {}
    }
    const ip = getClientIp(req);
    const key = `${ip}__${provider}`;
    const now = Date.now();
    if (rateLimit[key] && now - rateLimit[key] < 60 * 60 * 1000) {
      return res.status(429).json({ error: 'You can only submit once per hour for this service.' });
    }
    rateLimit[key] = now;
    fs.writeFileSync(RATE_LIMIT_FILE, JSON.stringify(rateLimit, null, 2));

    // Save submission
    let submissions = [];
    if (fs.existsSync(SUBMISSIONS_FILE)) {
      try {
        submissions = JSON.parse(fs.readFileSync(SUBMISSIONS_FILE, 'utf8'));
      } catch {}
    }
    const record = {
      provider,
      name,
      email,
      description,
      ip,
      submittedAt: new Date().toISOString(),
    };
    submissions.push(record);
    fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify(submissions, null, 2));

    return res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error: ' + (err.message || err.toString()) });
  }
}
