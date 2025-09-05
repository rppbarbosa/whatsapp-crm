# Script simples para limpar arquivos de autenticação
Write-Host "Limpando arquivos de autenticacao..." -ForegroundColor Yellow

$authPath = ".\auth_info"

if (Test-Path $authPath) {
    Write-Host "Encontrado diretorio de autenticacao: $authPath" -ForegroundColor Green
    
    # Parar processos do Chrome
    Write-Host "Parando processos do Chrome..." -ForegroundColor Yellow
    Get-Process | Where-Object {$_.ProcessName -like "*chrome*"} | Stop-Process -Force -ErrorAction SilentlyContinue
    
    Start-Sleep -Seconds 3
    
    try {
        Remove-Item -Path $authPath -Recurse -Force -ErrorAction Stop
        Write-Host "Arquivos de autenticacao removidos com sucesso!" -ForegroundColor Green
    } catch {
        Write-Host "Erro ao remover arquivos: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "Diretorio de autenticacao nao encontrado" -ForegroundColor Blue
}

Write-Host "Limpeza concluida!" -ForegroundColor Green
