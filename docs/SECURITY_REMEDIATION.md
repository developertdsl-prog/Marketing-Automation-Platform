# Security Vulnerability Remediation Plan

This document outlines known security vulnerabilities identified via `npm audit` and the remediation plan.

## Summary

| Layer | Total | Critical | High | Moderate |
|-------|-------|----------|------|----------|
| Backend | 18 | 1 | 9 | 8 |
| Frontend | 3 | 1 | 2 | 0 |

## Backend Vulnerabilities

### Critical (1)

| Package | Vulnerability | Fix |
|---------|--------------|-----|
| `tar` | Arbitrary File Creation/Overwrite via Hardlink Path Traversal | `npm audit fix` (non-breaking) |

### High (9)

| Package | Vulnerability | Fix | Breaking Change |
|---------|--------------|-----|-----------------|
| `@nestjs/core` | Injection via downstream component | v12.4.2 | Yes |
| `body-parser` | DoS via invalid limit value | v12.4.2 (via platform-express) | Yes |
| `js-yaml` | Prototype pollution / DoS | v12.1.1 (via swagger) | Yes |
| `lodash` | Code injection / Prototype pollution | v12.1.1 (via swagger) | Yes |
| `multer` | Multiple DoS vulnerabilities | v12.4.2 (via platform-express) | Yes |
| `nodemailer` | SMTP injection / DoS / SSRF | v10.5.0 | Yes |

### Moderate (8)

| Package | Vulnerability | Fix | Breaking Change |
|---------|--------------|-----|-----------------|
| `file-type` | Infinite loop / DoS | `npm audit fix` | No |
| `qs` | DoS via stringify | `npm audit fix` | No |
| `uuid` | Missing buffer bounds check | No fix available | N/A |

## Frontend Vulnerabilities

### Critical (1)

| Package | Vulnerability | Fix | Breaking Change |
|---------|--------------|-----|-----------------|
| `next` | Multiple DoS / XSS / SSRF / RCE | v16.4.6 | Yes |

### High (2)

| Package | Vulnerability | Fix | Breaking Change |
|---------|--------------|-----|-----------------|
| `postcss` | XSS via CSS Stringify | v16.4.6 (via next) | Yes |
| `zod` | Memory exhaustion | v4.6.7 | Yes |

## Remediation Approach

### Phase 1: Non-Breaking Fixes (Immediate)

Run `npm audit fix` in both frontend and backend to address non-breaking vulnerabilities:

```bash
# Backend
cd backend
npm audit fix

# Frontend
cd ../frontend
npm audit fix
```

This addresses: `tar`, `file-type`, `qs` (backend).

### Phase 2: Breaking Changes (Planned)

The remaining vulnerabilities require major version upgrades that introduce breaking changes. These should be addressed in a dedicated sprint:

1. **Upgrade NestJS to v12** — Requires reviewing migration guide for `@nestjs/core`, `@nestjs/platform-express`, `@nestjs/swagger`, `@nestjs/config`, `@nestjs/terminus`
2. **Upgrade nodemailer to v10.5.0** — Review SMTP transport changes
3. **Upgrade Next.js to v16.4.6** — Review App Router changes, test all pages
4. **Upgrade zod to v4.6.7** — Review schema validation API changes
5. **Upgrade postcss** — Comes with Next.js upgrade

### Phase 3: No Fix Available

- `uuid` (<11.1.1) — No fix available. This is a transitive dependency of `bull`. Consider migrating from `bull` to `bullmq` (already used in some parts) or accepting the risk.

## Verification

After applying fixes:

1. Run `npm audit` to confirm vulnerabilities are resolved
2. Run `tsc --noEmit` to verify TypeScript compilation
3. Run all unit tests (`npm test` / `npx jest`)
4. Run all E2E tests (`npx playwright test`)
5. Manually test critical user flows (login, campaign launch, workflow execution)

## References

- GitHub Security Advisories: https://github.com/advisories
- NestJS v12 Migration: https://docs.nestjs.com/
- Next.js v16 Upgrade: https://nextjs.org/docs/upgrading

-- End of Security Remediation Plan --