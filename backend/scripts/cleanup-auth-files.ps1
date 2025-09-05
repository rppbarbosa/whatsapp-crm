# Script para limpar arquivos de autenticação bloqueados no Windows
# Execute este script se encontrar erros EBUSY

Write-Host "🧹 Limpando arquivos de autenticação bloqueados..." -ForegroundColor Yellow

$authPath = ".\auth_info"

if (Test-Path $authPath) {
    Write-Host "📁 Encontrado diretório de autenticação: $authPath" -ForegroundColor Green
    
    # Parar processos do Chrome/Chromium que possam estar usando os arquivos
    Write-Host "🛑 Parando processos do Chrome/Chromium..." -ForegroundColor Yellow
    Get-Process | Where-Object {$_.ProcessName -like "*chrome*" -or $_.ProcessName -like "*chromium*"} | Stop-Process -Force -ErrorAction SilentlyContinue
    
    # Aguardar um pouco para os processos terminarem
    Start-Sleep -Seconds 3
    
    # Remover diretório de autenticação
    try {
        Remove-Item -Path $authPath -Recurse -Force -ErrorAction Stop
        Write-Host "✅ Arquivos de autenticação removidos com sucesso!" -ForegroundColor Green
    } catch {
        Write-Host "❌ Erro ao remover arquivos: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "💡 Tente executar como administrador ou reinicie o computador" -ForegroundColor Yellow
    }
} else {
    Write-Host "ℹ️ Diretório de autenticação não encontrado" -ForegroundColor Blue
}

Write-Host "🏁 Limpeza concluída!" -ForegroundColor Green
