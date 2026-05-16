# 멀티 에이전트 협업 규칙

---

## 기본 원칙

```
1. 오케스트레이터(메인 Claude)가 요청을 분석하고 적절한 에이전트에 위임한다.
2. 에이전트는 자기 역할 범위만 수행하고, 범위 밖 작업은 오케스트레이터에 반환한다.
3. 하나의 작업에 여러 에이전트가 순차적으로 관여할 수 있다.
4. 충돌 시 보수적인 판단(차단/대기)이 우선이다.
```

---

## 주요 워크플로우

### WF1: 새 기능 구현

```
사용자 요청
  → planner: 설계 청사진 + 기존 코드 재활용 검토
  → tdd-guide: 테스트 먼저 작성
  → [구현]: 코드 작성
  → code-reviewer: 리뷰
  → regulation-reviewer: 금융 규제 검토 (사용자 노출 텍스트 있을 때만)
  → security-reviewer: 보안 검사
  → HARNESS 게이트 통과
  → commit + push
```

### WF2: 타로 해석 프롬프트 변경

```
사용자 요청
  → prompt-engineer: 프롬프트 수정
  → regulation-reviewer: 금칙어 검사
  → tdd-guide: 해석 품질 테스트
  → code-reviewer: 리뷰
  → commit + push
```

### WF3: 스토어 출시 준비

```
사용자 요청
  → rn-specialist: EAS 빌드 설정 확인
  → store-reviewer: 심사 체크리스트 실행
  → regulation-reviewer: 면책 문구 최종 확인
  → security-reviewer: 보안 최종 검사
  → 출시
```

### WF4: 빌드 실패 대응

```
빌드 오류 발생
  → build-error-resolver: 오류 진단 + 수정
  → (Expo 빌드면 rn-specialist 추가 투입)
  → 빌드 재실행
```

### WF5: Prisma 스키마 변경

```
스키마 변경 요청
  → planner: 마이그레이션 계획
  → [구현]: 스키마 수정 + prisma migrate
  → security-reviewer: 데이터 접근 권한 검사
  → code-reviewer: 리뷰
  → commit + push
```

---

## 에이전트 간 충돌 해결

| 상황 | 우선 에이전트 | 이유 |
|---|---|---|
| code-reviewer vs security-reviewer | security-reviewer | 보안이 항상 우선 |
| regulation-reviewer가 BLOCKED 판정 | regulation-reviewer | 무조건 수정 후 재검사 |
| store-reviewer가 리젝 위험 탐지 | store-reviewer + rn-specialist | 협력 해결 후 재검사 |
| prompt-engineer vs regulation-reviewer | regulation-reviewer | 금칙어가 창의성보다 우선 |

---

## 에이전트 호출 조건

| 에이전트 | 자동 호출 조건 |
|---|---|
| planner | 새 기능 구현 시작 시 |
| tdd-guide | 모든 구현 작업 시 |
| code-reviewer | PR 생성 또는 push 전 |
| security-reviewer | 인증/결제/API키 관련 코드 변경 시 |
| regulation-reviewer | 사용자 노출 텍스트/프롬프트 변경 시 |
| store-reviewer | 릴리즈 빌드 전 |
| rn-specialist | Expo/네이티브 모듈/빌드 이슈 시 |
| prompt-engineer | 프롬프트 파일 변경 시 |
| build-error-resolver | 빌드 실패 시 |
| refactor-cleaner | 기능 완료 후 정리 단계 |
| doc-updater | 기능 완료 후 |
