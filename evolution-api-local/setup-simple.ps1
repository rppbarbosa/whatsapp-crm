# Script para configurar Evolution API localmente
# ===============================================

Write-Host "Configurando Evolution API localmente..." -ForegroundColor Green

# Criar diretório de logs
if (!(Test-Path "logs")) {
    New-Item -ItemType Directory -Name "logs"
    Write-Host "Diretorio de logs criado" -ForegroundColor Green
}

# Verificar se já temos o JAR
if (Test-Path "evolution-api.jar") {
    Write-Host "Evolution API JAR ja existe" -ForegroundColor Green
} else {
    Write-Host "Baixando Evolution API..." -ForegroundColor Yellow
    
    # URL da versão mais recente
    $downloadUrl = "https://github.com/EvolutionAPI/evolution-api/releases/latest/download/evolution-api.jar"
    
    try {
        Invoke-WebRequest -Uri $downloadUrl -OutFile "evolution-api.jar"
        Write-Host "Evolution API baixada com sucesso" -ForegroundColor Green
    } catch {
        Write-Host "Erro ao baixar Evolution API: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "Voce pode baixar manualmente de: $downloadUrl" -ForegroundColor Yellow
        exit 1
    }
}

# Criar arquivo .env para Evolution API
$envContent = @"
# Evolution API Local Configuration
# ================================

# Porta da API
PORT=8080

# API Key
EVOLUTION_API_KEY=whatsapp-crm-evolution-key-2024-secure

# Configuracoes do banco (opcional para desenvolvimento)
# DATABASE_ENABLED=false
# DATABASE_CONNECTION_URI=

# Logs
LOG_LEVEL=INFO
LOG_COLOR=true

# Webhook (opcional)
# WEBHOOK_BY_EVENTS=false
# WEBHOOK_URL=

# Configuracoes de instancia
# INSTANCE_CLEANUP_INTERVAL=7200
# INSTANCE_CLEANUP_DAYS=7
"@

Set-Content -Path ".env" -Value $envContent
Write-Host "Arquivo .env criado" -ForegroundColor Green

# Verificar se Java está instalado
try {
    $javaVersion = java -version 2>&1 | Select-String "version"
    if ($javaVersion) {
        Write-Host "Java encontrado: $javaVersion" -ForegroundColor Green
    } else {
        Write-Host "Java nao encontrado ou versao nao reconhecida" -ForegroundColor Yellow
    }
} catch {
    Write-Host "Java nao esta instalado ou nao esta no PATH" -ForegroundColor Red
    Write-Host "Instale o Java 11+ e adicione ao PATH" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Configuracao concluida!" -ForegroundColor Green
Write-Host ""
Write-Host "Para iniciar a Evolution API:" -ForegroundColor Cyan
Write-Host "   java -jar evolution-api.jar" -ForegroundColor White
Write-Host "   ou" -ForegroundColor White
Write-Host "   pm2 start ecosystem.config.js" -ForegroundColor White
Write-Host ""
Write-Host "A API estara disponivel em: http://localhost:8080" -ForegroundColor Cyan
Write-Host "API Key: whatsapp-crm-evolution-key-2024-secure" -ForegroundColor Cyan
Write-Host ""
Write-Host "Documentacao: https://doc.evolution-api.com/" -ForegroundColor Blue 