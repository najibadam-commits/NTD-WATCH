# Stage 5 decision register

**Status:** none of the 25 decisions from `STAGE4_DECISIONS.md` has been made. This register classifies each one by who owns it, says what depends on it, and says whether it blocks real data, a pilot or production.

**How to read the "recommended option" field.**

- For **technical** decisions it is a recommendation and a proposed default, for approval by the technical lead and programme owner.
- For **clinical/public-health, legal/privacy and organisational** decisions it is only a _conservative option for the owner to consider_. It favours minimal data, reversibility and caution. It is **not** a decision, and the owner may choose differently. Nothing in this register is legal advice or a claim of compliance.

**Ownership categories**

| Code | Category                   | Who decides                                                              |
| ---- | -------------------------- | ------------------------------------------------------------------------ |
| P    | Product decision           | Product team                                                             |
| T    | Technical decision         | Technical lead, proposed default for approval                            |
| C    | Clinical/public-health     | Qualified NTD, public-health and clinical experts                        |
| L    | Legal/privacy              | Legal counsel, data protection officer, ethics or institutional review   |
| O    | Organisational/stakeholder | Management and programme leadership (ministry, state programme, partner) |

A decision can have a secondary category. The primary one is who must sign it off.

**"Blocks" definitions.** _Real data_ means any real person's information entered into any NTD-WATCH system, including a test. _Pilot_ means a controlled field pilot with approved users. _Production_ means operation at programme scale. "Yes" means the decision must be recorded before that point. "Default OK" means a conservative default can be approved and the fuller decision deferred. "No" means it can stay open.

## 1. Summary

| ID   | Decision                                   | Primary | Secondary        | Real data       | Pilot              | Production |
| ---- | ------------------------------------------ | ------- | ---------------- | --------------- | ------------------ | ---------- |
| D-01 | Hosting and data residency                 | L       | T, O             | **Yes**         | Yes                | Yes        |
| D-02 | Identity provider and MFA                  | T       | L                | **Yes**         | Yes                | Yes        |
| D-03 | Backend language, framework, API style     | T       |                  | **Yes** (build) | Yes                | Yes        |
| D-04 | Database, spatial extension, job queue     | T       |                  | **Yes** (build) | Yes                | Yes        |
| D-05 | Boundary dataset and custodian             | O       | T                | Partly          | Yes                | Yes        |
| D-06 | Facility directory, owner, unconfirmed use | O       | P                | Partly          | Yes                | Yes        |
| D-07 | Retention and on-device residency          | L       | O, T             | **Yes**         | Yes                | Yes        |
| D-08 | Consent or notice model                    | L       | C, O             | **Yes**         | Yes                | Yes        |
| D-09 | Pilot geography and sites                  | O       | C                | **Yes**         | Yes                | No         |
| D-10 | Rule governance body, quorum, fail-safe    | C       | O, L             | **Yes**         | Yes                | Yes        |
| D-11 | Evaluation design and ethics route         | L       | C, O             | **Yes**         | Yes                | Yes        |
| D-12 | Person linkage option                      | L       | C                | **Yes**         | Yes                | Yes        |
| D-13 | Notification channels                      | T       | L                | No              | Default OK         | Yes        |
| D-14 | Client delivery (PWA or native)            | T       |                  | **Yes**         | Yes                | Yes        |
| D-15 | Integration counterparts and order         | O       | L, T             | No              | No (none in pilot) | Yes        |
| D-16 | Role model changes                         | P       | L, O             | **Yes**         | Yes                | Yes        |
| D-17 | Break-glass access                         | L       | O, T             | Default OK      | Default OK         | Yes        |
| D-18 | Small-number suppression rule              | L       | C (statistician) | **Yes**         | Yes                | Yes        |
| D-19 | Community unit and vulnerability index     | C       | P, O             | Partly          | Partly             | Yes        |
| D-20 | Basemap approach                           | T       | L                | No              | Default OK         | Yes        |
| D-21 | Location precision below community         | L       | C                | **Yes**         | Yes                | Yes        |
| D-22 | Languages and reviewed translations        | C       | O, P             | Partly          | Yes                | Yes        |
| D-23 | Data ownership and controller roles        | O       | L                | **Yes**         | Yes                | Yes        |
| D-24 | Export and external-sharing approval       | O       | L                | Default OK      | Default OK         | Yes        |
| D-25 | Device policy and supervised recovery      | O       | T, L             | **Yes**         | Yes                | Yes        |

