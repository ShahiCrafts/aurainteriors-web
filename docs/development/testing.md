# Testing

## Web (`aurainteriors-web`) — Vitest + Testing Library

```bash
npm test                 # full suite (vitest run)
npx vitest run tests/components/sections/   # a folder
npx vitest run tests/pages/shop/ProductDetailsPage.test.jsx   # one file
```

Suites live in `tests/` mirroring the app: `components/`, `pages/`,
`layouts/`, `chat/`, `routing/`, `security/` (including a storage-audit test
that allowlists every `localStorage` key the apps may write), `hooks/`,
`api/`, `lib/`, `config/`, `regression/`.

**Known baseline:** the full suite has a small set of long-standing,
pre-existing failures (17 of ~1,450 tests at the time of writing — link
integrity, a media-sink guard expectation, a CategoryBar class expectation,
and a few component suites). Treat "no *new* failures beyond baseline" as the
bar for a change, and run the suites for the areas you touched.

## Server (`aurainteriors-server`) — node:test

```bash
npm test                 # tests/**/*.test.js
npm run test:fresh       # tests/fresh — clean-room behaviour suites
npm run test:audit       # tests/audit — audit-log suites
npm run test:chat        # tests/chatV2 — AI chat suites
npm run chat:gate        # chat quality gate (benchmark harness)
```

**Known baseline:** ~10 pre-existing failures on the full run; the same
"no new failures" rule applies.

## Builds as a smoke test

```bash
# web — both apps must build before any push
VITE_API_BASE_URL=https://api.aurainteriors.live npm run build
npm run build:admin
npm run check:bundle     # bundle-size budget check

# server
npm run lint
```

## Conventions

- Pushes go through the GitHub connector in this project's workflow; before
  pushing a file, diff the remote version against local to catch divergence,
  and after pushing, verify the pushed blob hash matches the local file.
- Production is verified by **content markers in the served JS/CSS chunks**,
  not by build hashes — Render's build hashes can differ from a local build
  of the same commit.
- Mobile layout can only be fully verified on a real phone viewport; the
  managed browser cannot emulate one. Ship mobile changes with correct
  responsive classes and verify visually on device.
