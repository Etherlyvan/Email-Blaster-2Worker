#!/bin/sh

# Print environment information
echo "Starting services with NODE_ENV: $NODE_ENV"

# Start the Next.js app in the background
echo "Starting Next.js application..."
node server.js &
NEXTJS_PID=$!

# Wait a moment to ensure Next.js has started
sleep 5

# Use the locally installed ts-node from node_modules
TS_NODE_BIN="./node_modules/.bin/ts-node"

# Start the workers in the background with proper error handling
echo "Starting email worker..."
$TS_NODE_BIN --project tsconfig.worker.json workers/email-worker.ts &
EMAIL_WORKER_PID=$!

echo "Starting scheduler worker..."
$TS_NODE_BIN --project tsconfig.worker.json workers/scheduler-worker.ts &
SCHEDULER_WORKER_PID=$!

echo "Starting analytics worker..."
$TS_NODE_BIN --project tsconfig.worker.json workers/analytics-worker.ts &
ANALYTICS_WORKER_PID=$!

# Function to check if a process is still running in Alpine Linux
is_running() {
  if [ -d "/proc/$1" ]; then
    return 0  # Process is running
  else
    return 1  # Process is not running
  fi
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
    $TS_NODE_BIN --project tsconfig.worker.json workers/email-worker.ts &
    EMAIL_WORKER_PID=$!
  fi
  
  if ! is_running $SCHEDULER_WORKER_PID; then
    echo "Scheduler worker crashed, restarting..."
    $TS_NODE_BIN --project tsconfig.worker.json workers/scheduler-worker.ts &
    SCHEDULER_WORKER_PID=$!
  fi
  
  if ! is_running $ANALYTICS_WORKER_PID; then
    echo "Analytics worker crashed, restarting..."
    $TS_NODE_BIN --project tsconfig.worker.json workers/analytics-worker.ts &
    ANALYTICS_WORKER_PID=$!
  fi
  
  # Sleep for a while before checking again
  sleep 10
done