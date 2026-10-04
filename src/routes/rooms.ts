import { Router } from 'express';
import { pool } from '../db';
import { authMiddleware, AuthedRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req: AuthedRequest, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT r.id, r.type, r.name, r.created_at
       FROM rooms r
       JOIN room_participants rp ON rp.room_id = r.id
       WHERE rp.user_id = $1
       ORDER BY r.created_at DESC`,
      [req.userId]
    );
    res.json({ rooms: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req: AuthedRequest, res) => {
  const { type, name, participantIds } = req.body;
  if (!type || !Array.isArray(participantIds)) {
    return res.status(400).json({ error: 'type and participantIds[] are required' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      'INSERT INTO rooms (type, name) VALUES ($1, $2) RETURNING *',
      [type, name ?? null]
    );
    const roomId = rows[0].id;
    const members = Array.from(new Set([...participantIds, req.userId]));
    for (const uid of members) {
      await client.query('INSERT INTO room_participants (room_id, user_id) VALUES ($1, $2)', [roomId, uid]);
    }
    await client.query('COMMIT');
    res.status(201).json({ room: rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

export default router;
