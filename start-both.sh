#!/bin/bash

echo "🚀 Iniciando WhatsApp CRM (Frontend + Backend)..."

# Verificar se as portas estão livres
echo "🔍 Verificando portas..."
if command -v netstat &> /dev/null; then
    if netstat -tuln | grep -q ":3000 " || netstat -tuln | grep -q ":3001 "; then
        echo "❌ Portas 3000 ou 3001 estão em uso!"
        echo "💡 Execute: ./check-ports.sh"
        exit 1
    fi
fi

# Verificar se os arquivos .env existem
if [ ! -f ".env" ]; then
    echo "📝 Criando arquivo .env..."
    cp backend/env.example .env
    echo "⚠️ Configure suas variáveis de ambiente no arquivo .env"
fi

if [ ! -f "frontend/.env" ]; then
    echo "📝 Criando arquivo .env para frontend..."
    cp frontend/env.example frontend/.env
fi

# Função para limpar processos ao sair
cleanup() {
    echo ""
    echo "🛑 Parando serviços..."
    pkill -f "node.*server.js" 2>/dev/null || true
    pkill -f "react-scripts" 2>/dev/null || true
    exit 0
}

# Capturar Ctrl+C
trap cleanup SIGINT

# Iniciar backend em background
echo "🔧 Iniciando backend na porta 3001..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Aguardar backend inicializar
echo "⏳ Aguardando backend inicializar..."
sleep 5

# Verificar se backend está rodando
if ! curl -s http://localhost:3001/health > /dev/null; then
    echo "❌ Backend não iniciou corretamente"
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi

echo "✅ Backend iniciado com sucesso!"

# Iniciar frontend
echo "📱 Iniciando frontend na porta 3000..."
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

echo ""
echo "🎉 WhatsApp CRM iniciado!"
echo ""
echo "📱 URLs:"
echo "  Frontend: http://localhost:3000"
echo "  Backend: http://localhost:3001"
echo "  Health Check: http://localhost:3001/health"
echo ""
echo "🛑 Pressione Ctrl+C para parar todos os serviços"

# Aguardar indefinidamente
wait 