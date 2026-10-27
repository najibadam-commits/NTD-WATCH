# Testing and security-quality roadmap (proposed)

**Status:** Tier 1 is Implemented and measured. Tiers 2 and 3 are Proposed. A passing Tier 1 suite shows the prototype behaves as designed on synthetic data. It does not show the system is safe for real data, and the report must never be read that way.

## Tier 1. Current prototype tests (Implemented)

Measured on the repository as of Stage 3 (no code changed in Stage 4).

| Layer                | What exists                                                                                                                                                                                                                         | Count               |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| Unit and integration | Vitest (jsdom, fake-indexeddb, MSW) across `domain` 31, `rules-engine` 35, `programme` 38, `demo-data` 14, `api-contract` 3, `design-system` 15, i18n 4, navigation 3, offline 26, mock API 20, workflow 10, app 9, programme UI 28 | 236 tests, 17 files |
| End to end           | Playwright, 18 specs, each on mobile and desktop viewports                                                                                                                                                                          | 36 tests            |
| Accessibility        | axe checks within the Playwright suite on the main pages                                                                                                                                                                            | Included above      |
| Static               | TypeScript strict (`noUncheckedIndexedAccess`), ESLint 9, Prettier                                                                                                                                                                  | In `npm run check`  |
| Doc-versus-data      | `docs/RULES.md` tested against the rule data                                                                                                                                                                                        | Included above      |
| Offline              | Atomic write + outbox, single-flight, ordering, back-off, interrupted-sync recovery, duplicate prevention, forward-only merge                                                                                                       | Included above      |

**What this does not cover** (so it does not give false assurance):

- The mock server runs the same code paths in tests. It is not a deployed service and has no real authentication. Role and scope come from request headers.
- Offline behaviour is proven in a test environment with a fake IndexedDB, not on real phones, browsers or under OS storage eviction. There is no service worker.
- No security test, load test, penetration test, backup test, or accessibility audit by a person.
- No CI pipeline runs the suite automatically. The suite runs locally.
- Slow machines needed timeout adjustments; a single Windows run of the suite exhibited them.
- Rule tests prove the evaluator is deterministic for the demonstration rules, not that any rule is clinically right.

## Tier 2. Required before any pilot with real users

Everything here is a gate in `PILOT_READINESS.md` section 5. "Pass" criteria are set by the security lead, clinical lead and programme owner; none is invented here.

