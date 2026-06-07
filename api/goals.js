//import { sql } from '@vercel/postgres';
import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS goals (
        id       BIGINT PRIMARY KEY,
        name     TEXT NOT NULL,
        target   NUMERIC NOT NULL,
        unit     TEXT NOT NULL,
        current  NUMERIC DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    if (req.method === 'GET') {
      const { rows } = await sql`SELECT * FROM goals ORDER BY created_at ASC`;
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const { id, name, target, unit, current } = req.body;
      if (!name || !target || !unit) return res.status(400).json({ error: 'Missing fields' });
      await sql`
        INSERT INTO goals (id, name, target, unit, current)
        VALUES (${id}, ${name}, ${target}, ${unit}, ${current || 0})
      `;
      return res.status(201).json({ success: true });
    }

    if (req.method === 'PUT') {
      // Update progress
      const { id } = req.query;
      const { current } = req.body;
      if (!id) return res.status(400).json({ error: 'Missing id' });
      await sql`UPDATE goals SET current = ${current} WHERE id = ${id}`;
      return res.status(200).json({ success: true });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'Missing id' });
      await sql`DELETE FROM goals WHERE id = ${id}`;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (err) {
    console.error('Goals API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
