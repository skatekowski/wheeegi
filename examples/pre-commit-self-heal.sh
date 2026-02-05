#!/bin/sh
# Pre-commit hook with self-healing
# Place this in .git/hooks/pre-commit and make it executable

echo "🔧 Running self-healing build checks..."

# Run self-healing build system
node tools/automation/self-heal-build.js --fix-all

# Check exit code
if [ $? -ne 0 ]; then
  echo ""
  echo "⚠️  Some issues could not be auto-fixed."
  echo "📋 Check project/errors.md for details."
  echo ""
  echo "Do you want to commit anyway? (y/N)"
  read -r response
  if [ "$response" != "y" ] && [ "$response" != "Y" ]; then
    echo "❌ Commit aborted. Please fix issues first."
    exit 1
  fi
fi

# Stage any auto-fixed files
git add -u

echo "✅ Pre-commit checks passed"
exit 0
