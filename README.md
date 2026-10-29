# NTD-WATCH

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![DPG Standard: self-assessed](https://img.shields.io/badge/DPG_Standard-self--assessed-lightgrey.svg)](#digital-public-good-self-assessment)
[![SDG 3: Good Health and Well-being](https://img.shields.io/badge/SDG_3-Good_Health_%26_Well--being-4C9F38.svg)](https://sdgs.un.org/goals/goal3)
[![TypeScript, Node 20.19+](https://img.shields.io/badge/TypeScript-Node_%E2%89%A5_20.19-3178C6.svg)](#quick-start)

> **DEMONSTRATION ONLY.** All data is synthetic. All risk rules are demonstration placeholders, **not clinically validated**. Sign-in, roles and permissions are simulated and are **not** security controls. The API is a mock running in the browser. Offline capture and synchronisation are prototype functionality, **not production-ready offline operation**. The system supports early recognition, triage, referral and programme decisions. It does not diagnose disease or prescribe medication.

## Executive summary

NTD-WATCH is an open-source prototype of a community-to-action layer for neglected tropical disease (NTD) programmes in resource-constrained settings. It explores how community health workers (CHWs) can record a short, consented assessment on a phone, receive an explainable, non-diagnostic signal and a referral suggestion, and how that information can reach facilities and programme teams as aggregate risk and priority views.

What it is today: a React and TypeScript web app with a rules-based demonstration rule set, a simulated closed referral loop, programme dashboards with a fictional map, and an offline-capable browser store, all running against a mock API and synthetic data. What it is not: a deployed surveillance system, a diagnostic tool, a validated risk model, or a system approved for real data. It contains **no machine learning**; every signal comes from readable, documented rules (`docs/RULES.md`).

Core loop: Signal → Assessment → Action → Referral → Follow-up → Intelligence → Response.

## Architecture flow

```
Field input                    Rules and aggregation                    Output
-----------------------------  ---------------------------------------  --------------------------------
CHW assessment (consent first) -> Rules engine (documented rules,    ->  Non-diagnostic signal and
saved on the device first         no ML) and referral pathway            referral suggestion for the CHW
        |                                                                          |
Offline outbox (IndexedDB)     -> Mock API (in the browser)          ->  Facility inbox and outcomes
synchronises when online          stands in for a future backend             (simulated closed loop)
                                       |
                                       v
                               Programme aggregation with small-count ->  Priority communities, GIS map
                               display rule and data-confidence cues      (fictional geography), CSV/JSON
                                                                          exports labelled synthetic
```

The prototype does not yet ingest real spatial or clinical data. The map uses fictional GeoJSON and has no base map.

## Clinical and epidemiological scope

- **Diseases:** the prototype is NTD-themed but deliberately **disease-agnostic**. It produces a signal category, not a condition name. User-facing text must not name schistosomiasis, lymphatic filariasis, onchocerciasis, trachoma, soil-transmitted helminths or any other condition or treatment, and automated tests fail if it does (`apps/web/src/safety.test.ts`). The disease-specific content, case definitions and thresholds that a real programme needs are **not implemented** and require clinical and programme sign-off (`docs/CLINICAL_VALIDATION_PLAN.md`).
- **Not in scope:** diagnosis, medication advice, outbreak declaration, and any claim of prevalence or severity. Priority is not prevalence.

### Women and girls: gender-sensitive module (FGS)

The prototype includes a women-and-girls assessment flow built around female genital schistosomiasis (FGS) as a use case, described in `docs/FGS_PROTOTYPE.md`. Consent comes before any question, the CHW sees a signal category rather than a condition, and the referral step considers women's access needs using invented facility capabilities. Programme views carry a women-and-girls aggregate with small-count suppression. The wording is a placeholder awaiting clinical and safeguarding review.

Gender-disaggregated tracking beyond this module, and any screening for maternal anaemia linked to chronic parasitic infection, are **not implemented**; they are listed for future work in `ROADMAP.md`.

## Quick start

Requirements: Node.js 20.19 or newer (`.nvmrc` pins 22) and npm 10 or newer. There is no Python in this repository.

```bash
git clone https://github.com/najibadam-commits/NTD-WATCH.git
cd NTD-WATCH
npm install
npm run dev          # http://localhost:5173 (Vite picks the next free port if it is busy)
```

Open the app and choose **Open the CHW app** (any 4-digit demo PIN) or one of the programme roles. **Reset demo** in the banner returns everything to the synthetic seed.

For a production-style build served on port 4173, use `npm run demo`.

On Windows PowerShell, if scripts are blocked ("running scripts is disabled on this system"), either run `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned` once, use Command Prompt, or call `npm.cmd` and `npx.cmd`. Older PowerShell does not support `&&`; run commands one per line.

### Docker

```bash
docker compose up --build        # http://localhost:8080
docker compose ps                # shows the health status
```

The image builds the app with Node, then serves the static files with nginx as an unprivileged user (`appuser`) on port 8080. It runs the same demonstration prototype: synthetic data, mock API in the browser, no server-side data. The Docker files have not yet been built or run in an environment with registry access; treat them as untested until a CI build confirms them.

## Offline and low-connectivity capability (prototype)

CHW assessments, referrals and follow-ups are written to an on-device IndexedDB store first, together with an outbox of changes. When connectivity returns, the outbox is sent oldest first with retries and idempotent keys. The only service worker in the code hosts the mock API; there is no web app manifest and no app-shell caching yet, so the app is not installable and must be loaded while online. A "simulate offline" switch supports demonstrations. This is **prototype functionality**: it has not been tested on real phones, in real field conditions, or against a real server, and there is no on-device encryption yet. See `docs/OFFLINE_AND_MOCK_API.md` and `docs/OFFLINE_SYNC_ARCHITECTURE.md`.

## Data privacy and anonymisation

- **Synthetic data only.** Do not enter real patient or community information.
- Person-level schemas reject name, phone, address and national ID fields (tested), and cases use a pseudonymous code derived from a random key.
- Records are **retained**, not discarded: they are stored in the browser's IndexedDB and in the mock server's IndexedDB until deleted or reset. Deletion is simulated and does not model backups, logs, replicas or exports. This project therefore does **not** claim zero retention of personal data.
- Programme views show aggregates and apply a small-count display rule (counts of 1 to 4 appear as "n/s"). It is a client-side display measure, **not a security control**, and some inference routes remain open (`docs/SMALL_COUNT_POLICY.md`).
- There has been no independent privacy review, and no claim of compliance with the Nigeria Data Protection Act or any other law is made. Real data requires that review first (`docs/STAGE5_PRIVACY_READINESS.md`, `docs/PRIVACY_AND_ACCESS.md`).

## Digital Public Good self-assessment

This is the project's own reading of the DPG Standard indicators as we understand them. It is **not** a DPGA assessment, the project is **not** a recognised digital public good, and the current standard at digitalpublicgoods.net should be checked. Gaps are open work in `ROADMAP.md` (Q4).

| Indicator                               | Self-assessed state                                                                                                       |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| 1. Relevance to the SDGs                | Aligned with SDG 3 (health); no outcome or impact evidence exists                                                         |
| 2. Open licensing                       | Met: Apache License 2.0 (`LICENSE`)                                                                                       |
| 3. Clear ownership                      | Partial: copyright is "NTD-WATCH Contributors"; governance and ownership statements are still to be written               |
| 4. Platform independence                | Likely met: open-source web stack, no proprietary dependency known; no dependency licence audit has been done             |
| 5. Documentation                        | Partial: extensive design documents; no end-user or deployment guide for a real service                                   |
| 6. Mechanism for extracting data        | Partial: CSV and JSON exports of synthetic aggregates; no real-data export or open data standard yet                      |
| 7. Adherence to privacy and laws        | Not met: no privacy review, no real data, no legal compliance assessment                                                  |
| 8. Adherence to standards and practices | Partial: automated accessibility scans and tests; no manual accessibility testing; no DHIS2 or other standard integration |
| 9. Do no harm by design                 | Partial: safety scope and disclosure rules documented and tested; no independent review                                   |

## Governance

[LICENSE](LICENSE) (Apache 2.0) · [CONTRIBUTING.md](CONTRIBUTING.md) · [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) · [SECURITY.md](SECURITY.md) · [ROADMAP.md](ROADMAP.md)

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

| Area                                                                                       | State                                                                                                 |
| ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| Design tokens and components, routing, role-based navigation, access-denied page           | **Implemented**, unit tested                                                                          |
| Domain model, demonstration rules engine, CHW app (16 screens), offline queue, mock API    | **Implemented / prototype** (Stage 2), regression tested                                              |
| Fictional hierarchy: 2 states, 5 LGAs, 10 wards, 15 communities, 9 facilities, 11 CHWs     | **Implemented**, synthetic, labelled "Demo"                                                           |
| Synthetic seed: about 650 assessments, 75 referrals, 42 follow-ups over 12 weeks           | **Implemented**, deterministic, consistency-checked                                                   |
| Programme overview, risk signals, vulnerability, referral monitoring, trends, reports      | **Implemented**, computed from the records, filters shared by every page                              |
| MapLibre GIS map on fictional GeoJSON; separate signal and vulnerability layers            | **Implemented**, table fallback when WebGL is missing                                                 |
| Community details on select (aggregate only)                                               | **Implemented**                                                                                       |
| User management and settings (Super Administrator)                                         | **Simulated**, stored in the mock server only, with a simulated audit log                             |
| Exports (CSV and JSON) labelled synthetic in file name, header, footer and every row       | **Implemented**                                                                                       |
| Referral ids: UUID-based, legacy format still accepted                                     | **Implemented**; production ids need backend design                                                   |
| Sign-in, roles, scope, API permission checks                                               | **Simulated**, not security controls                                                                  |
| Small-cell suppression, formal statistical methods, validated risk or vulnerability scores | **Prototype pattern only** (FGS aggregate block); formal methods and validated scores not implemented |
| Languages other than English                                                               | **Not implemented**                                                                                   |
| Real backend, authentication, DHIS2 or other integrations, deployment                      | **Not implemented, not approved**                                                                     |
| Offline in a real field setting; manual screen-reader and real-phone testing               | **Untested**                                                                                          |

See `docs/` for details: `FGS_PROTOTYPE.md` (women-and-girls module), `RULES.md`, `OFFLINE_AND_MOCK_API.md`, `PRIVACY_AND_ACCESS.md`, `SAFETY_AND_SCOPE.md`, `ARCHITECTURE.md`, `DECISIONS.md`.

## Programme dashboard (Stage 3)

Choose a programme role on the landing page. The Super Administrator sees every page. Programme views
read **aggregates only** from the mock API. Records you enter in the CHW app appear there after they
sync (open the programme view in another tab, or press Refresh). **Settings → Reset demonstration data**
returns everything to the synthetic seed.

Everything is synthetic: the places, people, boundaries and numbers. The map has no base map and does
not represent any real geography. Risk results are demonstration rules, not clinically validated.

## Pilot readiness and production architecture (Stage 4)

Stage 4 is documentation only. No application code changed, no real data or live system is used, and
nothing in it is approved or validated. Start with `docs/STAGE4_REPORT.md`, then:
`STAGE4_CURRENT_STATE.md`, `PRODUCTION_ARCHITECTURE.md`, `DATA_ARCHITECTURE.md`, `PRODUCTION_RBAC.md`,
`PRIVACY_SECURITY_ARCHITECTURE.md`, `OFFLINE_SYNC_ARCHITECTURE.md`, `RULE_GOVERNANCE.md`,
`INTEROPERABILITY.md`, `GIS_PRODUCTION_ARCHITECTURE.md`, `PILOT_READINESS.md`, `TESTING_ROADMAP.md`
and the decision register `STAGE4_DECISIONS.md` (25 open decisions). Diagrams are in `docs/diagrams/`.

## Decision, validation and pilot preparation (Stage 5)

Stage 5 is also documentation only: nothing is implemented, deployed or approved. Start with
`docs/STAGE5_REPORT.md`, then `STAGE5_DECISION_REGISTER.md`, `TECHNICAL_RECOMMENDATIONS.md`,
`CLINICAL_VALIDATION_PLAN.md`, `STAGE5_PRIVACY_READINESS.md`, `PILOT_BLUEPRINT.md`, `PILOT_GATES.md`,
`STAKEHOLDER_REVIEW.md` and `INNOVATION_ASSESSMENT.md`.

## Demo-ready MVP (Stage 7)

Stage 7 joins the earlier work into one demonstrable story: CHW assessment, explainable signal,
referral, facility inbox and outcome, CHW follow-up, then programme priority communities. It adds
a facility experience, a signal-by-vulnerability priority view, a one-click **Reset demo**, a rule
governance table and a REAL / SIMULATED / FUTURE register. Still a prototype with synthetic data
and simulated roles. Start with `docs/stage7/DEMO_SETUP_GUIDE.md`, then `DEMO_SCRIPT.md`.
Run it with `npm install` then `npm run dev` (or `npm run demo`).

## Validation and stakeholder review (Stage 6)

Stage 6 is a validation-planning stage, updated with a Nigeria-first evidence-integration pass. It
collects no stakeholder evidence yet, changes no application code, and makes no claim of validity,
impact, compliance or uniqueness. NTD-WATCH is tested only as a possible interoperable
community-to-action layer that complements existing systems (CIMS-NTDs, WHO tools, DHIS2, DHIS2
Community Health, WASHIMS), not as a standalone surveillance or diagnostic platform. The possible
outcomes are PROCEED, MODIFY, INTEGRATE, STOP or INCONCLUSIVE; the criteria are locked and the outcome is open.
Start with `docs/stage6/STAGE6_VALIDATION_PLAN.md`; the other plans, the stakeholder session pack, the
evidence and decision registers, the ecosystem capability matrix and the report are in the same folder. No interview or session may be
held until the ethics determination is recorded.
