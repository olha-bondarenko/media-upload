# Case study: Media Upload

**Role:** design, frontend, backend and deployment (solo) · **Time:** two weeks ·
**Stack:** React, TypeScript, FastAPI, Postgres, Cloudflare R2

[Live demo](https://media-upload-six.vercel.app/) · [Code](../README.md)

## The problem

Uploading a large video through a normal web form is fragile. One request carries the whole file,
the server has to hold it in memory or on disk, a dropped connection means starting over, and the
user stares at a spinner with no idea how long it will take.

I wanted to build the kind of upload experience video platforms have: fast, visible, cancellable,
and not tied to one page. Around it, a small media library with the parts a real product needs:
search, editing, and permissions for different kinds of users.

## Goals

- Upload files of hundreds of megabytes reliably, with honest progress.
- Keep the file bytes away from the API server, so a free-tier server can handle it.
- Let people keep working while uploads run.
- Make permissions real (enforced by the server), but let a visitor try every role in one click.
- Ship it publicly, with tests and CI, in two weeks.

## Key decisions

### 1. Upload straight to storage, in chunks

The browser asks the API to start an upload. The API opens a **multipart upload** in Cloudflare R2
and hands back **presigned URLs**: short-lived links that allow uploading exactly one part. The
browser then sends the parts directly to R2 and finally asks the API to complete the upload with
the list of parts and their ETags.

*Why:* the API only exchanges small JSON messages, so it stays cheap and fast. Storage credentials
never reach the browser. Each 10 MiB part is a separate request, so the file never has to fit in a
single one.

### 2. Parallel parts, measured in bytes

Parts upload four at a time through a small concurrency helper. Progress is tracked per part in
bytes and summed, so it moves smoothly instead of jumping when a part finishes. Speed is a
five-second sliding average, which gives a stable "time remaining".

I used `XMLHttpRequest` instead of `fetch` here on purpose: `fetch` still has no reliable upload
progress events in browsers.

### 3. One abort path for everything

Cancel, a failed part, and a failed completion all go through the same path: abort the parts still
in flight, tell the API to abort the multipart upload in storage, and remove the database row. A
single `AbortController` connects the user's Cancel button with the failure of any one part.

### 4. Uploads that survive navigation

Upload state lives in a React context above the router, shown in a global panel. You can start an
upload, browse to another video and come back. If you try to close the tab mid-upload, the browser
asks first.

### 5. Permissions on the server, mirrored in the UI

Roles (viewer, editor, admin) are encoded in a signed JWT. Every protected endpoint checks the role
with FastAPI dependencies, and the frontend uses the same rules only to hide what you can't do. A
"View as" menu issues a demo token for any role, so reviewers can try everything without an account.

### 6. Guardrails for a public demo

Anyone can upload, so the demo protects itself: a 200 MB limit per file and 2 GB in total, a storage
lifecycle rule that removes abandoned parts, clean-up of uploads stuck for over a day, and an
idempotent seed script that restores deleted sample data.

## Quality

- **Tests where the risk is:** the upload engine is tested with a fake `XMLHttpRequest` (all parts
  uploaded, ETags sent, clean-up on failure and on cancel). The API is tested end to end against a
  fake storage, including storage outages and a full table of role × action permissions.
- **Accessibility:** labelled controls, visible focus, focus moved into the edit form and back to
  the button that opened it, the safe choice focused in the delete confirmation, and status
  messages announced to screen readers. Checked with eslint-plugin-jsx-a11y, a keyboard-only pass
  and axe (which caught one contrast issue, now fixed).
- **Automation:** GitHub Actions runs lint, format, type checks, build and tests on every pull
  request. A pre-commit hook runs the fast checks locally.

## Challenges

- **Storage configuration.** The first uploads failed with `NoSuchKey`: the storage endpoint URL
  included the bucket name, and the S3 client added it again. Direct uploads also need a CORS rule
  on the bucket that exposes the `ETag` header, because the browser can only read response headers
  the server explicitly allows, and the upload can't be completed without them.
- **Free-tier cold starts.** The API sleeps when idle, so the library shows a skeleton and, after a
  few seconds, a "waking up the server" message instead of looking broken.

## What I'd do next

- Retry failed parts with backoff, and resume an interrupted upload instead of starting over.
- Server-side media checks (for example with ffprobe) and generated thumbnails.
- Caption upload (WebVTT) for accessible playback.
- Real accounts, and editors limited to their own uploads.
- Sharing to social platforms.

## Built with

**Frontend**
- React 19, TypeScript (strict mode), Vite 7
- TanStack Query (data fetching and caching), React Router 7
- Tailwind CSS 4, shadcn/ui on Base UI, lucide-react icons
- XMLHttpRequest upload progress, AbortController, React context, `useSyncExternalStore`

**Backend**
- Python 3.12, FastAPI, Uvicorn
- SQLAlchemy 2, Alembic migrations, psycopg 3
- Pydantic 2 and pydantic-settings (validation and configuration)
- boto3 (S3 multipart uploads and presigned URLs), PyJWT (signed role tokens)

**Infrastructure**
- Cloudflare R2 (object storage, CORS and lifecycle rules)
- Neon (serverless Postgres), Render (API in Docker), Vercel (frontend)
- Docker Compose for the local database

**Testing and quality**
- Vitest, Testing Library, user-event, jsdom
- pytest with FastAPI's TestClient and a fake storage
- ESLint with typescript-eslint, react-hooks and jsx-a11y; Ruff for Python lint and format
- axe DevTools for accessibility audits
- GitHub Actions CI and a Git pre-commit hook

**Tooling**
- uv (Python packages), npm, VS Code, Git and GitHub
