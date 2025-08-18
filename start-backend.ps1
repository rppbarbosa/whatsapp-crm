# Script para verificar e iniciar o backend
Write-Host "🔍 Verificando se o backend está rodando..." -ForegroundColor Yellow

# Verificar se a porta 3001 está em uso
$portInUse = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue

if ($portInUse) {
    Write-Host "✅ Backend já está rodando na porta 3001" -ForegroundColor Green
    Write-Host "🌐 Acesse: http://localhost:3001" -ForegroundColor Cyan
} else {
    Write-Host "❌ Backend não está rodando. Iniciando..." -ForegroundColor Red
    
    # Navegar para a pasta backend
    Set-Location "backend"
    
    # Verificar se node_modules existe
    if (-not (Test-Path "node_modules")) {
        Write-Host "📦 Instalando dependências..." -ForegroundColor Yellow
        npm install
    }
    
    # Iniciar o backend
    Write-Host "🚀 Iniciando backend..." -ForegroundColor Green
    npm run dev
}

Write-Host "`n📋 Comandos úteis:" -ForegroundColor Cyan
Write-Host "  • Testar Supabase: npm run test:supabase" -ForegroundColor White
Write-Host "  • Inserir dados: npm run seed" -ForegroundColor White
Write-Host "  • Limpar sessões: npm run cleanup" -ForegroundColor White 