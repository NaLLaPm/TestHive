#!/usr/bin/env bash

set -e

echo "=========================================================="
echo "   TestHive - Launching All Services"
echo "=========================================================="
echo " Workspace: $(pwd)"
echo ""

cleanup() {
    echo ""
    echo "Stopping all TestHive services..."

    # Terminate background child process IDs if set
    if [ -n "${BACKEND_PID:-}" ]; then kill "$BACKEND_PID" 2>/dev/null || true; fi
    if [ -n "${DEMO_PID:-}" ]; then kill "$DEMO_PID" 2>/dev/null || true; fi
    if [ -n "${WEB_PID:-}" ]; then kill "$WEB_PID" 2>/dev/null || true; fi

    # Also kill any remaining children in this process group
    kill $(jobs -p) 2>/dev/null || true

    echo "All services stopped."
}

trap cleanup INT TERM EXIT

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "[1/3] Starting Fastify Backend (http://127.0.0.1:8787)..."
(
    cd "$ROOT"
    bun --filter @testhive/api dev
) &
BACKEND_PID=$!

echo "[2/3] Starting Demo Store SPA (http://localhost:8989)..."
(
    cd "$ROOT"
    bun run demo:site
) &
DEMO_PID=$!

echo "[3/3] Starting Next.js Web App (http://localhost:3000)..."
(
    cd "$ROOT"
    bun --filter @testhive/web dev
) &
WEB_PID=$!

echo ""
echo "All 3 services are running:"
echo " -> Backend API:  http://127.0.0.1:8787"
echo " -> Demo Site:    http://localhost:8989"
echo " -> Web UI:       http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all services."
echo ""

wait
