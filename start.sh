#!/bin/sh
# Enable verbose mode for debugging
set -x

echo "Current directory: $(pwd)"
echo "Listing files:"
ls -la

# Start the Next.js application
echo "Starting Next.js application..."
node server.js &
NEXTJS_PID=$!
echo "Next.js PID: $NEXTJS_PID"

# Wait a moment for Next.js to initialize
sleep 3

# Start the email worker
echo "Starting email worker..."
ts-node --project tsconfig.worker.json workers/email-worker.ts &
EMAIL_WORKER_PID=$!
echo "Email worker PID: $EMAIL_WORKER_PID"

# Start the scheduler worker
echo "Starting scheduler worker..."
ts-node --project tsconfig.worker.json workers/scheduler-worker.ts &
SCHEDULER_WORKER_PID=$!
echo "Scheduler worker PID: $SCHEDULER_WORKER_PID"

echo "All processes started. Waiting for completion."

# Handle termination
trap "echo 'Caught SIGTERM/SIGINT, shutting down...'; kill $NEXTJS_PID $EMAIL_WORKER_PID $SCHEDULER_WORKER_PID; exit" SIGINT SIGTERM

# Keep the script running
wait $NEXTJS_PID $EMAIL_WORKER_PID $SCHEDULER_WORKER_PID