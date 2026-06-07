import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS feedbacks (
        id      BIGINT PRIMARY KEY,
        name    TEXT NOT NULL,
        stars   INTEGER NOT NULL,
        text    TEXT NOT NULL,
        feature TEXT DEFAULT '',
        date    TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    if (req.method === 'GET') {
      const { rows } = await sql`SELECT * FROM feedbacks ORDER BY created_at DESC`;
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const { id, name, stars, text, feature, date } = req.body;
      if (!name || !stars || !text || !date) return res.status(400).json({ error: 'Missing fields' });
      await sql`
        INSERT INTO feedbacks (id, name, stars, text, feature, date)
        VALUES (${id}, ${name}, ${stars}, ${text}, ${feature || ''}, ${date})
      `;
      return res.status(201).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (err) {
    console.error('Feedbacks API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
