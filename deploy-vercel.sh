#!/bin/bash

echo "🚀 Deployando WhatsApp CRM para Vercel..."

# Verificar se o Vercel CLI está instalado
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI não está instalado. Instalando..."
    npm install -g vercel
fi

# Verificar se está logado no Vercel
if ! vercel whoami &> /dev/null; then
    echo "🔐 Fazendo login no Vercel..."
    vercel login
fi

# Configurar variáveis de ambiente
echo "⚙️ Configurando variáveis de ambiente..."

# Verificar se o arquivo .env existe
if [ ! -f .env ]; then
    echo "📝 Criando arquivo .env..."
    cp backend/env.example .env
    echo "⚠️ Configure suas variáveis de ambiente no arquivo .env antes de continuar"
    echo "💡 Execute: nano .env"
    exit 1
fi

# Carregar variáveis do .env
source .env

# Configurar variáveis no Vercel
echo "🔧 Configurando variáveis no Vercel..."

# Variáveis obrigatórias
vercel env add EVOLUTION_API_KEY production <<< "$EVOLUTION_API_KEY"
vercel env add SUPABASE_URL production <<< "$SUPABASE_URL"
vercel env add SUPABASE_ANON_KEY production <<< "$SUPABASE_ANON_KEY"
vercel env add SUPABASE_SERVICE_ROLE_KEY production <<< "$SUPABASE_SERVICE_ROLE_KEY"
vercel env add OPENAI_API_KEY production <<< "$OPENAI_API_KEY"
vercel env add JWT_SECRET production <<< "$JWT_SECRET"
vercel env add SESSION_SECRET production <<< "$SESSION_SECRET"
vercel env add COOKIE_SECRET production <<< "$COOKIE_SECRET"

# Variáveis opcionais
if [ ! -z "$DATABASE_URL" ]; then
    vercel env add DATABASE_URL production <<< "$DATABASE_URL"
fi

if [ ! -z "$REDIS_URL" ]; then
    vercel env add REDIS_URL production <<< "$REDIS_URL"
fi

# Configurar para usar Supabase por padrão
vercel env add USE_PRISMA production <<< "false"

# Deploy do backend
echo "📦 Fazendo deploy do backend..."
cd backend
vercel --prod

# Voltar para o diretório raiz
cd ..

# Deploy do frontend
echo "📦 Fazendo deploy do frontend..."
cd frontend
vercel --prod

# Voltar para o diretório raiz
cd ..

echo "✅ Deploy concluído!"
echo ""
echo "🔗 URLs de produção:"
echo "📱 Frontend: https://seu-projeto.vercel.app"
echo "🔧 Backend: https://seu-projeto-backend.vercel.app"
echo ""
echo "📋 Para ver os logs: vercel logs"
echo "🛑 Para remover: vercel remove" 