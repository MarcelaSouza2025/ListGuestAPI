#!/usr/bin/env bash
set -euo pipefail

echo "🔧 Checando Node e Yarn..."
node -v >/dev/null 2>&1 || { echo "❌ Node não encontrado. Instale Node 18+."; exit 1; }

# Habilita Yarn via Corepack (recomendado nas versões modernas do Node)
if ! command -v corepack >/dev/null 2>&1; then
  echo "ℹ️  Corepack não encontrado; ele costuma vir com Node 16+. Prosseguindo mesmo assim..."
else
  corepack enable >/dev/null 2>&1 || true
  corepack prepare yarn@stable --activate >/dev/null 2>&1 || true
fi

echo "📦 Usando Yarn: $(yarn -v || echo 'vai ativar agora')"
if ! command -v yarn >/dev/null 2>&1; then
  echo "❌ Yarn não disponível. Atualize o Node (com Corepack) ou instale Yarn."
  exit 1
fi

# Cria package.json se não existir
if [ ! -f package.json ]; then
  echo "📝 package.json não existe. Iniciando projeto..."
  yarn init -y
fi

echo "📥 Instalando dependências de produção..."
yarn add \
  @prisma/client \
  bcryptjs \
  cookie-parser \
  cors \
  dotenv \
  express \
  express-validator \
  jsonwebtoken \
  nodemailer \
  ms

echo "🛠️  Instalando dependências de desenvolvimento..."
yarn add -D \
  prisma \
  typescript \
  tsx \
  eslint \
  @types/node \
  @types/express \
  @types/jsonwebtoken \
  @types/bcryptjs \
  @types/cookie-parser

# Cria tsconfig básico se não existir (compatível com o projeto que te passei)
if [ ! -f tsconfig.json ]; then
  cat > tsconfig.json <<'JSON'
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "rootDir": "src",
    "outDir": "dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"]
}
JSON
  echo "🧩 tsconfig.json criado."
fi

# Gera client do Prisma caso o schema exista
if [ -f prisma/schema.prisma ]; then
  echo "🧬 Prisma schema encontrado. Gerando client..."
  yarn prisma generate
else
  echo "ℹ️  prisma/schema.prisma não encontrado. Pulando 'prisma generate'."
fi

echo "✅ Dependências instaladas com sucesso."
echo "👉 Agora você pode rodar: 'yarn dev' (local) ou 'docker compose up -d --build' (containers)."


#como rodar
# dê permissão de execução
#chmod +x scripts/install-deps.sh

# execute
#./scripts/install-deps.sh