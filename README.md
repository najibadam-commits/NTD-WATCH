# NTD-WATCH

Community-level neglected tropical disease (NTD) early-warning, referral, follow-up and programme-intelligence **prototype**.

> **DEMONSTRATION ONLY.** All data is synthetic. All risk rules are demonstration placeholders, **not clinically validated**. Sign-in, roles and permissions are simulated and are **not** security controls. The API is a mock running in the browser. Offline capture and synchronisation are prototype functionality, **not production-ready offline operation**. The system supports early recognition, triage, referral and programme decisions. It does not diagnose disease or prescribe medication.

Core loop: Signal → Assessment → Action → Referral → Follow-up → Intelligence → Response.

## Requirements

- Node.js 20.19 or newer (`.nvmrc` pins 22)
- npm 10 or newer

## Install and run

```bash
npm install
npm run dev          # http://localhost:5173 (Vite picks the next free port if it is busy)
```

On Windows PowerShell, if scripts are blocked ("running scripts is disabled on this system"), either run
`Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned` once, use Command Prompt, or call
`npm.cmd` and `npx.cmd`. Older PowerShell does not support `&&`; run commands one per line.

Open the app and choose **Open the CHW app** (any 4-digit demo PIN) or one of the programme roles.

## Test and check

```bash
npm run typecheck    # TypeScript, strict
npm run lint         # ESLint, including accessibility rules
npm run format:check # Prettier
npm test             # Vitest: rules, domain, aggregation, offline sync, mock API, UI, map
npm run build        # production build to apps/web/dist
npm run check        # all of the above, in order

npx playwright install chromium   # one-off
npm run test:e2e                  # Playwright, mobile and desktop (builds, then serves on :4173)
```

`npm run test:e2e` runs a real browser against the production build with the mock API in a service
worker. Set `CHROMIUM_PATH` to use an already-installed Chromium instead of the downloaded one.

## Layout

| Path                     | Purpose                                                                 |
| ------------------------ | ----------------------------------------------------------------------- |
| `apps/web`               | React + Vite app: routes, layouts, CHW screens, offline layer, mock API |
| `packages/design-system` | Tokens, base CSS, accessible components including form components       |
| `packages/domain`        | Roles, permissions, risk, referral pathway, zod entity schemas          |
| `packages/rules-engine`  | Demonstration rule set (data), validator and evaluator                  |
| `packages/demo-data`     | Fictional hierarchy, CHWs, users and GeoJSON                            |
| `packages/programme`     | Synthetic seed, aggregation, filters and report builders                |
| `packages/api-contract`  | Mock API routes and the permissions they need                           |
| `e2e`                    | Playwright tests, including automated accessibility scans               |
| `prototype`              | Original single-file prototype, unchanged, reference only               |
| `docs`                   | Architecture, rules, offline and mock API, safety, privacy, decisions   |

## Status after Stage 3

| Area                                                                                       | State                                                                     |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| Design tokens and components, routing, role-based navigation, access-denied page           | **Implemented**, unit tested                                              |
| Domain model, demonstration rules engine, CHW app (16 screens), offline queue, mock API    | **Implemented / prototype** (Stage 2), regression tested                  |
| Fictional hierarchy: 2 states, 5 LGAs, 10 wards, 15 communities, 9 facilities, 11 CHWs     | **Implemented**, synthetic, labelled "Demo"                               |
| Synthetic seed: about 650 assessments, 75 referrals, 42 follow-ups over 12 weeks           | **Implemented**, deterministic, consistency-checked                       |
| Programme overview, risk signals, vulnerability, referral monitoring, trends, reports      | **Implemented**, computed from the records, filters shared by every page  |
| MapLibre GIS map on fictional GeoJSON; separate signal and vulnerability layers            | **Implemented**, table fallback when WebGL is missing                     |
| Community details on select (aggregate only)                                               | **Implemented**                                                           |
| User management and settings (Super Administrator)                                         | **Simulated**, stored in the mock server only, with a simulated audit log |
| Exports (CSV and JSON) labelled synthetic in file name, header, footer and every row       | **Implemented**                                                           |
| Referral ids: UUID-based, legacy format still accepted                                     | **Implemented**; production ids need backend design                       |
| Sign-in, roles, scope, API permission checks                                               | **Simulated**, not security controls                                      |
| Small-cell suppression, formal statistical methods, validated risk or vulnerability scores | **Not implemented**                                                       |
| Languages other than English                                                               | **Not implemented**                                                       |
| Real backend, authentication, DHIS2 or other integrations, deployment                      | **Not implemented, not approved**                                         |
| Offline in a real field setting; manual screen-reader and real-phone testing               | **Untested**                                                              |

See `docs/` for details: `RULES.md`, `OFFLINE_AND_MOCK_API.md`, `PRIVACY_AND_ACCESS.md`, `SAFETY_AND_SCOPE.md`, `ARCHITECTURE.md`, `DECISIONS.md`.

## Programme dashboard (Stage 3)

Choose a programme role on the landing page. The Super Administrator sees every page. Programme views
read **aggregates only** from the mock API. Records you enter in the CHW app appear there after they
sync (open the programme view in another tab, or press Refresh). **Settings → Reset demonstration data**
returns everything to the synthetic seed.

Everything is synthetic: the places, people, boundaries and numbers. The map has no base map and does
not represent any real geography. Risk results are demonstration rules, not clinically validated.
