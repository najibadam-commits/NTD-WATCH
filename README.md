# NTD-WATCH

Community-level neglected tropical disease (NTD) early-warning, referral, follow-up and programme-intelligence **prototype**.

> **DEMONSTRATION ONLY.** All data is synthetic. All risk rules are demonstration placeholders, not validated clinical guidance. Login and roles are simulated and are **not** security controls. The system supports early recognition, triage, referral and programme decisions. It does not diagnose disease or prescribe medication.

Core loop: Signal → Assessment → Action → Referral → Follow-up → Intelligence → Response.

## Requirements

- Node.js 20.19 or newer (`.nvmrc` pins 22)
- npm 10 or newer

## Install and run

```bash
npm install
npm run dev          # http://localhost:5173
```

## Test and check

```bash
npm run typecheck    # TypeScript, strict
npm run lint         # ESLint (incl. accessibility rules)
npm run format:check # Prettier
npm test             # Vitest unit and component tests
npm run build        # production build to apps/web/dist
npm run check        # all of the above, in order

npx playwright install chromium   # one-off
npm run test:e2e                  # Playwright smoke tests (builds, then serves on :4173)
```

## Layout

| Path                     | Purpose                                                        |
| ------------------------ | -------------------------------------------------------------- |
| `apps/web`               | React + Vite PWA shell: routes, layouts, guards, pages, i18n   |
| `packages/design-system` | Tokens, base CSS, accessible components                        |
| `packages/domain`        | Roles, permissions, risk, referral pathway, zod entity schemas |
| `packages/rules-engine`  | Demonstration rule types (evaluator comes in Stage 2)          |
| `packages/demo-data`     | Seeded synthetic data helpers (generator comes in Stage 2/3)   |
| `packages/api-contract`  | Mock API route contract                                        |
| `e2e`                    | Playwright tests                                               |
| `prototype`              | Original single-file prototype, unchanged, reference only      |
| `docs`                   | Architecture, safety, privacy and decision records             |

## Status

| Area                                                        | Status                                      |
| ----------------------------------------------------------- | ------------------------------------------- |
| Design tokens, components (button, badge, notice, states)   | **Implemented**, unit tested                |
| Routing, layouts, role-based navigation, access-denied page | **Implemented**, unit tested                |
| Domain model: roles, risk, referral pathway, schemas        | **Implemented**, unit tested                |
| English i18n scaffold                                       | **Implemented** (English only)              |
| CHW screens (13 workflow screens)                           | **Placeholders**, Stage 2                   |
| Rules engine evaluator, mock API (MSW)                      | **Not started**, Stage 2                    |
| IndexedDB offline queue and mock sync                       | **Not started**, Stage 2                    |
| Programme dashboard pages, charts                           | **Placeholders**, Stage 3                   |
| MapLibre GIS map with fictional geography                   | **Not started**, Stage 3                    |
| Authentication                                              | **Simulated** (role picker, sessionStorage) |
| Offline operation, external integrations, deployment        | **Not implemented**                         |
| Playwright smoke tests (mobile and desktop)                 | **Passing** in the build sandbox (6 of 6)   |

## First commit

```bash
git init
git add .
git commit -m "Stage 1: foundation, design system, navigation"
```
