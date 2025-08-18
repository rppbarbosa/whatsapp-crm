#!/bin/bash

echo "🔍 Verificando portas..."

# Função para verificar se uma porta está em uso
check_port() {
    local port=$1
    local service=$2
    
    if command -v netstat &> /dev/null; then
        if netstat -tuln | grep -q ":$port "; then
            echo "❌ Porta $port está em uso por $service"
            return 1
        else
            echo "✅ Porta $port está livre para $service"
            return 0
        fi
    elif command -v lsof &> /dev/null; then
        if lsof -i :$port &> /dev/null; then
            echo "❌ Porta $port está em uso por $service"
            return 1
        else
            echo "✅ Porta $port está livre para $service"
            return 0
        fi
    else
        echo "⚠️ Não foi possível verificar a porta $port (netstat/lsof não encontrado)"
        return 0
    fi
}

# Verificar portas
echo "📋 Verificando portas necessárias:"
echo ""

check_port 3000 "Frontend (React)"
frontend_ok=$?

check_port 3001 "Backend (Node.js)"
backend_ok=$?

echo ""
if [ $frontend_ok -eq 0 ] && [ $backend_ok -eq 0 ]; then
    echo "🎉 Todas as portas estão livres! Pode iniciar o projeto."
    echo ""
    echo "🚀 Para iniciar:"
    echo "  ./start-local.sh"
else
    echo "⚠️ Algumas portas estão em uso. Libere as portas antes de continuar."
    echo ""
    echo "💡 Para liberar as portas:"
    echo "  # No Windows:"
    echo "  netstat -ano | findstr :3000"
    echo "  netstat -ano | findstr :3001"
    echo "  taskkill /PID <PID> /F"
    echo ""
    echo "  # No Linux/Mac:"
    echo "  lsof -ti:3000 | xargs kill -9"
    echo "  lsof -ti:3001 | xargs kill -9"
fi 