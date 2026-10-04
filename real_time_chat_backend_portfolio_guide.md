# Real-Time Chat Backend Portfolio Project: Architecture & Blueprint

A professional, production-grade blueprint for building a WhatsApp-like real-time chat backend using **100% free and open-source technologies**. This project is specifically designed to impress recruiters by demonstrating proficiency in persistent bidirectional communication, database design, caching, and state management.

---

## 1. Project Overview & Objectives
* **Goal:** Build a robust, scalable real-time messaging API system.
* **Key Skills Highlighted:** 
  * WebSocket connection lifecycle management.
  * Event-driven architecture.
  * Database relational modeling & message queueing.
  * In-memory caching and online status tracking with Redis.
  * Zero-cost local development and cloud deployment.

---

## 2. Tech Stack (100% Free / Open-Source)

| Component | Technology | Why Use It? | Cost |
| :--- | :--- | :--- | :--- |
| **Core Runtime** | **Node.js + TypeScript** | Asynchronous, vast ecosystem, perfect for I/O-heavy chat systems. | Free |
| **Framework** | **Express.js** or **NestJS** | Lightweight or structured enterprise framework for REST endpoints. | Free |
| **Real-Time Engine** | **Socket.io** | Built-in reconnection, rooms, automatic fallback, and easy event handling. | Free |
| **Primary Database** | **Supabase (PostgreSQL)** | Relational database for users, rooms, and historical messages with a generous free tier. | Free (Cloud) / Free (Local Docker) |
| **Caching / Pub-Sub** | **Upstash (Redis)** | In-memory store for tracking online status and scaling WebSockets. | Free Tier Available |
| **Containerization** | **Docker & Docker Compose** | Reproducible environment for local development. | Free |

---

## 3. Database Schema Design (PostgreSQL / Supabase)

Design your relational database using these tables to support individual and group messaging:

```sql
-- 1. Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_online BOOLEAN DEFAULT FALSE,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Chat Rooms Table (supports 1-on-1 and groups)
CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(20) CHECK (type IN ('private', 'group')) NOT NULL,
    name VARCHAR(100), -- NULL for private chats
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Room Participants (Many-to-Many relationship)
CREATE TABLE room_participants (
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (room_id, user_id)
);

-- 4. Messages Table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    message_text TEXT NOT NULL,
    status VARCHAR(20) CHECK (status IN ('sent', 'delivered', 'read')) DEFAULT 'sent',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

## 4. API & WebSocket Event Specification

### A. HTTP REST Endpoints (Authentication & History)
* `POST /api/v1/auth/register` — Register a new user account.
* `POST /api/v1/auth/login` — Authenticate and return a JSON Web Token (JWT).
* `GET /api/v1/rooms` — Get a list of active chat rooms for the authenticated user.
* `GET /api/v1/messages/:roomId` — Retrieve pagination-ready message history for a room.

### B. WebSocket Events (Real-Time Communication)
Connect via `ws://localhost:3000` with query param `?token=YOUR_JWT`.

| Event Name | Direction | Payload Structure | Description |
| :--- | :--- | :--- | :--- |
| `client:join_room` | Client $\rightarrow$ Server | `{ roomId }` | Places socket connection into a specific room channel. |
| `client:send_message` | Client $\rightarrow$ Server | `{ roomId, text }` | Dispatched when a user sends a new message. |
| `server:new_message` | Server $\rightarrow$ Client | `{ messageId, roomId, senderId, text, createdAt }` | Broadcasted instantly to room members. |
| `client:typing` | Client $\rightarrow$ Server | `{ roomId, isTyping }` | Triggered when typing status changes. |
| `server:user_typing` | Server $\rightarrow$ Client | `{ userId, isTyping }` | Broadcasted to notify other room members. |

---

## 5. Step-by-Step Implementation Guide

1. **Initialize Project:**
   ```bash
   mkdir chat-backend && cd chat-backend
   npm init -y
   npm install express socket.io pg dotenv jsonwebtoken bcrypt cors
   npm install -D typescript @types/node @types/express ts-node
   npx tsc --init
   ```

2. **Docker Compose Setup (`docker-compose.yml`):**
   Run a local PostgreSQL database and Redis instance effortlessly using Docker:
   ```yaml
   version: '3.8'
   services:
     postgres:
       image: postgres:15-alpine
       environment:
         POSTGRES_USER: postgres
         POSTGRES_PASSWORD: secretpassword
         POSTGRES_DB: chatapp
       ports:
         - "5432:5432"
     redis:
       image: redis:alpine
       ports:
         - "6379:6379"
   ```

3. **Core WebSocket Server Logic Concept:**
   * Validate the JWT during the Socket.io `io.use()` handshake middleware.
   * Map user IDs to active socket IDs using Redis (`HSET online_users userId socketId`).
   * Listen for incoming `client:send_message`, persist the message to PostgreSQL, and emit `server:new_message` to the designated `roomId`.

---

## 6. Free Deployment Strategy for Portfolio
* **Backend Hosting:** Deploy your Node.js code to **Render.com** (Free Web Service) or **Railway.app**.
* **Database:** Create a free cluster on **Supabase**.
* **Redis:** Create a free Redis instance on **Upstash**.
* **Documentation:** Create an incredible `README.md` containing architectural diagrams, setup steps using `docker-compose up`, and a Postman/Swagger collection link.