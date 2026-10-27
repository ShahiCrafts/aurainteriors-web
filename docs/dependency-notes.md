# Dependency notes — non-registry dependencies

Two dependencies in this project do **not** resolve from the npm registry.
Both are recorded here so their provenance risks stay visible. This file was
added during remediation Phase 8 (DEP-01 / DEP-02 in
`02-security-and-performance-report.md` §4.3). **No dependency source was
changed in that phase** — the options below are decisions for the project
owner, not actions already taken.

> Verification status: no completed vulnerability scan exists for this
> delivery. `npm audit` is blocked in the remediation environment
> (403 `policy_denied` from the registry audit endpoint, reproduced in
> Phase 8 for both projects), so nothing in this file is a CVE verdict for
> any installed version. OWASP A06 remains **Needs Verification** until a
> scan runs in an environment with registry-audit access (both repos' CI
> already gate on one — see report H-22).

---

## DEP-01 — `xlsx` (SheetJS) ships from a vendor CDN tarball

- **Declared:** `package.json` —
  `"xlsx": "https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz"`
- **Locked:** version `0.20.3`, resolved from the same CDN URL, **with** an
  integrity hash recorded in `package-lock.json`:

  `sha512-oLDq3jw7AcLqKWH2AhCpVTZl8mf6X2YReP+Neh0SJUzV/BdZYjth94tG5toiMB1PPrYtxOCfaoUCkvtuH+3AJA==`

  A changed tarball therefore fails `npm ci`.

### Why it is this way

SheetJS distributes its current builds from its own CDN; the `xlsx`
package published on the npm registry is stale by comparison. Using the
vendor CDN is the vendor's supported route to a current release, so this
is an understandable choice — the risks below are structural, not a claim
that the current tarball is compromised.

### Risks

1. **Outside `npm audit` coverage.** npm's audit only covers registry
   packages. SheetJS advisories for this tarball must be tracked manually;
   no automated gate will flag them.
2. **Availability/integrity depends on `cdn.sheetjs.com`** rather than the
   npm registry (partially mitigated by the lockfile integrity hash above).
3. **No version range.** Upgrades are a manual URL edit in `package.json`
   plus a lockfile regeneration — easy to forget, so the pinned version
   can silently age.

### Already done (earlier remediation phases)

- The blast radius is already shrunk: `xlsx` is loaded via dynamic
  `import('xlsx')` in the two admin export paths
  (`src/pages/admin/Dashboard.jsx`, `src/pages/admin/SalesReports.jsx`),
  so it ships as a lazy chunk (`vendor-xlsx`) loaded only on export.

### Advisory watchlist (manual)

Until an option below is adopted, a named owner should check SheetJS
release/advisory notices for the pinned `0.20.3` line on the same cadence
as the Dependabot review, and record the check. This file is the
watchlist home: update the version + integrity values above whenever the
pin moves.

### Options — **OWNER DECISION** (none applied)

| Option | Notes |
|---|---|
| Keep the CDN tarball, pinned + integrity-checked (status quo) | Vendor-supported route; requires the manual watchlist above to stay meaningful. |
| Mirror the exact tarball into an internal artefact store | Removes the external-CDN availability dependency; the project becomes responsible for the mirror's integrity. |
| Switch to the npm registry `xlsx` package | Only if licensing/edition requirements allow accepting the registry build's staleness; restores `npm audit` coverage. |
| Replace the spreadsheet export with CSV generation | Removes the dependency entirely; loses `.xlsx` formatting/multi-sheet output — a product decision about what the admin export must produce. |

---

## DEP-02 — `capacitor-arcore` is a git dependency on a personal-account repository

- **Declared:** `package.json` —
  `"capacitor-arcore": "https://github.com/ShahiCrafts/arcore-react.git#334a9ab9158c2e63f0ddc483762f4a94cb5a38be"`
- **Locked:** version `1.0.0`, resolved in `package-lock.json` as
  `git+ssh://git@github.com/ShahiCrafts/arcore-react.git#334a9ab9158c2e63f0ddc483762f4a94cb5a38be`
  with **no `integrity` field** — the only package in either project's
  lockfile without one.

### What is good

- The pin is to a **full commit SHA**, not a branch or tag, so the
  referenced tree is content-fixed as long as that commit remains
  reachable. Treat the SHA above as a **reviewed pin**: any change to it
  is a code-review event, not a routine bump.

### Risks

1. **No lockfile integrity hash.** npm cannot verify the fetched tree the
   way it verifies registry tarballs; the commit SHA is the only anchor.
2. **Resolution requires SSH GitHub access** (the lockfile resolves via
   `git+ssh://`), so build environments need GitHub SSH credentials —
   the audit's DEP-02/03/04 retest asks for a fresh `npm ci` that succeeds
   without SSH GitHub access, which this dependency currently prevents.
3. **Third-party personal account.** `ShahiCrafts` is outside the
   project's control: account compromise, repository transfer, or history
   rewrite sit outside npm's controls.
4. **Audit tooling skips git dependencies**, compounding the A06
   verification gap noted at the top of this file.

### Options — **OWNER DECISION / TBD** (none applied)

| Option | Notes |
|---|---|
| Vendor the package into this repository | Full control and offline installs; the project takes on maintenance of the vendored code. |
| Fork into an organisation the project controls, pin there | Keeps the git workflow but moves trust to a controlled account; still no lockfile integrity hash. |
| Switch the spec to an `https` URL + commit pin | May avoid the SSH requirement depending on repo visibility; does not add an integrity hash and does not change the personal-account trust issue. |
| Replace with a registry-published Capacitor AR plugin | Restores registry integrity + audit coverage; requires an AR feature-parity evaluation and on-device regression testing before adoption. |

**Owner:** TBD — a named owner for this pin (review + any future SHA
change) still needs to be assigned.
