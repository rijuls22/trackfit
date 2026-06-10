import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!process.env.DATABASE_URL) {
    return res.status(500).json({ error: 'DATABASE_URL environment variable is not set. Please connect your Neon database in Vercel.' });
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS workouts (
        id         BIGINT PRIMARY KEY,
        name       TEXT NOT NULL,
        type       TEXT NOT NULL,
        duration   INTEGER NOT NULL,
        cals       INTEGER DEFAULT 0,
        date       TEXT NOT NULL,
        notes      TEXT DEFAULT '',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    if (req.method === 'GET') {
      const rows = await sql`SELECT * FROM workouts ORDER BY date DESC, created_at DESC`;
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const { id, name, type, duration, cals, date, notes } = req.body;
      if (!name || !type || !duration || !date) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      await sql`
        INSERT INTO workouts (id, name, type, duration, cals, date, notes)
        VALUES (${id}, ${name}, ${type}, ${Number(duration)}, ${Number(cals) || 0}, ${date}, ${notes || ''})
      `;
      return res.status(201).json({ success: true });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'Missing id' });
      await sql`DELETE FROM workouts WHERE id = ${id}`;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (err) {
    console.error('Workouts API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