Primary-category counts (25 in total): technical 6 (D-02, D-03, D-04, D-13, D-14, D-20); product 1 (D-16); clinical/public-health 3 (D-10, D-19, D-22); legal/privacy 8 (D-01, D-07, D-08, D-11, D-12, D-17, D-18, D-21); organisational 7 (D-05, D-06, D-09, D-15, D-23, D-24, D-25).

## 2. Prioritisation

### 2.1 Blocking before real data

The seven Stage 4 identified decisions are all blockers: **D-01, D-07, D-08, D-12, D-18, D-21, D-23**. Reading the Stage 4 documents again, these others also block real data:

| ID                     | Why it also blocks real data                                                                                                                                                                                             |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| D-09                   | No real data without a defined, approved site and an agreed list of communities and users                                                                                                                                |
| D-10                   | Real assessments would receive a risk level. Either an approved rule set exists, or the app runs in an approved **no-rule mode** (record and refer under CHW judgement, no level shown). One of the two must be approved |
| D-11                   | Ethics or equivalent review must precede any real participant data if the pilot is research or evaluation, and the route must be confirmed even if it is not                                                             |
| D-02, D-03, D-04       | A real server, database and authentication must exist; the prototype's mock server and unchecked PIN cannot hold real data. Technical defaults can be approved quickly                                                   |
| D-14                   | Real data cannot be entered on a client whose offline storage and update behaviour has not been tested on the real phones                                                                                                |
| D-16                   | Access control for real data depends on the final role set, including whether supervisors see individual records                                                                                                         |
| D-25                   | Real data on phones depends on whether the phones are issued, managed or personal, and what happens when one is lost                                                                                                     |
| D-17                   | Must at least be decided as "not available" so no undocumented access path exists (default OK)                                                                                                                           |
| D-24                   | Must at least be decided as "no custom exports" (default OK)                                                                                                                                                             |
| D-05, D-06, D-19, D-22 | Partly: a minimum, programme-approved list of communities, facilities and languages for the pilot site is needed; full polygons, registry integration and the vulnerability index are not                                |

### 2.2 Blocking before pilot

Everything that blocks real data (a controlled pilot uses real data), plus:

- Operational gates: D-13 default (in-app only), D-22 reviewed wording in the CHW languages.
- Clinical and public-health gates: an approved rule set or approved no-rule mode (D-10); D-19 for what the map shows; facility confirmation (D-06).
- Governance gates: written agreements (D-23), export default (D-24), device policy (D-25), stop conditions.
- The facility interface must be built, and the real-device offline test must pass (see `PILOT_GATES.md`).

### 2.3 Can be deferred during an initial controlled pilot

These can remain open if the conservative default shown is approved and recorded as _the pilot default_.

| ID              | Pilot default (for the owner to confirm)                                                                                           | Revisit before                      |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| D-13            | In-app reminders only; no SMS or push; no third-party messaging provider                                                           | Wider rollout                       |
| D-15            | No integration; manual, human-reviewed aggregate reports from the standard report kinds                                            | Any outbound feed                   |
| D-17            | Break-glass not enabled; no standing or emergency access to person-level data outside scope                                        | Production                          |
| D-19 (index)    | Show wards or listed communities without a vulnerability index, or label it "contextual, not validated"; real WASH layers not used | Using the index for any decision    |
| D-20            | No basemap                                                                                                                         | A map that needs roads or landmarks |
| D-24            | Only the four standard suppressed report kinds; no custom or external exports                                                      | Any external sharing                |
| D-05 (polygons) | A programme-approved list of units with codes; real polygons only if the custodian agrees                                          | Production                          |
| D-22            | English only, if the CHWs in D-09 work in English; otherwise it blocks                                                             | Adding languages                    |

