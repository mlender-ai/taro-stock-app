#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"
ROOT_DIR="$(dirname "$(dirname "$APP_DIR")")"
OUT=/tmp/tarot-verify-$$

echo "=== 타로 증권 번들 검증 ==="
echo ""

ERRORS=0

# 1. React 버전 확인
APP_REACT=$(node -e "console.log(require('$APP_DIR/node_modules/react/package.json').version)" 2>/dev/null || echo "MISSING")
ROOT_REACT=$(node -e "console.log(require('$ROOT_DIR/node_modules/react/package.json').version)" 2>/dev/null || echo "MISSING")
echo "[1] React 버전"
echo "    앱 로컬: $APP_REACT"
echo "    루트:    $ROOT_REACT"
if [ "$APP_REACT" = "MISSING" ]; then
  echo "    FAIL: 앱 로컬 react 없음"; ERRORS=$((ERRORS+1))
elif [ "$APP_REACT" = "$ROOT_REACT" ]; then
  echo "    OK (단일 버전)"
else
  echo "    OK (격리됨 — metro.config.js blockList 적용)"
fi

# 2. babel-preset-expo 경로 확인
BABEL_PRESET="$APP_DIR/node_modules/expo/node_modules/babel-preset-expo"
if [ -d "$BABEL_PRESET" ]; then
  echo "[2] babel-preset-expo: OK ($BABEL_PRESET)"
else
  echo "[2] babel-preset-expo: FAIL — 경로 없음"; ERRORS=$((ERRORS+1))
fi

# 3. metro.config.js blockList 패턴 확인
if grep -q "blockList" "$APP_DIR/metro.config.js"; then
  echo "[3] metro.config.js blockList: OK"
else
  echo "[3] metro.config.js blockList: FAIL — blockList 없음"; ERRORS=$((ERRORS+1))
fi

# 4. app.json plugins 확인 (reanimated 없어야 함)
if node -e "
  const a = require('$APP_DIR/app.json');
  const plugins = a.expo.plugins || [];
  const bad = plugins.filter(p => typeof p === 'string' && p.includes('reanimated'));
  if (bad.length > 0) { console.error('BAD:', bad); process.exit(1); }
" 2>/dev/null; then
  echo "[4] app.json plugins: OK"
else
  echo "[4] app.json plugins: FAIL — reanimated plugin 감지"; ERRORS=$((ERRORS+1))
fi

# 5. 실제 번들링 테스트
echo "[5] iOS 번들링 테스트 중..."
if npx expo export --platform ios --output-dir "$OUT" --no-minify 2>&1 | grep -q "Exported:"; then
  echo "    OK — 번들 생성 성공"
  rm -rf "$OUT"
else
  echo "    FAIL — 번들링 실패"; ERRORS=$((ERRORS+1))
fi

echo ""
if [ "$ERRORS" -eq 0 ]; then
  echo "=== 모든 검증 통과 ==="
  exit 0
else
  echo "=== 검증 실패: ${ERRORS}개 항목 ==="
  exit 1
fi
