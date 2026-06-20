#!/usr/bin/env python3
"""Generate SBOMs for built images using syft."""

import json
import subprocess
import sys
import os
import argparse


def run_cmd(cmd, capture=True):
    """Run command and return result."""
    result = subprocess.run(cmd, shell=True, capture_output=capture, text=True)
    return result


def generate_sbom(image_name, output_format="spdx-json", output_file=None):
    """Generate SBOM for a Docker image using syft."""
    print(f"[*] Generating SBOM for {image_name}...")
    
    cmd = f"syft {image_name} -o {output_format}"
    if output_file:
        cmd += f" > {output_file}"
    
    result = run_cmd(cmd)
    
    if result.returncode != 0:
        print(f"[FAIL] syft failed for {image_name}: {result.stderr}")
        return False
    
    if output_file:
        print(f"[OK] SBOM saved to {output_file}")
    else:
        print(result.stdout)
    
    return True


def generate_both_sboms(frontend_image, backend_image, output_dir="sbom-output"):
    """Generate SBOMs for both frontend and backend images."""
    os.makedirs(output_dir, exist_ok=True)
    
    results = {}
    
    # Frontend SBOM
    frontend_sbom = os.path.join(output_dir, "frontend-sbom.spdx.json")
    results["frontend"] = generate_sbom(frontend_image, "spdx-json", frontend_sbom)
    
    # Backend SBOM
    backend_sbom = os.path.join(output_dir, "backend-sbom.spdx.json")
    results["backend"] = generate_sbom(backend_image, "spdx-json", backend_sbom)
    
    # Also generate CycloneDX format for compatibility
    frontend_cdx = os.path.join(output_dir, "frontend-sbom.cyclonedx.json")
    generate_sbom(frontend_image, "cyclonedx-json", frontend_cdx)
    
    backend_cdx = os.path.join(output_dir, "backend-sbom.cyclonedx.json")
    generate_sbom(backend_image, "cyclonedx-json", backend_cdx)
    
    return results


def main():
    parser = argparse.ArgumentParser(description="Generate SBOMs for test images")
    parser.add_argument("--frontend-image", default="test-project-frontend:latest", help="Frontend image name")
    parser.add_argument("--backend-image", default="test-project-backend:latest", help="Backend image name")
    parser.add_argument("--output-dir", default="sbom-output", help="Output directory for SBOMs")
    args = parser.parse_args()
    
    print("=" * 60)
    print("SBOM Generation")
    print("=" * 60)
    
    generate_both_sboms(args.frontend_image, args.backend_image, args.output_dir)
    
    print("=" * 60)
    print("[OK] SBOM generation complete")


if __name__ == "__main__":
    main()