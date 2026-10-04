# Real-Time Chat Backend

A WhatsApp-like real-time messaging REST + WebSocket API built with Node.js, TypeScript, Express, Socket.io, PostgreSQL, and Redis.

## Tech Stack

| Component | Technology |
| :--- | :--- |
| Runtime | Node.js + TypeScript |
| HTTP Framework | Express.js |
| Real-Time | Socket.io |
| Database | PostgreSQL (Supabase / Docker) |
| Cache / Pub-Sub | Redis (Upstash / Docker) |
| Auth | JWT + bcrypt |
| Containerization | Docker & Docker Compose |

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Create environment file
cp .env.example .env

# 3. Start PostgreSQL & Redis
docker-compose up -d

# 4. Run the dev server
npm run dev
```

Server runs on `http://localhost:3000`.

## REST API

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| POST | `/api/v1/auth/register` | — | Register a new account |
| POST | `/api/v1/auth/login` | — | Login, returns JWT |
| GET | `/api/v1/rooms` | Bearer | List rooms of the user |
| POST | `/api/v1/rooms` | Bearer | Create a room |
| GET | `/api/v1/messages/:roomId?limit=50&offset=0` | Bearer | Message history |

## WebSocket Events

Connect with: `ws://localhost:3000?token=YOUR_JWT`

| Event | Direction | Payload | Description |
| :--- | :--- | :--- | :--- |
| `client:join_room` | Client → Server | `{ roomId }` | Join a room channel |
| `client:send_message` | Client → Server | `{ roomId, text }` | Send a message |
| `server:new_message` | Server → Client | `{ messageId, roomId, senderId, text, createdAt }` | New message broadcast |
| `client:typing` | Client → Server | `{ roomId, isTyping }` | Typing indicator |
| `server:user_typing` | Server → Client | `{ userId, isTyping }` | Typing broadcast |

Online users are tracked in Redis (`HSET online_users`) and `is_online`/`last_seen` are persisted in PostgreSQL.

## Scripts

```bash
npm run dev     # Development (ts-node)
npm run build   # Compile to dist/
npm start       # Run compiled build
```

## Deployment

- **Backend:** Render.com / Railway.app (free tier)
- **Database:** Supabase (free PostgreSQL)
- **Redis:** Upstash (free tier)
