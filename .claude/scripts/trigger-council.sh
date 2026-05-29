#!/usr/bin/env bash
# Daily Agent Council 수동 트리거 스크립트
# Claude Code 세션 (또는 로컬 터미널)에서 직접 호출 가능
#
# 사전 요건:
#   환경변수 GITHUB_TOKEN 또는 GH_TOKEN 필요
#   로컬에서: export GITHUB_TOKEN=$(gh auth token)
#
# 사용법:
#   bash .claude/scripts/trigger-council.sh              # 전체 실행 (all)
#   bash .claude/scripts/trigger-council.sh cto          # CTO 에이전트만
#   bash .claude/scripts/trigger-council.sh cto marketer prompt_engineer
#
# 에이전트 이름:
#   all / pm / frontend / backend / designer / qa / cto / marketer / security / prompt_engineer

set -euo pipefail

REPO="mlender-ai/taro-stock-app"
WORKFLOW="idea-proposal.yml"
BRANCH="main"
AGENTS=("${@:-all}")

# 토큰 우선순위: GITHUB_TOKEN → GH_TOKEN
TOKEN="${GITHUB_TOKEN:-${GH_TOKEN:-}}"
if [[ -z "$TOKEN" ]]; then
  echo "❌ GITHUB_TOKEN (또는 GH_TOKEN) 환경변수가 없습니다."
  echo ""
  echo "로컬에서 실행 시:"
  echo "  export GITHUB_TOKEN=\$(gh auth token)"
  echo "  bash .claude/scripts/trigger-council.sh all"
  echo ""
  echo "또는 GitHub Actions UI에서 직접 실행:"
  echo "  https://github.com/${REPO}/actions/workflows/${WORKFLOW}"
  exit 1
fi

for AGENT in "${AGENTS[@]}"; do
  echo "▶ Triggering agent: $AGENT"
  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Accept: application/vnd.github+json" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    "https://api.github.com/repos/${REPO}/actions/workflows/${WORKFLOW}/dispatches" \
    -d "{\"ref\":\"${BRANCH}\",\"inputs\":{\"agent\":\"${AGENT}\"}}")

  if [[ "$HTTP_STATUS" == "204" ]]; then
    echo "  ✅ Dispatched: $AGENT"
  else
    echo "  ❌ Failed (HTTP $HTTP_STATUS): $AGENT"
  fi

  # 여러 에이전트 연속 트리거 시 concurrency 충돌 방지
  if [[ "${#AGENTS[@]}" -gt 1 && "$AGENT" != "${AGENTS[-1]}" ]]; then
    echo "  ⏳ 대기 10s..."
    sleep 10
  fi
done

echo ""
echo "🔗 실행 확인: https://github.com/${REPO}/actions/workflows/${WORKFLOW}"
