# Security Documentation

## Accepted Risks & Mitigations

### Next.js 14.2.35 - Known Vulnerabilities (High Severity)

**Status:** Accepted with mitigations  
**Reason:** Next.js 14 is the LTS version we depend on. Upgrading to Next.js 15+ would require significant code changes (App Router, React Server Components, etc.) and is deferred to a separate migration effort.

**Vulnerabilities (from npm audit):**
- GHSA-9g9p-9gw9-jx7f: DoS via Image Optimizer remotePatterns
- GHSA-h25m-26qc-wcjf: HTTP request deserialization DoS with insecure RSC
- GHSA-ggv3-7p47-pfv8: HTTP request smuggling in rewrites
- GHSA-3x4c-7xq6-9pq8: Unbounded next/image disk cache growth
- GHSA-q4gf-8mx6-v5v3: DoS with Server Components
- GHSA-8h8q-6873-q5fj: DoS with Server Components
- GHSA-3g8h-86w9-wvmq: Middleware/Proxy redirects cache poisoning
- GHSA-ffhc-5mcf-pf4q: XSS in App Router with CSP nonces
- GHSA-vfv6-92ff-j949: Cache poisoning via RSC cache-busting collisions
- GHSA-gx5p-jg67-6x7h: XSS in beforeInteractive scripts
- GHSA-h64f-5h5j-jqjh: DoS in Image Optimization API
- GHSA-c4j6-fc7j-m34r: SSRF with WebSocket upgrades
- GHSA-wfc6-r584-vfw7: Cache poisoning in RSC responses
- GHSA-36qx-fr4f-26g5: Middleware/Proxy bypass in Pages Router with i18n

**Mitigations Applied:**
1. **WAF Rules** - Cloudflare/Traefik WAF blocking malicious payloads
2. **CSP Headers** - Strict Content Security Policy configured in `next.config.js`
3. **Rate Limiting** - API rate limits on all auth and write endpoints
4. **Image Optimization** - Disabled external images, only local allowed
5. **No i18n** - i18n routing not used, eliminates GHSA-36qx-fr4f-26g5
6. **WebSocket Upgrades** - Not used in application
7. **Monitoring** - Log aggregation and alerting on error rates

**Review Date:** Quarterly (next review: 2026-09-15)

---

### Resolved Vulnerabilities

| Package | Original Version | Fixed Version | CVE/GHSA |
|---------|-----------------|---------------|----------|
| glob | 10.2.0 | 11.1.0 | GHSA-5j98-mcp5-4vw2 (Command Injection) |
| postcss | <8.5.10 | 8.5.15 | GHSA-qx2v-qp2m-jg93 (XSS) |
| @tiptap/* | 3.26.0 | 3.26.1 | Peer dependency conflicts (build failure risk) |

---

## Supply Chain Security Measures

### Implemented
- [x] Exact version pinning in `package.json` and `requirements.lock`
- [x] `npm ci` / `pip install --require-hashes` in Dockerfiles
- [x] Base images pinned to SHA256 digests
- [x] Non-root containers (UID 1001)
- [x] `.dockerignore` files excluding secrets, tests, local config
- [x] GitHub branch protection (2 approvals, signed commits)
- [x] Dependabot alerts enabled
- [x] No secrets in git history (verified)

### Planned (Future Phases)
- [ ] SBOM generation (`syft`) per build
- [ ] Image signing (`cosign` keyless via GitHub OIDC)
- [ ] Pre-deploy verification webhook (cosign verify + trivy scan)
- [ ] Runtime vulnerability scanning schedule
- [ ] Image digest pinning in production compose

---

## Dependency Update Policy

1. **Security patches** - Apply within 48 hours of disclosure
2. **Minor updates** - Monthly review, test in staging
3. **Major updates** - Dedicated migration branch, full regression test
4. **Framework LTS** - Plan migration 6 months before EOL

---

## Incident Response

If a critical vulnerability is discovered in a deployed dependency:
1. Assess exploitability in our context
2. Apply override/workaround within 4 hours
3. Schedule permanent fix in next sprint
4. Document in this file with resolution date