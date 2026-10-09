$source = "D:\learn\New folder"
$target = "D:\hackathon\TestHive"

$batches = @(
    @{
        Name = "Root configuration and tooling"
        Items = @("package.json", "turbo.json", "tsconfig.base.json", "bun.lock", "mise.toml", ".npmrc", ".gitignore", ".env.example", "SUBAGENT_PLAN.md", "start-all.ps1", "start-all.sh")
        Message = "chore: configure root workspace, dependencies, and environment runners"
    },
    @{
        Name = "Core Database package"
        Items = @("packages/db")
        Message = "feat(db): establish schema definitions, migrations, and core repositories"
    },
    @{
        Name = "LLM and Persona packages"
        Items = @("packages/llm", "packages/personas")
        Message = "feat(ai): implement persona generators and LLM multi-provider orchestration"
    },
    @{
        Name = "Test Engine package"
        Items = @("packages/engine")
        Message = "feat(engine): add browser automation, crawler pipelines, and test runners"
    },
    @{
        Name = "Graph Analysis and Reporting packages"
        Items = @("packages/graph", "packages/report")
        Message = "feat(analysis): implement Louvain community graph clustering and report writers"
    },
    @{
        Name = "API backend service"
        Items = @("apps/api")
        Message = "feat(api): add Elysia server routes, SSE bus, and execution controllers"
    },
    @{
        Name = "Web Dashboard frontend"
        Items = @("apps/web")
        Message = "feat(web): update Next.js dashboard views, components, and real-time state"
    },
    @{
        Name = "Demo site, test data and utility scripts"
        Items = @("demo-site", "data", "scripts")
        Message = "feat(demo): add interactive shopping demo harness, seed data, and utility scripts"
    }
)

$total = $batches.Count
$idx = 0

foreach ($batch in $batches) {
    $idx++
    Write-Host "[$idx/$total] Processing batch: $($batch.Name)..." -ForegroundColor Cyan
    
    foreach ($item in $batch.Items) {
        $srcPath = Join-Path $source $item
        $dstPath = Join-Path $target $item
        
        if (Test-Path $srcPath) {
            if ((Get-Item $srcPath).PSIsContainer) {
                if (!(Test-Path $dstPath)) { New-Item -ItemType Directory -Path $dstPath -Force | Out-Null }
                Copy-Item -Path "$srcPath\*" -Destination $dstPath -Recurse -Force
            } else {
                $parent = Split-Path $dstPath -Parent
                if (!(Test-Path $parent)) { New-Item -ItemType Directory -Path $parent -Force | Out-Null }
                Copy-Item -Path $srcPath -Destination $dstPath -Force
            }
        }
    }
    
    git add -A
    $status = git status --porcelain
    if ($status) {
        git commit -m "$($batch.Message)"
        Write-Host "SUCCESS: Committed $($batch.Name)" -ForegroundColor Green
    } else {
        Write-Host "INFO: No file changes for $($batch.Name)" -ForegroundColor Yellow
    }

    if ($idx -lt $total) {
        Write-Host "Waiting 120 seconds..." -ForegroundColor Magenta
        Start-Sleep -Seconds 120
    }
}
Write-Host "ALL BATCHES COMPLETE." -ForegroundColor Green