Production-only items: D-15, D-17 (mechanism), D-20, D-24 (beyond standard), D-13 beyond in-app.

## 3. Register

Entries give: the decision, why it matters, current status, recommended option, alternatives considered, owner, dependency, consequence of not deciding, and what it blocks. "Status" is **Open** for all. Source text for options is in `STAGE4_DECISIONS.md`.

### D-01 Hosting and data residency

- **Category:** Legal/privacy (primary); technical and organisational input.
- **Why it matters:** decides where health data physically lives and under which law; constrains the cloud provider, backups, support access, and what integration partners will accept.
- **Status:** Open. Reference technology is only an assumption.
- **Recommended option (for the owner to consider):** the narrowest jurisdictional footprint that legal review accepts, with person-level data kept in the approved jurisdiction and customer-managed encryption keys. If no in-country option is acceptable or available, the owner decides whether aggregates only may be hosted elsewhere.
- **Alternatives:** in-country cloud region; elsewhere in Africa; outside Africa; government or partner data centre; hybrid (person-level local, aggregates elsewhere).
- **Owner:** data owner with legal counsel; technical lead advises.
- **Dependency:** legal answers on localisation and transfer (`PRIVACY_SECURITY_ARCHITECTURE.md` question 11); D-23; provider availability and cost.
- **If not decided:** no production environment can be built or selected; the only permitted environment remains synthetic-data development.
- **Blocks:** real data **yes**; pilot **yes**; production **yes**.

### D-02 Identity provider and MFA

- **Category:** Technical.
- **Why it matters:** the prototype's role and PIN are simulated. Real access control starts here.
- **Status:** Open.
- **Recommended default (for approval):** a standards-based OpenID Connect provider with named accounts, mandatory MFA for supervisors, facility staff, officers and all administrators, and a CHW sign-in that is usable offline-first (device-bound session plus periodic online re-authentication). Prefer a managed provider hosted in the jurisdiction chosen in D-01 unless operations capacity exists to self-host.
- **Alternatives:** self-hosted open-source provider; government identity service if suitable; SMS-code second factor for CHWs; authenticator app; hardware keys for administrators only.
- **Owner:** technical lead and security lead; programme owner approves the cost.
- **Dependency:** D-01, D-25.
- **If not decided:** no real authentication; no real user can be onboarded.
- **Blocks:** real data **yes**; pilot **yes**; production **yes**.

### D-03 Backend language, framework and API style

- **Category:** Technical.
- **Why it matters:** the domain, rules and programme packages are TypeScript and Zod. Matching the backend avoids rewriting tested logic.
- **Status:** Open.
- **Recommended default:** TypeScript on Node as a modular monolith; REST with an OpenAPI description generated from the existing Zod contract; shared packages consumed unchanged; strict mode and the existing lint rules kept.
- **Alternatives:** another language with the shared packages re-implemented and re-tested; GraphQL; gRPC.
- **Owner:** technical lead.
- **Dependency:** team skills and maintainers.
- **If not decided:** the server cannot start; Phase 1 of `STAGE4_REPORT.md` section 14 stalls.
- **Blocks:** real data **yes (build prerequisite)**; pilot **yes**; production **yes**.

### D-04 Database, spatial extension and job queue

- **Category:** Technical.
- **Why it matters:** row-level security, spatial queries and reference-data versioning are database features.
- **Status:** Open.
- **Recommended default:** PostgreSQL with PostGIS, schemas and roles as in `DATA_ARCHITECTURE.md`, row-level security on person-level tables, and a Postgres-backed job queue at pilot scale.
- **Alternatives:** managed PostgreSQL service; separate queue service; a different database with spatial support.
- **Owner:** technical lead with the data steward.
- **Dependency:** D-01 (managed options depend on region), operations capacity.
- **If not decided:** no schema or migration work can begin.
- **Blocks:** real data **yes (build)**; pilot **yes**; production **yes**.

