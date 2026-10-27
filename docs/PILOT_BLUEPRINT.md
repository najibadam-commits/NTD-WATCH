# Pilot blueprint (minimum)

**Status:** Proposed. This is the smallest pilot that would be informative and safe, built on the actual prototype. **No pilot location is selected** (D-09 is open and this document proposes none). All numbers are "proposed pilot targets" or are left to be set. Nothing here authorises real data; the gates in `PILOT_GATES.md` do.

It builds on `PILOT_READINESS.md` (Stage 4: users, indicators, readiness gates) and does not repeat it. This document adds the technology split, the pilot data and the stepwise structure.

## 1. Two pilot stages

| Stage                         | Data                                                               | Purpose                                                                                                                   | Gate   |
| ----------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- | ------ |
| **P1 Usability pilot**        | Synthetic and scripted scenarios only; no real person's data       | Do CHWs, supervisors, facility staff and officers understand and use the workflow? Is wording clear? Where does it break? | Gate A |
| **P2 Controlled field pilot** | Real data, limited users, approved site, production-grade controls | Does the full loop work in real conditions, safely?                                                                       | Gate B |

P1 can run early, because it needs no real data, no legal decisions on person-level data, and no approved rule set (the demonstration rules are used only on scripted scenarios and are shown as demonstration). P2 cannot start until Gate B is met. Scale (Gate C) is not part of this blueprint.

## 2. Pilot users

| User            | P1 usability                                                        | P2 controlled pilot                                                                  |
| --------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| CHWs            | A small group works through scripted scenarios on candidate phones  | Approved CHWs at the approved site, trained, with issued or enrolled phones          |
| Supervisors     | Review the supervisor view with synthetic data                      | Supervisors with aggregate and sync-status view only unless D-16 decides otherwise   |
| Facility users  | Try the facility interface prototype with scripted referrals        | Staff at confirmed facilities (D-06) who have agreed to receive and record referrals |
| Programme users | Review the intelligence views on synthetic data to judge usefulness | Programme officers with scope-limited aggregate views, with suppression              |
| Administrators  | Walk through user, role and reference data administration           | Named administrators with separated duties; no standing access to person-level data  |

Numbers of users and sites are not proposed (D-09, D-11).

## 3. Pilot workflow

Community → assessment → risk assessment → referral → facility interaction → follow-up → programme intelligence.

| Step                   | P1 (usability)                                   | P2 (controlled)                                                |
| ---------------------- | ------------------------------------------------ | -------------------------------------------------------------- |
| Community              | Synthetic communities                            | Programme-approved list of units for the site (D-05, D-19)     |
| Assessment             | Scripted scenarios, reviewed wording             | Real people after notice (D-08); reviewed wording (D-22)       |
| Risk assessment        | Demonstration rules on scenarios, labelled       | Approved rule set, or approved no-rule mode (D-10)             |
| Referral               | To synthetic facilities                          | To confirmed facilities only (D-06)                            |
| Facility interaction   | Facility interface prototype with scripted cases | Real facility interface; arrival and outcome recorded          |
| Follow-up              | Scripted                                         | CHW follow-up with in-app reminders                            |
| Programme intelligence | Synthetic aggregates                             | Real aggregates with suppression (D-18) and ward-level display |

In P2 the paper process continues in parallel. Care never depends on the app.

## 4. Pilot technology

Based on the actual repository, classified three ways. "Reusable" means the code and tests already exist and can be moved with changes only at the edges.

### 4.1 Usable from the current prototype

| Component                                                                             | Where                                | Note                                                                       |
| ------------------------------------------------------------------------------------- | ------------------------------------ | -------------------------------------------------------------------------- |
| Domain model and validation (strict schemas, no free text)                            | `packages/domain`                    | Add version, device and consent hook fields; keeps the minimal-data stance |
| Rule evaluation engine, schema, forbidden-wording check                               | `packages/rules-engine`              | Evaluator reusable; the rule content is not                                |
| Programme aggregation (signals, vulnerability, direction, monitoring)                 | `packages/programme`                 | Needs suppression and server-side scope; index definition open (D-19)      |
| API contract                                                                          | `packages/api-contract`              | Becomes the OpenAPI source                                                 |
| CHW app screens, navigation, i18n, design system, accessibility patterns              | `apps/web`, `packages/design-system` | Reusable; needs reviewed wording                                           |
| Offline record + outbox, single-flight sync, ordering, recovery, duplicate protection | `apps/web/src/offline`               | Proven in tests; needs device identity, encryption, new states             |
| Test suites (236 + 36)                                                                | repository                           | Continue to run; extend per `TESTING_ROADMAP.md`                           |
| Synthetic data generator                                                              | `packages/demo-data`                 | Remains the only data in development and test environments                 |

### 4.2 Must be implemented before the controlled field pilot (P2)

