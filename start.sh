#!/bin/bash
ROOT="$(cd "$(dirname "$0")" && pwd)"

# Kill anything already on these ports
lsof -ti:8000 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true
sleep 1

# Stable DB path (not $TMPDIR)
export DATABASE_PATH="$ROOT/data/db"
mkdir -p "$DATABASE_PATH"

# Fixed JWT secret so tokens survive restarts
export TOKEN_SECRET="resumeprep-dev-secret-do-not-use-in-prod"

echo "Starting ResumePrep AI backend on :8000 ..."
cd "$ROOT/backend"
"$ROOT/.venv/bin/jac" serve main.jac --port 8000 &
BACKEND_PID=$!

# Wait until backend is actually accepting connections before starting frontend
echo -n "Waiting for backend..."
for i in $(seq 1 20); do
  if curl -s http://localhost:8000/healthz >/dev/null 2>&1 || \
     curl -s http://localhost:8000/ >/dev/null 2>&1; then
    break
  fi
  echo -n "."
  sleep 1
done
echo " ready"

echo "Starting React dev server on :5173 ..."
cd "$ROOT/frontend"
npm run dev &
FRONTEND_PID=$!

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM

echo ""
echo "  Backend:  http://localhost:8000"
echo "  Frontend: http://localhost:5173"
echo "  API docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop both servers."

wait