### D-05 Boundary dataset and custodian

- **Category:** Organisational (primary); technical input.
- **Why it matters:** the administrative hierarchy and codes are the join key for everything geographic. A wrong or unlicensed source is hard to unwind.
- **Status:** Open; no real boundary is in the repository.
- **Recommended option (for the owner to consider):** use the boundary release the state or national health programme already uses for planning, with a written licence, stored as a versioned reference dataset. For a first pilot a programme-approved list of units with codes is enough; polygons can follow.
- **Alternatives:** national mapping or statistics authority release; humanitarian or open dataset; state-held version.
- **Owner:** programme leadership with the GIS lead and the custodian.
- **Dependency:** D-15 (counterparts), D-09 (which units are needed first).
- **If not decided:** the hierarchy stays synthetic; no real community can be assigned.
- **Blocks:** real data **partly** (agreed unit list); pilot **yes**; production **yes**.

### D-06 Facility directory source, owner and use of unconfirmed facilities

- **Category:** Organisational; product input.
- **Why it matters:** a referral to a closed, moved or non-participating facility is a safety failure.
- **Status:** Open.
- **Recommended option (for the owner to consider):** referral destinations limited to facilities that have confirmed they receive NTD-WATCH referrals; verification state owned by the programme; no unconfirmed facilities offered.
- **Alternatives:** national or state registry as master; programme list as master; NTD-WATCH list seeded from either; allow unconfirmed facilities with a warning and supervisor notice.
- **Owner:** programme leadership with the state health authority and the facilities.
- **Dependency:** D-09, D-05, D-15 (I-3).
- **If not decided:** referral destinations cannot be real.
- **Blocks:** real data **partly** (pilot facility list); pilot **yes**; production **yes**.

### D-07 Retention periods and on-device residency

- **Category:** Legal/privacy.
- **Why it matters:** retention must be justified and limited. It also determines backup, deletion and device behaviour. No period is proposed anywhere in the repository.
- **Status:** Open.
- **Recommended option (for the owner to consider):** set periods per data class (person-level, aggregates, audit, backups, logs, device copies) after the legal review, as short as the programme's need allows, with automatic deletion or anonymisation and a documented exception route. Synced records are removed from phones after a short grace period the owner sets.
- **Alternatives:** periods set by statute; periods set by programme or research need; indefinite for anonymised aggregates only.
- **Owner:** data owner with counsel and the data protection officer.
- **Dependency:** D-08, D-12, D-11, legal answers 7 and 8.
- **If not decided:** the system would keep data with no basis, or delete it with no basis; neither is acceptable for real data.
- **Blocks:** real data **yes**; pilot **yes**; production **yes**.

### D-08 Consent or notice model

- **Category:** Legal/privacy; clinical and organisational input.
- **Why it matters:** determines what a CHW tells a person, what is recorded, and the data model (`notice_version`, `notice_given_at`).
- **Status:** Open.
- **Recommended option (for the owner to consider):** a plain-language, assisted verbal notice in the person's language, recorded as a notice version and time, unless counsel and the ethics review require a different form; special handling for children and people unable to consent as counsel directs.
- **Alternatives:** written consent; consent per person (needs D-12); notice-only; programme-level authorisation; none (not suggested).
- **Owner:** counsel and the ethics committee, with the programme.
- **Dependency:** D-11, D-12, D-22.
- **If not decided:** no CHW can lawfully or ethically start an assessment with real people.
- **Blocks:** real data **yes**; pilot **yes**; production **yes**.

### D-09 Pilot geography and sites

