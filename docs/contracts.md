# Atlas Commerce — Service Contracts

This file is the integration contract between services. Code against it
exactly: names, paths, field casing, and status codes are binding.

## 1. Shared library `@atlas/shared` (packages/shared)

Exports (all from the package root):

```ts
// logger.ts
createLogger(service: string): Logger
interface Logger { debug|info|warn|error(msg: string, ctx?: Record<string, unknown>): void
                   child(ctx: Record<string, unknown>): Logger }

// config.ts — reads process.env, throws on missing required keys at boot
defineConfig<T>(spec: { [K in keyof T]: { env: string; required?: boolean;
  default?: string; parse?: (raw: string) => T[K] } }): T

// db.ts — pg Pool wrapper
createPool(cfg: { connectionString: string; schema: string }): Db
interface Db { query<R>(sql: string, params?: unknown[]): Promise<R[]>
               withTx<R>(fn: (tx: Db) => Promise<R>): Promise<R>
               close(): Promise<void> }

// cache.ts — Redis JSON cache
createCache(cfg: { url: string; prefix: string }): Cache
interface Cache { get<T>(key: string): Promise<T | null>
                  set(key: string, value: unknown, ttlSec: number): Promise<void>
                  del(...keys: string[]): Promise<void>
                  withCache<T>(key: string, ttlSec: number, loader: () => Promise<T>): Promise<T>
                  close(): Promise<void> }

// httpClient.ts — inter-service HTTP
serviceClient(cfg: { baseUrl: string; service: string; timeoutMs?: number }): ServiceClient
interface ServiceClient { get<T>(path: string, opts?: ReqOpts): Promise<T>
                          post<T>(path: string, body?: unknown, opts?: ReqOpts): Promise<T>
                          patch<T>(path: string, body?: unknown, opts?: ReqOpts): Promise<T> }
interface ReqOpts { headers?: Record<string, string>; timeoutMs?: number }
// Throws UpstreamError (extends AppError, carries status + body) on non-2xx.

// retry.ts
withRetry<T>(fn: () => Promise<T>, opts?: { retries?: number; baseDelayMs?: number;
  retryOn?: (err: unknown) => boolean }): Promise<T>

// idempotency.ts — Redis-backed exactly-once guard
createIdempotency(cache: Cache): Idempotency
interface Idempotency {
  // Runs fn once per key within ttl; concurrent/duplicate calls get the stored result.
  run<T>(key: string, ttlSec: number, fn: () => Promise<T>): Promise<{ result: T; replayed: boolean }>
}

// errors.ts
class AppError extends Error { code: string; status: number; ctx?: object }
class NotFoundError / ConflictError / ValidationError / UpstreamError extends AppError
errorHandler(logger: Logger): express.ErrorRequestHandler

// middleware.ts
requestId(): express.RequestHandler            // sets req.id + x-request-id header
accessLog(logger: Logger): express.RequestHandler
healthRouter(checks: { name: string; check: () => Promise<void> }[]): express.Router
// healthRouter serves GET /health (always 200 {status:"ok"}) and
// GET /ready (runs checks; 200 or 503 with per-check results)

// money.ts
convertCents(amountCents: number, rate: number): number   // banker's rounding
formatCents(amountCents: number, currency: string): string
```

Package name: `@atlas/shared`. Services import it as a workspace dependency.

## 2. Database

One PostgreSQL instance, database `atlas`. Each service uses its own schema and
must never query another service's schema.

Migrations live in `db/migrations/NNN_<desc>.sql` (plain SQL, applied in order
by the `migrator` container; tracking table `public.schema_migrations`).

### Schema `catalog`
- `categories(id uuid pk, name text, parent_id uuid null)`
- `products(id uuid pk, sku text unique, name text, description text,
   category_id uuid, base_price_cents bigint, currency text default 'USD',
   status text check in ('active','discontinued'), created_at, updated_at)`
- `price_rules(id uuid pk, product_id uuid, rule_type text check in
   ('percent_off','fixed_off','override'), value bigint, priority int,
   starts_at timestamptz, ends_at timestamptz, created_at)`

### Schema `inventory`
- `warehouses(id uuid pk, code text unique, name text, region text)`
- `stock_levels(warehouse_id uuid, product_id uuid, on_hand int not null,
   reserved int not null default 0, updated_at, primary key(warehouse_id, product_id))`
