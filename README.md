# Collaborative Ghost Writer

A multiplayer web game where players take turns directing an AI to continue a shared story. Each player writes a prompt, and a Groq-powered LLM (Llama 3.3 70B) generates the next chapter — collaboratively building a story nobody fully controls.

## How it works

Players create or join a room with a 6-character code. Once in the lobby, they take turns writing a short prompt ("the detective opens the door and finds...") and the AI writes the next 2–3 sentences of the story. The full story builds up turn by turn, visible to everyone in the room.

## Tech stack

**Backend** — FastAPI · SQLAlchemy · PostgreSQL · Groq API (Llama 3.3 70B)

**Frontend** — React (TypeScript) · React Router · Vite

## Project structure

```
collaborative-ghost-writer/
├── main.py          # FastAPI routes
├── models.py        # SQLAlchemy models (Room, Turn)
├── database.py      # DB engine / session setup
├── utils.py         # Join-code generator + Groq story generation
├── .env.example     # Environment variable template
└── frontend/
    └── src/
        ├── pages/   # Home, Create, Join, Lobby, Game
        └── Context/ # Game context (player name, index)
```

## Getting started

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL database
- [Groq API key](https://console.groq.com)

### Backend

```bash
# Install dependencies
pip install fastapi uvicorn sqlalchemy psycopg2-binary python-dotenv groq

# Copy and fill in env vars
cp .env.example .env
```

Edit `.env`:

```
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_db_name
DB_URL=postgresql://your_db_user:your_db_password@localhost:5432/your_db_name
API_KEY=your_groq_api_key
FRONTEND_URL=http://localhost:5173
```

Then run the schema and start the server:

```bash
# Apply schema
psql -U your_db_user -d your_db_name -f ghost.sql

# Start server
uvicorn main:app --reload
```

### Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:

```
VITE_API_URL=http://localhost:8000
```

```bash
npm run dev
```

## Deploying

### Backend → Render

1. Push to GitHub and create a new **Web Service** on Render, pointing at the repo root.
2. Set the **Build Command** to `pip install -r requirements.txt` (create one if you haven't — see below).
3. Set the **Start Command** to `uvicorn main:app --host 0.0.0.0 --port $PORT`.
4. Add environment variables in Render's dashboard: `DB_URL`, `API_KEY`, and `FRONTEND_URL` (your Vercel URL once deployed).
5. Provision a **PostgreSQL** database on Render (or use an external provider) and run `ghost.sql` against it.

`requirements.txt` should include:
```
fastapi
uvicorn[standard]
sqlalchemy
psycopg2-binary
python-dotenv
groq
```

### Frontend → Vercel

1. Import the repo on [Vercel](https://vercel.com) and set the **Root Directory** to `frontend`.
2. Vercel auto-detects Vite — no build command changes needed.
3. Add an environment variable: `VITE_API_URL=https://your-render-service.onrender.com`
4. Deploy. Once live, go back to Render and update `FRONTEND_URL` to your Vercel domain so CORS is allowed.

## API reference

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/create` | Create a room |
| `POST` | `/join` | Join a room by code |
| `GET` | `/rooms/{room_id}` | Get all turns in a room |
| `POST` | `/rooms/{room_id}` | Submit a turn (triggers AI generation) |
| `POST` | `/rooms/{room_id}/leave` | Remove a player; deletes room if empty |

## License

MIT
