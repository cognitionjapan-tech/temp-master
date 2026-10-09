# Temp Master Dashboard

A fullstack web dashboard to monitor temperature readings from SwitchBot Meter devices.

## Features

- Temperature charts for all SwitchBot Meter devices using Recharts
- Time scale switching (hour/day/week/month/year)
- Default / Shelf view toggle, stale (7+ days) meter section
- Light / Dark / High Contrast themes (saved in localStorage)
- Auto-refresh every 30 seconds (frontend) with background data collection every 2 minutes (backend)
- Rate limiting protection with exponential backoff
- All API calls are cached - GET endpoints never call SwitchBot API directly

## Setup

### Backend

1. Navigate to the backend directory:
   ```bash
   cd switchbot-backend
   ```

2. Install dependencies:
   ```bash
   poetry install
   ```

3. Copy `.env.example` to `.env` and add your SwitchBot credentials:
   ```bash
   cp .env.example .env
   ```
   
   Get your credentials from the SwitchBot app:
   - Go to Profile > Preferences > About
   - Tap App Version 10 times to enable Developer Options
   - Go to Developer Options > Get Token

4. Start the development server:
   ```bash
   poetry run fastapi dev app/main.py
   ```

### Frontend

React 18 + TypeScript + Vite / Tailwind CSS / Recharts / TanStack Query で構成されています。
データは `src/api/client.ts` の `API_URL`（`https://snakeroom.fly.dev`）から取得し、30 秒ごとに自動更新します。

```bash
cd switchbot-frontend
npm ci
npm run dev        # http://localhost:5173
npm test           # Vitest + React Testing Library
npm run typecheck
npm run build      # dist/ を生成
```

FastAPI から配信する場合は `dist/` を `switchbot-backend/static` にリンクします（Docker ではマルチステージビルドで自動配置）。

```bash
ln -sfn $(pwd)/switchbot-frontend/dist switchbot-backend/static
```

## API Endpoints

- `GET /api/meters` - Returns list of all meter devices with current temperature (from cache)
- `GET /api/meters/{device_id}/history` - Returns temperature history with time_scale parameter
- `POST /api/meters/refresh` - Triggers immediate data collection
- `GET /api/status` - Returns backend status and configuration

## Notes

- Temperature history is stored in memory and resets on backend restart
- Backend data collection interval: 2 minutes minimum
- Frontend refresh interval: 30 seconds
- SwitchBot API has strict rate limits (~10000 requests/day)
