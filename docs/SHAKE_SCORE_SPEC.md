# 흔들림 점수 스펙 (SHAKE_SCORE_SPEC)

| | |
|---|---|
| **상태** | Phase 5 step 1 구현 완료(엔진). PRODUCT_VISION §8.1/§8.2 의 구체화. |
| **선행 문서** | `docs/PRODUCT_VISION.md` §4.1·§8 / `docs/PRODUCT_TRUTH.md`(정직한 숫자) |
| **구현** | `packages/fomo-core/src/shake-score/score.ts` (순수 함수) + `__tests__/shake-score.test.ts` |
| **정의 축(오너 확정)** | **혼합형** — 시장 열기 × 내 스와이프 관심 반응. 콜드스타트는 숫자 숨김. |

> 흔들림 점수는 **시장의 열기가 아니라, 그 열기에 대한 오늘 *나*의 반응**을 0~100으로 본다.
> §4.1 "시장은 광기 84인데 너는 잘 안 흔들렸어"를 숫자로 만든다.

---

## 1. 입력 (이미 가진 로컬 신호)

전부 익명·로컬(localStorage). fomo-web 어댑터가 join 해 엔진에 넘긴다.

- `keywordHistory`(`fomo_keyword_history`): 본 카드 {keyword, **fomoScore**, ts}
- `keywordInterest`(`fomo_keyword_interest`): 스와이프 {keywordId, **more/less**, ts}

→ `ShakeInteraction { keyword, fomoScore(0~100), reaction?:"more"|"less", tsMs }`

KST 일자 버킷팅은 엔진 내부(`Intl … Asia/Seoul`, 결정적).

## 2. 공식

각 engagement(반응 있는 카드)에 대해:
```
pull_i   = (fomoScore_i / 100) × (reaction==="more" ? 1.0 : 0.25)   // 시장 열기 × 내 반응
marketPull = mean(pull_i)
scatter    = min(1, (오늘 more로 추격한 서로 다른 '뜨거운'(fomoScore≥50) 테마 수) / 3)   // §4.4 시선 옮겨다님
score      = round(100 × (0.75·marketPull + 0.25·scatter))
```
- **혼합**: 같은 시장 열기라도 따라가면(more) 높고 패스하면(less) 낮다. 차가운 테마는 추격해도 거의 안 오른다(분산에서도 제외 — 차가운 추격은 FOMO 가 아님).
- **대조값** `marketHeat` = 오늘 본 카드(반응 무관) 평균 fomoScore → "시장 84 vs 너 32".
- **가중치/임계는 튜닝 가능**(상수): W_PULL .75 / W_SCATTER .25 / LESS .25 / HOT 50 / SCATTER_SAT 3.

## 3. 정직성 / 콜드스타트 (§8.2)

| 조건 | confidence | 화면 |
|---|---|---|
| 오늘 engagement ≥ 7 | `ok` | 점수 노출 |
| 3 ≤ engagement < 7 | `low` | 점수 + "긴가민가" 결 |
| engagement < 3, 과거 기록 있음 | `insufficient` | **숫자 숨김** + "데이터 부족" |
| engagement < 3, 첫날(과거 버킷 없음) | `onboarding` | **숫자 숨김** + "너를 알아가는 중" |

- **가짜 숫자 금지**: 데이터 부족 시 `score=null`. 30일 기준선이 없으므로 "평소 대비" 단정 안 함.
- **어제 대비 Δ**: 로컬에 어제 버킷이 충분(engagement≥3)할 때만 `today−yesterday`, 아니면 `null`.

## 4. 출력

```ts
ShakeResult {
  score: number | null
  confidence: "ok" | "low" | "insufficient" | "onboarding"
  marketHeat: number | null
  deltaVsYesterday: number | null
  components: { marketPull, scatter } | null
  engagementCount, viewedCount: number
  reason: string   // 정직성 노출/디버그
}
```

## 5. 다음 단계 (이 엔진 위에)

PRODUCT_VISION §9 Phase 5: step 2 "오늘의 너"(스와이프 끝 카드 — 점수+시장 대조) → step 3 판단 보조 무료 진단 → step 4 패턴 거울(PRO) → step 5 결제. **엔진은 세 화면 공통 토대.** 서버 집계(취향 프로파일)는 §7 행동 로그 보존 위에서 후속.
