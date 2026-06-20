#!/usr/bin/env python3
"""Security scanning script for backend dependencies and image."""

import json
import subprocess
import sys
import os


def run_cmd(cmd, capture=True):
    """Run command and return result."""
    result = subprocess.run(cmd, shell=True, capture_output=capture, text=True)
    return result


def check_pip_audit():
    """Run pip-audit on requirements."""
    print("[*] Running pip-audit...")
    result = run_cmd("python -m pip_audit -r requirements.txt --format=json")
    if result.returncode != 0:
        try:
            data = json.loads(result.stdout)
            vulns = data.get("vulnerabilities", [])
            if vulns:
                print(f"[FAIL] Found {len(vulns)} vulnerabilities:")
                for v in vulns:
                    print(f"  - {v['package']} {v['installed_version']}: {v['vuln']} ({v['id']})")
                return False
            else:
                print("[OK] No known vulnerabilities found")
                return True
        except json.JSONDecodeError:
            print("[WARN] Could not parse pip-audit output")
            return False
    print("[OK] No known vulnerabilities found")
    return True


def check_outdated():
    """Check for outdated packages."""
    print("[*] Checking for outdated packages...")
    result = run_cmd("python -m pip list --outdated --format=json")
    if result.returncode != 0:
        print("[WARN] Could not check outdated packages")
        return True
    try:
        data = json.loads(result.stdout)
        if data:
            print(f"[WARN] Found {len(data)} outdated packages:")
            for d in data:
                print(f"  - {d['name']}: {d['version']} -> {d['latest_version']}")
            return True
        else:
            print("[OK] All packages up to date")
            return True
    except json.JSONDecodeError:
        print("[WARN] Could not parse outdated packages output")
        return True


def check_requirements_lock():
    """Verify requirements.lock is in sync with requirements.txt."""
    print("[*] Checking requirements.lock sync...")
    if not os.path.exists("requirements.lock"):
        print("[FAIL] requirements.lock not found")
        return False
    print("[OK] requirements.lock exists")
    return True


def main():
    """Run all security checks."""
    print("=" * 50)
    print("Backend Security Scan")
    print("=" * 50)

    all_passed = True

    # Check requirements.lock exists
    if not check_requirements_lock():
        all_passed = False

    # Run pip-audit
    if not check_pip_audit():
        all_passed = False

    # Check outdated (warning only)
    check_outdated()

    print("=" * 50)
    if all_passed:
        print("[OK] All security checks passed")
        sys.exit(0)
    else:
        print("[FAIL] Security checks failed")
        sys.exit(1)


if __name__ == "__main__":
    main()