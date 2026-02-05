#!/bin/bash
# WHEEE Control Center - Start Script
# Usage: ./start.sh [dev|prod]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

MODE="${1:-dev}"

echo "🎢 WHEEE Control Center"
echo "========================"

# Check dependencies
if [ ! -d "backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    (cd backend && npm install)
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    (cd frontend && npm install)
fi

if [ "$MODE" = "prod" ]; then
    echo "🏭 Starting in PRODUCTION mode..."

    # Build frontend
    echo "🔨 Building frontend..."
    (cd frontend && npm run build)

    # Start backend with static file serving
    echo "🚀 Starting server on http://localhost:3001"
    cd backend && NODE_ENV=production node server.js
else
    echo "🔧 Starting in DEVELOPMENT mode..."
    echo ""
    echo "   Backend:  http://localhost:3001"
    echo "   Frontend: http://localhost:3000"
    echo ""

    # Start backend in background
    (cd backend && node server.js) &
    BACKEND_PID=$!

    # Start frontend
    (cd frontend && npm run dev) &
    FRONTEND_PID=$!

    # Trap to kill both on exit
    trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT

    # Wait for either to exit
    wait
fi