| Component                                                                    | Why                                                                           | Decision / doc                           |
| ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------- |
| Real server, database, environments                                          | The mock server runs in the browser                                           | D-03, D-04, D-01                         |
| Real authentication and MFA, device registration                             | The prototype PIN is unchecked; role comes from a header                      | D-02, D-25                               |
| Server-side authorisation with row-level security                            | The mock trusts headers and client ids                                        | `PRODUCTION_RBAC.md`                     |
| Server-side rule evaluation and approved rule set (or approved no-rule mode) | The server trusts the client's risk level; the rule set is demonstration-only | D-10, `CLINICAL_VALIDATION_PLAN.md`      |
| Installable PWA with encrypted local store                                   | No manifest or service worker today; local store unencrypted                  | D-14                                     |
| Facility interface                                                           | No facility screens exist                                                     | `PILOT_READINESS.md`                     |
| Supervisor role and view                                                     | Not in the prototype                                                          | D-16                                     |
| Small-number suppression                                                     | Not in the prototype                                                          | D-18                                     |
| Audit logging for the full event list                                        | 3 events today                                                                | `PRODUCTION_RBAC.md` section 7           |
| Consent or notice hook and record                                            | No such field                                                                 | D-08                                     |
| Backup, restore, monitoring, incident procedures                             | None                                                                          | `TECHNICAL_RECOMMENDATIONS.md`           |
| CI pipeline                                                                  | None                                                                          | `TECHNICAL_RECOMMENDATIONS.md` section 9 |
| Reference data import (units, facilities) with versioning                    | Synthetic only                                                                | D-05, D-06                               |
| Reviewed wording and translations                                            | English placeholder                                                           | D-22                                     |

### 4.3 May remain mocked in an early usability pilot (P1)

| Component                                | Condition                                                                             |
| ---------------------------------------- | ------------------------------------------------------------------------------------- |
| Mock server in the browser               | No real data; clearly labelled demonstration                                          |
| Demonstration rule set                   | Only on scripted scenarios and visibly labelled; never presented as clinical guidance |
| Fictional geography and map              | Labelled; no claim that it represents any place                                       |
| Simulated sign-in and roles              | Participants told it is a simulation; no real credentials                             |
| Programme intelligence on synthetic data | Used to judge layout and usefulness, not to draw conclusions                          |
| Facility interface as a prototype        | Scripted use only                                                                     |
| Notifications, integrations, exports     | Not present                                                                           |
| Local storage without encryption         | Acceptable only because no real data is entered                                       |

P1 must not collect real personal data from participants beyond what usability research ethically requires (for example observation notes), under the organisation's research-participant rules. If P1 uses real CHWs' time or feedback, the usual consent for that activity applies.

## 5. Pilot data

### 5.1 Data required for functionality (P2)

Taken from the actual schemas; each field needs its purpose confirmed in the privacy review (`STAGE5_PRIVACY_READINESS.md` section 6).

| Data                                                                                      | Used for                                                                        |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Community (unit) id, CHW id, assessment time                                              | Scope, assignment, ordering                                                     |
| Age group, sex                                                                            | Rule inputs; equity monitoring                                                  |
| Reported symptoms, duration, progression                                                  | Rule inputs                                                                     |
| Exposure answers (four tri-state answers) and WASH answers (four)                         | Rule inputs and context; WASH may belong at area level instead (to be reviewed) |
| Risk level, reasons, rule set id, version, hash, evaluated-by (server)                    | Decision support and audit                                                      |
| Referral: destination facility, stage history with timestamps, referral code              | Referral loop                                                                   |
| Facility outcome fields (arrival, outcome category)                                       | Closing the loop                                                                |
| Follow-up: person reached, attended facility, condition category, further referral needed | Follow-up                                                                       |
| Notice version and time                                                                   | Notice record (D-08)                                                            |
| Device id, app version, record version                                                    | Sync and conflict handling                                                      |

### 5.2 Data required for evaluation

Derived from the above for the indicators in `PILOT_READINESS.md` section 4: timestamps (assessment, referral, each stage, follow-up), completion flags, counts of records created offline and their sync times, duplicate flags from reconciliation, device versus server rule mismatch counts, support requests, usability measures from observation and questionnaires, programme feedback. Evaluation uses aggregates or de-identified extracts wherever possible. A person-level evaluation extract needs a separate approval (D-11).

### 5.3 Data that should not be collected unless justified

Name, phone number, address, national or health identifier, exact household location or GPS, photographs, free-text notes, household member details, biometric data, religion or ethnicity, contact details of relatives, and any field not tied to a stated purpose. **The prototype collects none.** Adding any needs a recorded purpose, a minimal design, privacy review and, where relevant, ethics review.

## 6. Pilot operating model (outline)

- **Roles:** pilot lead, clinical lead, data owner, security lead, support lead, rule board, GIS and reference-data steward.
- **Support:** a route and response times suited to field hours; a paper fallback; scheduled check-ins.
- **Training:** workflow, wording, limitations of the rule output, privacy rules, device security, what to do when the app fails.
- **Safety:** a safety-reporting route; stop conditions defined before start (`PILOT_READINESS.md` section 5.6).
- **Change control:** no rule, wording or role change during the pilot except through governance.
- **Review points:** after supervised start, at the end of the pilot, and on any stop condition.

## 7. Success measures

The indicators in `PILOT_READINESS.md` section 4 apply. The pilot's primary question is operational ("can the loop run safely?"), not clinical performance. No claim about detection accuracy or health impact will be made from the pilot unless D-11 designs an evaluation that supports it.

## 8. Site selection criteria (for the owner; no site is proposed)

The programme owner may weigh: programme priority and approvals; presence of CHWs already trained in the relevant activities; at least one reachable facility willing to confirm and use the interface; adequate connectivity for periodic sync and tolerance of offline days; safe access for supervision; languages matching reviewed content; a boundary and facility reference that exists and is licensed; community acceptance; and a size small enough to supervise closely. Fairness and avoiding burden on over-researched communities should be considered.

## 9. Exit and learning

At the end of P2: a review of indicators, safety reports and feedback; a decision to stop, extend, adjust or prepare for scale; deletion or retention of pilot data per D-07; a handover record; publication or sharing only as D-11 and agreements allow.
