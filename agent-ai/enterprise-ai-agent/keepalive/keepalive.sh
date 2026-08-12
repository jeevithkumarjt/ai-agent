#!/bin/sh
# Keep-alive probe for the Render free-tier web service.
# Free instances spin down after ~15 min of inactivity; a request wakes them.
# This cron job pings /v1/health every 10 min so the first customer message
# does not hit a 30-60s cold start. This is a band-aid, NOT an SLA.
set -eu

URL="${PING_URL:-https://ai-agent-backend-wnc6.onrender.com}"
HEALTH="${URL}/v1/health"
CODE=$(curl -s --max-time 30 -o /dev/null -w '%{http_code}' "$HEALTH") || CODE=000
echo "[keepalive] $(date -u +%FT%TZ) $HEALTH -> HTTP $CODE"
