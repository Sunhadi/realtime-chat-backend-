import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from './config';
import { pool } from './db';
import { redis } from './redis';

interface AuthedSocket extends Socket {
  userId?: string;
}

export function setupSocket(io: Server) {
  io.use((socket: AuthedSocket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    if (!token) return next(new Error('Authentication token required'));
    try {
      const payload = jwt.verify(token as string, config.jwtSecret) as { userId: string };
      socket.userId = payload.userId;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket: AuthedSocket) => {
    const userId = socket.userId!;
    console.log(`User connected: ${userId}`);

    await redis.hSet('online_users', userId, socket.id);
    await pool.query('UPDATE users SET is_online = TRUE WHERE id = $1', [userId]);

    socket.on('client:join_room', ({ roomId }: { roomId: string }) => {
      socket.join(roomId);
      console.log(`${userId} joined room ${roomId}`);
    });

    socket.on('client:send_message', async ({ roomId, text }: { roomId: string; text: string }) => {
      try {
        const { rows } = await pool.query(
          `INSERT INTO messages (room_id, sender_id, message_text)
           VALUES ($1, $2, $3)
           RETURNING id AS "messageId", room_id AS "roomId", sender_id AS "senderId",
                     message_text AS text, created_at AS "createdAt"`,
          [roomId, userId, text]
        );
        io.to(roomId).emit('server:new_message', rows[0]);
      } catch (err) {
        console.error(err);
        socket.emit('server:error', { error: 'Failed to send message' });
      }
    });

    socket.on('client:typing', ({ roomId, isTyping }: { roomId: string; isTyping: boolean }) => {
      socket.to(roomId).emit('server:user_typing', { userId, isTyping });
    });

    socket.on('disconnect', async () => {
      await redis.hDel('online_users', userId);
      await pool.query(
        'UPDATE users SET is_online = FALSE, last_seen = CURRENT_TIMESTAMP WHERE id = $1',
        [userId]
      );
      console.log(`User disconnected: ${userId}`);
    });
  });
}
