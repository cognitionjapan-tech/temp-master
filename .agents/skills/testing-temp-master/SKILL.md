---
name: testing-temp-master
description: Test the Temp Master SwitchBot dashboard locally. Use when verifying UI changes, API connectivity, or branding updates.
---

# Testing Temp Master Dashboard

## Prerequisites

- Python 3.12+
- Poetry (dependency management)
- Node.js 22+ (via `~/.nvm`)

## Devin Secrets Needed

None for UI testing: the frontend fetches live data from `https://snakeroom.fly.dev` (CORS allowed).
`SWITCHBOT_TOKEN` / `SWITCHBOT_SECRET` are only needed if you want the local backend itself to collect data.

## Local Development Setup

### 1. Install dependencies

```bash
cd switchbot-dashboard/switchbot-backend
poetry install --no-interaction
```

### 2. Create .env file

```bash
cd switchbot-dashboard/switchbot-backend
echo "SWITCHBOT_TOKEN=${SWITCHBOT_TOKEN}" > .env
echo "SWITCHBOT_SECRET=${SWITCHBOT_SECRET}" >> .env
```

### 3. Build the frontend and symlink it as static files

The frontend is React 18 + TypeScript + Vite. The Dockerfile builds it in a Node stage and copies `dist/` to `static/`. Locally, build it and symlink `dist/`:

```bash
source ~/.nvm/nvm.sh   # Node 22+ (npm ci)
cd switchbot-dashboard/switchbot-frontend && npm ci && npm run build && cd -
ln -sfn $(pwd)/switchbot-dashboard/switchbot-frontend/dist switchbot-dashboard/switchbot-backend/static
```

Rebuilding (`npm run build`) after the server is running is fine; the symlink stays valid.

**Important:** The static directory check in `main.py` happens at module import time (`STATIC_DIR = Path(__file__).resolve().parent.parent / "static"`). If you create the symlink after starting the server, you must restart the server.

### 4. Start the server

```bash
cd switchbot-dashboard/switchbot-backend
poetry run fastapi run app/main.py --host 0.0.0.0 --port 8000
```

The frontend is served at `http://localhost:8000/` and the API docs at `http://localhost:8000/docs`.

## Key Test Points

### Branding Verification
- Page title (`<title>` tag): should say "Temp Master Dashboard"
- Navbar brand: should say "Temp Master Dashboard"
- Footer: should say "Temp Master Dashboard v2.0 - Built with React 18 + TypeScript + Vite + Tailwind CSS + Recharts + TanStack Query"
- Verify no "Snake" or "SnakeRoom" text exists anywhere: `document.body.innerHTML.includes('Snake')` should be `false`

### API Connectivity
- Data comes from `https://snakeroom.fly.dev` (`/api/meters`, `/api/status`, `/api/meters/{id}/history`, `POST /api/meters/refresh`); local `/api/status` shows `configured: false`, which is expected
- Connection status badge (`[data-testid=connection-status]`) shows "Connected" (green, `data-state="connected"`)

### UI Functionality
- Theme switcher (navbar): Light / Dark / High Contrast; sets `<html data-theme>` and persists to localStorage key `temp-master-theme`
- View toggle: Default (equal 3-col grid) vs Shelf (top shelf 2 featured meters + Left/Middle/Right columns + その他)
- Time Range selector: Last Hour / Last 24 Hours / Last 7 Days / Last 30 Days / Last Year
- Charts: Recharts SVG area charts (`[data-testid=meter-chart]`, `data-points` = number of points)
- Stale meters (7+ days) appear in the「未更新のメーター」section without charts
- Refresh Data button POSTs `/api/meters/refresh` and refetches

## Running Frontend Tests

```bash
cd switchbot-dashboard/switchbot-frontend
npm test && npm run typecheck && npm run build
```

## Running Backend Tests

```bash
cd switchbot-dashboard/switchbot-backend
poetry run pytest -v
```

Expected: 97 tests pass.

## Architecture Notes

- Backend: FastAPI + aiosqlite (SQLite persistence at `/data/app.db` or local `app.db`)
- Frontend: React 18 + TypeScript + Vite, Tailwind CSS, Recharts, TanStack Query (`switchbot-frontend/src`)
- Deployment: Fly.io (see `fly.toml`)
- Background data collection runs with 120s interval, with rate limiting and exponential backoff

## E2E Screenshot Tips

- 日本語の工場機械名が豆腐（□）になる場合は `sudo apt-get install -y fonts-noto-cjk` 後に Chrome を再起動する（`chrome://restart`）。リロードだけではフォントのフォールバックが更新されないことがある。
- CDP の `captureBeyondViewport` でフルページ撮影すると Recharts の SVG が抜けることがある。通常のビューポート撮影と比較し、抜けている場合は device metrics を文書全高に一時変更して、ResizeObserver とアニメーションフレームの反映を待ってから `captureBeyondViewport: false` で撮影する。撮影だけの欠落をアプリ不具合として報告しない。
- 表示名はマッピング後の名前（例: 夢男 → 熱交換器 (E-301)）。未更新メーターなどの確認は表示名ではなく `data-device-id` で行う（同じ表示名を持つ物理デバイスが複数ある）。
- Shelf ビューは Bedroom Meter / Living Meter を意図的に除外するため、グラフ数は Default と一致しない。
