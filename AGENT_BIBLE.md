# 에이전트 운영 불변 원칙

> 도구가 바뀌어도, 프레임워크가 바뀌어도, 이 원칙은 변하지 않는다.
> 모든 에이전트는 매 작업 시작 전에 이 파일을 참조한다.

---

## 패러다임: 프롬프팅 → 거버넌스

```
옛 방식: 프롬프팅
  → 잘 쓴 프롬프트에 의존
  → LLM이 "따를 수도, 안 따를 수도"인 확률적 제어

새 방식: 거버넌스
  → HARNESS로 결정론적 강제
  → AGENTS로 역할 분리
  → ORCHESTRATION으로 협업 구조화
  → "Stop Prompting, Start Governing"
```

---

## 핵심 불변 원칙

### 보편 원칙 (모든 프로젝트)

```
1. Clean context         → 컨텍스트를 항상 깨끗하게 유지
2. Explicit goals        → 목표를 명시적으로 선언
3. Plan before executing → 실행 전 반드시 계획
4. Read before editing   → 편집 전 반드시 읽기
5. Verify before trusting → 신뢰 전 반드시 검증
```

### Trading Taro 프로젝트 원칙

```
6. 기존 코드 먼저        → 새로 만들기 전에 packages/shared/를 반드시 검색
7. 서버가 진실           → 결제, 크레딧, 인증은 반드시 서버 사이드
8. 규제가 기능보다 우선   → regulation-reviewer BLOCKED = 무조건 수정
9. 빈 화면 절대 금지      → AI 실패해도 폴백으로 결과 제공
10. 스토어가 최종 게이트  → 심사 통과 못하면 출시 못함
```

---

## 위반 시 자동 대응

| 원칙 | 위반 탐지 | 대응 |
|---|---|---|
| 1-5 | code-reviewer 리뷰 시 | WARNING 발행 |
| 6 | 중복 코드 발견 | refactor-cleaner 호출 |
| 7 | 클라이언트에 결제/인증 로직 | security-reviewer CRITICAL |
| 8 | 금칙어 포함 텍스트 배포 시도 | regulation-reviewer BLOCKED → 머지 차단 |
| 9 | try-catch 없는 AI 호출 | build-error-resolver 경고 |
| 10 | 스토어 체크 미통과 출시 시도 | store-reviewer 차단 |

---

## 금기 사항 (절대 하지 않는 것)

```
- any 타입 사용 (TypeScript)
- 클라이언트에서 크레딧 직접 차감
- 클라이언트 번들에 API 키 포함
- 테스트 없는 코드 push
- 금칙어 검사 없는 LLM 출력 노출
- force push to main
- Prisma migration 없는 스키마 변경
```

---

## 품질 기준

```
코드 커버리지: 80% 이상
함수 길이: 20줄 이하
중첩 깊이: 3단계 이하
빌드 성공률: 100% (실패 시 push 금지)
금칙어 검사: 사용자 노출 텍스트 100% 커버
```
