# Paper Trading Setup

This runbook is for the real paper trading loop, not `LOCAL_DEMO_MODE=true`.

## Required Environment Variables

Set these in `.env`:

```bash
DATABASE_URL="postgresql://..."
PORT=4000
FRONTEND_ORIGIN="http://127.0.0.1:3100"
NEXT_PUBLIC_API_BASE_URL="http://127.0.0.1:4000"
BOT_PASSWORD="local-demo-password"
API_PASSWORD="local-demo-password"
DASHBOARD_PASSWORD="local-demo-password"
ENABLE_LEGACY_TRADING_API=true
LOCAL_DEMO_MODE=false
WORKER_INTERVAL_MS=30000
REPORT_TIMEZONE="Asia/Seoul"
MARKET_DATA_PROVIDER="binance"
```

Optional but recommended:

```bash
DAILY_REPORT_HOUR=23
WEEKLY_REPORT_HOUR=23
WEEKLY_REPORT_DAY="SUN"
```

## DB Setup

From repo root:

```bash
npm install
npm run prisma:generate
npm run prisma:migrate:dev -- --name init
npm run prisma:seed
```

## Local Run Order

Run these in separate terminals:

```bash
npm run dev:api
```

```bash
npm run dev:worker
```

```bash
npm run dev:web
```

Single command alternative:

```bash
npm run dev
```

## How to Verify the Worker Is Actually Running

1. Check basic health:

```bash
curl -s http://127.0.0.1:4000/health
```

2. Check worker status:

```bash
curl -s -H "x-dashboard-password: local-demo-password" http://127.0.0.1:4000/worker/status
```

3. Check paper trading status:

```bash
curl -s -H "x-dashboard-password: local-demo-password" http://127.0.0.1:4000/paper/status
```

4. Quick combined check:

```bash
npm run paper:status
```

## Operational Endpoints

- `GET /health`
- `GET /worker/status`
- `GET /paper/status`
- `GET /paper/positions`
- `GET /paper/trades`
- `GET /paper/logs`
- `POST /paper/reset`
- `POST /telegram/test`

## What to Look For

The worker is really alive only if these fields move over time:

- `lastHeartbeatAt`
- `lastWorkerTickAt`
- `lastMarketUpdateAt`
- `lastStrategyEvaluationAt`
- `lastTradeExecutionAt` when a trade happens

## UI Verification

Open:

- `http://127.0.0.1:3100`

Main checks:

- Agent log stream changes over time
- New `ENTRY / EXIT / FILTER / ALERT` lines show up
- Chart stays live
- Summary line changes after trades

## Trade / Position / Event Verification

Recent positions:

```bash
curl -s -H "x-dashboard-password: local-demo-password" "http://127.0.0.1:4000/paper/positions?status=OPEN"
```

Recent trades:

```bash
curl -s -H "x-dashboard-password: local-demo-password" "http://127.0.0.1:4000/paper/trades?limit=20"
```

Recent events:

```bash
curl -s -H "x-dashboard-password: local-demo-password" "http://127.0.0.1:4000/paper/logs?limit=30"
```

## Paper Trading Flow

Every worker cycle:

1. Worker heartbeat updates.
2. Public market candles are fetched.
3. Only active strategies are evaluated.
4. A signal is generated or skipped.
5. Fee/slippage and filter checks run.
6. Paper order executes on entry or exit.
7. Trade, position, strategy run, and structured event are stored.
8. The same event stream feeds the UI log panel and Telegram notifier.

## Structured Event Types

- `WORKER_TICK`
- `MARKET_DATA_UPDATED`
- `STRATEGY_EVALUATED`
- `SIGNAL_GENERATED`
- `ENTRY_PLACED`
- `EXIT_TAKE_PROFIT`
- `EXIT_STOP_LOSS`
- `TRADE_SKIPPED`
- `COOLDOWN_TRIGGERED`
- `ERROR`

## Operating Checklist

Before starting:

- `LOCAL_DEMO_MODE=false`
- DB is reachable
- `npm run prisma:seed` completed
- API password matches web password
- Worker terminal shows no boot error

After starting:

- `/worker/status` is `LIVE`
- `/paper/status` returns non-empty `watchedSymbols`
- `/paper/logs` grows over time
- UI log stream shows recent worker events
- Telegram test succeeds if configured

## Troubleshooting

### Worker runs but no trades happen

- Check `/paper/logs` for `TRADE_SKIPPED` or `COOLDOWN_TRIGGERED`
- Check strategy is `ACTIVE`
- Check `MARKET_DATA_PROVIDER="binance"`
- Wait for enough candles if the DB was just reset

### Market data seems stuck

- Check `/worker/status.lastMarketUpdateAt`
- Check internet access from the API/worker environment
- If Binance public API is unavailable, the adapter falls back to mock candles

### UI log updates but trade table does not

- Check `/paper/trades`
- Confirm the worker is not only generating `HOLD` or `SKIP`
- Confirm database writes are succeeding in the worker terminal

### DB connection fails

- Recheck `DATABASE_URL`
- Confirm PostgreSQL is running
- Re-run `npm run prisma:generate`
- Re-run `npm run prisma:migrate:dev -- --name init`
