# Stage 5 report: Validation, decision and pilot preparation

**Scope:** decisions, validation planning and pilot preparation only. No application code, test, rule, data or Stage 1 to 4 document content was changed in order to produce this report (the README gained one pointer section). No production database, real data, deployment, live integration, real facility dataset or real geography was introduced. No clinical rule was activated. Nothing here claims legal or regulatory compliance, clinical validation, or public-health impact.

The sections answer the 14 questions in the Stage 5 brief. Detail is in the linked documents.

## 1. What is NTD-WATCH now?

A tested **prototype** of a community-level NTD early-warning, referral, follow-up and programme-intelligence workflow, running on synthetic data with demonstration rules, plus a complete architecture and governance design (Stage 4) and now a decision, validation and pilot-preparation package (Stage 5). It is not a deployed product, not a validated clinical tool, and not yet shown to add value over existing systems.

## 2. What has actually been built?

- A React/TypeScript application with a CHW workflow, referral lifecycle, follow-up, programme dashboard, map, reports and role-based views.
- Pure TypeScript packages for the domain model, rules engine and programme aggregation, usable on a server.
- An offline layer with a transactional outbox, idempotent keys, ordering and recovery.
- A mock API with a 16-route contract (14 routes implemented) and a synthetic data generator.
- **236** unit and integration tests and **36** end-to-end tests (including accessibility checks).
- Stage 4 documentation: current-state assessment, production, data, RBAC, privacy and security, offline, rule governance, interoperability and GIS architectures, pilot readiness, testing roadmap, and 25 open decisions.
- Stage 5 documentation: this report, `STAGE5_DECISION_REGISTER.md`, `TECHNICAL_RECOMMENDATIONS.md`, `CLINICAL_VALIDATION_PLAN.md`, `STAGE5_PRIVACY_READINESS.md`, `PILOT_BLUEPRINT.md`, `PILOT_GATES.md`, `STAKEHOLDER_REVIEW.md`, `INNOVATION_ASSESSMENT.md`.

The test suite was re-run at the end of this stage (see section 15).

## 3. What remains simulated?

Data (people, communities, facilities, geometry, WASH indicators, signals); the rule set `demo-placeholder` 0.1.0; authentication and scope (taken from headers, PIN unchecked); the server (a browser-hosted mock); the audit log (3 events); the map (fictional geometry near 0,0, no coordinate reference system, no basemap); the vulnerability index and its bands at 30 and 45; offline behaviour as evidence for field reliability (proven only in a desktop test environment; the app is not a PWA yet); and every figure on every dashboard. The prototype also trusts the client's risk level and lacks a facility interface, small-number suppression, a consent field and encryption on the device.

## 4. What decisions are unresolved?

All 25 (D-01 to D-25). `STAGE5_DECISION_REGISTER.md` classifies each by owner, recommended option, alternatives, dependency, consequence of not deciding, and what it blocks.

| Primary owner category       | Count | Decisions                                      |
| ---------------------------- | ----- | ---------------------------------------------- |
| Technical                    | 6     | D-02, D-03, D-04, D-13, D-14, D-20             |
| Product                      | 1     | D-16                                           |
| Clinical / public-health     | 3     | D-10, D-19, D-22                               |
| Legal / privacy              | 8     | D-01, D-07, D-08, D-11, D-12, D-17, D-18, D-21 |
| Organisational / stakeholder | 7     | D-05, D-06, D-09, D-15, D-23, D-24, D-25       |

For the technical decisions the register gives a recommended default for approval. For the others it gives only a conservative option for the owner to consider; **no clinical, legal, privacy or organisational decision has been made.**

## 5. Which decisions block real data?

Re-reading the Stage 4 documents, the blockers go beyond the seven already named.

- **Block real data (16):** D-01, D-07, D-08, D-12, D-18, D-21, D-23 (the seven identified earlier), plus D-02, D-03, D-04 (a real server, database and authentication must exist), D-09 (an approved site), D-10 (an approved rule set or an approved no-rule mode), D-11 (ethics route), D-14 (client tested on real phones), D-16 (final roles and supervisor access), D-25 (device policy).
- **Partly block (4):** D-05, D-06, D-19, D-22 need only a minimum programme-approved list of units, facilities and languages for the site, not full polygons, registry integration or the vulnerability index.
- **Default-OK (2):** D-17 and D-24 need only the conservative defaults "break-glass not enabled" and "standard suppressed reports only" to be confirmed.
- **Do not block (3):** D-13, D-15, D-20.

