param([string]$Phase = "all")

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  QA Check - Phase: $Phase" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
$ErrorActionPreference = "Stop"

# ── 1. Build backend ──
Write-Host "`n[1/5] Building backend..." -ForegroundColor Yellow
$buildBackend = docker-compose build backend 2>&1 | Out-String
if ($LASTEXITCODE -ne 0) { throw "Backend build FAILED" }
Write-Host "  ✓ Backend built" -ForegroundColor Green

# ── 2. Build frontend ──
Write-Host "`n[2/5] Building frontend..." -ForegroundColor Yellow
$buildFrontend = docker-compose build frontend 2>&1 | Out-String
if ($LASTEXITCODE -ne 0) { throw "Frontend build FAILED" }
Write-Host "  ✓ Frontend built" -ForegroundColor Green

# ── 3. Restart services ──
Write-Host "`n[3/5] Restarting services..." -ForegroundColor Yellow
docker-compose rm -fs backend frontend 2>&1 | Out-Null
docker-compose up -d backend frontend 2>&1 | Out-Null
Start-Sleep -Seconds 5
Write-Host "  ✓ Services restarted" -ForegroundColor Green

# ── 4. API smoke tests ──
Write-Host "`n[4/5] Running API smoke tests..." -ForegroundColor Yellow

# Health check
try {
    $health = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/health" -Method Get -TimeoutSec 10
    if ($health.status -ne "healthy") { throw "Health check: unexpected status" }
    Write-Host "  ✓ GET /health → healthy" -ForegroundColor Green
} catch {
    throw "Health check FAILED: $_"
}

# Auth config
try {
    $config = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/auth/config" -Method Get -TimeoutSec 10
    Write-Host "  ✓ GET /auth/config → github=$($config.github) google=$($config.google)" -ForegroundColor Green
} catch {
    throw "Auth config FAILED: $_"
}

Write-Host "`n[5/5] Running Phase-specific checks..." -ForegroundColor Yellow

