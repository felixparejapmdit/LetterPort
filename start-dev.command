#!/bin/bash
cd "$(dirname "$0")"

echo "==================================================="
echo "    Starting LetterPort LMS (Backend & Frontend)   "
echo "==================================================="

# Function to clean up background processes on exit
cleanup() {
  echo ""
  echo "Shutting down LetterPort services..."
  kill $(jobs -p) 2>/dev/null
  exit 0
}
trap cleanup INT TERM EXIT

# Start Backend API
echo "Starting Backend API on http://localhost:5001 ..."
(cd backend && npm run dev) &

# Brief pause
sleep 2

# Start Frontend UI
echo "Starting Frontend UI on http://localhost:3001 ..."
(cd frontend && npm run dev) &

echo ""
echo "Services launched!"
echo "- Backend API:  http://localhost:5001/api"
echo "- Frontend UI:  http://localhost:3001"
echo ""
echo "Press Ctrl+C in this terminal window to stop all services."

# Keep script running
wait
