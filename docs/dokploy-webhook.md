# Dokploy Pre-Deploy Webhook Configuration

## Overview
This document describes how to configure a pre-deploy webhook in Dokploy that runs security checks before deploying the backend.

## Webhook Setup

### 1. Create the Webhook Endpoint
Add a simple HTTP endpoint in the backend that runs security checks:

```python
# In app/api/v1/security.py
from fastapi import APIRouter, HTTPException, Depends
from subprocess import run
import json

router = APIRouter(prefix="/security", tags=["security"])

@router.post("/pre-deploy-check")
async def pre_deploy_check(secret: str):
    """Run pre-deploy security checks. Requires secret token."""
    expected_secret = os.getenv("DEPLOY_WEBHOOK_SECRET")
    if not expected_secret or secret != expected_secret:
        raise HTTPException(status_code=401, detail="Invalid secret")

    # Run security checks
    result = run([
        "python", "scripts/pre_deploy_check.py"
    ], capture_output=True, text=True)

    if result.returncode != 0:
        raise HTTPException(
            status_code=400,
            detail=f"Security check failed: {result.stdout}"
        )

    return {"status": "ok", "message": "All security checks passed"}
```

### 2. Configure Dokploy Webhook
In Dokploy dashboard:
1. Go to your app → Settings → Webhooks
2. Add webhook:
   - **Name**: Pre-Deploy Security Check
   - **URL**: `https://do.dharapx.work/api/v1/security/pre-deploy-check`
   - **Events**: `deployment.started`
   - **Secret**: Set a strong secret (e.g., `openssl rand -hex 32`)
   - **Headers**: `Authorization: Bearer <secret>`

### 3. Environment Variable
Add to Dokploy Environment:
```
DEPLOY_WEBHOOK_SECRET=<your-generated-secret>
```

### 4. Alternative: External Webhook Service
If you prefer not to add an endpoint to the app, use an external service:
- **GitHub Actions**: Run security checks on push, block deploy on failure
- **GitLab CI**: Same approach
- **External webhook service**: Custom service that runs trivy + pip-audit

## Security Checks Performed

1. **pip-audit** - Checks for known vulnerabilities in Python dependencies
2. **requirements.lock verification** - Ensures lockfile exists and is in sync
3. **Outdated packages** - Warns about outdated packages (non-blocking)
4. **trivy scan** (optional) - Scan image for OS-level vulnerabilities

## Blocking vs Warning

| Check | Blocks Deploy | Rationale |
|-------|---------------|-----------|
| pip-audit (high/critical) | Yes | Known exploitable vulnerabilities |
| requirements.lock missing | Yes | Reproducibility requirement |
| Outdated packages | No | Warning only, manual review |
| trivy (high/critical) | Yes | OS-level vulnerabilities |

## Local Testing

```bash
# Run pre-deploy check locally
python scripts/pre_deploy_check.py

# Run full security scan
python scripts/security_scan.py

# Build security scan image
docker build -f Dockerfile.security -t backend-security-scan .
docker run --rm backend-security-scan
```