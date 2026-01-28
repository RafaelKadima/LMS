#!/bin/bash

# ===========================================
# Universidade MotoChefe - Development Script
# ===========================================

echo "🚀 Iniciando ambiente de desenvolvimento..."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "❌ Docker não está rodando. Inicie o Docker primeiro."
  exit 1
fi

# Start containers if not running
if ! docker ps | grep -q motochefe-postgres; then
  echo "🐳 Iniciando containers..."
  docker compose up -d
  sleep 5
fi

echo "✅ Containers rodando"
echo ""

# Run all apps in parallel
echo "🏃 Iniciando aplicações..."
pnpm dev
