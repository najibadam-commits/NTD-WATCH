# Technical recommendations and proposed defaults

**Status:** Proposed, for approval by the technical lead and programme owner. Nothing here is implemented, and nothing is chosen until recorded in `STAGE5_DECISION_REGISTER.md`. Each recommendation names its decision ID, the reasoning from the actual codebase, the alternative that would change it, and what would make us revisit it.

The principle is the same as Stage 4: keep what the tests already prove, replace what is simulated, and pick the smallest technology set the team can operate.

## 1. Summary of proposed defaults

| Area              | Proposed default                                                                                             | Decision                                   | Confidence                     |
| ----------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------ | ------------------------------ |
| Frontend / PWA    | Keep React 19 + Vite + TypeScript; add manifest, service worker, installable PWA; conditional on device test | D-14                                       | Medium                         |
| Backend           | TypeScript on Node, modular monolith, shared packages                                                        | D-03                                       | High                           |
| Database          | PostgreSQL with PostGIS, schemas and roles, row-level security                                               | D-04                                       | High                           |
| Authentication    | OIDC provider, named accounts, MFA by role                                                                   | D-02                                       | High (pattern), open (product) |
| API               | REST + OpenAPI generated from the Zod contract                                                               | D-03                                       | High                           |
| Offline storage   | IndexedDB (Dexie) with application-level encryption and device-bound key                                     | D-14                                       | Medium                         |
| Synchronisation   | Keep the outbox model; add device id, jitter, bounded retry, new states, server idempotency                  | D-14                                       | High                           |
| CI/CD             | A hosted CI pipeline gating merges; infrastructure as code; staged environments                              | none (no decision needed beyond D-01 host) | High                           |
| Monitoring        | Structured logs without personal data, metrics, tracing, alerting, uptime from the user's side               | none                                       | High                           |
| Backup / recovery | Encrypted automated backups, point-in-time recovery, restore drill before pilot                              | D-01                                       | High                           |
| GIS               | PostGIS storage in EPSG:4326, vector tiles, server-side scope clipping, no basemap in pilot                  | D-19, D-20                                 | Medium                         |
| Notifications     | In-app only for the pilot                                                                                    | D-13                                       | High                           |

"Confidence" is how likely the default survives contact with the real constraints (hosting, team, devices), not a statement of quality.

## 2. Frontend and PWA (D-14)

**Evidence in the repository.** React 19, Vite 8, TypeScript strict, TanStack Query, Zustand, react-i18next, Dexie, a design system package, a mobile and desktop Playwright suite with axe. The main chunk is about 368 kB and the map chunk about 1.06 MB, loaded only on the GIS page. There is **no** web manifest and **no** application service worker; the sync timer runs only while the CHW app is open.

**Recommendation.** Continue with the existing stack and make it an installable PWA:

1. Web manifest, icons, and a service worker that precaches the app shell and handles versioned updates without interrupting a non-empty outbox.
2. Request persistent storage and handle eviction, with a visible warning when the browser refuses.
3. Background Sync is not assumed (it is unavailable on some browsers); sync on app open, on connectivity events and on a timer, as today.
4. Keep the map chunk lazy and out of the CHW path.

**Condition.** The default stands only if the real-device test matrix in `TESTING_ROADMAP.md` tier 2 passes on the phones and browsers chosen in D-25. The failure fallback is a native wrapper around the same code, which keeps the React code and replaces storage and update handling.

**Alternatives.** Native app (higher cost, better storage guarantees); native wrapper (middle). Revisit if the target phones are old, storage is evicted, or install is not practical for CHWs.

## 3. Backend (D-03)

**Evidence.** `domain`, `rules-engine` and `programme` are pure TypeScript with no React or browser APIs; the API contract is Zod; 14 of the 16 contract routes are implemented in the mock.

**Recommendation.** TypeScript on Node as a modular monolith (modules in `PRODUCTION_ARCHITECTURE.md` section 3), importing the shared packages unchanged so rule evaluation, validation and aggregation have one implementation. No microservices; one deployable unit, one database. Strict mode, the existing lint and format rules, and the contract tests carry over.

**Why not more.** The team and pilot scale do not justify service boundaries. A monolith with module boundaries keeps the later option to split a module (for example the integration worker).

**Revisit if.** The team lacks TypeScript back-end skills, or a mandated platform requires another language.

## 4. Database (D-04)

**Recommendation.** PostgreSQL with PostGIS. Schemas and roles as `DATA_ARCHITECTURE.md` section 2. Row-level security on person-level tables so a faulty query still cannot cross scope. UUIDv7 keys with a device-generated client UUID. Hash-chained audit table with insert-only grants. Migrations versioned and tested forwards and backwards. A Postgres-backed queue (for example row-claiming with `SKIP LOCKED`) for jobs at pilot scale.

**Alternatives.** A managed PostgreSQL service, if D-01 allows one in the chosen jurisdiction; a dedicated queue only if load demands it.

**Revisit if.** Hosting rules out PostGIS, or load exceeds a single primary with replicas.

## 5. Authentication (D-02)

**Recommendation.** An OpenID Connect provider issuing short-lived access tokens and rotating refresh tokens. Named accounts only. MFA mandatory for supervisors, facility staff, officers and administrators. For CHWs a device-bound session with a limited offline period and a required online re-authentication, tuned in usability testing. Account lifecycle: invited, activated, disabled, revoked. Device registration tied to the account.

