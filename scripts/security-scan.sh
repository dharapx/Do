#!/bin/bash
set -e

echo "=================================================="
echo "Security Scan Container"
echo "=================================================="

# Default values
FRONTEND_IMAGE=${FRONTEND_IMAGE:-test-project-frontend:latest}
BACKEND_IMAGE=${BACKEND_IMAGE:-test-project-backend:latest}
COSIGN_PASSWORD=${COSIGN_PASSWORD:-cosign-password}
OUTPUT_DIR="/sbom-output"
KEY_DIR="/cosign-keys"

mkdir -p "$OUTPUT_DIR" "$KEY_DIR"

echo "[*] Using images: $FRONTEND_IMAGE, $BACKEND_IMAGE"

# Check if cosign keys exist, generate if not
if [ ! -f "$KEY_DIR/cosign.key" ] || [ ! -f "$KEY_DIR/cosign.pub" ]; then
    echo "[*] Generating cosign key pair..."
    COSIGN_PASSWORD="$COSIGN_PASSWORD" cosign generate-key-pair --output-key-prefix "$KEY_DIR/cosign"
    echo "[OK] Keys generated at $KEY_DIR"
else
    echo "[OK] Using existing keys at $KEY_DIR"
fi

# Generate SBOMs
echo "=================================================="
echo "Generating SBOMs"
echo "=================================================="

for image in "$FRONTEND_IMAGE" "$BACKEND_IMAGE"; do
    name=$(echo "$image" | sed 's/:.*//' | sed 's/.*\///')
    echo "[*] Generating SBOM for $image..."
    
    # SPDX format - use docker:// prefix for local images
    syft "docker://$image" -o spdx-json > "/sbom-output/${name}-sbom.spdx.json"
    echo "[OK] SPDX SBOM saved for $name"
    
    # CycloneDX format
    syft "docker://$image" -o cyclonedx-json > "/sbom-output/${name}-sbom.cyclonedx.json"
    echo "[OK] CycloneDX SBOM saved for $name"
done

# Sign images
echo "=================================================="
echo "Signing Images"
echo "=================================================="

for image in "$FRONTEND_IMAGE" "$BACKEND_IMAGE"; do
    name=$(echo "$image" | sed 's/:.*//' | sed 's/.*\///')
    echo "[*] Signing $image..."
    
    COSIGN_PASSWORD="$COSIGN_PASSWORD" cosign sign --yes \
        --key /cosign-keys/cosign.key \
        --annotation "org.opencontainers.image.source=https://github.com/dharapx/Do" \
        --annotation "org.opencontainers.image.revision=$(git rev-parse HEAD 2>/dev/null || echo 'local')" \
        "$image"
    
    echo "[OK] Signed $image"
done

# Verify signatures
echo "=================================================="
echo "Verifying Signatures"
echo "=================================================="

for image in "$FRONTEND_IMAGE" "$BACKEND_IMAGE"; do
    echo "[*] Verifying $image..."
    
    cosign verify \
        --key /cosign-keys/cosign.pub \
        "$image"
    
    echo "[OK] Verified $image"
done

echo "=================================================="
echo "Security Scan Complete"
echo "=================================================="
echo "[OK] SBOMs saved to $OUTPUT_DIR"
echo "[OK] Images signed and verified"
echo "[OK] Keys stored at $KEY_DIR"