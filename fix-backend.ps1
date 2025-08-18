# Script de Correção do Backend - WhatsApp CRM
Write-Host "🔧 Script de Correção do Backend - WhatsApp CRM" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# Verificar se estamos no diretório correto
if (-not (Test-Path "backend/package.json")) {
    Write-Host "❌ Erro: Execute este script na raiz do projeto" -ForegroundColor Red
    exit 1
}

Write-Host "📁 Diretório atual: $(Get-Location)" -ForegroundColor Yellow
Write-Host ""

# Função para limpar sessões
function Cleanup-Sessions {
    Write-Host "🧹 Limpando sessões do WhatsApp Web.js..." -ForegroundColor Yellow
    Set-Location backend
    if (Test-Path "cleanup-sessions.js") {
        node cleanup-sessions.js
    } else {
        Write-Host "⚠️ Script de limpeza não encontrado" -ForegroundColor Yellow
    }
    Set-Location ..
}

# Função para verificar processos
function Check-Processes {
    Write-Host "🔍 Verificando processos..." -ForegroundColor Yellow
    
    # Verificar se o backend está rodando
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -TimeoutSec 5 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Backend está rodando na porta 3001" -ForegroundColor Green
        } else {
            Write-Host "❌ Backend não está rodando na porta 3001" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ Backend não está rodando na porta 3001" -ForegroundColor Red
    }
    
    # Verificar se o frontend está rodando
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Frontend está rodando na porta 3000" -ForegroundColor Green
        } else {
            Write-Host "❌ Frontend não está rodando na porta 3000" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ Frontend não está rodando na porta 3000" -ForegroundColor Red
    }
}

# Função para matar processos
function Kill-Processes {
    Write-Host "🛑 Matando processos..." -ForegroundColor Yellow
    
    # Matar processos na porta 3001
    try {
        $processes = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
        foreach ($processId in $processes) {
            Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
        }
        Write-Host "✅ Processos na porta 3001 finalizados" -ForegroundColor Green
    } catch {
        Write-Host "ℹ️ Nenhum processo na porta 3001" -ForegroundColor Gray
    }
    
    # Matar processos na porta 3000
    try {
        $processes = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
        foreach ($processId in $processes) {
            Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
        }
        Write-Host "✅ Processos na porta 3000 finalizados" -ForegroundColor Green
    } catch {
        Write-Host "ℹ️ Nenhum processo na porta 3000" -ForegroundColor Gray
    }
}

# Função para reinstalar dependências
function Reinstall-Dependencies {
    Write-Host "📦 Reinstalando dependências..." -ForegroundColor Yellow
    Set-Location backend
    if (Test-Path "node_modules") {
        Remove-Item -Recurse -Force "node_modules" -ErrorAction SilentlyContinue
    }
    if (Test-Path "package-lock.json") {
        Remove-Item "package-lock.json" -ErrorAction SilentlyContinue
    }
    npm install
    Set-Location ..
    Write-Host "✅ Dependências reinstaladas" -ForegroundColor Green
}

# Função para mostrar menu
function Show-Menu {
    Write-Host ""
    Write-Host "Escolha uma opção:" -ForegroundColor Cyan
    Write-Host "1) Limpar sessões do WhatsApp Web.js" -ForegroundColor White
    Write-Host "2) Verificar processos" -ForegroundColor White
    Write-Host "3) Matar processos" -ForegroundColor White
    Write-Host "4) Reinstalar dependências" -ForegroundColor White
    Write-Host "5) Limpeza completa (sessões + processos)" -ForegroundColor White
    Write-Host "6) Sair" -ForegroundColor White
    Write-Host ""
    $choice = Read-Host "Digite sua opção (1-6)"
    return $choice
}

# Função para processar escolha
function Process-Choice {
    param($choice)
    
    switch ($choice) {
        "1" { Cleanup-Sessions }
        "2" { Check-Processes }
        "3" { Kill-Processes }
        "4" { Reinstall-Dependencies }
        "5" { 
            Write-Host "🧹 Executando limpeza completa..." -ForegroundColor Yellow
            Cleanup-Sessions
            Kill-Processes
            Write-Host "✅ Limpeza completa finalizada" -ForegroundColor Green
        }
        "6" { 
            Write-Host "👋 Saindo..." -ForegroundColor Cyan
            exit 0 
        }
        default { Write-Host "❌ Opção inválida" -ForegroundColor Red }
    }
}

# Loop principal
while ($true) {
    $choice = Show-Menu
    Process-Choice $choice
    Write-Host ""
    Read-Host "Pressione Enter para continuar"
} 