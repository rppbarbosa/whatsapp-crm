#!/bin/bash

# Script de configuração do Supabase para WhatsApp CRM
# Execute este script após criar o projeto no Supabase

echo "🚀 Configuração do Supabase para WhatsApp CRM"
echo "=============================================="
echo ""

# Verificar se estamos no diretório raiz
if [ ! -f "README.md" ]; then
    echo "❌ Execute este script no diretório raiz do projeto"
    exit 1
fi

# Verificar se o arquivo de schema existe
if [ ! -f "docs/supabase-schema-complete.sql" ]; then
    echo "❌ Arquivo docs/supabase-schema-complete.sql não encontrado"
    exit 1
fi

echo "📋 Passos para configurar o Supabase:"
echo ""
echo "1️⃣ Crie um projeto no Supabase:"
echo "   - Acesse: https://supabase.com"
echo "   - Clique em 'New Project'"
echo "   - Nome: whatsapp-crm"
echo "   - Escolha uma região próxima"
echo "   - Defina uma senha forte para o banco"
echo ""

echo "2️⃣ Obtenha as credenciais:"
echo "   - Vá em Settings > API"
echo "   - Copie: Project URL, anon public, service_role"
echo ""

echo "3️⃣ Execute o schema SQL:"
echo "   - No Supabase, vá em SQL Editor"
echo "   - Clique em 'New Query'"
echo "   - Cole o conteúdo de docs/supabase-schema-complete.sql"
echo "   - Clique em 'Run'"
echo ""

echo "4️⃣ Configure as variáveis de ambiente:"
echo "   - Copie backend/env.example para backend/.env"
echo "   - Edite backend/.env com suas credenciais"
echo ""

read -p "✅ Após completar os passos acima, pressione Enter para testar a conexão..."

# Verificar se o arquivo .env existe
if [ ! -f "backend/.env" ]; then
    echo "❌ Arquivo backend/.env não encontrado"
    echo "   Execute: cp backend/env.example backend/.env"
    echo "   E configure as variáveis do Supabase"
    exit 1
fi

# Verificar se as variáveis do Supabase estão configuradas
if ! grep -q "SUPABASE_URL" backend/.env; then
    echo "❌ Variável SUPABASE_URL não encontrada em backend/.env"
    exit 1
fi

if ! grep -q "SUPABASE_ANON_KEY" backend/.env; then
    echo "❌ Variável SUPABASE_ANON_KEY não encontrada em backend/.env"
    exit 1
fi

echo "🔍 Testando conexão com Supabase..."
echo ""

# Executar teste de conexão
cd backend
npm run test:supabase

echo ""
echo "🎉 Configuração concluída!"
echo ""
echo "📚 Próximos passos:"
echo "1. Inicie o backend: cd backend && npm run dev"
echo "2. Inicie o frontend: cd frontend && npm start"
echo "3. Acesse: http://localhost:3000"
echo ""
echo "📖 Para mais detalhes, veja: docs/supabase-setup-guide.md" 