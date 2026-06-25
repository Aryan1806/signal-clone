# Signal Clone

A pixel-perfect, fully functional Signal Messenger clone built as a portfolio project.

---

## 1. Overview

Signal Clone replicates the core experience of [Signal Messenger](https://signal.org):
- Phone-number-based registration with mocked OTP verification
- Real-time one-on-one and group messaging via WebSockets
- Delivery and read receipts (single ✓ / double ✓✓ / blue ✓✓)
- Typing indicators, online/offline presence
- Emoji reactions on messages
- Quoted replies
- Dark mode
- Signal's exact color palette and layout (sidebar + chat pane)
- Fully seeded database with realistic demo data

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router, TypeScript) |
| Styling | Tailwind CSS + CSS custom properties |
| State | Zustand |
| HTTP Client | Axios |
| Backend | Python 3.11+ · FastAPI |
| ORM | SQLAlchemy 2.x |
| Database | SQLite |
| Auth | JWT (python-jose) · Password hashing (passlib/bcrypt) |
| Real-time | FastAPI native WebSockets |
| Background jobs | APScheduler (disappearing messages) |

---

## 3. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│  Browser (Next.js 16)                                       │
│  ┌──────────────┐   HTTP REST    ┌──────────────────────┐   │
│  │  React UI    │ ─────────────► │  FastAPI backend     │   │
│  │  Zustand     │ ◄───────────── │  /api/*              │   │
│  │  Axios       │                │                      │   │
│  │              │   WebSocket    │  WebSocket manager   │   │
│  │  useWebSocket│ ◄────────────► │  /ws/{user_id}       │   │
│  └──────────────┘                └──────────┬───────────┘   │
└─────────────────────────────────────────────┼───────────────┘
                                              │ SQLAlchemy ORM
                                    ┌─────────▼──────────┐
                                    │  SQLite database   │
                                    │  signal_clone.db   │
                                    └────────────────────┘
```

**Flow:**
1. Client authenticates → receives JWT token
2. Client connects to WebSocket with token for real-time events
3. Sending a message: `POST /api/messages/{conv_id}` → backend saves + broadcasts via WS to other participants
4. Receiving: WS event `new_message` → Zustand store updates → React re-renders

---

## 4. Database Schema

```
users                          contacts
─────────────────────         ────────────────────────
id (PK)                       id (PK)
phone (UNIQUE)                owner_id  → users.id
username                      contact_id → users.id
display_name                  nickname
avatar_url                    created_at
about
password_hash                 conversations
is_online                     ─────────────────────────
last_seen                     id (PK)
created_at                    type ('direct'|'group')
                              created_at
                              updated_at

conversation_participants     groups
──────────────────────────    ─────────────────────────
id (PK)                       id (PK)
conversation_id → convs.id    conversation_id (UNIQUE)
user_id → users.id            name
role ('admin'|'member')       description
joined_at                     avatar_url
last_read_at                  created_by → users.id
                              created_at

messages                      message_receipts
──────────────────────────    ──────────────────────────
id (PK)                       id (PK)
conversation_id               message_id → messages.id
sender_id → users.id          user_id → users.id
content                       status ('delivered'|'read')
message_type                  timestamp
status
reply_to_id → messages.id     message_reactions
is_deleted                    ──────────────────────────
disappears_at                 id (PK)
created_at                    message_id → messages.id
updated_at                    user_id → users.id
                              emoji
                              created_at
```

---

## 5. API Overview

### Auth — `/api/auth`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/register` | No | Register with phone + mocked OTP (123456) |
| POST | `/login` | No | Login with phone + password |
| GET | `/me` | Yes | Get current user profile |
| POST | `/logout` | Yes | Mark user offline |

### Users — `/api/users`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/search?q=` | Yes | Search users by name/phone |
| GET | `/me` | Yes | Get own profile |
| PATCH | `/me` | Yes | Update display_name, about, avatar_url |
| GET | `/{user_id}` | Yes | Get user by ID |

### Conversations — `/api/conversations`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `` | Yes | List all conversations (sorted by updated_at) |
| POST | `/direct` | Yes | Create/get direct conversation |
| POST | `/group` | Yes | Create group conversation |
| GET | `/{conv_id}` | Yes | Get conversation details |
| PATCH | `/{conv_id}/read` | Yes | Mark conversation as read |

### Messages — `/api/messages`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/{conv_id}?page=&limit=` | Yes | Paginated message history |
| POST | `/{conv_id}` | Yes | Send message (broadcasts via WS) |
| PATCH | `/{message_id}/status` | Yes | Update delivery/read status |
| DELETE | `/{message_id}` | Yes | Soft-delete message |
| POST | `/{message_id}/react` | Yes | Add/toggle emoji reaction |

### Groups — `/api/groups`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/{conv_id}/members` | Yes | List group members |
| POST | `/{conv_id}/members` | Yes (admin) | Add member |
| DELETE | `/{conv_id}/members/{user_id}` | Yes (admin) | Remove member |
| PATCH | `/{conv_id}` | Yes (admin) | Update group info |

### WebSocket — `/ws`
| Path | Description |
|---|---|
| `/ws/{user_id}?token=` | Real-time event stream (JWT validated on connect) |

---

## 6. Setup & Installation

### Prerequisites
- Python 3.11+
- Node.js 18+

### Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv venv

# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt

# Seed the database with demo data
python seed.py

# Start the server
uvicorn main:app --reload --port 8000
```

The API docs will be available at: http://localhost:8000/docs

### Frontend

```bash
cd frontend

npm install

# Copy environment file
cp .env.example .env.local
# Edit .env.local if your backend runs on a different port

npm run dev
```

Open http://localhost:3000

---

## 7. Seed Accounts

All accounts use password: `password123`

| Name | Phone |
|---|---|
| Aryan Sharma *(primary)* | +919876543210 |
| Priya Patel | +919123456789 |
| Rahul Gupta | +919234567890 |
| Sneha Reddy | +919345678901 |
| Vikram Singh | +919456789012 |
| Meera Nair | +919567890123 |
| Karan Mehta | +919678901234 |
| Ananya Iyer | +919789012345 |

**Pre-seeded conversations:**
- Aryan ↔ Priya — 20 messages about weekend plans and a project report
- Aryan ↔ Rahul — 17 messages about IPL and work
- Aryan ↔ Sneha — 9 messages (3 unread for Aryan — celebration invite)
- Aryan ↔ Vikram — 11 messages (3 unread for Aryan — tech questions)
- Priya ↔ Rahul — 7 messages about team lunch
- **Dev Team** group — 32 messages across Aryan, Priya, Rahul, Sneha, Vikram
- **College Buddies** group — 29 messages across Aryan, Meera, Karan, Ananya, Priya

---

## 8. Assumptions & Decisions

| Decision | Rationale |
|---|---|
| OTP is always "123456" | Simulated phone verification; real SMS would need Twilio/AWS SNS |
| SQLite instead of PostgreSQL | Simpler local setup; swap `DATABASE_URL` for production |
| Passlib/bcrypt for hashing | Industry standard; python-jose for JWT |
| WebSocket per user, not per connection | Simpler logic; multi-tab would need connection list |
| Optimistic UI updates | Messages appear instantly; replaced with server data on response |
| Avatar from DiceBear API | Free, deterministic, no upload infra needed |
| No S3/file upload | Out of scope; placeholder "Coming Soon" for attachments |
| Dark mode via CSS variables | Zero runtime JS cost; instant toggle |
| `last_read_at` for unread count | Standard approach, computed server-side per conversation list call |
| bcrypt downgraded to 4.3.0 | passlib is incompatible with bcrypt 5.x API change |

---

## 9. Deployment

### Frontend (Vercel)
```bash
cd frontend
npx vercel deploy
# Set env vars in Vercel dashboard:
# NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
# NEXT_PUBLIC_WS_URL=wss://your-backend.onrender.com
```

### Backend (Render / Railway)
- Build: `pip install -r requirements.txt`
- Start: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Run `python seed.py` post-deploy via Render Shell
- For persistence, mount a disk and set `SQLALCHEMY_DATABASE_URL=sqlite:////data/signal_clone.db`
- Update CORS origins in `main.py` to your Vercel URL