| Area                            | Required test or control                                                                                                                                                                                           | Why                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------- |
| CI                              | Pipeline that runs lint, types, unit, integration and e2e on every change, blocks merge on failure, stores results, and fails on an `ACTIVE` rule file                                                             | No automated gate exists today                      |
| Authentication                  | Tests for MFA, session expiry, token rotation and revocation, lockout, account disable, offline re-authentication limits                                                                                           | Prototype PIN is unchecked                          |
| Authorisation                   | A generated matrix test: every role x every endpoint x in-scope / out-of-scope / no scope, expecting allow or deny. Row-level security tests that go around the application layer                                  | The strongest control against data leakage          |
| Insecure direct reference       | Try every identifier from another scope; confirm 403 or 404 identically, with no information leak                                                                                                                  | Common failure                                      |
| Server-side trust               | Tampered `riskLevel`, `chwId`, timestamps, ids and stages are ignored or rejected                                                                                                                                  | The prototype trusts the client                     |
| Input validation                | Contract tests from the shared Zod/OpenAPI schemas; fuzzing of the sync and write endpoints; size and rate limits                                                                                                  | Abuse and malformed data                            |
| Rule engine                     | Clinically authored expected-result cases, version comparison reports, device versus server equivalence on the same cases, expiry and suspension behaviour                                                         | `RULE_GOVERNANCE.md` section 4                      |
| Offline and sync on devices     | Real-device matrix for the chosen phones: install, days offline, kill and restart, low storage, OS eviction, clock change, app update with a non-empty queue, sign-out with unsynced data, two devices for one CHW | Prototype evidence is desktop-only (D-14)           |
| Sync failure injection          | Server errors, timeouts, partial batches, duplicate delivery, out-of-order arrival, parent missing, conflict, token expiry mid-sync; checks that no record is lost or doubled                                      | `OFFLINE_SYNC_ARCHITECTURE.md` section 15           |
| Conflict handling               | Cases for each data type in the conflict policy, including referral stage inference and assessment correction by `baseVersion`                                                                                     | Policy is a design only                             |
| Privacy                         | Verify no personal data in logs, error reports, URLs, analytics, push or SMS; suppression applied on all aggregate paths and exports; encryption verified at rest and on device                                    | Core obligations                                    |
| Small-number disclosure         | Differencing tests across filters and periods to see whether suppressed cells can be recovered                                                                                                                     | A common weakness                                   |
| Audit                           | Every event in `PRODUCTION_RBAC.md` section 7 produces a record; the chain verifies; no role can edit or delete                                                                                                    | Only 3 events audited today                         |
| Secrets and dependencies        | Secret scanning, dependency vulnerability scanning, software bill of materials, licence check, pinned versions                                                                                                     | Supply chain                                        |
| Static and dynamic security     | Static analysis on every change; dynamic scan of staging; headers, CORS, CSP, cookies                                                                                                                              | Web basics                                          |
| Penetration test                | Independent test of staging with production-like configuration; remediation of high and critical findings before pilot; retest                                                                                     | Independent assurance                               |
| Backup and restore              | A timed restore drill into an empty environment, with data integrity checked                                                                                                                                       | A backup that has not been restored is not a backup |
| Performance and load            | Realistic load for the pilot's users with margin; sync burst after a connectivity gap; slow-network profiles on target phones; map render budget                                                                   | Field networks                                      |
| Availability                    | Monitoring, alert routing, an incident exercise, a rollback exercise                                                                                                                                               | `PILOT_READINESS.md` indicator 7                    |
| Data migration                  | Schema migrations tested forwards and backwards on a copy; reference data import validation                                                                                                                        | Data safety                                         |
| GIS                             | Boundary import validation, point-in-polygon, succession mapping, tile scope clipping, suppression at tile level, CRS declared on every dataset                                                                    | `GIS_PRODUCTION_ARCHITECTURE.md` section 10         |
| Accessibility                   | Automated axe plus manual keyboard and screen reader review on production builds, in the pilot languages                                                                                                           | Automation finds only part of the problems          |
| Usability                       | Task-based sessions with real CHWs, supervisors and facility staff in realistic conditions; low literacy and low light; time on task                                                                               | Field usability                                     |
| Localisation                    | Reviewed translations; text expansion; right-to-left only if a language needs it                                                                                                                                   | D-22                                                |
| Interoperability                | Contract tests against recorded fixtures or sandboxes for any enabled connector; idempotent re-send tests                                                                                                          | No live system is used for tests                    |
| Incident and device-loss drills | Run the lost device, suspected breach and safety-incident runbooks                                                                                                                                                 | Procedures must be exercised                        |
| Documentation as tests          | Generated rule documents, API documentation checked against the schema                                                                                                                                             | Drift prevention                                    |

## Tier 3. Required before production scale

| Area                        | Required                                                                                                                                                                  |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pilot evidence              | Pilot indicators and safety reports reviewed; defects closed; usability and data quality acceptable to the programme; written go decision (`STAGE4_REPORT.md` section 18) |
| Clinical validation         | An evaluation of the rule set's performance appropriate to its claimed use, designed with experts and ethics (D-11); regulatory position confirmed                        |
| Scale and soak              | Load and soak at target scale, including growth in assessments, devices and map data; capacity plan; cost model                                                           |
| Resilience                  | Multi-zone design where required; disaster recovery plan with recovery time and recovery point set and rehearsed; chaos-style tests for dependencies                      |
| Security assurance          | Recurring independent penetration tests; bug-report channel; periodic access reviews; key rotation exercised; third-party risk reviews                                    |
| Compliance activities       | Audits required by the legal position (D-23, `PRIVACY_SECURITY_ARCHITECTURE.md` section 13); records of processing; subject-rights procedures tested                      |
| Operational maturity        | 24 hour support model suitable for the field; runbooks; on-call; change management; release trains; versioned API with deprecation policy                                 |
| Multi-region or multi-state | Reference data and rule governance per jurisdiction; tenancy and scope tests across states; data localisation tests                                                       |
| Monitoring in production    | Rule performance and equity monitoring running; alert thresholds tuned from pilot data; dashboards used by owners                                                         |
| Training and sustainability | Train-the-trainer; maintenance ownership and funding; exit and handover plan for the system and the data                                                                  |
| Interoperability            | Production-grade connectors with reconciliation and monitoring, agreements in place                                                                                       |

## How the tiers relate to the code

No code is added in Stage 4. The test files in Tier 1 stay untouched. Tier 2 starts as a backlog for the first implementation phase (`STAGE4_REPORT.md` section 14): CI and the authorisation matrix are the first two items because they protect everything built afterwards.
