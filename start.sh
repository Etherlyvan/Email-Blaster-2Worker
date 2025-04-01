#!/bin/sh

# Start the Next.js app in the background
node server.js &

# Start the workers in the background
ts-node --project tsconfig.worker.json workers/email-worker.ts &
ts-node --project tsconfig.worker.json workers/scheduler-worker.ts &
ts-node --project tsconfig.worker.json workers/analytics-worker.ts &

# Wait for any process to exit
wait -n

# Exit with status of process that exited first
exit $?