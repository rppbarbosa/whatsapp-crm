#!/bin/bash

echo "🚀 Iniciando WhatsApp CRM localmente..."

# Verificar se o Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não está instalado. Por favor, instale o Node.js 18+ primeiro."
    exit 1
fi

# Verificar se o npm está instalado
if ! command -v npm &> /dev/null; then
    echo "❌ npm não está instalado. Por favor, instale o npm primeiro."
    exit 1
fi

# Criar arquivo .env se não existir
if [ ! -f .env ]; then
    echo "📝 Criando arquivo .env..."
    cp backend/env.example .env
    echo "✅ Arquivo .env criado. Por favor, configure suas variáveis de ambiente."
fi

# Instalar dependências do backend
echo "📦 Instalando dependências do backend..."
cd backend
npm install
cd ..

# Instalar dependências do frontend
echo "📦 Instalando dependências do frontend..."
cd frontend
npm install
cd ..

echo "✅ Instalação concluída!"
echo ""
echo "🚀 Para iniciar o projeto:"
echo "  Backend: cd backend && npm run dev"
echo "  Frontend: cd frontend && npm start"
echo ""
echo "📱 URLs:"
echo "  Frontend: http://localhost:3000"
echo "  Backend: http://localhost:3001"
echo "  Health Check: http://localhost:3001/health"
echo ""
echo "⚠️ Certifique-se de que as portas 3000 e 3001 estão livres!" 