**Do not.** Build password handling in the application, share accounts, or store credentials on devices.

**Open.** Which provider and where it runs (D-01); which CHW second factor works in the field.

## 6. API architecture (D-03)

**Recommendation.** REST with JSON, versioned under `/v1`. An OpenAPI document generated from the existing Zod contract so the client and server share one source of truth. Server-side authorisation on every route using the role and scope claims plus database row-level security. Idempotency keys (the client key already exists) on every write. Cursor-based pull with a server change feed. Consistent error taxonomy mapped to the retry policy in `OFFLINE_SYNC_ARCHITECTURE.md` section 7. Rate limits and payload size limits. No endpoint returns person-level data to a programme role.

**Server must not trust the client** for risk level, CHW id, timestamps used for ordering, or stage skips (the prototype does).

## 7. Offline storage (D-14)

**Recommendation.** Keep IndexedDB through Dexie, with application-level AES-GCM encryption of record payloads using a non-extractable key bound to the device and session. Store only the signed-in CHW's records. Remove synced records after a grace period set by D-07. Sign-out with unsynced data warns and blocks until sync or a supervised choice.

**Limits.** Encryption in the browser deters casual loss and theft; it does not defeat a compromised device or origin (`PRIVACY_SECURITY_ARCHITECTURE.md` section 5). Do not claim more.

## 8. Synchronisation

**Recommendation.** Keep the transactional record plus outbox write, single-flight loop, ordering through `dependsOn`, and recovery after interruption (all tested). Add the items in `OFFLINE_SYNC_ARCHITECTURE.md`: device identity, jittered back-off with a ceiling and attempt limits that move records to a visible "needs attention" state, a paused-for-authentication state, conflict and quarantine states, partial and resumable sync, and server-side clock-skew handling. Conflict policy by data type as documented; never last-write-wins for clinical content.

## 9. CI/CD

**Evidence.** No CI today; the suite runs locally, and slow machines needed timeout changes.

**Recommendation.**

1. A hosted pipeline on every change: install with a lockfile, lint, type-check, format check, unit and integration tests, build, Playwright on a fixed runner image, accessibility checks.
2. Merge blocked on failure. Required reviews; protected main branch.
3. Secret scanning, dependency vulnerability scanning, licence check, software bill of materials.
4. A repository check that fails on any rule set file claiming `ACTIVE`, and on any real-data-looking fixture.
5. Infrastructure as code. Separate environments: development and test with **synthetic data only**, staging with synthetic data, production. Promotion by pipeline, not by hand. Database migrations in the pipeline with an approval step for production.
6. Reproducible builds with pinned versions; release tags tied to rule set versions where relevant.

**Open.** Which CI service follows D-01; none is recommended here.

## 10. Monitoring

**Recommendation.** Structured logs with a personal-data filter and tests that prove none leaks; metrics for availability, latency, error rates, queue depth, sync success and lag by device; distributed tracing optional; alerts routed to a named on-call; an external uptime check; client-side sync health reporting that carries counts, never content. Audit events are separate from operational logs. Dashboards for the pilot indicators in `PILOT_READINESS.md`. Rule performance monitoring is in `RULE_GOVERNANCE.md` section 6.

## 11. Backup and recovery

**Recommendation.** Encrypted, automated backups in a second location allowed by D-01; point-in-time recovery; backup encryption keys separated from data keys; **a timed restore drill before pilot** and after each major change; retention matching D-07; deletion requests addressed in backups by documented expiry. Recovery time and recovery point targets are set by the programme and counsel, not invented here.

## 12. GIS architecture (D-19, D-20)

**Recommendation.** As `GIS_PRODUCTION_ARCHITECTURE.md`: PostGIS in EPSG:4326, area and distance in a projected or equal-area CRS (to be confirmed by the GIS lead); versioned boundaries; vector tiles with server-side scope clipping and suppression; ward-level published geography; no basemap in the pilot; no per-assessment GPS. Import no real dataset until D-05 and D-15 are decided.

## 13. Notification architecture (D-13)

**Recommendation.** In-app reminders and lists for the pilot. No external provider. If SMS or push are added later: reference code only, no health detail, opt-in, provider contract reviewed by counsel, delivery failures visible, no reliance on a notification for safety-critical follow-up.

## 14. Rules service

Server-side evaluation of every submitted assessment under a named rule version, with the device result treated as preliminary. Rule sets are read only from the governance store, never from the application bundle (`RULE_GOVERNANCE.md` section 8). Until an approved rule set exists, run in no-rule mode.

## 15. What would change these recommendations

- A hosting decision (D-01) that rules out a managed Postgres, a particular identity provider, or a particular CI service.
- Real-device tests (D-14) that show storage eviction or install problems.
- A legal position that bars encrypted on-device storage of any person-level data, or that requires different residency for aggregates.
- A clinical decision that no rule engine is to be used (no-rule mode becomes permanent).
- Team skills.

## 16. What is not recommended now

Microservices, event streaming platforms, graph or document databases, real-time websockets for the CHW flow, machine-learning models for risk, public cloud-specific lock-in features, and any third-party analytics in the CHW app. None is needed for the pilot, and each adds privacy or operational risk.
