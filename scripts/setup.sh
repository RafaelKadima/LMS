#!/bin/bash

# ===========================================
# Universidade MotoChefe - Setup Script
# ===========================================

set -e

echo "🚀 Universidade MotoChefe - Setup"
echo "=================================="
echo ""

# Check prerequisites
check_command() {
  if ! command -v $1 &> /dev/null; then
    echo "❌ $1 não encontrado. Por favor, instale antes de continuar."
    exit 1
  else
    echo "✅ $1 encontrado"
  fi
}

echo "Verificando pré-requisitos..."
check_command node
check_command pnpm
check_command docker

echo ""
echo "📦 Instalando dependências..."
pnpm install

echo ""
echo "🐳 Iniciando containers Docker..."
docker compose up -d

echo ""
echo "⏳ Aguardando PostgreSQL iniciar..."
sleep 5

# Wait for PostgreSQL to be ready
until docker exec motochefe-postgres pg_isready -U motochefe -d universidade > /dev/null 2>&1; do
  echo "  Aguardando PostgreSQL..."
  sleep 2
done
echo "✅ PostgreSQL pronto"

echo ""
echo "⏳ Aguardando Keycloak iniciar..."
# Keycloak takes longer to start
sleep 10
until curl -s http://localhost:8080/health/ready > /dev/null 2>&1; do
  echo "  Aguardando Keycloak..."
  sleep 5
done
echo "✅ Keycloak pronto"

echo ""
echo "🗄️ Gerando Prisma Client..."
pnpm --filter @motochefe/api prisma generate

echo ""
echo "🗄️ Executando migrations..."
pnpm --filter @motochefe/api prisma migrate deploy

echo ""
echo "🌱 Executando seed..."
pnpm --filter @motochefe/api prisma db seed

echo ""
echo "🎉 Setup completo!"
echo ""
echo "Próximos passos:"
echo "  1. Copie .env.example para .env e configure as variáveis"
echo "  2. Execute 'pnpm dev' para iniciar o desenvolvimento"
echo ""
echo "URLs:"
echo "  - Portal Web: http://localhost:3000"
echo "  - API: http://localhost:4000"
echo "  - API Docs: http://localhost:4000/api/docs"
echo "  - Keycloak: http://localhost:8080"
echo "  - Metabase: http://localhost:3001"
echo ""
echo "Usuários de teste (Keycloak):"
echo "  - admin / admin123 (Super Admin)"
echo "  - joao / joao123 (Mecânico)"
echo "  - maria / maria123 (Atendente)"
