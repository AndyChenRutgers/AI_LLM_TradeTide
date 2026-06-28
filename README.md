# TradeTide

A multi-agent AI system for stock market analysis. TradeTide runs a panel of LLM-powered analyst agents — technical, sentiment, macro, and contrarian — that independently research a ticker, debate their conclusions, and synthesize a single risk-aware outlook with price targets and a confidence score. The LLM provider behind the agents (Claude, ChatGPT, or Gemini) is selectable per request.

## How it works

For a given ticker, TradeTide runs an analyst debate in four stages:

1. **Independent research** — three agents work in parallel, each with its own tools:
   - **Technical Analyst** — pulls OHLCV price history and computes moving averages (40/60-day), RSI, MACD, and Bollinger Bands
   - **Sentiment Analyst** — pulls recent news, social media sentiment, and analyst ratings
   - **Macro Economist** — pulls market-moving news (Fed announcements, earnings, economic data) and reasons over the broader macro environment
2. **Self-correction check** — if the agents land on conflicting bullish/bearish calls, a correction engine investigates the contradiction and proposes a resolution before the debate continues
3. **Contrarian challenge** — a fourth agent is shown the consensus view and explicitly tasked with arguing the opposite case, using live order book data to look for signals the consensus might be missing
4. **Synthesis** — a weighted vote across all agent views produces a final BULLISH/BEARISH/NEUTRAL call, a consensus-strength score, 1-week/1-month/6-month price targets, a stop-loss level, and a risk/reward summary

Each agent's reasoning, tool calls, token usage, and latency are logged, so a full analysis session can be replayed and inspected after the fact.

## Stack

- **Backend** — Python 3.12, FastAPI, SQLAlchemy, Pydantic v2, Alembic, WebSockets (for streaming the live debate)
- **Frontend** — React 18, TypeScript, Vite, TailwindCSS, Zustand, React Query
- **Database** — PostgreSQL 16
- **Cache** — Redis 7
- **LLM providers** — Anthropic (Claude), OpenAI (ChatGPT), Google (Gemini)
- **Market & news data** — Alpaca, Finnhub, NewsAPI, Twitter/X, yfinance

## Project structure

```
tradetide/
├── backend/
│   ├── services/             # all agent logic
│   │   ├── agents.py         # TechnicalAgent, SentimentAgent, MacroAgent, ContraryAgent
│   │   ├── orchestrator.py   # runs the debate, self-correction, and synthesis
│   │   ├── llm_router.py     # routes requests to Anthropic / OpenAI / Google clients
│   │   └── tools.py          # tool definitions + execution (price data, news, sentiment, LOB, ratings)
│   ├── models/                # SQLAlchemy ORM + Pydantic schemas
│   ├── endpoints/router.py    # /analyze, /session/{id}, /history, /llms, /search-ticker, /ws/stream
│   ├── alembic/                # DB migrations
│   ├── main.py
│   └── config.py
├── frontend/
│   └── src/
│       ├── pages/             # Dashboard, Analyze, AgentDebate, Compare, History
│       ├── components/        # AgentCards, DebatePanel, ConfidenceMeter, RiskPanel, charts, etc.
│       ├── state/             # Zustand stores (LLM selection, analysis state, agent state)
│       ├── services/          # API clients
│       └── hooks/              # useAnalysis, useWebSocket, useTheme
├── docker-compose.yml          # postgres, redis, backend, frontend, nginx
└── nginx.conf
```

## Quick start

### With Docker (recommended)

Create `backend/.env` and `frontend/.env` (see [Environment variables](#environment-variables) below), then:

```bash
docker compose up --build
```

The app is served at `http://localhost:80` (via nginx). API docs are at `http://localhost:8000/docs`.

### Without Docker

**Backend**

```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# create .env with the variables listed below

alembic upgrade head                # create tables
uvicorn main:app --reload           # runs on :8000
```

**Frontend**

```bash
cd frontend
npm install

# create .env with VITE_API_BASE_URL=http://localhost:8000

npm run dev                         # runs on :3000
```

## Database migrations

```bash
cd backend

# create a new migration after changing models/orm.py
alembic revision --autogenerate -m "describe change"

# apply migrations
alembic upgrade head

# roll back one migration
alembic downgrade -1
```

## LLM provider selection

Every analysis request specifies an `llm_provider` and `llm_model`. Supported values:

| Provider | `llm_provider` | Example `llm_model` |
|---|---|---|
| Anthropic | `anthropic` | `claude-sonnet-4-6`, `claude-opus-4-6`, `claude-haiku-4-5-20251001` |
| OpenAI | `openai` | `gpt-4o`, `gpt-4-turbo`, `gpt-3.5-turbo` |
| Google | `google` | `gemini-2.5-pro`, `gemini-2.5-flash`, `gemini-2.0-flash` |

The default provider/model and agent behavior (temperature, max tokens, max tool-call iterations) are configured in `backend/config.py`.

## Environment variables

There's no committed `.env.example`, so create `backend/.env` yourself with the variables read by `backend/config.py`:

```env
APP_ENV=development
DEBUG=true
ALLOWED_ORIGINS=["http://localhost:3000"]

DATABASE_URL=postgresql://user:password@localhost:5432/trade_tide
REDIS_URL=redis://localhost:6379/0
CACHE_TTL_SECONDS=300

# at least one LLM key is required
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_API_KEY=

# market & news data
FINNHUB_API_KEY=
ALPACA_API_KEY=
ALPACA_SECRET_KEY=
POLYGON_API_KEY=
NEWS_API_KEY=
TWITTER_API_KEY=

MAX_AGENT_ITERATIONS=10
DEFAULT_LLM_PROVIDER=anthropic
DEFAULT_MODEL=claude-sonnet-4-6
DEFAULT_TEMPERATURE=0.7
DEFAULT_MAX_TOKENS=1024
```

For `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:8000
```

## API overview

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/analyze` | Run a full multi-agent analysis for a ticker, return the synthesized result |
| `GET` | `/api/session/{session_id}` | Fetch a previously run analysis session |
| `GET` | `/api/history` | List past analysis sessions, optionally filtered by ticker |
| `GET` | `/api/llms` | List available LLM providers/models |
| `GET` | `/api/search-ticker` | Search for a ticker symbol |
| `WS` | `/ws/stream` | Stream the agent debate live as each agent finishes its analysis |

## Disclaimer

TradeTide is a research and educational project. Its output (predictions, price targets, risk assessments) is generated by LLMs and is not financial advice.

## Authors

Advait Ashtikar, Andy Chen, Alexander Goferman
