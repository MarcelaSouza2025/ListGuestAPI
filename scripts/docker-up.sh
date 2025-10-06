#!/usr/bin/env bash
set -euo pipefail

# Ajuste aqui caso tenha mudado os nomes dos containers no docker-compose.yml
API_C="event_api"
DB_C="event_pg"

COMPOSE="docker compose"

if ! command -v docker >/dev/null 2>&1; then
  echo "❌ Docker não encontrado."; exit 1
fi
$COMPOSE version >/dev/null 2>&1 || { echo "❌ Docker Compose v2 não disponível."; exit 1; }

FRESH="${1:-}"
if [[ "$FRESH" == "--fresh" ]]; then
  echo "🧹 Limpando containers/volumes anteriores..."
  $COMPOSE down -v --remove-orphans || true
fi

echo "📦 Build & up..."
$COMPOSE up -d --build

echo "⏳ Aguardando Postgres ficar pronto..."
for i in {1..60}; do
  if docker exec "$DB_C" pg_isready -U postgres -h 127.0.0.1 -p 5432 >/dev/null 2>&1; then
    echo "✅ Postgres ok"
    break
  fi
  sleep 1
  if [[ $i -eq 60 ]]; then
    echo "❌ Postgres não respondeu a tempo."; exit 1
  fi
done

echo "📜 Aplicando migrations do Prisma..."
docker exec "$API_C" sh -lc "npx prisma migrate deploy && npx prisma generate"

echo "🩺 Healthcheck da API..."
for i in {1..60}; do
  if curl -fsS http://localhost:4000/health >/dev/null; then
    echo "✅ API online: http://localhost:4000"
    exit 0
  fi
  sleep 1
done

echo "❌ API não respondeu ao /health."
exit 1
