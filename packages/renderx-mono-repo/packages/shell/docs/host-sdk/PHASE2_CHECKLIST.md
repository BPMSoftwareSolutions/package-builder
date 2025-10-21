# Phase 2 Checklist — SDK Hardening & Artifact Integrity

## SDK Surface
- [ ] Create `packages/host-sdk/public-api.ts`
- [ ] Move exports from `index.ts` -> `public-api.ts`
- [ ] Ensure no deep `../../src/...` usage outside controlled list
- [ ] Add basic API diff script (optional)

## Artifact Integrity
- [ ] Add hashing util (`scripts/hash-artifacts.js`)
- [ ] Integrate optional `--integrity` flag into `build-artifacts.js`
- [ ] Emit `artifacts.integrity.json` (per-file + aggregate hash)
- [ ] Runtime validator (dev only) compares hashes; logs warning on mismatch

## ESLint Externalization
- [ ] Support env `RENDERX_PLUGINS_SRC` for rules reading plugin JSON/catalogs
- [ ] Update docs with external plugin repo scenario

## Watch Mode (Stub)
- [ ] Add `--watch` flag placeholder to `build-artifacts.js` (logs not implemented)

## Docs
- [ ] Update README: integrity, env vars, SDK policy
- [ ] Add ADR finalization (promote ADR-0024 to Accepted)

## Validation
- [ ] Tamper test: modify a public JSON after copy → dev warning
- [ ] Ensure integrity file ignored by hashing recursion itself