- **Category:** Organisational.
- **Why it matters:** fixes the boundaries, facilities, languages, CHWs, connectivity and approvals the pilot needs.
- **Status:** Open. **No location has been proposed or chosen.**
- **Recommended option:** none. Selection criteria for the owner are in `PILOT_BLUEPRINT.md` section 8.
- **Alternatives:** n/a.
- **Owner:** programme leadership with state authorities.
- **Dependency:** programme priorities, partner presence, safety, facility readiness, D-23.
- **If not decided:** the pilot cannot be planned beyond the generic blueprint.
- **Blocks:** real data **yes**; pilot **yes**; production no.

### D-10 Rule governance body, quorum and fail-safe

- **Category:** Clinical/public-health.
- **Why it matters:** the rule set is demonstration-only. No clinical level may be shown to CHWs for real people without a qualified review. The fail-safe decides what the app does when no valid rule set exists.
- **Status:** Open.
- **Recommended option (for the owner to consider):** adopt the lifecycle in `RULE_GOVERNANCE.md` and `CLINICAL_VALIDATION_PLAN.md`; until an approved rule set exists, run in **no-rule mode**: record the assessment, show no level, and show the programme-approved instruction.
- **Alternatives:** adopt an existing national guideline algorithm as the rule set after expert adaptation; commission new rules; no rules ever (record and refer only).
- **Owner:** clinical lead and the national or state NTD programme, with an independent reviewer.
- **Dependency:** expert availability, programme guidance, regulatory position (counsel).
- **If not decided:** real assessments cannot show a level; only no-rule mode is possible.
- **Blocks:** real data **yes** (an approved set or an approved no-rule mode); pilot **yes**; production **yes**.

### D-11 Evaluation design and ethics route

- **Category:** Legal/privacy (ethics, institutional review).
- **Why it matters:** whether the pilot is service improvement or research changes approvals, consent, publication and what can be claimed.
- **Status:** Open.
- **Recommended option (for the owner to consider):** ask the relevant ethics body to determine the classification before design is fixed; plan for an operational pilot with a monitoring plan unless they require a protocol.
- **Alternatives:** operational pilot; evaluation with a protocol; both.
- **Owner:** ethics committee, programme leadership, evaluation lead.
- **Dependency:** D-08, D-09, funder requirements.
- **If not decided:** no real participant data; no publication.
- **Blocks:** real data **yes**; pilot **yes**; production **yes** (evidence for scale).

### D-12 Person linkage option

- **Category:** Legal/privacy; clinical need input.
- **Why it matters:** the prototype holds no person identity. Linking follow-up to the same person, or de-duplicating, needs some identifier, which raises risk.
- **Status:** Open.
- **Recommended option (for the owner to consider):** the least identifying option that meets a stated clinical or programme need: A (no person identity) or B (a pseudonymous code held by the CHW and facility). Option C (stored identifiers under separate encryption) only with an explicit justification, counsel's agreement and a data protection impact assessment.
- **Alternatives:** A, B, C as in `DATA_ARCHITECTURE.md` section 4.4.
- **Owner:** data owner with clinical lead, counsel and the data protection officer.
- **Dependency:** D-08, D-18, D-23; clinical workflow for follow-up.
- **If not decided:** the data model and the privacy impact assessment cannot be finished.
- **Blocks:** real data **yes**; pilot **yes**; production **yes**.

### D-13 Notification channels

- **Category:** Technical (primary); legal input for third-party providers.
- **Why it matters:** reminders improve follow-up, but SMS or messaging providers add third parties and exposure.
- **Status:** Open.
- **Recommended default:** in-app reminders and lists only; messages (if any later) carry a reference code and a prompt to open the app, never health detail.
- **Alternatives:** web push; SMS; WhatsApp or email for supervisors.
- **Owner:** technical lead with programme owner; counsel for providers.
- **Dependency:** D-01, D-14, D-25.
- **If not decided:** reminders remain in-app. This is safe.
- **Blocks:** real data no; pilot default OK; production yes.

### D-14 Client delivery

