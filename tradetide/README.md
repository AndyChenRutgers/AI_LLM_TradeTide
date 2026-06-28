# Market Agentic AI

Multi-agent stock market analysis system with selectable LLM providers (Claude, ChatGPT, Gemini).

## Stack

- **Backend** — Python 3.12, FastAPI, SQLAlchemy, Pydantic v2, Alembic
- **Frontend** — React 18, TypeScript, Vite, TailwindCSS, Zustand, React Query
- **Database** — PostgreSQL 16
- **Cache** — Redis 7
- **LLM providers** — Anthropic (Claude), OpenAI (ChatGPT), Google (Gemini)

## Project structure

```
market-agentic-ai/
├── backend/
│   ├── services/         # all agent logic
│   │   ├── analysis.py   # top-level entry, called by router
│   │   ├── orchestrator.py
│   │   ├── agents.py
│   │   ├── llm_router.py
│   │   └── tools.py
│   ├── models/           # SQLAlchemy ORM + Pydantic schemas
│   │   ├── db.py
│   │   ├── orm.py
│   │   ├── schemas.py
│   │   └── repository.py
│   ├── endpoints/        # thin FastAPI routers
│   │   └── routes.py
│   ├── alembic/          # DB migrations
│   ├── main.py
│   ├── config.py
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── state/
│   │   ├── services/
│   │   ├── types/
│   │   └── hooks/
│   ├── package.json
│   ├── vite.config.ts
│   └── .env
├── docker-compose.yml
├── nginx.conf
└── README.md
```

## Quick start

### With Docker (recommended)

```bash
cp backend/.env.example backend/.env   # fill in API keys
cp frontend/.env.example frontend/.env

docker compose up --build
```

App is at `http://localhost:80`. API docs at `http://localhost:8000/docs`.

### Without Docker

**Backend**

```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env               # fill in API keys

alembic upgrade head               # create tables
uvicorn main:app --reload          # runs on :8000
```

**Frontend**

```bash
cd frontend
npm install
cp .env.example .env
npm run dev                        # runs on :3000
```

## Database migrations

```bash
cd backend

# Create a new migration after changing orm.py
alembic revision --autogenerate -m "describe change"

# Apply migrations
alembic upgrade head

# Roll back one migration
alembic downgrade -1
```

## LLM provider selection

The frontend sends `llm_provider` and `model_id` in every analysis request.
Supported values:

| Provider | `llm_provider` | Example `model_id` |
|---|---|---|
| Anthropic | `anthropic` | `claude-sonnet-4-6`, `claude-opus-4-6`, `claude-haiku-4-5-20251001` |
| OpenAI | `openai` | `gpt-4o`, `gpt-4-turbo`, `gpt-3.5-turbo` |
| Google | `google` | `gemini-1.5-pro`, `gemini-1.5-flash` |

## Environment variables

See `backend/.env.example` and `frontend/.env.example` for all required variables.
The minimum required to run are `DATABASE_URL` and at least one LLM API key.