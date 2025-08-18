#!/bin/bash

echo "🔧 Corrigindo dependências e limpando cache..."

# Parar processos em execução
echo "🛑 Parando processos em execução..."
pkill -f "node.*server.js" 2>/dev/null || true
pkill -f "nodemon" 2>/dev/null || true

# Limpar cache do npm
echo "🧹 Limpando cache do npm..."
npm cache clean --force

# Remover node_modules e package-lock.json
echo "🗑️ Removendo node_modules..."
rm -rf backend/node_modules
rm -rf frontend/node_modules
rm -f backend/package-lock.json
rm -f frontend/package-lock.json

# Reinstalar dependências do backend
echo "📦 Reinstalando dependências do backend..."
cd backend
npm install
cd ..

# Reinstalar dependências do frontend
echo "📦 Reinstalando dependências do frontend..."
cd frontend
npm install
cd ..



# Verificar se há arquivo .env
if [ ! -f ".env" ]; then
    echo "📝 Criando arquivo .env..."
    cp backend/env.example .env
    echo "⚠️ Configure suas variáveis de ambiente no arquivo .env"
fi

echo "✅ Limpeza e reinstalação concluídas!"
echo ""
echo "🚀 Para iniciar o projeto:"
echo "  Backend: cd backend && npm run dev"
echo "  Frontend: cd frontend && npm start" 