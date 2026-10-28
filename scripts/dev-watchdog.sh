#!/bin/bash
# AuraLab dev-server watchdog.
# Keeps `next dev` alive on the 4GB sandbox: when the OOM killer (or anything
# else) reaps next-server, this loop restarts it within a few seconds.
# Runs fully detached; logs to dev.log (truncated per start to stay small).

cd /home/z/my-project

while true; do
  # Cap the Node JS heap so V8 GCs aggressively long before the OS OOMs.
  export NODE_OPTIONS="--max-old-space-size=1400"
  echo "[$(date '+%F %T')] starting next dev..." >> dev.log
  bun run dev >> dev.log 2>&1
  echo "[$(date '+%F %T')] dev server exited (code $?), restarting in 3s..." >> dev.log
  sleep 3
done
