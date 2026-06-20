#!/usr/bin/env python3
"""Sign Docker images using cosign (keyless via GitHub OIDC)."""

import subprocess
import sys
import os
import argparse


def run_cmd(cmd, capture=True):
    """Run command and return result."""
    result = subprocess.run(cmd, shell=True, capture_output=capture, text=True)
    return result


def check_cosign_installed():
    """Check if cosign is installed."""
    result = run_cmd("cosign version")
    if result.returncode != 0:
        print("[FAIL] cosign not installed. Install from https://github.com/sigstore/cosign")
        return False
    print(f"[OK] cosign found: {result.stdout.strip()}")
    return True


def check_syft_installed():
    """Check if syft is installed."""
    result = run_cmd("syft version")
    if result.returncode != 0:
        print("[FAIL] syft not installed. Install from https://github.com/anchore/syft")
        return False
    print(f"[OK] syft found: {result.stdout.strip()}")
    return True


def sign_image(image_name, annotations=None):
    """Sign a Docker image using cosign keyless signing."""
    print(f"[*] Signing {image_name} with cosign...")
    
    cmd = f"cosign sign --yes {image_name}"
    
    if annotations:
        for key, value in annotations.items():
            cmd += f" --annotation {key}={value}"
    
    result = run_cmd(cmd)
    
    if result.returncode != 0:
        print(f"[FAIL] cosign sign failed for {image_name}: {result.stderr}")
        return False
    
    print(f"[OK] {image_name} signed successfully")
    return True


def verify_signature(image_name):
    """Verify the cosign signature on an image."""
    print(f"[*] Verifying signature for {image_name}...")
    
    result = run_cmd(f"cosign verify {image_name}")
    
    if result.returncode != 0:
        print(f"[FAIL] Signature verification failed for {image_name}: {result.stderr}")
        return False
    
    print(f"[OK] Signature verified for {image_name}")
    return True


def get_image_digest(image_name):
    """Get the image digest for an image."""
    result = run_cmd(f"docker inspect {image_name} --format '{{{{index .RepoDigests 0}}}}'")
    if result.returncode == 0:
        return result.stdout.strip()
    return None


def main():
    parser = argparse.ArgumentParser(description="Sign Docker images with cosign")
    parser.add_argument("--frontend-image", default="test-project-frontend:latest", help="Frontend image name")
    parser.add_argument("--backend-image", default="test-project-backend:latest", help="Backend image name")
    parser.add_argument("--verify-only", action="store_true", help="Only verify signatures, don't sign")
    parser.add_argument("--skip-verify", action="store_true", help="Skip signature verification after signing")
    args = parser.parse_args()
    
    print("=" * 60)
    print("Image Signing with cosign (keyless)")
    print("=" * 60)
    
    if not check_cosign_installed():
        sys.exit(1)
    
    if not args.verify_only and not check_syft_installed():
        # syft is optional for signing but good to have
        pass
    
    annotations = {
        "org.opencontainers.image.source": "https://github.com/dharapx/Do",
        "org.opencontainers.image.revision": os.getenv("GITHUB_SHA", "unknown"),
    }
    
    images = [
        args.frontend_image,
        args.backend_image,
    ]
    
    all_success = True
    
    for image in images:
        if not args.verify_only:
            if not sign_image(image, annotations):
                all_success = False
                continue
        
        if not args.skip_verify:
            if not verify_signature(image):
                all_success = False
    
    print("=" * 60)
    if all_success:
        print("[OK] All image signing/verification operations completed successfully")
        sys.exit(0)
    else:
        print("[FAIL] Some operations failed")
        sys.exit(1)


if __name__ == "__main__":
    main()