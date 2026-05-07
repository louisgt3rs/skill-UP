# SkillUp — Competitive Gaming Platform

Mobile app for gamers to create, join, and compete in 1v1/2v2/3v3 matches with a built-in credits system and proof submission.

## Stack

- **Frontend**: Expo React Native (TypeScript)
- **Backend**: Node.js + Express
- **Database + Auth + Storage**: Supabase

---

## Project Structure

```
SKILLUP/
├── supabase/
│   └── schema.sql          # Run this in Supabase SQL editor
├── backend/
│   ├── index.js            # Express server entry point
│   ├── src/
│   │   ├── middleware/
│   │   │   └── auth.js     # JWT verification
│   │   ├── routes/
│   │   │   ├── matches.js
│   │   │   ├── proofs.js
│   │   │   ├── disputes.js
│   │   │   └── users.js
│   │   └── utils/
│   │       ├── supabase.js
│   │       └── matchLogic.js
│   └── package.json
└── app/
    ├── App.tsx
    ├── src/
    │   ├── screens/        # All 7 screens
    │   ├── components/     # Button, Input, MatchCard
    │   ├── navigation/     # Stack + Tab navigator
    │   ├── lib/            # Supabase client, API client
    │   ├── store/          # Zustand auth store
    │   ├── theme/          # Dark gaming theme
    │   └── types/          # TypeScript types
    └── package.json
```

---

## Setup Instructions

### 1. Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `supabase/schema.sql`
3. From **Settings → API**, collect:
   - `Project URL`
   - `anon public` key
   - `service_role` key (keep secret!)
   - `JWT Secret` (Settings → API → JWT Settings)

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:
```
PORT=3001
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret
```

Start the server:
```bash
npm run dev       # development (nodemon)
npm start         # production
```

The API runs at `http://localhost:3001`.

### 3. Expo App Setup

```bash
cd app
npm install
cp .env.example .env
```

Edit `.env`:
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_API_URL=http://localhost:3001
```

> **iOS/Android device**: replace `localhost` with your machine's local IP (e.g., `192.168.1.5`).

Start the app:
```bash
npm start
```

Scan the QR code with **Expo Go** on your phone, or press `a`/`i` for emulator.

---

## API Reference

### Auth
JWT tokens are obtained from Supabase auth and sent as `Authorization: Bearer <token>`.

### Matches
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/matches` | List matches (filter: `?status=pending&game=Fortnite&format=1v1`) |
| GET | `/api/matches/:id` | Match detail with participants + proofs |
| POST | `/api/matches` | Create match (auth required) |
| POST | `/api/matches/:id/join` | Join match — body: `{ team: 1 or 2 }` |
| POST | `/api/matches/:id/result` | Submit result — body: `{ claimed_result: "win" or "loss" }` |

### Proofs
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/proofs/upload` | Upload screenshot/video (multipart form, fields: `file`, `match_id`) |
| GET | `/api/proofs/signed-url?path=...` | Get signed download URL |

### Users
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/users/me` | Current user profile |
| PUT | `/api/users/me` | Update username/avatar |
| GET | `/api/users/me/matches` | Match history |
| GET | `/api/users/:id` | Public profile |

### Disputes
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/disputes/:matchId/report` | Report a match (participant only) |
| GET | `/api/disputes` | List all disputes (admin only) |
| POST | `/api/disputes/:matchId/resolve` | Resolve dispute — body: `{ winner_team: 1 or 2, admin_notes?: "..." }` (admin only) |

---

## Match Flow

```
[Create Match] → status: pending
     ↓ (players join until full)
[All slots filled] → status: active
     ↓ (each player uploads proof + submits result)
[All results submitted]
     ↓
  Both teams agree? → status: completed, winner gets credits
  Disagree?         → status: disputed
     ↓
[Admin reviews] → resolves dispute, assigns credits
```

## Credits System

- New users start with **1,000 credits**
- Joining a match **locks** your entry cost
- Winners receive **2× their entry** (net gain: +entry_cost)
- Losers lose their entry cost
- Winning also gives **+10 reputation**

## Anti-Cheat

Each match has a short ID (e.g., `A1B2C3D4`). Players must include this ID visibly in their screenshot. The ID is displayed prominently in the SubmitResult screen as a reminder.

## Making a User Admin

In Supabase SQL editor:
```sql
UPDATE public.users SET is_admin = true WHERE username = 'your-username';
```

---

## Screens

| Screen | Route | Description |
|--------|-------|-------------|
| Login | Auth | Email/password sign in |
| Signup | Auth | Create account (starts with 1000 credits) |
| Home | Main tab | Browse + filter matches |
| Create Match | Main tab | Create a match with game/format/cost |
| Match Detail | Stack | Full match info, join, track status |
| Submit Result | Modal | Upload proof + declare win/loss |
| Profile | Main tab | Stats, match history, sign out |
