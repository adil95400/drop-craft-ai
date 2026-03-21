#!/bin/bash
# CI check: Detect console.log/debug/info in source code
# Allowed: console.warn, console.error (in logger only via eslint-disable)
#
# Usage: bash scripts/check-console-logs.sh

set -euo pipefail

echo "🔍 Checking for prohibited console.log usage in src/..."

# Search for console.log/debug/info but exclude:
# - logger files themselves (they need raw console access)
# - test files
# - node_modules
MATCHES=$(grep -rn "console\.\(log\|debug\|info\)" src/ \
  --include="*.ts" --include="*.tsx" \
  --exclude-dir="node_modules" \
  --exclude="consoleInterceptor.ts" \
  --exclude="logger.ts" \
  --exclude="productionLogger.ts" \
  --exclude="sentry.ts" \
  --exclude="*.test.*" \
  --exclude="*.spec.*" \
  --exclude="buttonAuditor.ts" \
  | grep -v "'\`\|'\|\"" \
  | grep -v "includes('console" \
  || true)

if [ -n "$MATCHES" ]; then
  echo ""
  echo "❌ Found console.log/debug/info calls that should use logger instead:"
  echo ""
  echo "$MATCHES"
  echo ""
  echo "Total: $(echo "$MATCHES" | wc -l) occurrences"
  echo ""
  echo "Fix: Replace with 'import { logger } from \"@/lib/logger\"'"
  echo "  console.log(...)  →  logger.debug(...) or logger.info(...)"
  echo "  console.error(...)  →  logger.error(...)"
  exit 1
else
  echo "✅ No prohibited console.log usage found!"
  exit 0
fi