- **Category:** Technical.
- **Why it matters:** the prototype is not a PWA and its offline behaviour is proven only in a desktop test environment. Data loss on a phone is the main field risk.
- **Status:** Open.
- **Recommended default:** installable PWA with device-bound session and encrypted local store, **conditional on passing the real-device test matrix** in `TESTING_ROADMAP.md` tier 2. If it fails, move to a native wrapper.
- **Alternatives:** native wrapper; fully native app.
- **Owner:** technical lead and programme owner.
- **Dependency:** D-25 (which phones), D-02.
- **If not decided:** offline guarantees cannot be claimed.
- **Blocks:** real data **yes**; pilot **yes**; production **yes**.

### D-15 Integration counterparts and order

- **Category:** Organisational.
- **Why it matters:** each integration has an owner, an agreement and privacy implications. It is the largest source of delay and scope creep.
- **Status:** Open. No counterpart confirmed.
- **Recommended option (for the owner to consider):** none in the controlled pilot. Afterwards, inbound reference data first, aggregate outbound later, nothing person-level.
- **Alternatives:** DHIS2 aggregate feed first; programme systems first; file exchange first.
- **Owner:** programme leadership with each counterpart.
- **Dependency:** D-05, D-06, D-23, legal answer 12.
- **If not decided:** the system stays stand-alone. This is acceptable for a pilot.
- **Blocks:** real data no; pilot no; production **yes**.

### D-16 Role model changes

- **Category:** Product (role set); legal and organisational input for supervisor access to individual records.
- **Why it matters:** access control is built from the role set.
- **Status:** Open.
- **Recommended option:** adopt the seven roles in `PRODUCTION_RBAC.md`. Supervisors see aggregates and sync status only unless counsel and leadership approve a logged, reason-required view for quality assurance.
- **Alternatives:** keep five prototype roles; different splits of the administrator.
- **Owner:** product team decides the role set; programme leadership approves supervisor record access.
- **Dependency:** D-23, D-17.
- **If not decided:** the access control model cannot be finalised.
- **Blocks:** real data **yes**; pilot **yes**; production **yes**.

### D-17 Break-glass access

- **Category:** Legal/privacy.
- **Why it matters:** emergency access to person-level data is the most abusable path.
- **Status:** Open.
- **Recommended option (for the owner to consider):** not enabled in the pilot. Revisit only with counsel for production.
- **Alternatives:** never; two-person approved, time-limited, reasoned and alerted access.
- **Owner:** data owner with security lead and counsel.
- **Dependency:** D-16, D-23.
- **If not decided:** treated as not available (safe default).
- **Blocks:** real data default OK; pilot default OK; production **yes**.

### D-18 Small-number suppression rule

- **Category:** Legal/privacy; statistical input.
- **Why it matters:** the prototype has none. A count of 1 or 2 in a small community can identify a person.
- **Status:** Open. **No value is proposed.**
- **Recommended option:** a statistician and the data protection officer choose and test a rule on realistic synthetic data, covering differencing across filters and periods, before real data.
- **Alternatives:** minimum cell size; complementary suppression; geographic merging; rounding; other statistical disclosure control.
- **Owner:** data owner with data protection officer and a statistician.
- **Dependency:** D-19 (unit size), D-23.
- **If not decided:** aggregates cannot be shown for real data.
- **Blocks:** real data **yes**; pilot **yes**; production **yes**.

### D-19 Community unit and vulnerability index

- **Category:** Clinical/public-health (index); product and organisational input (unit).
- **Why it matters:** there is no standard national community polygon. The unit shapes maps and disclosure risk. The index's bands are demonstration values.
- **Status:** Open.
- **Recommended option:** publish maps at ward level, keep community as an attribute list; do not use the index for decisions until experts define it.
- **Alternatives:** settlement point; programme catchment; ward choropleth.
- **Owner:** public-health experts and the programme, with the GIS lead.
- **Dependency:** D-05, D-18, WASH data availability.
- **If not decided:** use ward-level display and hide or label the index.
- **Blocks:** real data partly; pilot partly (unit yes, index no); production **yes**.

