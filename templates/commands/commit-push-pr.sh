#!/bin/bash
# Example WHEEE Turbo Workflow: commit-push-pr
# Usage: wheee turbo commit-push-pr

echo "🚀 Starting Commit-Push-PR Workflow..."

# 1. Self-Heal & Lint
wheee heal
wheee audit

# 2. Add and Commit
git add .
read -p "Enter commit message: " msg
git commit -m "$msg"

# 3. Push
git push origin HEAD

# 4. Create PR (if gh cli is installed)
if command -v gh &> /dev/null; then
    gh pr create --fill
else
    echo "⚠️ gh CLI not found, skipping PR creation."
fi

echo "✅ Workflow finished."
