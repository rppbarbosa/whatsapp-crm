#!/bin/bash

echo "🔧 Diagnosticando e corrigindo problemas no frontend..."

# Verificar se estamos no diretório correto
if [ ! -f "frontend/package.json" ]; then
    echo "❌ Execute este script na raiz do projeto"
    exit 1
fi

# Parar processos em execução
echo "🛑 Parando processos do frontend..."
pkill -f "react-scripts" 2>/dev/null || true

# Limpar cache
echo "🧹 Limpando cache..."
rm -rf frontend/node_modules/.cache
rm -rf frontend/build
rm -f frontend/package-lock.json

# Verificar Node.js
echo "📋 Verificando Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não está instalado"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js versão 18+ é necessária (atual: $(node -v))"
    exit 1
fi

echo "✅ Node.js $(node -v) - OK"

# Verificar npm
echo "📋 Verificando npm..."
if ! command -v npm &> /dev/null; then
    echo "❌ npm não está instalado"
    exit 1
fi

echo "✅ npm $(npm -v) - OK"

# Entrar no diretório do frontend
cd frontend

# Verificar se package.json existe
if [ ! -f "package.json" ]; then
    echo "❌ package.json não encontrado"
    exit 1
fi

# Instalar dependências
echo "📦 Instalando dependências..."
npm install

# Verificar se o arquivo .env existe
if [ ! -f ".env" ]; then
    echo "📝 Criando arquivo .env..."
    cp env.example .env
    echo "✅ Arquivo .env criado"
fi

# Verificar se o Tailwind está configurado
if [ ! -f "tailwind.config.js" ]; then
    echo "❌ tailwind.config.js não encontrado"
    exit 1
fi

# Verificar se o PostCSS está configurado
if [ ! -f "postcss.config.js" ]; then
    echo "❌ postcss.config.js não encontrado"
    exit 1
fi

# Verificar se os arquivos principais existem
echo "📋 Verificando arquivos principais..."
required_files=(
    "src/App.tsx"
    "src/index.tsx"
    "src/index.css"
    "src/components/WhatsAppManager.tsx"
    "src/services/api.ts"
)

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Arquivo não encontrado: $file"
        exit 1
    fi
done

echo "✅ Todos os arquivos principais encontrados"

# Verificar se o TypeScript está configurado
if [ ! -f "tsconfig.json" ]; then
    echo "📝 Criando tsconfig.json..."
    cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "es5",
    "lib": [
      "dom",
      "dom.iterable",
      "es6"
    ],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": [
    "src"
  ]
}
EOF
    echo "✅ tsconfig.json criado"
fi

# Verificar se o public/index.html existe
if [ ! -f "public/index.html" ]; then
    echo "📝 Criando public/index.html..."
    mkdir -p public
    cat > public/index.html << 'EOF'
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta
      name="description"
      content="WhatsApp CRM Manager - Evolution API"
    />
    <link rel="apple-touch-icon" href="%PUBLIC_URL%/logo192.png" />
    <link rel="manifest" href="%PUBLIC_URL%/manifest.json" />
    <title>WhatsApp CRM Manager</title>
  </head>
  <body>
    <noscript>Você precisa habilitar JavaScript para executar este app.</noscript>
    <div id="root"></div>
  </body>
</html>
EOF
    echo "✅ public/index.html criado"
fi

# Voltar para o diretório raiz
cd ..

echo ""
echo "✅ Diagnóstico concluído!"
echo ""
echo "🚀 Para iniciar o frontend:"
echo "  cd frontend"
echo "  npm start"
echo ""
echo "📱 URL: http://localhost:3000"
echo ""
echo "🔍 Se ainda houver problemas:"
echo "  1. Verifique se a porta 3000 está livre"
echo "  2. Execute: ./check-ports.sh"
echo "  3. Verifique os logs no console do navegador" 