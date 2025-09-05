# Script para verificar conectividade do backend
# Execute antes de tentar conectar o frontend

Write-Host "🔍 Verificando conectividade do backend..." -ForegroundColor Green

# Verificar se o backend está rodando
Write-Host "📡 Testando conexão com o backend..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -Method GET -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Backend está rodando e respondendo" -ForegroundColor Green
        Write-Host "📊 Status: $($response.StatusCode)" -ForegroundColor Cyan
        Write-Host "📝 Resposta: $($response.Content)" -ForegroundColor Gray
    } else {
        Write-Host "⚠️ Backend respondeu com status: $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Backend não está respondendo" -ForegroundColor Red
    Write-Host "🔍 Verifique se o servidor está rodando na porta 3001" -ForegroundColor Yellow
}

# Verificar se a porta 3001 está em uso
Write-Host "🔌 Verificando porta 3001..." -ForegroundColor Yellow
try {
    $portCheck = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue
    if ($portCheck) {
        Write-Host "✅ Porta 3001 está em uso" -ForegroundColor Green
        Write-Host "📊 Processo: $($portCheck.ProcessName) (PID: $($portCheck.OwningProcess))" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Porta 3001 não está em uso" -ForegroundColor Red
        Write-Host "💡 Inicie o backend primeiro" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️ Não foi possível verificar a porta 3001" -ForegroundColor Yellow
}

# Verificar variáveis de ambiente
Write-Host "🔑 Verificando variáveis de ambiente..." -ForegroundColor Yellow
$envFile = Join-Path $PSScriptRoot "..\.env"
if (Test-Path $envFile) {
    Write-Host "✅ Arquivo .env encontrado" -ForegroundColor Green
    
    # Verificar se o arquivo não está vazio
    $envContent = Get-Content $envFile
    if ($envContent.Length -gt 0) {
        Write-Host "✅ Arquivo .env não está vazio" -ForegroundColor Green
        Write-Host "📊 Linhas: $($envContent.Length)" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Arquivo .env está vazio" -ForegroundColor Red
        Write-Host "💡 Configure as variáveis de ambiente necessárias" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ Arquivo .env não encontrado" -ForegroundColor Red
    Write-Host "💡 Crie o arquivo .env com as configurações necessárias" -ForegroundColor Yellow
}

# Verificar se o Chrome está instalado
Write-Host "🌐 Verificando instalação do Chrome..." -ForegroundColor Yellow
$chromePaths = @(
    "${env:ProgramFiles}\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
    "${env:LOCALAPPDATA}\Google\Chrome\Application\chrome.exe"
)

$chromeFound = $false
foreach ($path in $chromePaths) {
    if (Test-Path $path) {
        Write-Host "✅ Chrome encontrado em: $path" -ForegroundColor Green
        $chromeFound = $true
        break
    }
}

if (-not $chromeFound) {
    Write-Host "❌ Chrome não encontrado" -ForegroundColor Red
    Write-Host "💡 Instale o Google Chrome para usar o WhatsApp Web" -ForegroundColor Yellow
}

# Verificar dependências do Node.js
Write-Host "📦 Verificando dependências do Node.js..." -ForegroundColor Yellow
$packageJson = Join-Path $PSScriptRoot "..\package.json"
if (Test-Path $packageJson) {
    Write-Host "✅ package.json encontrado" -ForegroundColor Green
    
    # Verificar se node_modules existe
    $nodeModules = Join-Path $PSScriptRoot "..\node_modules"
    if (Test-Path $nodeModules) {
        Write-Host "✅ node_modules encontrado" -ForegroundColor Green
    } else {
        Write-Host "❌ node_modules não encontrado" -ForegroundColor Red
        Write-Host "💡 Execute 'npm install' para instalar as dependências" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ package.json não encontrado" -ForegroundColor Red
}

Write-Host "🎯 Verificação concluída!" -ForegroundColor Green
Write-Host "💡 Resolva os problemas encontrados antes de tentar conectar" -ForegroundColor Cyan
