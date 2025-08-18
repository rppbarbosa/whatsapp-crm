#!/bin/bash

echo "🔧 Script de Correção do Backend - WhatsApp CRM"
echo "================================================"

# Verificar se estamos no diretório correto
if [ ! -f "backend/package.json" ]; then
    echo "❌ Erro: Execute este script na raiz do projeto"
    exit 1
fi

echo "📁 Diretório atual: $(pwd)"
echo ""

# Função para limpar sessões
cleanup_sessions() {
    echo "🧹 Limpando sessões do WhatsApp Web.js..."
    cd backend
    if [ -f "cleanup-sessions.js" ]; then
        node cleanup-sessions.js
    else
        echo "⚠️ Script de limpeza não encontrado"
    fi
    cd ..
}

# Função para verificar processos
check_processes() {
    echo "🔍 Verificando processos..."
    
    # Verificar se o backend está rodando
    if curl -s http://localhost:3001/health > /dev/null; then
        echo "✅ Backend está rodando na porta 3001"
    else
        echo "❌ Backend não está rodando na porta 3001"
    fi
    
    # Verificar se o frontend está rodando
    if curl -s http://localhost:3000 > /dev/null; then
        echo "✅ Frontend está rodando na porta 3000"
    else
        echo "❌ Frontend não está rodando na porta 3000"
    fi
}

# Função para matar processos
kill_processes() {
    echo "🛑 Matando processos..."
    
    # Matar processos na porta 3001
    lsof -ti:3001 | xargs kill -9 2>/dev/null || echo "Nenhum processo na porta 3001"
    
    # Matar processos na porta 3000
    lsof -ti:3000 | xargs kill -9 2>/dev/null || echo "Nenhum processo na porta 3000"
    
    echo "✅ Processos finalizados"
}

# Função para reinstalar dependências
reinstall_deps() {
    echo "📦 Reinstalando dependências..."
    cd backend
    rm -rf node_modules package-lock.json
    npm install
    cd ..
    echo "✅ Dependências reinstaladas"
}

# Menu principal
show_menu() {
    echo ""
    echo "Escolha uma opção:"
    echo "1) Limpar sessões do WhatsApp Web.js"
    echo "2) Verificar processos"
    echo "3) Matar processos"
    echo "4) Reinstalar dependências"
    echo "5) Limpeza completa (sessões + processos)"
    echo "6) Sair"
    echo ""
    read -p "Digite sua opção (1-6): " choice
}

# Processar escolha
process_choice() {
    case $choice in
        1)
            cleanup_sessions
            ;;
        2)
            check_processes
            ;;
        3)
            kill_processes
            ;;
        4)
            reinstall_deps
            ;;
        5)
            echo "🧹 Executando limpeza completa..."
            cleanup_sessions
            kill_processes
            echo "✅ Limpeza completa finalizada"
            ;;
        6)
            echo "👋 Saindo..."
            exit 0
            ;;
        *)
            echo "❌ Opção inválida"
            ;;
    esac
}

# Loop principal
while true; do
    show_menu
    process_choice
    echo ""
    read -p "Pressione Enter para continuar..."
done 