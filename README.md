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
npm test             # Vitest: rules, domain, offline sync, mock API, UI workflow
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
| `packages/demo-data`     | Fictional LGAs, communities, facilities and the demo CHW                |
| `packages/api-contract`  | Mock API routes and the permissions they need                           |
| `e2e`                    | Playwright tests, including automated accessibility scans               |
| `prototype`              | Original single-file prototype, unchanged, reference only               |
| `docs`                   | Architecture, rules, offline and mock API, safety, privacy, decisions   |

## Status after Stage 2

| Area                                                                                        | State                                                                   |
| ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Design tokens and components (buttons, badges, notices, states, form fields, error summary) | **Implemented**, unit tested                                            |
| Routing, layouts, role-based navigation, access-denied page                                 | **Implemented**, unit tested                                            |
| Domain model: roles, permissions, risk, referral pathway, schemas                           | **Implemented**, unit tested                                            |
| Demonstration rules engine (data-driven, validated, labelled)                               | **Implemented**, 35 tests incl. boundaries, missing data, conflicts     |
| CHW app: 13 milestone screens plus referral list, follow-up list and profile                | **Implemented**, tested in jsdom and in a real browser                  |
| Form validation, draft persistence, review before saving                                    | **Implemented**, tested                                                 |
| Referral generation, status timeline, follow-up, history with filter                        | **Implemented**, tested                                                 |
| Mock API (MSW): assessments, referrals, status updates, follow-ups                          | **Simulated**, tested                                                   |
| IndexedDB store and sync queue: refresh, offline, reconnect, duplicates, failures, retry    | **Prototype**, 26 tests + browser tests                                 |
| Sign-in, roles, API permission checks                                                       | **Simulated**, not security controls                                    |
| Super Administrator access rules (programme intelligence, users, settings)                  | **Implemented as rules**, tested; the pages themselves are placeholders |
| Programme dashboard pages, charts, filters                                                  | **Placeholders**, Stage 3                                               |
| MapLibre GIS map with fictional geography                                                   | **Not started**, Stage 3                                                |
| Programme data fed from CHW activity (aggregation)                                          | **Not started**, Stage 3 and 4                                          |
| Languages other than English                                                                | **Not implemented** (scaffold and English only)                         |
| Real backend, authentication, DHIS2 or other integrations, deployment                       | **Not implemented, not approved**                                       |
| Offline in a real field setting (storage limits, multiple devices, background sync)         | **Untested**                                                            |
| Manual testing with screen readers and on real phones                                       | **Not done**                                                            |

See `docs/` for details: `RULES.md`, `OFFLINE_AND_MOCK_API.md`, `PRIVACY_AND_ACCESS.md`, `SAFETY_AND_SCOPE.md`, `ARCHITECTURE.md`, `DECISIONS.md`.
