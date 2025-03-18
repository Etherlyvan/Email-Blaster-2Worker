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

# Check if Next.js started successfully
sleep 3
if ! kill -0 $NEXTJS_PID 2>/dev/null; then
  echo "Next.js failed to start. Exiting."
  exit 1
fi

# Start the email worker
echo "Starting email worker..."
node /app/dist/workers/email-worker.js &
EMAIL_WORKER_PID=$!
echo "Email worker PID: $EMAIL_WORKER_PID"

# Check if email worker started successfully
sleep 2
if ! kill -0 $EMAIL_WORKER_PID 2>/dev/null; then
  echo "Email worker failed to start. Exiting."
  kill $NEXTJS_PID
  exit 1
fi

# Start the scheduler worker
echo "Starting scheduler worker..."
node /app/dist/workers/scheduler-worker.js &
SCHEDULER_WORKER_PID=$!
echo "Scheduler worker PID: $SCHEDULER_WORKER_PID"

# Check if scheduler worker started successfully
sleep 2
if ! kill -0 $SCHEDULER_WORKER_PID 2>/dev/null; then
  echo "Scheduler worker failed to start. Exiting."
  kill $NEXTJS_PID $EMAIL_WORKER_PID
  exit 1
fi

echo "All processes started successfully. Waiting for completion."

# Handle termination
trap "echo 'Caught SIGTERM/SIGINT, shutting down...'; kill $NEXTJS_PID $EMAIL_WORKER_PID $SCHEDULER_WORKER_PID; exit" SIGINT SIGTERM

# Monitor processes and restart if needed
while true; do
  # Check if Next.js is still running
  if ! kill -0 $NEXTJS_PID 2>/dev/null; then
    echo "Next.js died, restarting..."
    node server.js &
    NEXTJS_PID=$!
    echo "New Next.js PID: $NEXTJS_PID"
  fi
  
  # Check if email worker is still running
  if ! kill -0 $EMAIL_WORKER_PID 2>/dev/null; then
    echo "Email worker died, restarting..."
    node /app/dist/workers/email-worker.js &
    EMAIL_WORKER_PID=$!
    echo "New email worker PID: $EMAIL_WORKER_PID"
  fi
  
  # Check if scheduler worker is still running
  if ! kill -0 $SCHEDULER_WORKER_PID 2>/dev/null; then
    echo "Scheduler worker died, restarting..."
    node /app/dist/workers/scheduler-worker.js &
    SCHEDULER_WORKER_PID=$!
    echo "New scheduler worker PID: $SCHEDULER_WORKER_PID"
  fi
  
  # Sleep for a while before checking again
  sleep 30
done