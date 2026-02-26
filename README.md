# 💬 Connect — Real-time Global Messaging App

A full-stack WhatsApp-like messaging application built with the MERN stack + Socket.io.

## ✨ Features

- 🔐 **JWT Authentication** — Secure register/login with bcrypt password hashing
- 👥 **User Discovery** — Search and find **all registered users** from the shared database
- 💬 **Real-time Messaging** — Instant delivery via Socket.io (no page refresh needed)
- ✏️ **Typing Indicators** — Live "User is typing…" powered by Socket.io events
- 🟢 **Online/Last Seen Status** — Real-time presence with exact timestamps
- ✅ **Read Receipts** — Sent → Delivered → Read status per message
- 📜 **Message Persistence** — Full chat history saved in MongoDB, loads chronologically
- 📄 **Pagination** — Infinite scroll / Load More for large chat histories
- 🛡️ **Security** — XSS sanitization, NoSQL injection prevention, rate limiting, helmet
- 📱 **Mobile Responsive** — Full mobile UI with slide-in sidebar




---

## 🚀 Local Development Setup

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier works) OR local MongoDB

### 1. Clone & Install

```bash
# Install server dependencies
cd connect-app/server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Configure Environment

```bash
cd server
cp .env.example .env
```

Edit `.env`:
```env
PORT=5000
MONGODB_URI=YOUR_URI
JWT_SECRET=YOUR_SECRET_KEY
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

### 3. Run Both Servers

**Terminal 1 — Backend:**
```bash
cd server
npm run dev        # starts on http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd client
npm start          # starts on http://localhost:3000
```

---

## ☁️ Deployment

### Backend → Render or Railway

1. Push code to GitHub
2. Create new **Web Service** on [render.com](https://render.com)
3. Set root directory to `server/`
4. Build command: `npm install`
5. Start command: `npm start`
6. Add these **Environment Variables** in the dashboard:
   ```
   MONGODB_URI      = your MongoDB Atlas URI
   JWT_SECRET       = your_secret_key
   CLIENT_URL       = https://your-app.vercel.app
   NODE_ENV         = production
   ```

### Frontend → Vercel

1. Create new project on [vercel.com](https://vercel.com)
2. Set root directory to `client/`
3. Add **Environment Variable**:
   ```
   REACT_APP_API_URL = https://your-backend.onrender.com
   ```
4. Deploy!

---

## 🧪 Test Credentials

After deploying, create two accounts manually:

| Name | Email | Password |
|------|-------|----------|
| Tester Guy | tester@123.com | Test@123 |
| Viewer Guy | viewer@123.com | View@123 |

Open the app in two **different browsers** (or one normal + one incognito), log in as each user, then go to **Contacts** tab — you'll see each other listed. Click to start a real-time chat!

---

## 🔑 How User Discovery Works

This is the key feature that makes it a **real** multi-user app:

1. User signs up → account saved to **shared MongoDB database**
2. Any logged-in user opens **Contacts tab** → calls `GET /api/users`
3. Backend queries MongoDB for **all registered users** (excluding self)
4. Results show online/offline status in real-time via Socket.io
5. Click any user → `POST /api/conversations` creates/finds a conversation → real messages flow via Socket.io

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| PATCH | `/api/auth/profile` | Update profile |
| GET | `/api/users?search=name` | **Search all registered users** |
| GET | `/api/users/:id` | Get user profile |
| GET | `/api/conversations` | Get my conversations |
| POST | `/api/conversations` | Start/get conversation |
| GET | `/api/messages/:convId?page=1` | Get messages (paginated) |
| POST | `/api/messages` | Send a message |
| PATCH | `/api/messages/:convId/read` | Mark as read |

---

## ⚡ Socket.io Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `user_online` | Server → Client | User came online |
| `user_offline` | Server → Client | User went offline |
| `new_message` | Server → Client | New message received |
| `messages_read` | Server → Client | Recipient read messages |
| `typing_start` | Client → Server | User started typing |
| `typing_stop` | Client → Server | User stopped typing |
| `user_typing` | Server → Client | Broadcast typing status |

---

## 🛡️ Security Measures

- **Passwords**: bcrypt hashed (cost factor 12)
- **JWT**: Signed tokens, 7-day expiry
- **XSS**: `validator.escape()` on all message text
- **NoSQL Injection**: `express-mongo-sanitize`
- **Headers**: `helmet` for secure HTTP headers
- **Rate Limiting**: 100 req/15min general, 20 req/15min for auth
- **Auth Middleware**: All `/api/users`, `/api/messages`, `/api/conversations` routes protected

---

## 🗄️ Database Schema

**Users collection** — stores all registered users (name, email, hashed password, about, online status, lastSeen)

**Conversations collection** — links two participants, stores lastMessage reference for preview

**Messages collection** — indexed on `(conversationId, createdAt)` for efficient paginated queries. Supports thousands of messages per conversation with no slowdown.


---

## 👨‍💻 Author

**Tushar Mishra**  
Software Developer  
Email: tm3390782@gmail.com

---