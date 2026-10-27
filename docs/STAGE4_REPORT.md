# Stage 4 completion report: Pilot readiness and production architecture

**Scope:** documentation and architecture only. No application code, rule, test or Stage 1 to 3 commit was changed. No real data, production service, live integration or pilot location was introduced. Nothing here claims legal compliance, clinical validity, or readiness for real data.

Status labels used throughout: **Implemented** (exists and tested), **Simulated** (behaves like it, but is not real), **Proposed** (a design), **Requires legal review**.

The sections below follow the 18 points requested. Detail lives in the linked documents.

## 1. Current-state assessment

Full detail: `STAGE4_CURRENT_STATE.md`.

What is genuinely there: a typed domain model, a data-driven and deterministic rules engine, an offline-first CHW workflow with a transactional outbox, a referral lifecycle, a programme-intelligence layer (signals, vulnerability index, referral monitoring) with scope clamping, a mock API with a 16-route contract (14 implemented), a synthetic-data generator, an accessible responsive interface, and 236 unit and integration tests plus 36 end-to-end tests.

What is simulated: authentication (role from a header, PIN unchecked), scope (a header), the server (a browser mock), the audit log (3 events), the map geometry (fictional, near 0,0), and rule validation (a self-asserted block of text).

Gaps that shaped the design: not a PWA (no manifest, no service worker); risk level and CHW id trusted from the client; `rules:manage` on the administrator; no facility interface; no consent, person-link, version, or device fields; unencrypted on-device store; no small-cell suppression; no CI; no ward level; one polygon per community assumed.

## 2. Target architecture

Full detail: `PRODUCTION_ARCHITECTURE.md`, diagram A.

A modular monolith with 12 modules, a single PostgreSQL/PostGIS database split into schemas (`ops`, `prog`, `ref`, `rules`, `iam`, `sync`, `audit`) with separate database roles, an OIDC identity provider, a Postgres-backed job queue, an installable offline-first client, and an integration module that is the only outward connection. The pure-TypeScript packages (`domain`, `rules-engine`, `programme`) move to the server unchanged. Reference technology is an assumption, not a decision (D-01 to D-04).

## 3. Data architecture

Full detail: `DATA_ARCHITECTURE.md`, diagram B.

Person-level operational data (`ops`) and aggregate programme intelligence (`prog`) are separated by schema, role and data flow; only suppressed aggregates cross. UUIDv7 keys with a device-generated client UUID; `row_version`, soft deletion and a hash-chained audit log; reference data versioned. A prototype-to-production field map is provided. The person-linkage question has three options (A none, B pseudonymous, C identifiers under separate encryption) and is **not** decided (D-12). Retention periods are not proposed (D-07).

## 4. RBAC architecture

Full detail: `PRODUCTION_RBAC.md`.

Seven roles: the five prototype roles plus a CHW Supervisor and a Project Administrator, with the prototype administrator split. Enforcement on the server and in the database (row-level security), not in the interface. The Super Administrator has no standing access to person-level data; access to it is by controlled break-glass only if D-17 allows. Separation of duties, approval rules and an audit event list are specified. Role additions are a decision (D-16).

## 5. Privacy and security architecture

Full detail: `PRIVACY_SECURITY_ARCHITECTURE.md`.

A threat table tied to the real prototype weaknesses; encryption in transit and at rest; honest limits of on-device protection (a deterrent, not a guarantee); session, token and device-loss procedures; export, rate and abuse controls; and 15 legal and ethics questions for counsel. Legal items are questions, not conclusions.

## 6. Offline and sync architecture

Full detail: `OFFLINE_SYNC_ARCHITECTURE.md`, diagram C.

Carries forward what the tests prove (atomic write plus outbox, single-flight, ordering, recovery, duplicate protection) and adds what they do not: device identity, jittered and bounded retry, new queue states (paused for authentication, conflict, needs attention, quarantined), partial sync, clock-skew handling, a conflict policy by data type (never last-write-wins for clinical content), and device replacement. The prototype is not a PWA; proving offline behaviour on real devices is a gate (D-14).

## 7. Rules governance model

Full detail: `RULE_GOVERNANCE.md`, diagram D.

Proposal, clinical and public-health review, technical validation, independent second review, approval by a board, signed immutable release, monitoring, and periodic review. Required metadata on every version; clinical validation recorded separately from technical validation; emergency suspension; rollback; and controls so that editing a file cannot activate a rule. The demonstration rule set stays demonstration-only.

## 8. GIS architecture

Full detail: `GIS_PRODUCTION_ARCHITECTURE.md`.

Hierarchy state, LGA, ward, community, facility; the community unit is an open problem with three options (D-19). EPSG:4326 storage with a projected or equal-area CRS for measurement (to be confirmed by the GIS lead). Versioned boundaries with a succession table; facility verification states; ownership and update process; seven future layers; server-side scope clipping and vector tiles; no per-assessment GPS by default. No real dataset is imported.

