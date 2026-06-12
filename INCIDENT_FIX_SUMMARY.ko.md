# interview-incident-lab 수정 결과 요약

참고 문서:

- `WEIRD_FINDINGS.ko_2.md`
- `FIX_PLAN.ko_2.md`

## 요약

이 저장소의 주요 문제는 synthetic monitor가 기대하는 운영 invariant와 실제 서비스 구현이 어긋나면서 다음 경보를 만들 수 있다는 점이었습니다.

- `duplicate_charge`
- `stale_price`
- `stock_negative`
- `order_total_zero`
- `http_error`

이번 수정에서는 `_2` 문서에서 지적된 핵심 문제를 먼저 반영했고, 이후 Docker compose로 전체 서비스를 띄워 synthetic monitor를 반복 실행하면서 추가로 드러난 런타임 문제까지 함께 수정했습니다.

## 수정한 문제

| 구분 | 기존 문제 | 수정 내용 | 검증 |
|---|---|---|---|
| 결제 캡처 멱등성 | capture idempotency key에 매 요청마다 달라지는 시간이 포함되어 동일 요청 재시도도 서로 다른 작업으로 처리됨 | 멱등 키를 `capture:${intentId}:${idempotencyKey}`로 고정하고, PSP 호출 전에 `requires_capture -> processing` 상태를 선점하도록 변경 | `services/payments/tests/captureIntent.test.ts` |
| 중복 PSP 캡처 | 병렬 요청이 모두 `requires_capture`를 읽고 PSP capture를 여러 번 호출할 수 있음 | `processing` 상태는 409로 처리하고, 성공 상태는 PSP 재호출 없이 기존 intent를 반환하도록 변경 | 결제 단위 테스트 및 synthetic monitor |
| stale price | 가격 규칙 생성 시 상품 캐시만 지우고 가격 캐시는 지우지 않음 | 가격 규칙 생성 전후에 `invalidatePriceCaches()`를 호출하도록 변경 | `services/catalog/tests/priceRuleService.test.ts` |
| override 가격 계산 | override rule로 고정한 가격에 customer tier multiplier가 다시 적용됨 | override rule은 최종 local unit price로 처리하고, tier multiplier는 일반 가격 규칙에만 적용 | `services/catalog/tests/pricingEngine.test.ts` |
| 재고 commit 정합성 | 재고 커밋이 SELECT 후 절대값 UPDATE라 동시성 상황에서 정합성이 깨질 수 있음 | `reserved >= qty`와 `on_hand >= qty` 조건을 가진 단일 원자적 UPDATE로 변경 | 기존 inventory 테스트 및 전체 테스트 |
| 마이그레이션 번호 중복 | `006_settlement_external_ref_unique.sql`이 기존 migration 번호와 충돌 | migration을 `011_settlement_external_ref_unique.sql`로 이동 | Docker DB migration |
| FX 통화 오타 | catalog가 `KRW` 요청을 `KWR`로 바꿔 payments FX API를 호출함 | 요청된 quote currency를 그대로 사용하도록 수정 | `services/catalog/tests/paymentsClient.test.ts` |
| 카테고리 조회 500 | category repository가 schema에 없는 `display_order`로 정렬함 | 존재하는 컬럼인 `name, id` 기준 정렬로 변경 | `services/catalog/tests/categoryRepository.test.ts` |
| 취소 시나리오 URL | synthetic monitor가 gateway route와 맞지 않는 취소 URL을 호출함 | `/api/orders/orders/:id/cancel` 경로로 수정 | Docker synthetic monitor |
| 예약 해제 conflict | inventory의 예약 해제 409가 orders에서 502 upstream 오류로 변환됨 | 409를 `RESERVATION_RELEASE_CONFLICT`로 보존하도록 변경 | `services/orders/tests/cancelOrder.test.ts` |
| gateway 타입체크 | `ioredis` 기본 import가 workspace typecheck에서 실패 | named import 방식으로 수정 | workspace typecheck |

## 추가로 발견한 점

초기 정적 분석에서는 `order_total_zero`의 직접 원인을 특정하지 못했습니다. Docker 기반 검증을 진행하면서 실제로는 FX 통화 오타 때문에 가격 환산이 실패하고, 그 결과 주문 금액 검증 경로가 깨질 수 있음을 확인했습니다. 이 문제는 catalog payments client에서 `KRW`를 `KWR`로 바꾸던 코드를 제거해 해결했습니다.

또한 `price-rule-mutation` 시나리오는 캐시 무효화만 고쳐서는 통과하지 않았습니다. override rule의 의미가 "최종 가격 고정"인데 tier multiplier가 추가 적용되어 기대값 `12345`와 실제 계산값이 달라졌기 때문입니다. 그래서 가격 엔진에서 override rule은 tier multiplier를 적용하지 않도록 정리했습니다.

## 검증 결과

다음 검증을 완료했습니다.

```bash
npm test
npm run typecheck --workspaces --if-present
docker compose down -v
docker compose up --build -d
docker compose logs --no-color synthetic-monitor
```

결과:

- 단위 테스트: 23개 test file, 50개 test 모두 통과
- workspace typecheck 통과
- Docker compose에서 gateway, postgres, redis 포함 전체 서비스 기동 확인
- synthetic monitor가 여러 cycle 동안 `browse-catalog`, `price-lookup`, `order-burst`, `price-rule-mutation`, `payment-retry-storm`, `cancellations`, `settlement-report`를 실행했고 최종 로그에서 `ALERT`가 발생하지 않음

## 남은 리스크

이번 수정은 중복 PSP capture와 synthetic monitor 경보 제거를 1차 목표로 했습니다. 다만 PSP capture 성공 이후 settlement ledger 작성이 실패하는 경우에는 intent가 이미 `succeeded`가 되어 재시도 시 ledger가 자동 복구되지 않을 수 있습니다. 운영 수준에서는 outbox, 재처리 job, 또는 settlement reconciliation 같은 후속 보완이 필요합니다.

`npm install` 과정에서 audit 취약점이 보고되었지만, 이번 incident 수정 범위에는 포함하지 않았습니다.
