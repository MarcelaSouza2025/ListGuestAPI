#!/usr/bin/env bash
set -euo pipefail

COMPOSE="docker compose"
FLAG="${1:-}"

if [[ "$FLAG" == "--volumes" || "$FLAG" == "-v" ]]; then
  echo "🧹 Derrubando containers + volumes..."
  $COMPOSE down -v --remove-orphans
else
  echo "🛑 Derrubando containers..."
  $COMPOSE down --remove-orphans
fi