## 9. Interoperability architecture

Full detail: `INTEROPERABILITY.md`.

Per-integration specifications (purpose, data, direction, frequency, identifier strategy, authentication, ownership, privacy, dependency) for DHIS2, NTD programme systems, facility registries, WASH datasets and administrative boundaries, plus a template for other systems. Aggregate outbound only; inbound reference first. Candidate sources are unconfirmed. No live connection.

## 10. Pilot design

Full detail: `PILOT_READINESS.md`.

Users, an eight-step workflow, 13 indicators with exact definitions and sources, and readiness gates covering governance, clinical content, technical, data and GIS, people, and stop conditions. Numeric values are marked "proposed pilot targets". No pilot location is chosen (D-09). The facility interface is a gap that must be closed before the referral loop can be piloted.

## 11. Testing roadmap

Full detail: `TESTING_ROADMAP.md`.

Tier 1 (implemented): 236 + 36 tests, with an explicit list of what they do not cover. Tier 2 (before pilot): CI, a generated authorisation matrix, server-side trust tests, real-device offline testing, failure injection, privacy and disclosure tests, penetration testing, restore drill, load tests, accessibility and usability with real users. Tier 3 (before production scale): pilot evidence, clinical validation, resilience, recurring assurance, operational maturity.

## 12. Decisions requiring stakeholder approval

Full detail: `STAGE4_DECISIONS.md`. Twenty-five decisions, none made. Those that most constrain the next step:

- **Before any real data:** D-01 hosting and residency; D-07 retention; D-08 consent or notice; D-12 person linkage; D-18 suppression rule; D-21 location precision; D-23 ownership.
- **Before the pilot build:** D-02, D-03, D-04 technology; D-05 boundaries; D-06 facility directory; D-14 client delivery; D-16 roles; D-19 community unit; D-20 basemap.
- **Before the pilot:** D-09 geography; D-10 rule board; D-11 evaluation and ethics; D-13 notifications; D-15 integrations; D-17 break-glass; D-22 languages; D-24 exports; D-25 devices.

## 13. Risks and dependencies

| Risk or dependency                                                                           | Effect                                                                                     | Mitigation or owner                                                 |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| Legal position on health data, consent, residency, transfer and device regulation is unknown | Could change hosting, data model, consent flow, and whether rules are a regulated function | Counsel review of the 15 questions; D-01, D-08, D-10                |
| No approved clinical rules                                                                   | The referral decision support cannot be used for real people                               | Rule governance process; clinical reviewers (D-10)                  |
| No standard community geography                                                              | Maps and aggregates may be wrong or disclosive                                             | D-19; ward-level published maps                                     |
| Offline behaviour unproven on real phones                                                    | Data loss in the field                                                                     | Real-device test gate; D-14                                         |
| Facilities may not adopt or confirm                                                          | Referrals never close                                                                      | Facility interface; agreements; D-06                                |
| Reference datasets unavailable, outdated, or restricted                                      | Delays; poor data                                                                          | Early engagement; D-05, D-15                                        |
| Small-area disclosure                                                                        | Re-identification                                                                          | D-18 before real data                                               |
| Single-team dependency and funding                                                           | Maintenance risk                                                                           | Sustainability plan before scale                                    |
| Prototype synthetic results taken as evidence                                                | Misleading donors or partners                                                              | Demonstration labelling; no donor-facing claims from synthetic data |
| Connectivity, power and device limits                                                        | Low sync success                                                                           | Measured in the readiness phase; D-25                               |
| Scope creep into clinical decisions or outbreak declaration                                  | Safety and legal exposure                                                                  | Humans decide; rule governance; labelling                           |

## 14. Recommended implementation phases

A proposal for the order of work after approval. Phase boundaries are gates, not dates; no durations are proposed.

