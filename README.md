# Atlas Commerce

Atlas Commerce is a B2B wholesale commerce platform used by retail buyers to browse a catalog, reserve inventory, place bulk orders, capture payments, and produce daily settlement reports. The repository is organized as a small production-style service fleet: API gateway, catalog, inventory, orders, payments, settlement, PostgreSQL, Redis, and an ops synthetic monitor.

## Quickstart

```bash
docker compose up
```

The compose stack starts PostgreSQL and Redis, runs migrations plus deterministic seed data, starts the six application services, waits for the gateway to become ready, then starts synthetic traffic. External traffic enters through the gateway on `http://localhost:8080`.

The gateway also serves a lightweight operator console at `http://localhost:8080` for browsing products, checking price/stock, creating orders, and reviewing daily settlement totals.

Seed API keys:

```text
demo-key-1
demo-key-2
```

## Services

| Service | Port | Purpose |
|---|---:|---|
| `gateway` | 8080 | API gateway, API key auth, rate limiting, service routing |
| `catalog` | 7002 | Products, categories, price rules, computed pricing |
| `inventory` | 7003 | Warehouses, stock levels, reservations, adjustments |
| `orders` | 7004 | Order orchestration, lifecycle, shipments |
| `payments` | 7005 | Payment intents, capture, FX lookup |
| `settlement` | 7006 | Ledger entries, daily reports, settlement runs |
| `synthetic-monitor` | internal | Continuous synthetic traffic and invariant alerts |

## Useful Commands

```bash
npm run migrate
npm run typecheck:shared
npm run typecheck:synthetic-monitor
```

## Repository Map

| Path | Description |
|---|---|
| `docs/architecture.md` | System architecture and runtime model |
| `docs/contracts.md` | Integration contract for APIs, schemas, env, and shared library |
| `packages/shared` | Shared logger, config, DB, cache, HTTP client, retry, idempotency, errors, middleware, money helpers |
| `db/migrations` | Ordered PostgreSQL migrations |
| `db/seed` | Deterministic seed generator, generated SQL, and synthetic fixture IDs |
| `services/*` | Service implementations |

## Operations Notes

Every service uses one PostgreSQL database with a schema per service. Services own their schema exclusively and communicate through HTTP for cross-service reads or writes. Redis is used for cache, idempotency, API key/rate limit state, and other short-lived coordination.

The synthetic monitor drives traffic only through the gateway with `x-api-key: demo-key-1`. Healthy runs produce structured service logs and no `ALERT` lines.

## 과제 진행 / 제출 방식

이 저장소는 본인 전용으로 제공됩니다. 아래 순서로 진행해 주세요.

1. **사전 준비** — 테스트 시작 전, 본인 환경에서 `docker compose up` 이 한 번에 뜨는지 확인해 주세요 (Apple Silicon / Intel / Windows 모두 동일하게 동작합니다).
2. **작업 브랜치** — `main` 은 원본 상태로 두고, 본인 브랜치를 만들어 작업합니다.
   ```bash
   git checkout -b fix/<이름>
   ```
3. **수정 / 커밋** — 원인을 찾아 수정하고, 커밋 메시지에 무엇을 왜 고쳤는지 남겨 주세요.
4. **제출** — 작업 브랜치를 push 하고 `main` 대상 Pull Request 를 엽니다. PR 본문에는 (1) 관측한 증상, (2) 추적 과정 요약, (3) 수정 내용을 적어 주세요.

테스트 중에는 에디터·CLI·AI 도구 등 평소 쓰시는 개발 환경을 자유롭게 사용하셔도 됩니다.
