# Pilot readiness (proposed)

**Status: Proposed.** This is a design for a future pilot. **No pilot location is selected** (decision D-09) and this document does not favour one. Nothing here authorises the use of real patient data. All numeric values below are labelled **proposed pilot targets**: starting points for discussion, not findings, not commitments, and not derived from any evidence in this repository. The prototype's data is synthetic, so no indicator has a baseline.

## 1. Purpose and framing

The pilot would test, in a limited and consented setting, whether the workflow the prototype demonstrates is usable, safe to operate, and useful to the programme. It is not a clinical validation of the risk rules and is not an evaluation of health impact unless D-11 designs one. It should answer operational questions: can CHWs complete it, does data reach the right people, does a referral get closed, does the programme find the aggregate view useful.

## 2. Users

| User                     | Role in the pilot                                                           | Prototype role              | Needs before the pilot                                                      |
| ------------------------ | --------------------------------------------------------------------------- | --------------------------- | --------------------------------------------------------------------------- |
| Community health workers | Assess, record, refer, follow up, work offline                              | CHW                         | Training, device, account, support contact, approved rules                  |
| CHW supervisors          | Oversee a group of CHWs, see their queue and sync status, resolve problems  | New (D-16)                  | Role built, training, aggregate-only view unless D-16 says otherwise        |
| Facility users           | Receive referrals, record arrival, assessment outcome and discharge/closure | Facility (no interface yet) | Facility interface built (a gap today); training; confirmed facility (D-06) |
| Programme officers       | Review signals and programme intelligence, take programme action            | LGA                         | Role scope, report definitions, training                                    |
| State managers           | Review state-level intelligence and approve exports                         | State                       | As above, plus export rules (D-24)                                          |
| Platform operators       | Run the system, handle incidents, reference data                            | Admin (split)               | Runbooks, on-call, role separation                                          |

The pilot size (users, sites, duration) is part of D-09 and D-11 and is not proposed here.

## 3. Pilot workflow

```text
Community -> CHW assessment -> Risk assessment -> Referral -> Facility interaction
          -> Follow-up -> Programme intelligence -> Programme action
```

| Step                   | What happens                                           | Prototype                                      | Gap before pilot                                                 |
| ---------------------- | ------------------------------------------------------ | ---------------------------------------------- | ---------------------------------------------------------------- |
| Community              | CHW works within an assigned community                 | Yes                                            | Real assignment and community unit (D-19)                        |
| CHW assessment         | Structured questions, offline capable                  | Yes                                            | Reviewed questions and translations (D-22)                       |
| Risk assessment        | Rule evaluation gives a level and reasons              | Demo only                                      | Approved rule set (D-10); server re-evaluation                   |
| Referral               | Referral code, reason, destination                     | Yes                                            | Confirmed facilities (D-06)                                      |
| Facility interaction   | Facility receives, records arrival and outcome         | Stage updates only, by CHW or admin simulation | Facility interface and access                                    |
| Follow-up              | CHW records follow-up outcome                          | Yes                                            | Reminders (D-13); linking follow-up to a person if needed (D-12) |
| Programme intelligence | Aggregated signals, vulnerability, referral monitoring | Yes (synthetic)                                | Suppression (D-18); real indicators                              |
| Programme action       | Officer records or triggers an action                  | Partial (reports, views)                       | A defined action log and escalation route                        |

## 4. Indicators

Definitions are precise so the numerator and denominator can be computed from the data model without ambiguity. "Proposed pilot target" values are for discussion and must be agreed with the programme after a baseline or readiness period. Where a target depends on a baseline that does not exist, it is marked "set after baseline".

| #   | Indicator                        | Definition                                                                                                                              | Source                              | Proposed pilot target                                                                                 |
| --- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 1   | Assessment completion rate       | Assessments marked complete / assessments started                                                                                       | `ops.assessment` status             | 90% or more (proposed pilot target)                                                                   |
| 2   | Data completeness                | Required fields present and valid / required fields expected, per submitted assessment; also share of results with unknown answers      | Server validation results           | 95% or more (proposed pilot target)                                                                   |
| 3   | Referral initiation rate         | Referrals created / assessments where the rule set recommends referral                                                                  | `ops.referral`, `ops.risk_result`   | Set after baseline                                                                                    |
| 4   | Referral completion rate         | Referrals reaching a closing stage, within an agreed window / referrals initiated. Window is a programme decision                       | `ops.referral_event`                | Set after baseline                                                                                    |
| 5   | Follow-up completion             | Follow-ups recorded by the due date / follow-ups due                                                                                    | `ops.follow_up`                     | Set after baseline                                                                                    |
| 6   | Time from assessment to referral | Median and 90th percentile of referral created minus assessment completed, using server-verified times                                  | Timestamps, with clock skew flagged | Set after baseline                                                                                    |
| 7   | System availability              | Minutes the API was available during agreed service hours / total minutes; counted separately for sync success from the user's side     | Monitoring                          | 99% in service hours (proposed pilot target)                                                          |
| 8   | Offline sync success             | Records that reached the server without manual help / records created offline; plus median time from creation to server acceptance      | `sync` metrics                      | 99% of records synced within 24 hours of connectivity (proposed pilot target)                         |
| 9   | Duplicate rate                   | Duplicate assessment or referral records found by review / records. Server blocks exact duplicates; near-duplicates are measured        | Reconciliation job                  | Below 1% (proposed pilot target)                                                                      |
| 10  | User adoption                    | Active CHWs (at least one assessment in the period) / enrolled CHWs; share of supervisors and facilities using the system               | Audit and usage logs                | Set after baseline                                                                                    |
| 11  | Usability                        | Task success and time on a standard task set observed in training; a short validated usability questionnaire; support requests per user | Observation, survey, support log    | Set with the usability lead                                                                           |
| 12  | Data quality                     | Rate of corrections, rejected records, impossible values, and mismatches between device and server rule results                         | Server and audit logs               | Set after baseline; device/server mismatch to be 0% in released rule versions (proposed pilot target) |
| 13  | Programme usefulness             | Structured feedback from programme officers and managers on whether the views changed a decision, with examples; frequency of use       | Interviews, survey, action log      | Qualitative; no numeric target                                                                        |

