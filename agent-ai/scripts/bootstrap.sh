#!/usr/bin/env bash
# One-shot bootstrap: waits for deps, seeds the default source, triggers ingestion.
set -euo pipefail

API="${API:-http://localhost:8000}"
ADMIN_EMAIL="${ADMIN_EMAIL:-owner@tryvium.ai}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-ChangeMe123!}"
SOURCE_TYPE="${SOURCE_TYPE:-website}"
SOURCE_URL="${SOURCE_URL:-https://www.tryvium.ai}"
SITEMAP_URL="${SITEMAP_URL:-https://www.tryvium.ai/sitemap_index.xml}"

echo "[bootstrap] waiting for API health"
until curl -fsS "$API/health/live" >/dev/null 2>&1; do
  sleep 3
done

echo "[bootstrap] logging in as $ADMIN_EMAIL"
TOKEN="$(curl -fsS -X POST "$API/api/v1/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" \
  | python -c 'import sys,json;print(json.load(sys.stdin)["access_token"])')"

echo "[bootstrap] ensuring default source"
SOURCE_ID="$(curl -fsS -X POST "$API/api/v1/sources" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"type\":\"$SOURCE_TYPE\",\"display_name\":\"Tryvium Docs\",\"config\":{\"url\":\"$SOURCE_URL\",\"sitemap_url\":\"$SITEMAP_URL\"}}" \
  | python -c 'import sys,json;print(json.load(sys.stdin)["id"])')"

echo "[bootstrap] triggering full crawl for source $SOURCE_ID"
curl -fsS -X POST "$API/api/v1/sources/$SOURCE_ID/crawl" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"kind":"full"}'

echo "[bootstrap] done"
