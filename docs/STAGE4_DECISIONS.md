# Stage 4 decision register

**Status:** none of these decisions has been made. Where a "working assumption" is given, it exists only so the architecture documents can be written; it binds nobody and no code depends on it. Each decision needs a named owner to decide, a date, and a record of the outcome (add the outcome under the entry or in the programme's own governance record).

Legend for "Decides": the function that should own the decision, not a named person. "Legal" means it needs legal review first (`PRIVACY_SECURITY_ARCHITECTURE.md` section 13). Nothing here claims legal compliance.

## Summary

| ID   | Decision                                             | Blocks                        | Needed by          |
| ---- | ---------------------------------------------------- | ----------------------------- | ------------------ |
| D-01 | Hosting and data residency                           | Any real data; staging build  | Before real data   |
| D-02 | Identity provider and MFA                            | Production sign-in            | Before pilot build |
| D-03 | Backend language, framework and API style            | Production build              | Before pilot build |
| D-04 | Database, spatial extension and job queue            | Production build              | Before pilot build |
| D-05 | Boundary dataset and custodian                       | GIS, hierarchy                | Before pilot build |
| D-06 | Facility directory source, owner and unconfirmed use | Referrals                     | Before pilot build |
| D-07 | Retention periods and on-device residency            | Any real data                 | Before real data   |
| D-08 | Consent or notice model                              | Any real data                 | Before real data   |
| D-09 | Pilot geography and sites                            | Pilot planning                | Before pilot plan  |
| D-10 | Rule governance body, quorum and fail-safe           | Any clinical use of rules     | Before pilot       |
| D-11 | Pilot evaluation design and ethics route             | Pilot                         | Before pilot       |
| D-12 | Person linkage option (A, B or C)                    | Data model, privacy design    | Before real data   |
| D-13 | Notification channels                                | Reminders, alerts             | Before pilot       |
| D-14 | Client delivery (installable web app or native)      | Offline guarantees            | Before pilot build |
| D-15 | Integration counterparts and order                   | Interoperability              | Before integration |
| D-16 | Role model changes                                   | RBAC build                    | Before pilot build |
| D-17 | Break-glass access                                   | Support, incidents            | Before pilot       |
| D-18 | Small-number suppression rule                        | Every aggregate view          | Before real data   |
| D-19 | Community unit and vulnerability index               | Maps, aggregates              | Before pilot build |
| D-20 | Basemap approach                                     | Map experience                | Before pilot build |
| D-21 | Location precision below community                   | Data model, GIS               | Before real data   |
| D-22 | Languages and reviewed translations                  | Pilot user materials, UI text | Before pilot       |
| D-23 | Data ownership and controller roles                  | Agreements, all sharing       | Before real data   |
| D-24 | Export and external-sharing approval                 | Exports, reports              | Before pilot       |
| D-25 | Device policy and supervised recovery                | Device loss, CHW onboarding   | Before pilot       |

## Decisions

### D-01 Hosting and data residency

- **Question:** where does the production system run, and in which jurisdiction does health data stay?
- **Options:** (a) a cloud region in Nigeria if available; (b) a region elsewhere in Africa; (c) a region outside Africa; (d) a government or partner data centre; (e) hybrid, with person-level data local and aggregates elsewhere.
- **Depends on:** Legal answers on data localisation and transfer; availability, cost, and operations capacity; backup and recovery location; counterpart requirements.
- **Decides:** Data owner with Legal and the technical lead.
- **Working assumption:** none. The architecture only requires encryption at rest with managed keys, private networking, separate environments, and tested backups.

### D-02 Identity provider and multi-factor authentication

- **Question:** which OpenID Connect provider, who runs it, and which second factor is workable for CHWs on shared network conditions?
- **Options:** managed commercial provider; self-hosted open-source provider; a government identity service if one is suitable. Second factor: authenticator app, SMS code, hardware key for administrators only.
- **Depends on:** D-01, device policy (D-25), connectivity, cost, account recovery process.
- **Decides:** Technical lead and security lead, with the programme.
- **Working assumption:** an OIDC provider with MFA mandatory for all non-CHW staff and for administrators; CHW factor to be chosen with usability testing.

### D-03 Backend language, framework and API style

- **Question:** what runs the server?
- **Options:** TypeScript on Node (reuses `domain`, `rules-engine` and `programme` packages and Zod schemas unchanged); another language with a rewrite of those packages.
- **Depends on:** team skills and long-term maintainers.
- **Decides:** Technical lead.
- **Working assumption (reference only):** TypeScript on Node, REST with an OpenAPI description generated from the existing contract.

### D-04 Database, spatial extension and job queue

- **Question:** which data stores?
- **Options:** PostgreSQL with PostGIS and a Postgres-backed queue; a managed equivalent; separate queue and cache services.
- **Depends on:** D-01, operations capacity, scale expectations.
- **Decides:** Technical lead and data steward.
- **Working assumption (reference only):** PostgreSQL with PostGIS and row-level security; a Postgres-backed queue at pilot scale.

### D-05 Boundary dataset and custodian

- **Question:** which official source provides state, LGA and ward boundaries and codes, and under what licence?
- **Options:** national mapping or statistics authority release; a humanitarian or open dataset; a state-held version.
- **Depends on:** availability, licence, release date, agreement with the custodian.
- **Decides:** Data owner and GIS lead, with the custodian.
- **Working assumption:** none. Candidates are to be confirmed with their owners.

### D-06 Facility directory source, owner and use of unconfirmed facilities

- **Question:** which registry is the source of truth for facilities, who owns the NTD-WATCH verification state, and may a referral be made to a facility that is not `CONFIRMED_BY_OWNER`?
- **Options:** national or state registry as master; an NTD programme list as master; an NTD-WATCH-maintained list seeded from either. For unconfirmed facilities: never; or only with a visible warning and a supervisor notice.
- **Depends on:** registry access (I-3), state agreement, field verification effort.
- **Decides:** Programme owner with state health authority.
- **Working assumption:** registry as master, NTD-WATCH owns the verification state, unconfirmed facilities not offered.

### D-07 Retention periods and on-device residency

- **Question:** how long is each class of data kept (person-level, aggregates, audit, backups, device copies, logs) and when is it deleted or anonymised?
- **Options:** periods set by law, programme policy and research needs. **No period is proposed in this repository.**
- **Depends on:** Legal; D-08; D-12; research and audit needs.
- **Decides:** Data owner with Legal and the data protection officer.
- **Working assumption:** none. The framework in `DATA_ARCHITECTURE.md` section 11 lists the classes only.

### D-08 Consent or notice model

- **Question:** what must a person be told, and is consent or another lawful basis needed, for what, in what form, and recorded how?
- **Options:** consent per assessment; consent per person (needs D-12); notice-only; programme-level authorisation. Verbal, written or assisted for low literacy.
- **Depends on:** Legal; ethics review; D-12; D-22.
- **Decides:** Legal and ethics committee, with the programme.
- **Working assumption:** nullable `notice_version` and `notice_given_at` fields reserved; nothing else.

### D-09 Pilot geography and sites

- **Question:** where does the pilot run?
- **Options:** not proposed here. This document deliberately does not select a location.
- **Depends on:** programme priorities, disease burden, partner presence, facility readiness, connectivity, security, political agreement.
- **Decides:** Programme owner and state authorities.
- **Working assumption:** none.

### D-10 Rule governance body, quorum and fail-safe

- **Question:** who are the reviewers and the Board, what is the quorum, what must be independent, and what does the app do when no valid rule set exists?
- **Options:** composition and independence rules in `RULE_GOVERNANCE.md`; fail-safe wording to be approved by clinical reviewers.
- **Depends on:** expert availability, programme guidance, regulatory view (Legal).
- **Decides:** Programme owner and clinical lead.
- **Working assumption:** the lifecycle in `RULE_GOVERNANCE.md`; the app shows no level and an approved instruction when no valid version exists.

### D-11 Pilot evaluation design and ethics route

- **Question:** is the pilot operational (service improvement) or research, who reviews it ethically, and what is evaluated?
- **Options:** operational pilot with a monitoring plan; evaluation with a protocol and ethics approval; both.
- **Depends on:** Legal, funder requirements, D-09, D-08.
- **Decides:** Programme owner, ethics committee, evaluation lead.
- **Working assumption:** none. Indicators in `PILOT_READINESS.md` are measurements, not an evaluation design.

### D-12 Person linkage option

- **Question:** does the system link records to a person, and how? The prototype has no person identity at all.
- **Options:** A, no person identity (current); B, pseudonymous person code held by the CHW and facility; C, identifiers stored under separate encryption. Detailed in `DATA_ARCHITECTURE.md` section 4.4.
- **Depends on:** clinical need (follow-up of the same person), Legal, D-08, D-18, D-23, threat model.
- **Decides:** Data owner with clinical lead, Legal and the data protection officer.
- **Working assumption:** A or B to start, because they minimise data. Not decided.

### D-13 Notification channels

- **Question:** how are CHWs and supervisors reminded of follow-ups and overdue referrals?
- **Options:** in-app only; web push; SMS; WhatsApp or email for supervisors. Messages never carry health detail.
- **Depends on:** device and network reality, cost, provider data handling, D-01, Legal.
- **Decides:** Programme owner with the technical lead.
- **Working assumption:** in-app first; others optional.

### D-14 Client delivery

- **Question:** installable web app (PWA) or native app?
- **Options:** PWA (the prototype is **not** yet a PWA: no manifest, no service worker); native wrapper; native app.
- **Depends on:** a real-device test of the offline behaviour on the actual phones and browsers, storage limits, OS eviction of web storage, update control, device policy (D-25).
- **Decides:** Technical lead and programme owner.
- **Working assumption:** PWA, to be disproved or confirmed by testing on real devices before the pilot.

### D-15 Integration counterparts and order

- **Question:** which systems are connected, in what order, and who owns each?
- **Options:** see `INTEROPERABILITY.md`; reference data in (boundaries, facilities, WASH) before any outbound feed (DHIS2, programme systems).
- **Depends on:** owner agreement, access, D-05, D-06, D-23, Legal.
- **Decides:** Programme owner with each counterpart.
- **Working assumption:** inbound reference first, aggregate outbound later, nothing person-level.

### D-16 Role model changes

- **Question:** adopt the CHW Supervisor and Project Administrator roles and the split of the current administrator?
- **Options:** as in `PRODUCTION_RBAC.md`; keep the prototype's five roles; alternative splits.
- **Depends on:** programme organisation, who actually operates the system.
- **Decides:** Programme owner and security lead.
- **Working assumption:** seven roles as proposed. Supervisor access to individual CHW records for quality assurance is **not** granted unless decided here.

### D-17 Break-glass access

- **Question:** may anyone ever access person-level data outside their normal scope in an emergency, and under what control?
- **Options:** never; two-person approval with reason, time limit, automatic review and alert to the data owner.
- **Depends on:** Legal, security lead, support model.
- **Decides:** Data owner and security lead.
- **Working assumption:** none granted by default; the controlled option is described in `PRODUCTION_RBAC.md` section 5.

### D-18 Small-number suppression rule

- **Question:** below what count, and by what method, are aggregates suppressed or merged? The prototype has none.
- **Options:** fixed minimum cell size; complementary suppression; geographic merging; rounding; differential approaches. **No value is proposed here.**
- **Depends on:** population size per unit, re-identification risk, programme needs, Legal.
- **Decides:** Data owner with the data protection officer and a statistician.
- **Working assumption:** none. Must be decided and tested before real data.

### D-19 Community unit and vulnerability index

- **Question:** what is a "community" geographically, and how is the vulnerability index defined (inputs, weights, bands)?
- **Options:** point; programme catchment; ward with communities as attributes (`GIS_PRODUCTION_ARCHITECTURE.md` section 2). Index: keep contextual and descriptive, or define with experts.
- **Depends on:** available boundaries, WASH data (I-4), programme definitions, D-18.
- **Decides:** Programme owner and GIS lead with public-health experts.
- **Working assumption:** ward-level published maps; the prototype's bands at 30 and 45 are demonstration values only.

### D-20 Basemap approach

- **Question:** no basemap, third-party tiles, or self-hosted tiles?
- **Options:** as described in `GIS_PRODUCTION_ARCHITECTURE.md` section 8.
- **Depends on:** privacy of viewing location, licence and attribution, cost, offline need.
- **Decides:** GIS lead and security lead.
- **Working assumption:** none (as the prototype).

### D-21 Location precision below community

- **Question:** is any location finer than community collected (household, GPS at assessment)?
- **Options:** never; ward only; settlement point; GPS with explicit approval and encryption.
- **Depends on:** clinical or programme need, Legal, ethics, D-08, D-12.
- **Decides:** Data owner with ethics and Legal.
- **Working assumption:** not collected.

### D-22 Languages and reviewed translations

- **Question:** which languages are supported and who reviews clinical wording in each?
- **Options:** English only for the pilot; additional languages with translation and back-translation review. The prototype is English only.
- **Depends on:** CHW languages in D-09, reviewer availability, rule translation governance (`RULE_GOVERNANCE.md` section 3).
- **Decides:** Programme owner and clinical lead.
- **Working assumption:** English only until decided.

### D-23 Data ownership and controller roles

- **Question:** who is the data owner or controller for each dataset, who are processors, and what do the agreements say?
- **Options:** programme, state authority, implementing partner, hosting provider, as described in `DATA_ARCHITECTURE.md` section 10.
- **Depends on:** Legal, funders, D-01, D-15.
- **Decides:** Programme owner and Legal.
- **Working assumption:** none.

### D-24 Export and external-sharing approval

- **Question:** who may approve exports beyond the standard suppressed reports, and under what record?
- **Options:** State Programme Manager or data owner approval; a committee for external sharing; no custom exports in the pilot.
- **Depends on:** D-18, D-23, Legal.
- **Decides:** Data owner.
- **Working assumption:** only the four standard report kinds, with suppression.

### D-25 Device policy and supervised recovery

- **Question:** programme-issued or personal phones, whether device management is used, minimum OS and browser versions, and whether unsynced data on a lost device can ever be recovered under supervision.
- **Options:** issued and managed; personal with a security baseline; recovery never, or one-time logged recovery.
- **Depends on:** budget, D-14, D-02, Legal, field realities.
- **Decides:** Programme owner and security lead.
- **Working assumption:** none; the lost-device procedure in `PRIVACY_SECURITY_ARCHITECTURE.md` section 8 works without recovery.

## How to record an outcome

Add under the entry: decision, date, decided by, alternatives rejected, conditions, and review date. A decision that changes the architecture updates the relevant document and notes the change in `DECISIONS.md`.
