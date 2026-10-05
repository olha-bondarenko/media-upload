# Media Upload

A small video-platform dashboard: upload, manage and preview media, with role-based permissions.

- `web/`: React, TypeScript and Vite frontend
- `api/`: FastAPI backend with Postgres (SQLAlchemy, Alembic)

> Status: day 1 scaffold. The frontend shows an app shell and checks that it can reach the API.

## Prerequisites

- Node.js 22+
- [uv](https://docs.astral.sh/uv/) (installs Python and the API dependencies)
- Docker (for local Postgres)

## First run

```bash
# 1. Database
docker compose up -d

# 2. API (http://localhost:8000, interactive docs at /docs)
cd api
cp .env.example .env
uv sync
uv run alembic upgrade head
uv run uvicorn app.main:app --reload

# 3. Frontend (http://localhost:4000), in a second terminal
cd web
cp .env.example .env.local
npm install
npm run dev
```

The header should show "API connected". Commit the generated `api/uv.lock` and
`web/package-lock.json`: CI and the Docker build rely on them.

## Checks

|        | API (`cd api`)         | Frontend (`cd web`) |
| ------ | ---------------------- | ------------------- |
| Tests  | `uv run pytest`        | `npm test`          |
| Lint   | `uv run ruff check .`  | `npm run lint`      |
| Format | `uv run ruff format .` |                     |
| Build  |                        | `npm run build`     |

GitHub Actions runs all of these on every push and pull request (`.github/workflows/ci.yml`).

## Database migrations

```bash
cd api
uv run alembic revision --autogenerate -m "describe the change"
uv run alembic upgrade head
```

New models must be imported in `app/models/__init__.py` so autogenerate can see them.

## Deploying

Three pieces, each with a free tier at the time of writing (check current terms):

1. **Postgres**: create a database (for example on Neon) and copy its connection URL.
2. **API**: deploy `api/` from its `Dockerfile` (for example on Fly.io or Render). Set
   `DATABASE_URL` and `CORS_ORIGINS` (the frontend's URL). The container runs migrations on start.
3. **Frontend**: deploy `web/` as a static site (for example on Vercel or Cloudflare Pages) with
   build command `npm run build`, output directory `dist`, and `VITE_API_URL` set to the API's URL.
   Add a rewrite of all paths to `/index.html` so client-side routes work on refresh.

## Storage

Media files go to S3-compatible object storage (Cloudflare R2 or AWS S3), uploaded directly from
the browser. Create a bucket and an access key, then fill in the `S3_*` values in `api/.env`.
The bucket needs a CORS rule that allows `PUT` from the frontend origin and exposes the `ETag`
header, which multipart uploads need.
