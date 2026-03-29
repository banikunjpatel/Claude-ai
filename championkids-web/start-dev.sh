#!/bin/bash
# ChampionKids Web — start dev server
echo "Checking backend is running..."
if ! curl -s http://localhost:8000/health > /dev/null 2>&1; then
  echo "WARNING: Backend not running on :8000"
  echo "Start it first: cd championkids-api && uvicorn app.main:app --reload --port 8000"
  echo ""
fi
echo "Starting Vite dev server..."
cd "$(dirname "$0")"
npm run dev
