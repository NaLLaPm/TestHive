# TestHive - One-Click All-in-One Launcher
# Starts Fastify Backend (8787), Next.js Frontend (3000), and Demo Store SPA (8989)

$ErrorActionPreference = "Stop"
$WorkspaceRoot = $PSScriptRoot

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   TestHive - Launching All Services" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Workspace: $WorkspaceRoot" -ForegroundColor DarkGray
Write-Host ""

# Ensure we clean up background processes on Ctrl+C / Exit
$Jobs = @()

function Stop-AllServices {
    Write-Host "`nStopping all TestHive background jobs..." -ForegroundColor Yellow
    foreach ($j in $Jobs) {
        if ($j -and $j.State -eq "Running") {
            Stop-Job $j -ErrorAction SilentlyContinue
            Remove-Job $j -Force -ErrorAction SilentlyContinue
        }
    }
    Write-Host "All services stopped." -ForegroundColor Green
}

try {
    # 1. Start Fastify Backend (Port 8787)
    Write-Host "[1/3] Starting Fastify Backend (http://127.0.0.1:8787)..." -ForegroundColor Magenta
    $Jobs += Start-Job -ScriptBlock {
        param($root)
        Set-Location $root
        bun --filter @testhive/api dev
    } -ArgumentList $WorkspaceRoot

    # 2. Start Demo E-Commerce SPA (Port 8989)
    Write-Host "[2/3] Starting Demo Store SPA (http://localhost:8989)..." -ForegroundColor Yellow
    $Jobs += Start-Job -ScriptBlock {
        param($root)
        Set-Location $root
        bun run demo:site
    } -ArgumentList $WorkspaceRoot

    # 3. Start Next.js Frontend (Port 3000)
    Write-Host "[3/3] Starting Next.js Web App (http://localhost:3000)..." -ForegroundColor Cyan
    $Jobs += Start-Job -ScriptBlock {
        param($root)
        Set-Location $root
        bun --filter @testhive/web dev
    } -ArgumentList $WorkspaceRoot

    Write-Host "`nAll 3 services are running in the background:" -ForegroundColor Green
    Write-Host " -> Backend API:  http://127.0.0.1:8787" -ForegroundColor White
    Write-Host " -> Demo Site:    http://localhost:8989" -ForegroundColor White
    Write-Host " -> Web UI:       http://localhost:3000" -ForegroundColor White
    Write-Host "`nStreaming combined logs below. Press Ctrl+C anytime to stop all services.`n" -ForegroundColor DarkGray

    # Stream logs from all background jobs
    while ($true) {
        foreach ($j in $Jobs) {
            $output = Receive-Job -Job $j -ErrorAction SilentlyContinue
            if ($output) {
                Write-Host $output
            }
        }
        Start-Sleep -Milliseconds 500
    }
}
finally {
    Stop-AllServices
}
