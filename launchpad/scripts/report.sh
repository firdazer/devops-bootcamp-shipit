#!/usr/bin/env bash
# report.sh — POST one launch event to the Mission Control board.
#
# The learner workflow calls this with just two env values (CI/CD 3 Amali 2):
#   BOARD_URL     board address  (repository variable -> env)
#   SHIPIT_TOKEN  shared token   (repository secret   -> env)
# callsign comes from GITHUB_ACTOR (set by Actions automatically); color and
# shipModel come from ship.config.json. Stage/status are overridable for
# operator flourishes — report.sh [stage] [status] — default: liftoff shipped.
#
# curl has NO -f on purpose: a rejected report (401) must keep the step green
# and print {"error":"unauthorized"} in the run log — CI/CD 3 Amali 3 depends
# on exactly that. Do not "harden" this to -fsS.
set -euo pipefail

: "${BOARD_URL:?BOARD_URL not set — register it as a repository variable}"
: "${SHIPIT_TOKEN:?SHIPIT_TOKEN not set — register it as a repository secret}"
: "${GITHUB_ACTOR:?GITHUB_ACTOR not set (GitHub Actions sets this automatically)}"

DIR="$(cd "$(dirname "$0")" && pwd)"
BODY="$(node -e '
  const fs = require("fs");
  const cfg = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
  process.stdout.write(JSON.stringify({
    callsign: process.env.GITHUB_ACTOR,
    stage: process.argv[2],
    status: process.argv[3],
    color: cfg.color,
    shipModel: cfg.shipModel,
  }));
' "$DIR/../ship.config.json" "${1:-liftoff}" "${2:-shipped}")"

curl -sS -X POST "$BOARD_URL/api/event" \
  -H "Authorization: Bearer $SHIPIT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$BODY"
echo