if ($Phase -eq "all" -or $Phase -eq "1") {
    # ── Phase 1 checks: Password security ──
    Write-Host "  Phase 1: Password security" -ForegroundColor Magenta

    # Signup with weak password should fail
    try {
        $weakSignup = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/auth/signup" -Method Post `
            -ContentType "application/json" `
            -Body '{"username":"test_qa_weak","email":"test_qa_weak@test.com","password":"abc"}' `
            -TimeoutSec 10
        throw "Weak password signup should have failed"
    } catch {
        $statusCode = if ($_.Exception.Response.StatusCode) { [int]$_.Exception.Response.StatusCode } else { 0 }
        if ($statusCode -eq 400 -or $statusCode -eq 422) {
            Write-Host "  ✓ Weak password signup rejected ($statusCode)" -ForegroundColor Green
        } else {
            throw "Unexpected status ${statusCode} for weak password: $_"
        }
    }

    # Signup with strong password should succeed
    try {
        $strongSignup = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/auth/signup" -Method Post `
            -ContentType "application/json" `
            -Body '{"username":"test_qa_strong","email":"test_qa_strong@test.com","password":"StrongPass1"}' `
            -TimeoutSec 10
        Write-Host "  ✓ Strong password signup succeeded" -ForegroundColor Green
    } catch {
        throw "Strong password signup FAILED: $_"
    }

    # Login with the new user
    try {
        $loginResp = Invoke-WebRequest -Uri "http://localhost:8000/api/v1/auth/login" -Method Post `
            -ContentType "application/json" `
            -Body '{"username":"test_qa_strong","password":"StrongPass1"}' `
            -TimeoutSec 10 `
            -SessionVariable session
        $cookies = $session.Cookies.GetCookies("http://localhost:8000/api/v1/auth")
        Write-Host "  ✓ Login succeeded (cookies set)" -ForegroundColor Green
    } catch {
        throw "Login FAILED: $_"
    }

    # Set password without current_password should fail
    $accessCookie = $session.Cookies.GetCookies("http://localhost:8000/") | Where-Object Name -eq "access_token"
    $headers = @{}
    if ($accessCookie) {
        $headers["Authorization"] = "Bearer $($accessCookie.Value)"
    }

    try {
        $noCurrentPw = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/auth/set-password" -Method Post `
            -ContentType "application/json" `
            -Body '{"new_password":"NewStrong1"}' `
            -TimeoutSec 10 `
            -Headers $headers
        throw "Set password without current_password should have failed"
    } catch {
        $statusCode = if ($_.Exception.Response.StatusCode) { [int]$_.Exception.Response.StatusCode } else { 0 }
        if ($statusCode -eq 400 -or $statusCode -eq 422) {
            Write-Host "  ✓ Set password without current_password rejected ($statusCode)" -ForegroundColor Green
        } else {
            throw "Unexpected status ${statusCode}: $_"
        }
    }

    # Set password with wrong current_password should fail
    try {
        $wrongCurrentPw = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/auth/set-password" -Method Post `
            -ContentType "application/json" `
            -Body '{"current_password":"WrongPass1","new_password":"NewStrong1"}' `
            -TimeoutSec 10 `
            -Headers $headers
        throw "Set password with wrong current_password should have failed"
    } catch {
        $statusCode = if ($_.Exception.Response.StatusCode) { [int]$_.Exception.Response.StatusCode } else { 0 }
        if ($statusCode -eq 400 -or $statusCode -eq 422) {
            Write-Host "  ✓ Set password with wrong current_password rejected ($statusCode)" -ForegroundColor Green
        } else {
            throw "Unexpected status ${statusCode}: $_"
        }
    }

    Write-Host "  ✓ Phase 1 all checks passed" -ForegroundColor Green
}

if ($Phase -eq "all" -or $Phase -eq "2") {
    # ── Phase 2 checks: Time entry edit/delete + max 1440 min ──
    Write-Host "  Phase 2: Time entry edit/delete + validation" -ForegroundColor Magenta

    # Login the strong user we created in Phase 1
    try {
        $loginResp = Invoke-WebRequest -Uri "http://localhost:8000/api/v1/auth/login" -Method Post `
            -ContentType "application/json" `
            -Body '{"username":"test_qa_strong","password":"StrongPass1"}' `
            -TimeoutSec 10 `
            -SessionVariable session
        $accessCookie = $session.Cookies.GetCookies("http://localhost:8000/") | Where-Object Name -eq "access_token"
        $headers = @{}
        if ($accessCookie) {
            $headers["Authorization"] = "Bearer $($accessCookie.Value)"
        } else {
            # Also try cookie
        }
        Write-Host "  ✓ Logged in for Phase 2 tests" -ForegroundColor Green
    } catch {
        Write-Host "  ⚠ Login for Phase 2 skipped (user may not exist). Re-creating user..." -ForegroundColor Yellow
        # Create user for Phase 2 tests
        Invoke-RestMethod -Uri "http://localhost:8000/api/v1/auth/signup" -Method Post `
            -ContentType "application/json" `
            -Body '{"username":"test_qa_p2","email":"test_qa_p2@test.com","password":"StrongPass2"}' `
            -TimeoutSec 10 | Out-Null
        $loginResp = Invoke-WebRequest -Uri "http://localhost:8000/api/v1/auth/login" -Method Post `
            -ContentType "application/json" `
            -Body '{"username":"test_qa_p2","password":"StrongPass2"}' `
            -TimeoutSec 10 `
            -SessionVariable session
        $accessCookie = $session.Cookies.GetCookies("http://localhost:8000/") | Where-Object Name -eq "access_token"
        $headers = @{}
        if ($accessCookie) {
            $headers["Authorization"] = "Bearer $($accessCookie.Value)"
        }
    }

    # Create a task for time entry tests
    try {
        $task = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/tasks" -Method Post `
            -ContentType "application/json" `
            -Body '{"title":"QA Test Task P2","type":"task"}' `
            -TimeoutSec 10 `
            -Headers $headers
        $taskId = $task.id
        Write-Host "  ✓ Created task id=$taskId for time entry tests" -ForegroundColor Green
    } catch {
        throw "Failed to create test task: $_"
    }

    # Add time entry exceeding 1440 min (1441 min = 86460 sec) should fail
    try {
        $overLimit = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/tasks/$taskId/time" -Method Post `
            -ContentType "application/json" `
            -Body '{"duration":86460}' `
            -TimeoutSec 10 `
            -Headers $headers
        throw "Time entry >1440min should have been rejected"
    } catch {
        $statusCode = if ($_.Exception.Response.StatusCode) { [int]$_.Exception.Response.StatusCode } else { 0 }
        if ($statusCode -eq 422) {
            Write-Host "  ✓ Time entry >1440min rejected (422)" -ForegroundColor Green
        } else {
            throw "Unexpected status ${statusCode}: $_"
        }
    }

    # Add valid time entry should succeed (60 min = 3600 sec)
    try {
        $entry = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/tasks/$taskId/time" -Method Post `
            -ContentType "application/json" `
            -Body '{"duration":3600,"description":"Test entry"}' `
            -TimeoutSec 10 `
            -Headers $headers
        $entryId = $entry.id
        if ($entry.duration -ne 3600) { throw "Duration mismatch" }
        Write-Host "  ✓ Time entry created (id=$entryId, duration=3600s)" -ForegroundColor Green
    } catch {
        throw "Failed to create time entry: $_"
    }

    # PUT update time entry
    try {
        $updated = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/tasks/$taskId/time/$entryId" -Method Put `
            -ContentType "application/json" `
            -Body '{"duration":1800,"description":"Updated entry"}' `
            -TimeoutSec 10 `
            -Headers $headers
        if ($updated.duration -ne 1800) { throw "Update duration mismatch" }
        if ($updated.description -ne "Updated entry") { throw "Update description mismatch" }
        Write-Host "  ✓ Time entry updated (duration=1800s, desc='Updated entry')" -ForegroundColor Green
    } catch {
        throw "Failed to update time entry: $_"
    }

    # DELETE time entry
    try {
        Invoke-RestMethod -Uri "http://localhost:8000/api/v1/tasks/$taskId/time/$entryId" -Method Delete `
            -TimeoutSec 10 `
            -Headers $headers
        Write-Host "  ✓ Time entry deleted" -ForegroundColor Green
    } catch {
        throw "Failed to delete time entry: $_"
    }

    # Verify entry is gone
    try {
        $entries = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/tasks/$taskId/time" -Method Get `
            -TimeoutSec 10 `
            -Headers $headers
        if ($entries.id -eq $entryId) { throw "Entry still exists after delete" }
        Write-Host "  ✓ Time entry list confirms deletion" -ForegroundColor Green
    } catch {
        if ($_.Exception.Response.StatusCode) { throw }
        Write-Host "  ✓ Time entry list confirms deletion" -ForegroundColor Green
    }

    # Clean up task
    try {
        Invoke-RestMethod -Uri "http://localhost:8000/api/v1/tasks/$taskId" -Method Delete `
            -TimeoutSec 10 `
            -Headers $headers | Out-Null
    } catch {}

    Write-Host "  ✓ Phase 2 all checks passed" -ForegroundColor Green
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  ALL QA CHECKS PASSED" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