Safety indicators are tracked separately and have no "target": any safety report is reviewed, and referral delays or missed escalations are reviewed case by case (`RULE_GOVERNANCE.md` section 6).

**Equity and access.** Each indicator is also reviewed by sex, age group, geography and CHW to see who is missed.

**What these cannot show.** They cannot show that the rules are clinically correct, that disease burden fell, or that the signals are accurate. Claims of that kind need a designed evaluation (D-11).

## 5. Readiness gates

Every gate must be met and recorded before the pilot starts. Items are grouped by owner. A gate that is not met is a reason to wait, not to proceed with a caveat.

### 5.1 Governance and legal

- Decisions D-01, D-07, D-08, D-09, D-10, D-11, D-12, D-18, D-23, D-24 recorded.
- Legal review of the questions in `PRIVACY_SECURITY_ARCHITECTURE.md` section 13 completed, with a written position.
- Data protection impact assessment completed and signed off by the data owner.
- Ethics or equivalent approval route followed (D-11).
- Data sharing agreements signed where reference data or exchange is used.
- Named owners: data owner, security lead, clinical lead, rule board, data steward.

### 5.2 Clinical content

- A rule set approved through `RULE_GOVERNANCE.md`. The demo rule set cannot be used.
- Reviewed question wording and referral instructions in the supported languages (D-22).
- The safe-fallback behaviour approved (D-10).

### 5.3 Technical

- Production environment built as designed, separate from demonstration and test.
- Authentication, roles and per-record scoping enforced on the server, with the tests in `TESTING_ROADMAP.md` tier 2 passing.
- Risk level computed and checked on the server, not trusted from the client.
- Encryption, backups and restore tested. A restore drill completed.
- Audit log covering all access and changes in `PRODUCTION_RBAC.md`.
- Facility interface built and tested.
- **Installable app tested on the actual phones and browsers** the CHWs will use: install, offline use for days, forced refresh, storage pressure, low battery, airplane mode, app update during an unsynced queue, and sign-out. This is mandatory because the prototype is not a PWA and its offline behaviour has been shown only in a desktop test environment.
- Load test sized to the pilot; monitoring and alerting live.
- Penetration test and remediation of high findings.
- Accessibility check on the production build.

### 5.4 Data and GIS

- Real boundaries and facility list imported through the controlled process (`GIS_PRODUCTION_ARCHITECTURE.md`) and verified by their owners.
- Suppression rule implemented and tested.
- Reference data version recorded.

### 5.5 People and operations

- CHWs, supervisors, facility staff and officers trained; a competency check completed; training materials in the right languages.
- Support route with response times; who answers a CHW at 8pm; escalation path.
- Device plan (D-25): issuance or checks, SIM and data plan, charging, loss reporting.
- Lost device, suspected breach and safety-incident runbooks tested in a drill.
- Facility agreement: the facility confirms it will receive and record referrals.
- Community engagement and information about the pilot, planned with the programme.
- Paper fallback documented, so care is never dependent on the app.

### 5.6 Stop conditions

Defined before the pilot: any confirmed privacy breach, any safety incident attributable to the system, a rule defect, or sustained failure of sync or availability pauses data collection until reviewed. Who can call a pause, and who can resume, is written down.

## 6. Pilot phases (proposed)

1. **Readiness** - gates in section 5 closed; synthetic-data rehearsal in the production-like environment.
2. **Supervised start** - few users, close support, daily review; no real data until the readiness review signs off.
3. **Expansion within the pilot** - widen CHWs and sites once stop conditions have not triggered for a period the group sets.
4. **Review** - indicators, safety reports, user feedback, data quality; decision to stop, extend, adjust or move toward scale (`STAGE4_REPORT.md` sections 14 and 18).

Durations are not proposed.

## 7. Risks specific to the pilot

| Risk                                                               | Mitigation                                                                                    |
| ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| Unvalidated rules shape referral behaviour                         | Rules approved first; CHW training stresses judgement; fail-safe; monitoring                  |
| Referral never closes because the facility does not use the system | Facility interface; facility agreement; a paper-to-app fallback; completion indicator watched |
| Offline data lost on a phone                                       | Frequent sync prompts, visible queue, supervisor alerts for stale devices                     |
| Alert fatigue or over-referral                                     | Monitor level distribution and referral volume; adjust through governance, not ad hoc         |
| Aggregates re-identify people in small areas                       | Suppression before real data (D-18)                                                           |
| Staff treat signals as outbreak declarations                       | Labelling; no automated declaration; human escalation process                                 |
| Connectivity worse than assumed                                    | Measure in the readiness phase; offline-first design; SMS reminder alternative (D-13)         |
| Programme expects more than the pilot can show                     | Written scope: operational pilot; no donor-facing outcome claims from synthetic data          |

## 8. What the pilot does not do

It does not diagnose, prescribe, or declare outbreaks. It does not replace clinical judgement or national protocols. It does not make claims about disease burden based on the prototype's synthetic data.