### D-20 Basemap approach

- **Category:** Technical.
- **Why it matters:** third-party tiles reveal viewers' locations and areas and add licence and availability dependencies.
- **Status:** Open.
- **Recommended default:** no basemap in the pilot (as the prototype). Revisit self-hosted tiles later.
- **Alternatives:** licensed or open third-party tiles; self-hosted tiles.
- **Owner:** technical lead and GIS lead; counsel on licence.
- **Dependency:** D-01, D-05.
- **If not decided:** no basemap. Safe.
- **Blocks:** real data no; pilot default OK; production yes.

### D-21 Location precision below community

- **Category:** Legal/privacy; clinical input.
- **Why it matters:** household or GPS location makes records far more identifying.
- **Status:** Open.
- **Recommended option (for the owner to consider):** not collected. Location is the community, shown at ward level.
- **Alternatives:** ward only; settlement point; GPS with explicit approval and encryption.
- **Owner:** data owner with counsel and ethics.
- **Dependency:** D-08, D-12.
- **If not decided:** treated as not collected.
- **Blocks:** real data **yes** (must be recorded); pilot **yes**; production **yes**.

### D-22 Languages and reviewed translations

- **Category:** Clinical/public-health (wording review); organisational and product input.
- **Why it matters:** misread questions or advice are a safety issue. The prototype is English only.
- **Status:** Open.
- **Recommended option:** decide after D-09 identifies the CHWs' working languages; any language shown to CHWs has reviewed and back-translated clinical wording.
- **Alternatives:** English only; add languages with review.
- **Owner:** clinical lead and programme owner.
- **Dependency:** D-09, D-10.
- **If not decided:** English only; it blocks if CHWs do not work in English.
- **Blocks:** real data partly; pilot **yes**; production **yes**.

### D-23 Data ownership and controller roles

- **Category:** Organisational; legal input.
- **Why it matters:** decides who is accountable, who signs agreements, and who responds to requests and incidents.
- **Status:** Open.
- **Recommended option:** a written data register naming an owner and a controller or processor role per dataset, agreed before real data (`DATA_ARCHITECTURE.md` section 10).
- **Alternatives:** programme, state authority, implementing partner or hosting provider as owner.
- **Owner:** programme leadership and counsel.
- **Dependency:** D-01, D-15.
- **If not decided:** no agreements can be signed; accountability is undefined.
- **Blocks:** real data **yes**; pilot **yes**; production **yes**.

### D-24 Export and external-sharing approval

- **Category:** Organisational; legal input.
- **Why it matters:** exports leave the access controls.
- **Status:** Open.
- **Recommended option:** only the four standard suppressed report kinds in the pilot; any other export needs the data owner's written approval and is logged.
- **Alternatives:** committee approval for external sharing; no custom exports.
- **Owner:** data owner.
- **Dependency:** D-18, D-23.
- **If not decided:** standard reports only.
- **Blocks:** real data default OK; pilot default OK; production **yes**.

### D-25 Device policy and supervised recovery

- **Category:** Organisational; technical and legal input.
- **Why it matters:** decides who holds the data on a phone, how it is secured, and what happens on loss.
- **Status:** Open.
- **Recommended option (for the owner to consider):** programme-issued or enrolled phones with a minimum OS and browser baseline and device registration, and no supervised recovery of unsynced data unless counsel approves it.
- **Alternatives:** personal phones with a baseline; managed devices; one-time logged recovery.
- **Owner:** programme leadership with the security lead.
- **Dependency:** D-14, D-02, budget.
- **If not decided:** no device enrolment; no real data on phones.
- **Blocks:** real data **yes**; pilot **yes**; production **yes**.

## 4. Sign-off record

Append for each decision: the outcome, date, decided by, alternatives rejected, conditions, review date. Until recorded, the status stays Open and the pilot defaults in section 2.3 are only proposals.
