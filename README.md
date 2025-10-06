README – Passo a passo (instalação, execução, deploy)
Local (sem Docker)

Pré-requisitos: Node 18+, PostgreSQL rodando local.

Clone o projeto e instale:

npm i
cp .env.example .env
# edite DATABASE_URL e segredos


Prisma:

npx prisma generate
npx prisma migrate dev --name init


Rodar:

npm run dev
# API: http://localhost:4000/health


Fluxo de teste (exemplos via curl):

# criar admin
curl -X POST http://localhost:4000/api/auth/register-admin \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@mail.com","password":"123456","passwordConfirm":"123456","adminSecret":"palavra-chave-para-criar-admin"}'

# login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@mail.com","password":"123456"}'
# -> guarde accessToken e refreshToken

# criar evento (admin)
curl -X POST http://localhost:4000/api/events \
  -H "Authorization: Bearer ACCESS_TOKEN" -H "Content-Type: application/json" \
  -d '{"title":"Show X","artist":"Banda Y","date":"2025-12-25T20:00:00.000Z","location":"Arena"}'

# criar user comum
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"User","email":"user@mail.com","password":"123456","passwordConfirm":"123456"}'

# listar eventos (qualquer autenticado)
curl -H "Authorization: Bearer ACCESS_TOKEN" http://localhost:4000/api/events

Local com Docker Compose

Subir containers:

docker compose up -d --build


Aplicar migrations (em outra shell):

# se tiver Node local:
npx prisma migrate deploy
# OU exec no container:
docker exec -it event_api sh -lc "npx prisma migrate deploy && npx prisma generate"


Health: http://localhost:4000/health

Deploy – opções rápidas
Render.com (simples)

Crie um PostgreSQL (Render Postgres).

Crie um Web Service apontando para seu repo.

Build Command: npm ci && npx prisma generate && npm run build

Start Command: npm run prisma:deploy && node dist/server.js

Environment (no dashboard):

DATABASE_URL (da instância Postgres)

JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, ADMIN_SECRET, APP_BASE_URL (URL pública do serviço)

(Opcional e-mail) SMTP_*, MAIL_FROM

Deploy e teste /health.

Railway.app

Provisionar Postgres.

Deploy do repo Node.

Vars de ambiente iguais às de cima.

Start Command: npm run prisma:deploy && node dist/server.js.

Docker (VPS própria)

Ajuste docker-compose.yml com suas variáveis/segredos.

docker compose up -d --build

docker exec -it event_api sh -lc "npx prisma migrate deploy".

Dica de segurança: use segredos do provedor para JWT_*, ADMIN_SECRET, SMTP_PASS.



# Importante

docker compose build --no-cache api
docker compose up -d
# (se o service roda migrate no start, ok; se não:)
docker compose run --rm api sh -lc "npx prisma migrate deploy && npx prisma generate"
curl -sf http://localhost:4000/health && echo