- `stock_reservations(id uuid pk, order_id uuid, status text check in
   ('pending','committed','released'), expires_at timestamptz, created_at)`
- `stock_reservation_lines(id uuid pk, reservation_id uuid, product_id uuid,
   warehouse_id uuid, qty int)`
- `stock_movements(id uuid pk, warehouse_id uuid, product_id uuid, delta int,
   reason text, ref_type text, ref_id uuid, created_at)`

### Schema `orders`
- `customers(id uuid pk, code text unique, name text, tier text check in
   ('standard','gold','platinum'), country text, currency text)`
- `orders(id uuid pk, customer_id uuid, status text check in
   ('pending','reserved','confirmed','shipped','cancelled','failed'),
   currency text, subtotal_cents bigint, total_cents bigint,
   reservation_id uuid null, payment_intent_id uuid null, placed_at, updated_at)`
- `order_items(id uuid pk, order_id uuid, product_id uuid, qty int,
   unit_price_cents bigint, line_total_cents bigint)`
- `shipments(id uuid pk, order_id uuid, status text check in
   ('preparing','dispatched','delivered'), carrier text, tracking_no text, created_at)`

### Schema `payments`
- `payment_intents(id uuid pk, order_id uuid, amount_cents bigint,
   currency text, status text check in ('requires_capture','processing',
   'succeeded','failed','voided'), idempotency_key text, created_at, updated_at)`
- `payment_attempts(id uuid pk, intent_id uuid, attempt_no int, status text
   check in ('succeeded','failed'), provider_ref text, error_code text null, created_at)`
- `fx_rates(base text, quote text, rate numeric(18,8), fetched_at timestamptz,
   primary key(base, quote))`

### Schema `settlement`
- `ledger_entries(id uuid pk, account text, order_id uuid null,
   payment_intent_id uuid null, amount_cents bigint, currency text,
   entry_type text check in ('charge','refund','fee','payout'),
   external_ref text null, created_at)`
- `settlements(id uuid pk, period_start date, period_end date, status text
   check in ('draft','finalized'), total_cents bigint, created_at)`
- `settlement_lines(id uuid pk, settlement_id uuid, ledger_entry_id uuid)`

### Seed (db/seed)
~40 categories, ~600 products (USD base prices), 3 warehouses, stock for every
product in 1–3 warehouses (on_hand 50–500), ~80 customers across
US/KR/JP/DE (currency USD/KRW/JPY/EUR), fx_rates for USD↔KRW/JPY/EUR,
~30 active price_rules. Deterministic (fixed seed data, no random at runtime).

## 3. Service APIs

All request/response bodies are JSON, camelCase. List endpoints support
`?limit=&offset=` and return `{ items: [...], total: number }`.

### catalog (7002)
- `GET /products` (filters: `?categoryId=&status=&sku=`)
- `GET /products/:id` → product
- `POST /products` / `PATCH /products/:id`
- `GET /products/:id/price?customerTier=&currency=&qty=` →
  `{ productId, currency, qty, unitPriceCents, appliedRuleIds: string[] }`
  (applies active price_rules by priority; converts via payments FX API when
  `currency` differs from the product currency)
- `GET /categories`
- `POST /price-rules` / `DELETE /price-rules/:id`

### inventory (7003)
- `GET /stock/:productId` → `{ productId, total: { onHand, reserved },
  byWarehouse: [{ warehouseId, onHand, reserved }] }`
- `POST /reservations` body `{ orderId, lines: [{ productId, qty }] }` →
  201 `{ id, status:'pending', lines:[{ productId, warehouseId, qty }] }`,
  409 `{ error: { code:'INSUFFICIENT_STOCK' } }` when short
- `POST /reservations/:id/commit` → decrements on_hand, releases reserved
- `POST /reservations/:id/release`
- `POST /adjustments` body `{ warehouseId, productId, delta, reason }`
- `GET /warehouses`

### orders (7004)
- `POST /orders` body `{ customerId, lines: [{ productId, qty }] }` —
  orchestrates the flow in docs/architecture.md → 201 order (status
  `confirmed`) or 422 with failure reason
- `GET /orders/:id`, `GET /orders` (`?customerId=&status=`)
- `POST /orders/:id/cancel`
- `POST /orders/:id/ship` → creates shipment
- `GET /orders/:id/timeline` → status history assembled from local data

