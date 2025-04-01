#!/bin/sh

# Print environment information
echo "Starting services with NODE_ENV: $NODE_ENV"

# Start the Next.js app in the background
echo "Starting Next.js application..."
node server.js &
NEXTJS_PID=$!

# Wait a moment to ensure Next.js has started
sleep 5

# Start the workers in the background with proper error handling
echo "Starting email worker..."
ts-node --project tsconfig.worker.json workers/email-worker.ts &
EMAIL_WORKER_PID=$!

echo "Starting scheduler worker..."
ts-node --project tsconfig.worker.json workers/scheduler-worker.ts &
SCHEDULER_WORKER_PID=$!

echo "Starting analytics worker..."
ts-node --project tsconfig.worker.json workers/analytics-worker.ts &
ANALYTICS_WORKER_PID=$!

# Function to check if a process is still running
is_running() {
  ps -p $1 > /dev/null
  return $?
}

# Monitor all processes
while true; do
  # Check each process
  if ! is_running $NEXTJS_PID; then
    echo "Next.js application crashed, restarting..."
    node server.js &
    NEXTJS_PID=$!
  fi
  
  if ! is_running $EMAIL_WORKER_PID; then
    echo "Email worker crashed, restarting..."
    ts-node --project tsconfig.worker.json workers/email-worker.ts &
    EMAIL_WORKER_PID=$!
  fi
  
  if ! is_running $SCHEDULER_WORKER_PID; then
    echo "Scheduler worker crashed, restarting..."
    ts-node --project tsconfig.worker.json workers/scheduler-worker.ts &
    SCHEDULER_WORKER_PID=$!
  fi
  
  if ! is_running $ANALYTICS_WORKER_PID; then
    echo "Analytics worker crashed, restarting..."
    ts-node --project tsconfig.worker.json workers/analytics-worker.ts &
    ANALYTICS_WORKER_PID=$!
  fi
  
  # Sleep for a while before checking again
  sleep 10
done