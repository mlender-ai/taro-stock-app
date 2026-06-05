#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"
ROOT_DIR="$(dirname "$(dirname "$APP_DIR")")"

echo "=== FOMO Club 번들 검증 ==="
echo ""
ERRORS=0

# 1. React 버전 격리 (앱 19.x / 루트 18.x)
APP_REACT=$(node -e "console.log(require('$APP_DIR/node_modules/react/package.json').version)" 2>/dev/null || echo "MISSING")
ROOT_REACT=$(node -e "console.log(require('$ROOT_DIR/node_modules/react/package.json').version)" 2>/dev/null || echo "MISSING")
echo "[1] React — 앱: $APP_REACT / 루트: $ROOT_REACT"
if [ "$APP_REACT" = "MISSING" ]; then
  echo "    FAIL: 앱 로컬 react 없음"; ERRORS=$((ERRORS+1))
else
  echo "    OK (격리됨 — metro blockList)"
fi

# 2. babel-preset-expo 해소 (require.resolve, hoist 위치 무관)
if node -e "require.resolve('babel-preset-expo', { paths: ['$APP_DIR'] })" 2>/dev/null; then
  echo "[2] babel-preset-expo: OK"
else
  echo "[2] babel-preset-expo: FAIL"; ERRORS=$((ERRORS+1))
fi

# 3. metro blockList
if grep -q "blockList" "$APP_DIR/metro.config.js"; then
  echo "[3] metro blockList: OK"
else
  echo "[3] metro blockList: FAIL"; ERRORS=$((ERRORS+1))
fi

# 4. 실제 iOS 번들링
echo "[4] iOS 번들링 테스트..."
OUT=/tmp/fomo-verify-$$
if (cd "$APP_DIR" && npx expo export --platform ios --output-dir "$OUT" > /tmp/fomo-verify-$$.log 2>&1); then
  echo "    OK — 번들 생성 성공"
  rm -rf "$OUT"
else
  echo "    FAIL — 번들 에러 (/tmp/fomo-verify-$$.log 확인)"; ERRORS=$((ERRORS+1))
fi

echo ""
if [ "$ERRORS" -eq 0 ]; then
  echo "=== 모든 검증 통과 ✓ ==="
else
  echo "=== 검증 실패: $ERRORS개 항목 ==="; exit 1
fi