| Phase | Name                                       | Scope                                                                                                                                                                                                                              | Exit gate                                                                                  |
| ----- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| 0     | Decisions and legal groundwork             | Stakeholder review of this report; record D-01, D-07, D-08, D-12, D-18, D-23 and the technology decisions; legal review begins; owners named                                                                                       | Decisions recorded; legal position received; a named data owner                            |
| 1     | Production foundation, synthetic data only | Repository CI; server skeleton using the shared packages; PostgreSQL/PostGIS with the schemas; identity provider; real authentication and the generated authorisation matrix; server-side risk evaluation; audit log; environments | Tier 2 "CI, authentication, authorisation, server-side trust" tests pass on synthetic data |
| 2     | Offline client hardening                   | Installable PWA; device identity; encrypted local store; improved retry and states; conflict handling; real-device test matrix                                                                                                     | Real-device matrix passes; D-14 resolved                                                   |
| 3     | Reference data and GIS                     | Governed import of boundaries, facilities and indicators; versioning; verification workflow; vector tiles with scope clipping; suppression                                                                                         | Reference data signed off by owners; suppression tested for disclosure                     |
| 4     | Facility loop and programme tools          | Facility interface; supervisor role; reminders; reports with suppression; export approval workflow                                                                                                                                 | End-to-end referral loop works across roles on synthetic data                              |
| 5     | Rule governance in operation               | Governance tool, approvals, signed releases, monitoring; a first rule set taken through the process by clinical reviewers                                                                                                          | A rule set approved by the board, independent of developers                                |
| 6     | Assurance and readiness                    | Penetration test, restore drill, load test, accessibility and usability work, training and runbooks, ethics approval, data sharing agreements, readiness review                                                                    | All `PILOT_READINESS.md` gates met and recorded                                            |
| 7     | Supervised pilot                           | As in `PILOT_READINESS.md` section 6                                                                                                                                                                                               | Pilot review                                                                               |
| 8     | Scale preparation                          | Items in section 18                                                                                                                                                                                                                | Written go decision                                                                        |

Real data enters only after Phase 6's readiness review. Interoperability outbound feeds (DHIS2, programme systems) follow Phase 4 and need their own agreements. Phase 5 can start earlier because it depends on people more than code.

## 15. What remains demonstration-only

- All data (people, communities, facilities, geometry, WASH indicators, signals, trends, counts).
- The rule set `demo-placeholder` 0.1.0 and its levels, thresholds and reasons.
- Authentication, PIN, roles from headers, scope headers, the browser-hosted mock server.
- The vulnerability index and its bands at 30 and 45.
- The map: fictional geometry near (0,0), no CRS, no basemap.
- The reports and exports as shown.
- The audit log (3 events).
- The offline behaviour as evidence for field reliability (desktop test environment only).
- Any claim about disease burden, accuracy, or impact.

## 16. Required before real data

1. Decisions D-01, D-07, D-08, D-12, D-18, D-21, D-23 recorded and legal review done, with a written position and no unresolved high-risk items.
2. A production environment with server-side authentication and authorisation, row-level security, encryption at rest and in transit, audit, and tested backups.
3. Server-side risk evaluation under an approved rule set, or a clearly approved no-rule mode.
4. Small-number suppression implemented and tested for disclosure.
5. A data protection impact assessment signed off, ethics route followed, and agreements in place.
6. Incident, device-loss and breach procedures written and exercised.
7. Development and test environments confirmed free of real data.

## 17. Required before pilot

All of section 16, plus every gate in `PILOT_READINESS.md` section 5: an approved rule set; reviewed language content; confirmed facilities and a facility interface; real-device offline testing; penetration test and fixes; restore drill; load test; training and support; device plan; stop conditions; and decisions D-09, D-10, D-11, D-13, D-15, D-16, D-17, D-19, D-20, D-22, D-24, D-25.

## 18. Required before production scale

All of section 17, plus the Tier 3 items in `TESTING_ROADMAP.md`: pilot evidence reviewed and a written go decision; clinical validation appropriate to the claimed use and a confirmed regulatory position; scale and soak testing; disaster recovery rehearsed; recurring independent security assurance; compliance activities determined by the legal review; a field-suitable support model; per-jurisdiction reference data and rule governance; production monitoring of rule performance and equity; sustainability, ownership and funding; production-grade connectors.

## Index of Stage 4 outputs

| Document                           | Purpose                                   |
| ---------------------------------- | ----------------------------------------- |
| `STAGE4_CURRENT_STATE.md`          | What exists, what is simulated, gaps      |
| `PRODUCTION_ARCHITECTURE.md`       | Target architecture (diagram A)           |
| `DATA_ARCHITECTURE.md`             | Data model and flows (diagram B)          |
| `PRODUCTION_RBAC.md`               | Roles, capabilities, Super Admin controls |
| `PRIVACY_SECURITY_ARCHITECTURE.md` | Privacy, security, legal questions        |
| `OFFLINE_SYNC_ARCHITECTURE.md`     | Offline and sync (diagram C)              |
| `RULE_GOVERNANCE.md`               | Rule lifecycle (diagram D)                |
| `INTEROPERABILITY.md`              | Integration designs                       |
| `GIS_PRODUCTION_ARCHITECTURE.md`   | GIS design                                |
| `PILOT_READINESS.md`               | Pilot design and gates                    |
| `TESTING_ROADMAP.md`               | Three-tier testing roadmap                |
| `STAGE4_DECISIONS.md`              | 25 decisions                              |
| `diagrams/`                        | Sources and rendered diagrams A to E      |

**This is the end of Stage 4. Stage 5 has not been started and will not be started without review and instruction.**
