$env:PATH += ";C:\syft"
docker run --rm `
  -v /var/run/docker.sock:/var/run/docker.sock `
  -v D:/PERSONAL-PROJECT/OPENCODE/TEST-PROJECT/scripts:/scripts `
  -v D:/PERSONAL-PROJECT/OPENCODE/TEST-PROJECT/sbom-output:/sbom-output `
  -v D:/PERSONAL-PROJECT/OPENCODE/TEST-PROJECT/cosign-keys:/cosign-keys `
  -e COSIGN_PASSWORD=cosign-password `
  -e FRONTEND_IMAGE=test-project-frontend:latest `
  -e BACKEND_IMAGE=test-project-backend:latest `
  test-project-security-scan