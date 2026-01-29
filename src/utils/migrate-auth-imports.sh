#!/bin/bash
# Script to migrate all AuthContext imports to UnifiedAuthContext

find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e "s|from '@/contexts/AuthContext'|from '@/contexts/UnifiedAuthContext'|g" \
  -e "s|from '@/contexts/AuthContext\";|from '@/contexts/UnifiedAuthContext';|g" \
  -e "s|import { useAuth }|import { useUnifiedAuth as useAuth }|g" \
  {} +

echo "Migration complete! All AuthContext imports updated to UnifiedAuthContext"
