# Atlas Commerce

Atlas Commerce는 소매 구매자가 카탈로그를 조회하고, 재고를 예약하며, 대량 주문을 등록하고, 결제를 수집하고, 일일 정산 리포트를 생성할 수 있는 B2B 도매 상거래 플랫폼입니다. 이 저장소는 소규모 운영용 서비스 집합으로 구성되어 있으며, API 게이트웨이, 카탈로그, 재고, 주문, 결제, 정산, PostgreSQL, Redis, 그리고 운영용 합성 모니터가 포함됩니다.

## Quickstart

```bash
docker compose up
```

컴포즈 스택은 PostgreSQL 및 Redis를 시작하고, 마이그레이션과 결정론적 시드 데이터를 실행한 뒤, 여섯 개의 애플리케이션 서비스를 기동하고, 게이트웨이가 준비될 때까지 대기한 후 합성 트래픽을 시작합니다. 외부 트래픽은 `http://localhost:8080`의 게이트웨이를 통해 유입됩니다.

시드 API 키:

```text
demo-key-1
demo-key-2
```

## Services

| Service | Port | Purpose |
|---|---:|---|
| `gateway` | 8080 | API 게이트웨이, API 키 인증, 속도 제한, 서비스 라우팅 |
| `catalog` | 7002 | 상품, 카테고리, 가격 규칙, 계산된 가격 |
| `inventory` | 7003 | 창고, 재고 수량, 예약, 조정 |
| `orders` | 7004 | 주문 오케스트레이션, 라이프사이클, 배송 |
| `payments` | 7005 | 결제 의도, 캡처, FX 조회 |
| `settlement` | 7006 | 원장 항목, 일일 리포트, 정산 실행 |
| `synthetic-monitor` | internal | 지속적인 합성 트래픽 및 불변성 알림 |

## Useful Commands

```bash
npm run migrate
npm run typecheck:shared
npm run typecheck:synthetic-monitor
```

## Repository Map

| Path | Description |
|---|---|
| `docs/architecture.md` | 시스템 아키텍처 및 런타임 모델 |
| `docs/contracts.md` | API, 스키마, 환경변수, 공유 라이브러리에 대한 통합 계약 |
| `packages/shared` | 공유 로거, 설정, DB, 캐시, HTTP 클라이언트, 재시도, 멱등성, 오류, 미들웨어, 통화 관련 헬퍼 |
| `db/migrations` | 정렬된 PostgreSQL 마이그레이션 |
| `db/seed` | 결정론적 시드 생성기, 생성된 SQL, 합성 피처 ID |
| `services/*` | 서비스 구현 |

## Operations Notes

각 서비스는 하나의 PostgreSQL 데이터베이스를 사용하며, 서비스별로 스키마를 분리해 운영합니다. 서비스는 스키마를 배타적으로 소유하며, 서비스 간 읽기/쓰기 통신은 HTTP를 통해 수행합니다. Redis는 캐시, 멱등성, API 키/속도 제한 상태, 기타 단기 조정 상태 관리에 사용됩니다.

합성 모니터는 `x-api-key: demo-key-1`만 사용하여 게이트웨이 경유로만 트래픽을 발생시킵니다. 정상 동작에서는 구조화된 서비스 로그만 출력되고 `ALERT` 라인이 출력되지 않습니다.

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