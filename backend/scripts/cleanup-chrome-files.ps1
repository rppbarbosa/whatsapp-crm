# Script para limpar arquivos travados do Chrome/Puppeteer
# Execute como Administrador se necessário

Write-Host "🧹 Iniciando limpeza de arquivos do Chrome/Puppeteer..." -ForegroundColor Green

# Parar processos do Chrome que possam estar travados
Write-Host "🛑 Parando processos do Chrome..." -ForegroundColor Yellow
try {
    Get-Process -Name "chrome" -ErrorAction SilentlyContinue | Stop-Process -Force
    Write-Host "✅ Processos do Chrome parados" -ForegroundColor Green
} catch {
    Write-Host "ℹ️ Nenhum processo do Chrome encontrado" -ForegroundColor Blue
}

# Parar processos do Puppeteer
Write-Host "🛑 Parando processos do Puppeteer..." -ForegroundColor Yellow
try {
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {$_.ProcessName -eq "node"} | Stop-Process -Force
    Write-Host "✅ Processos do Node.js parados" -ForegroundColor Green
} catch {
    Write-Host "ℹ️ Nenhum processo do Node.js encontrado" -ForegroundColor Blue
}

# Aguardar um pouco para os processos fecharem
Write-Host "⏳ Aguardando processos fecharem..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Limpar diretório de autenticação
$authPath = Join-Path $PSScriptRoot "..\auth_info"
if (Test-Path $authPath) {
    Write-Host "🗑️ Limpando diretório de autenticação..." -ForegroundColor Yellow
    try {
        Remove-Item -Path $authPath -Recurse -Force
        Write-Host "✅ Diretório de autenticação limpo" -ForegroundColor Green
    } catch {
        Write-Host "❌ Erro ao limpar diretório de autenticação: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "ℹ️ Diretório de autenticação não encontrado" -ForegroundColor Blue
}

# Limpar arquivos temporários do Chrome
$tempPaths = @(
    "$env:TEMP\chrome*",
    "$env:TEMP\puppeteer*",
    "$env:LOCALAPPDATA\Temp\chrome*",
    "$env:LOCALAPPDATA\Temp\puppeteer*"
)

foreach ($tempPath in $tempPaths) {
    if (Test-Path $tempPath) {
        Write-Host "🗑️ Limpando arquivos temporários: $tempPath" -ForegroundColor Yellow
        try {
            Remove-Item -Path $tempPath -Recurse -Force -ErrorAction SilentlyContinue
            Write-Host "✅ Arquivos temporários limpos" -ForegroundColor Green
        } catch {
            Write-Host "⚠️ Alguns arquivos temporários não puderam ser removidos" -ForegroundColor Yellow
        }
    }
}

# Verificar se há arquivos travados restantes
Write-Host "🔍 Verificando arquivos restantes..." -ForegroundColor Yellow
$remainingFiles = Get-ChildItem -Path $env:TEMP -Name "chrome*" -ErrorAction SilentlyContinue
if ($remainingFiles) {
    Write-Host "⚠️ Arquivos restantes encontrados:" -ForegroundColor Yellow
    $remainingFiles | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
} else {
    Write-Host "✅ Nenhum arquivo travado encontrado" -ForegroundColor Green
}

Write-Host "🎉 Limpeza concluída!" -ForegroundColor Green
Write-Host "💡 Agora você pode tentar executar o backend novamente" -ForegroundColor Cyan
