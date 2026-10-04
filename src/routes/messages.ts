import { Router } from 'express';
import { pool } from '../db';
import { authMiddleware, AuthedRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

router.get('/:roomId', async (req: AuthedRequest, res) => {
  const { roomId } = req.params;
  const limit = parseInt((req.query.limit as string) || '50', 10);
  const offset = parseInt((req.query.offset as string) || '0', 10);
  try {
    const membership = await pool.query(
      'SELECT 1 FROM room_participants WHERE room_id = $1 AND user_id = $2',
      [roomId, req.userId]
    );
    if (membership.rows.length === 0) return res.status(403).json({ error: 'Not a member of this room' });

    const { rows } = await pool.query(
      `SELECT id AS "messageId", room_id AS "roomId", sender_id AS "senderId",
              message_text AS text, status, created_at AS "createdAt"
       FROM messages WHERE room_id = $1
       ORDER BY created_at ASC
       LIMIT $2 OFFSET $3`,
      [roomId, limit, offset]
    );
    res.json({ messages: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
