Write-Host "🧹 Limpeza Simples de Sessões" -ForegroundColor Cyan

# Parar processos do backend se estiver rodando
Write-Host "🛑 Parando processos do backend..." -ForegroundColor Yellow
try {
    $processes = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
    foreach ($processId in $processes) {
        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
        Write-Host "✅ Processo $processId finalizado" -ForegroundColor Green
    }
} catch {
    Write-Host "ℹ️ Nenhum processo na porta 3001" -ForegroundColor Gray
}

# Limpar sessões do WhatsApp Web.js
Write-Host "🧹 Limpando sessões do WhatsApp Web.js..." -ForegroundColor Yellow
if (Test-Path "backend/.wwebjs_auth") {
    try {
        Remove-Item -Recurse -Force "backend/.wwebjs_auth" -ErrorAction SilentlyContinue
        Write-Host "✅ Sessões removidas com sucesso" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ Erro ao remover sessões: $($_.Exception.Message)" -ForegroundColor Yellow
    }
} else {
    Write-Host "ℹ️ Nenhuma sessão encontrada" -ForegroundColor Gray
}

# Limpar cache do WhatsApp Web.js
Write-Host "🧹 Limpando cache do WhatsApp Web.js..." -ForegroundColor Yellow
if (Test-Path "backend/.wwebjs_cache") {
    try {
        Remove-Item -Recurse -Force "backend/.wwebjs_cache" -ErrorAction SilentlyContinue
        Write-Host "✅ Cache removido com sucesso" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ Erro ao remover cache: $($_.Exception.Message)" -ForegroundColor Yellow
    }
} else {
    Write-Host "ℹ️ Nenhum cache encontrado" -ForegroundColor Gray
}

Write-Host "✅ Limpeza concluída!" -ForegroundColor Green
Write-Host "🚀 Agora você pode iniciar o backend novamente com: cd backend; npm run dev" -ForegroundColor Cyan 