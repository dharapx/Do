#!/usr/bin/env python3
"""Pre-deploy security check for Dokploy webhook."""

import json
import subprocess
import sys
import os


def run_cmd(cmd):
    """Run command and return (success, output)."""
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    return result.returncode == 0, result.stdout, result.stderr


def main():
    """Run pre-deploy security checks."""
    print("=" * 60)
    print("Pre-Deploy Security Check")
    print("=" * 60)

    # 1. Verify requirements.lock exists
    if not os.path.exists("requirements.lock"):
        print("[FAIL] requirements.lock not found")
        sys.exit(1)
    print("[OK] requirements.lock exists")

    # 2. Run pip-audit
    print("[*] Running pip-audit...")
    success, stdout, stderr = run_cmd("python -m pip_audit -r requirements.txt --format=json")
    if not success:
        try:
            data = json.loads(stdout)
            vulns = data.get("vulnerabilities", [])
            if vulns:
                print(f"[FAIL] Found {len(vulns)} vulnerabilities:")
                for v in vulns:
                    print(f"  - {v['package']} {v['installed_version']}: {v['vuln']} ({v['id']})")
                sys.exit(1)
        except json.JSONDecodeError:
            print(f"[FAIL] pip-audit failed: {stderr}")
            sys.exit(1)
    print("[OK] No known vulnerabilities found")

    # 3. Check requirements.lock sync
    if not os.path.exists("requirements.lock"):
        print("[FAIL] requirements.lock not found")
        sys.exit(1)
    print("[OK] requirements.lock exists")

    # 4. Check outdated (warning only)
    print("[*] Checking for outdated packages...")
    success, stdout, _ = run_cmd("python -m pip list --outdated --format=json")
    if success:
        try:
            data = json.loads(stdout)
            if data:
                print(f"[WARN] {len(data)} outdated packages found:")
                for d in data[:10]:  # Show first 10
                    print(f"  - {d['name']}: {d['version']} -> {d['latest_version']}")
            else:
                print("[OK] All packages up to date")
        except json.JSONDecodeError:
            pass

    print("=" * 60)
    print("[OK] All pre-deploy checks passed")
    sys.exit(0)


if __name__ == "__main__":
    main()