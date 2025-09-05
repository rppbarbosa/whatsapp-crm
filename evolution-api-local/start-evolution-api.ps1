# Script para iniciar Evolution API localmente
# ===========================================

Write-Host "🚀 Iniciando Evolution API..." -ForegroundColor Green

# Verificar se o JAR existe
if (!(Test-Path "evolution-api.jar")) {
    Write-Host "❌ Evolution API JAR não encontrado!" -ForegroundColor Red
    Write-Host "💡 Execute primeiro: .\setup-evolution-api.ps1" -ForegroundColor Yellow
    exit 1
}

# Verificar se Java está disponível
try {
    $javaVersion = java -version 2>&1 | Select-String "version"
    if (!$javaVersion) {
        throw "Java não encontrado"
    }
    Write-Host "✅ Java encontrado: $javaVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Java não está instalado ou não está no PATH" -ForegroundColor Red
    Write-Host "💡 Instale o Java 11+ e adicione ao PATH" -ForegroundColor Yellow
    exit 1
}

# Verificar se a porta 8080 está livre
try {
    $portCheck = Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue
    if ($portCheck) {
        Write-Host "⚠️ Porta 8080 já está em uso!" -ForegroundColor Yellow
        Write-Host "💡 Verifique se já há uma Evolution API rodando" -ForegroundColor Yellow
        
        $choice = Read-Host "Deseja continuar mesmo assim? (s/N)"
        if ($choice -ne "s" -and $choice -ne "S") {
            exit 0
        }
    }
} catch {
    Write-Host "✅ Porta 8080 está livre" -ForegroundColor Green
}

# Criar diretório de logs se não existir
if (!(Test-Path "logs")) {
    New-Item -ItemType Directory -Name "logs"
}

Write-Host ""
Write-Host "🌐 Iniciando Evolution API na porta 8080..." -ForegroundColor Cyan
Write-Host "📱 Aguarde alguns segundos para a inicialização..." -ForegroundColor Yellow
Write-Host "🔑 API Key: whatsapp-crm-evolution-key-2024-secure" -ForegroundColor Cyan
Write-Host ""

# Iniciar Evolution API
try {
    java -jar evolution-api.jar
} catch {
    Write-Host "❌ Erro ao iniciar Evolution API: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 Verifique se o Java está funcionando corretamente" -ForegroundColor Yellow
} 