## 6. Which decisions block a pilot?

All that block real data, plus the full resolution of D-05, D-06 and D-22, a decision on what D-19 shows, and the operational and governance gates in `PILOT_GATES.md` Gate B. In total **19 decisions** need to be recorded (Yes), **1 partly** (D-19), **4** accept defaults (D-13, D-17, D-20, D-24), and **1** (D-15) is not needed for a pilot with no integrations. A usability pilot with synthetic data (P1) needs none of the legal or person-level decisions, only Gate A.

## 7. Which decisions can wait?

During an initial controlled pilot, with the conservative defaults confirmed and recorded: D-13 notification channels (in-app only), D-15 integrations (none), D-17 break-glass (not enabled), D-19 vulnerability index (hidden or labelled contextual), D-20 basemap (none), D-24 exports (standard reports only), polygons in D-05, additional languages in D-22 (if English suffices). They must be decided before production.

## 8. What technical work comes next?

`TECHNICAL_RECOMMENDATIONS.md` gives proposed defaults for approval: TypeScript on Node as a modular monolith with REST and OpenAPI generated from the existing Zod contract; PostgreSQL with PostGIS, schemas and row-level security; an OIDC identity provider with MFA by role; an installable PWA with encrypted IndexedDB, conditional on a real-device test; the existing outbox model plus device identity, jitter and bounded retry; a gating CI pipeline with synthetic-data-only environments; privacy-safe monitoring; encrypted backups with a restore drill; PostGIS and vector tiles with server-side clipping and no basemap for the pilot; in-app notifications only. None is implemented.

The first implementation items, once the technical decisions are approved, are those in `STAGE4_REPORT.md` section 14 phases 0 to 2: decisions and legal groundwork, a production foundation on synthetic data with CI, real authentication and the authorisation matrix tests, and offline client hardening. This is the work that follows approval of this report, and **no implementation has begun.**

## 9. What clinical/public-health validation is required?

`CLINICAL_VALIDATION_PLAN.md`: intended use first; appointment of experts including an independent reviewer; evidence selection by those experts (external research required); rule drafting or adaptation; clinical review; technical validation; independent second review; expert-written test cases and scenario agreement testing with acceptance levels set beforehand; a comprehension check with CHWs; a signed approval record; versioned release; monitoring; and periodic revalidation. It separates content validity, technical verification and performance in practice, and states that only a separately designed, ethics-approved evaluation can support any accuracy or impact claim. **A working rule engine does not make NTD-WATCH able to diagnose**; until an approved rule set exists the app runs in no-rule mode.

## 10. What privacy/legal review is required?

`STAGE5_PRIVACY_READINESS.md` lists the exact questions, grouped for counsel (10), organisational policy (9), ethics review (8), controller and processor ownership (7), consent and data collection (7), retention and deletion (7), location precision (5), person linkage (5), access control (5), exports (5) and audit (6). It distinguishes technical safeguards from legal compliance and ends with the list of answers needed before real data. A data protection impact assessment is recommended regardless of counsel's view. No compliance is claimed.

## 11. What would management need to approve?

- The problem statement and whether a separate application, or a layer on an existing platform, is the right response (INNOVATION_ASSESSMENT R1, R3).
- Named owners for every decision in the register.
- The controlled-pilot concept and the process to choose a site (D-09).
- Appointment of the clinical and public-health panel, independent reviewer and rule approval board (D-10).
- The ethics and institutional route (D-11) and engagement of counsel.
- The technical defaults in `TECHNICAL_RECOMMENDATIONS.md`, and hosting (D-01).
- The conservative pilot defaults in the register section 2.3.
- Funding, a sustainable owner, and the commitment of staff time for reviews, training and support.

## 12. What would a pilot require?

`PILOT_BLUEPRINT.md` and `PILOT_GATES.md`. Two stages: a **usability pilot** (P1) on the existing prototype with synthetic scenarios and Gate A, then a **controlled field pilot** (P2) after Gate B. Gate B requires 33 evidence items across governance and legal, clinical, technical and security, and people and operations. The principal build items are a real server, database, authentication and server-side authorisation; server-side rule evaluation with an approved rule set or approved no-rule mode; an installable PWA with encrypted local storage; a facility interface; a supervisor role; small-number suppression; full audit; backup and restore; CI; and real-device offline testing. No pilot location is selected.