### payments (7005)
- `POST /intents` body `{ orderId, amountCents, currency, idempotencyKey }` → 201 intent
- `POST /intents/:id/capture` body `{ idempotencyKey }` — calls the PSP
  provider module, records a payment_attempt, posts a `charge` ledger entry to
  settlement on success. Idempotent per idempotencyKey.
- `POST /intents/:id/void`
- `GET /intents/:id`
- `GET /fx/:base/:quote` → `{ base, quote, rate, fetchedAt }` (served from
  fx_rates with Redis caching)

The PSP is an in-process mock provider module (`src/provider/`): deterministic
latency 30–80ms, returns `provider_ref`; a configurable failure mode is OFF by
default (env `PSP_FAIL_RATE=0`).

### settlement (7006)
- `POST /ledger/entries` body `{ account, orderId?, paymentIntentId?,
  amountCents, currency, entryType, externalRef? }` → 201
- `GET /reports/daily?date=YYYY-MM-DD` → totals by account/entryType
- `POST /settlements/run` body `{ periodStart, periodEnd }` → creates a draft
  settlement from unsettled ledger entries
- `GET /settlements/:id`

### gateway (8080)
- Routes `/api/catalog/* → catalog`, `/api/inventory/* → inventory`,
  `/api/orders/* → orders`, `/api/payments/* → payments`,
  `/api/settlement/* → settlement` (path prefix stripped).
- Auth: header `x-api-key` checked against seeded keys in Redis
  (`gateway:apikeys` set, loaded from env `GATEWAY_API_KEYS`, comma-separated;
  seed value `demo-key-1,demo-key-2`). 401 on missing/unknown key.
- Per-key rate limiting (Redis counters, 120 req/10s, 429 on excess).
- `GET /health` (self), `GET /ready` (fans out to every service's `/ready` and
  aggregates `{ service: status }`).

## 4. Service directory layout (binding for every service)

```
services/<name>/
  package.json            name "@atlas/<name>", dep on @atlas/shared
  tsconfig.json           extends ../../tsconfig.base.json
  Dockerfile              FROM node:22-slim, runs `npx tsx src/index.ts`
  src/index.ts            bootstrap: config, pool, cache, app.listen
  src/app.ts              createApp(deps) → Express app (no listen)
  src/config.ts           defineConfig spec for this service
  src/routes/             one router file per resource
  src/controllers/        request parsing/validation → service calls
  src/domain/             business logic, pure where possible
  src/repositories/       SQL access (this service's schema only)
  src/clients/            serviceClient wrappers for downstream services
  src/jobs/               background loops (if any)
  tests/                  vitest unit tests for domain logic
```

## 5. Environment (compose contract)

Compose service names: `postgres`, `redis`, `migrator`, `gateway`, `catalog`,
`inventory`, `orders`, `payments`, `settlement`, `synthetic-monitor`.

Common env per service: `DATABASE_URL=postgres://atlas:atlas@postgres:5432/atlas`,
`REDIS_URL=redis://redis:6379`, `PORT=<service port>`, `LOG_LEVEL=info`,
plus `<DEP>_URL` for each downstream dependency, e.g.
`CATALOG_URL=http://catalog:7002`. Only `gateway` publishes a host port (8080).

## 6. synthetic-monitor

Ops-style synthetic traffic generator + anomaly alerter (services/synthetic-monitor):

- Drives realistic traffic through the gateway with `x-api-key: demo-key-1`:
  browse products, price lookups, concurrent order bursts (same product from
  multiple customers in parallel), price-rule changes followed by price reads,
  payment capture retry storms (re-sending the same capture request),
  occasional cancellations, daily report reads.
- Asserts invariants after each scenario and logs structured alert lines on
  violation, e.g.:
  `ALERT stock_negative {productId, warehouseId, onHand}`
  `ALERT order_total_zero {orderId, currency}`
  `ALERT stale_price {productId, expectedCents, gotCents}`
  `ALERT duplicate_charge {orderId, chargeCount}`
  `ALERT http_error {path, status}`
- Alerts state symptoms only (what was observed where), never speculate about
  causes. Healthy system = zero ALERT lines.
- Scenario cadence: a full cycle every ~15s, staggered; deterministic ordering.