## 13. What are the principal risks?

| Risk                                                           | Why it matters                                                   | Mitigation                                                             |
| -------------------------------------------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------- |
| The problem or the differentiation is not what we assume       | Could mean the wrong thing is being built, or a redundant one    | Stakeholder review and the research list R1 to R8 before further build |
| Redundancy with existing platforms                             | Wasted effort; parallel systems; extra burden on CHWs            | Evaluate an extension of an existing platform                          |
| No approved clinical rules                                     | The core decision-support feature cannot be used for real people | Validation plan; no-rule mode                                          |
| Misinterpretation of synthetic or demonstration output as real | Reputational and safety harm                                     | Labelling; no donor-facing claims; Gate A item A3                      |
| Legal position unresolved (consent, residency, regulation)     | Could force redesign                                             | Counsel review before build decisions that depend on it                |
| Disclosure from small areas or linkage                         | Harm to individuals and communities                              | D-18, D-12, D-21 before real data                                      |
| Offline behaviour fails on real phones                         | Data loss in the field                                           | Real-device test gate; D-14 fallback to a native wrapper               |
| Facilities do not adopt the interface                          | Referral loop does not close                                     | Facility agreements; interface designed with them                      |
| Decision backlog                                               | 25 open items with many owners                                   | Named owners; decision calendar; defaults                              |
| Dependency on a small team and uncertain funding               | Pilot stalls; no maintenance                                     | Sustainability plan; Gate C12                                          |
| Scope creep toward diagnosis or outbreak declaration           | Safety and regulatory exposure                                   | Boundary stated in every document; governance                          |
| Reference data unavailable or restricted                       | Delays; poor geography                                           | Early engagement with custodians                                       |

## 14. Recommended next sequence

1. **Review this package** with programme leadership and record feedback (Gate A, A1). Use `STAKEHOLDER_REVIEW.md`.
2. **Assign decision owners** for all 25 decisions and record acknowledgement.
3. **Start in parallel the work that does not depend on code:** engage counsel on `STAGE5_PRIVACY_READINESS.md`; approach the ethics body (E-1); begin identifying the clinical and public-health panel and independent reviewer; start research R1 to R8.
4. **Approve the technical defaults** (D-02, D-03, D-04, D-14 as conditional) and the conservative pilot defaults, or direct alternatives.
5. **Decide hosting and residency** (D-01) as soon as counsel has answered, since it constrains almost everything else.
6. **Run the usability pilot (P1)** on the existing prototype with scripted synthetic scenarios, to learn about workflow and wording before more build. This needs no real data.
7. **Revisit the build-or-extend question** with the research results.
8. **If the project continues:** begin the implementation phases 0 to 2 in `STAGE4_REPORT.md` section 14 on synthetic data only, with CI and real authorisation tests first.
9. **Take rules through the validation plan** in parallel; do not wait for the application.
10. **Prepare Gate B evidence** and hold a gate review. Only then choose and engage a pilot site and begin supervised real-data collection.

Implementation of production components starts only after review of this report.

## 15. Verification

- No application source, test or fixture file was modified in Stage 5.
- `npm run check` (lint, type-check, format check, unit and integration tests, build) was run after the documents were written; results are in the delivery message.
- Cross-references between documents, decision IDs D-01 to D-25 and diagram links were checked.

## 16. Index of Stage 5 outputs

| Document                       | Purpose                                                       |
| ------------------------------ | ------------------------------------------------------------- |
| `STAGE5_DECISION_REGISTER.md`  | 25 decisions classified, with blocks and defaults             |
| `TECHNICAL_RECOMMENDATIONS.md` | Proposed technical defaults                                   |
| `CLINICAL_VALIDATION_PLAN.md`  | Process from demonstration rules to validated programme logic |
| `STAGE5_PRIVACY_READINESS.md`  | Questions to answer before real data                          |
| `PILOT_BLUEPRINT.md`           | Minimum pilot: users, workflow, technology split, data        |
| `PILOT_GATES.md`               | Gate A, B, C checklists                                       |
| `STAKEHOLDER_REVIEW.md`        | Structure of the stakeholder review package                   |
| `INNOVATION_ASSESSMENT.md`     | Differentiation test and research needs                       |
| `STAGE5_REPORT.md`             | This report                                                   |

**This is the end of Stage 5. No production implementation has begun and none will until this report is reviewed.**
