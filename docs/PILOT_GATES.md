# Pilot readiness gates

**Status:** Proposed checklist. Gates are cumulative: Gate B includes Gate A, and Gate C includes Gate B. A gate is passed only when every required evidence item exists, the owner has signed, and the pass condition is met. A gate that is not met means wait. "Outstanding risks" are the risks that remain even when the gate is passed, so the decision-maker sees them.

Owners are functions, not people. Evidence is stored in the programme's governance record, not in the code repository. No numeric acceptance values are invented here; where a value must be set, the owner sets it and records it before testing.

## Gate A: Prototype validation

**Question:** can stakeholders use and understand the system?

**Scope:** the existing prototype with synthetic data, plus the stakeholder review package. No real data. Corresponds to pilot stage P1 (`PILOT_BLUEPRINT.md`).

| #   | Required evidence                                                                                                                                      | Owner                           | Pass condition                                                                  |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------- | ------------------------------------------------------------------------------- |
| A1  | Stakeholder review package (`STAKEHOLDER_REVIEW.md`) presented to programme leadership, with recorded feedback                                         | Product lead                    | Presented; feedback and decisions recorded                                      |
| A2  | Prototype walkthroughs with each user group (CHW, supervisor, facility, programme officer, administrator) using scripted synthetic scenarios           | Product lead and usability lead | Each group completed the scripted tasks; observed problems logged with severity |
| A3  | Demonstration labelling verified on every screen and export (synthetic data, demonstration rules, fictional map)                                       | Product lead                    | No screen presents synthetic or demonstration output as real or validated       |
| A4  | Existing automated suite passes (`npm run check`; Playwright where run) on a clean checkout                                                            | Technical lead                  | All tests pass; results recorded with commit id                                 |
| A5  | Open decisions classified and owners named (`STAGE5_DECISION_REGISTER.md`)                                                                             | Product lead                    | Every D-xx has a named owner who has acknowledged it                            |
| A6  | Scope confirmation: leadership confirms the pilot concept and that NTD-WATCH is a screening and referral prompt, not diagnosis or outbreak declaration | Programme leadership            | Written confirmation                                                            |
| A7  | Differentiation and fit reviewed with programme staff (`INNOVATION_ASSESSMENT.md`), with external research needs assigned                              | Product lead                    | Review held; research tasks assigned                                            |

**Fail conditions:** stakeholders cannot complete core tasks; confusion about what the system claims; any tendency to treat synthetic output as real.

**Outstanding risks at pass:** usability findings from scripted scenarios may not predict field use; stakeholder enthusiasm is not evidence of clinical value; the offline claim is untested on phones.

## Gate B: Controlled field pilot

**Question:** can approved users safely use the system with controlled real-world data?

**Scope:** pilot stage P2. All Gate A items plus the following. Real data is entered only after every item below is complete.

### B.1 Governance and legal

| #   | Required evidence                                                                                                                                                             | Owner                                    | Pass condition                                                                        |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------- |
| B1  | Decisions recorded: D-01, D-02, D-03, D-04, D-07, D-08, D-09, D-10, D-11, D-12, D-14, D-16, D-18, D-21, D-23, D-25; defaults confirmed for D-13, D-15, D-17, D-19, D-20, D-24 | Programme leadership and decision owners | Each has outcome, date, decider and authority                                         |
| B2  | Written legal and privacy position on the questions in `STAGE5_PRIVACY_READINESS.md` sections 2 to 12                                                                         | Counsel and data protection officer      | Written answers received; conclusions applied to design; no unresolved high-risk item |
| B3  | Data protection impact assessment, if counsel confirms it is required (recommended regardless)                                                                                | Data owner                               | Completed and signed by the accountable owner                                         |
| B4  | Ethics or institutional determination and approvals                                                                                                                           | Ethics committee and programme           | Approval or written determination that none is required                               |
| B5  | Approvals from health authorities, facilities and community leaders as E-2 requires                                                                                           | Programme leadership                     | Letters on file                                                                       |
| B6  | Processing and data sharing agreements signed                                                                                                                                 | Data owner and counsel                   | Signed                                                                                |
| B7  | Named roles: data owner, security lead, clinical lead, rule board, reference data steward, support lead                                                                       | Programme leadership                     | Named and accepted                                                                    |

### B.2 Clinical and public-health

| #   | Required evidence                                                                                                             | Owner                        | Pass condition                                                                                |
| --- | ----------------------------------------------------------------------------------------------------------------------------- | ---------------------------- | --------------------------------------------------------------------------------------------- |
| B8  | Either an approved rule set (through `CLINICAL_VALIDATION_PLAN.md`) or an approved no-rule mode                               | Clinical lead and rule board | Approval record exists and verifies; demonstration rules cannot load in the pilot environment |
| B9  | Reviewed question wording, referral instructions and safe-fallback text in the pilot languages; comprehension check with CHWs | Clinical lead                | Review and comprehension results recorded; changes re-approved                                |
| B10 | Safety reporting route and stop conditions defined and agreed                                                                 | Clinical lead and pilot lead | Written and communicated                                                                      |
| B11 | Facilities confirmed as referral destinations                                                                                 | Programme and facilities     | Each facility confirmed in writing; verification state `CONFIRMED_BY_OWNER`                   |

### B.3 Technical and security

| #   | Required evidence                                                                                                                                                            | Owner                            | Pass condition                                        |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- | ----------------------------------------------------- |
| B12 | Production environment separate from development and test; development and test confirmed free of real data                                                                  | Technical lead                   | Configuration and data inventory reviewed             |
| B13 | Real authentication with MFA by role; device registration                                                                                                                    | Technical and security leads     | Tests for sign-in, expiry, revocation pass            |
| B14 | Authorisation matrix test (every role by endpoint by scope) and row-level security tests pass; server ignores tampered risk level, CHW id and stages                         | Technical lead                   | All cases pass; results recorded                      |
| B15 | Encryption in transit and at rest verified; on-device encryption implemented; key management documented                                                                      | Security lead                    | Verified by test and review                           |
| B16 | Server-side rule evaluation under the approved version; device versus server equivalence on the case set                                                                     | Technical and clinical leads     | Zero mismatches on the agreed case set                |
| B17 | Small-number suppression implemented and tested for differencing disclosure                                                                                                  | Statistician and technical lead  | Rule recorded in D-18; tests pass; reviewer sign-off  |
| B18 | Audit logging for the event list; chain verified; no role can edit or delete                                                                                                 | Security lead                    | Tests pass                                            |
| B19 | Installable app tested on the actual phones and browsers (install, days offline, restart, storage pressure, clock change, update with unsynced queue, two devices, sign-out) | Technical lead and field testers | Matrix passes; failures fixed and retested            |
| B20 | Sync failure injection tests (timeouts, duplicates, out of order, partial batches, token expiry) show no lost or doubled record                                              | Technical lead                   | All scenarios pass                                    |
| B21 | Facility interface built and tested with facility staff                                                                                                                      | Product and technical leads      | Facility staff complete scripted tasks                |
| B22 | Backup and restore drill executed into an empty environment                                                                                                                  | Technical lead                   | Restore succeeds and integrity checked; time recorded |
| B23 | Independent penetration test of staging; high and critical findings fixed and retested                                                                                       | Security lead                    | Retest report                                         |
| B24 | Load and slow-network tests sized to the pilot                                                                                                                               | Technical lead                   | Targets set by the owner before testing are met       |
| B25 | Monitoring and alerting live; on-call named; incident exercise held                                                                                                          | Technical and support leads      | Exercise report                                       |
| B26 | Continuous integration gating merges; secrets and dependency scans clean                                                                                                     | Technical lead                   | Pipeline evidence                                     |
| B27 | Accessibility checks (automated and manual) on the production build                                                                                                          | Product lead                     | Findings fixed or accepted by the owner               |

### B.4 People and operations

| #   | Required evidence                                                                               | Owner                                  | Pass condition                                              |
| --- | ----------------------------------------------------------------------------------------------- | -------------------------------------- | ----------------------------------------------------------- |
| B28 | Training delivered and competency checked for each user group; materials in the right languages | Pilot lead                             | Records on file; competency criteria set beforehand and met |
| B29 | Support route with response times; paper fallback documented                                    | Support lead                           | Tested in a drill                                           |
| B30 | Device plan (D-25) executed: devices enrolled, security baseline, loss procedure drilled        | Programme leadership and security lead | Drill report                                                |
| B31 | Lost device, suspected breach and safety-incident runbooks exercised                            | Security lead                          | Exercise reports                                            |
| B32 | Community information and notice process ready (D-08)                                           | Pilot lead and ethics                  | Materials approved                                          |
| B33 | Indicators, data sources and review points agreed; baseline readiness period defined            | Evaluation lead                        | Written plan                                                |

**Fail conditions:** any item incomplete; any unresolved high-risk finding; any use of demonstration rules in the production environment.

**Outstanding risks at pass:** unvalidated clinical performance (advisory only); connectivity worse than assumed; facilities not adopting the interface; small-area disclosure despite suppression; reliance on a small team; unforeseen legal changes; human-factor errors.

## Gate C: Production scale

**Question:** can the system operate securely and reliably at programme scale?

**Scope:** all of Gate B, plus evidence from the pilot and scale-readiness items.

| #   | Required evidence                                                                                                                 | Owner                                 | Pass condition                                                                   |
| --- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | -------------------------------------------------------------------------------- |
| C1  | Pilot review: indicators, safety reports, defects, user feedback, data quality                                                    | Pilot lead and evaluation lead        | Reviewed by leadership; written go decision with conditions                      |
| C2  | Evaluation of rule performance appropriate to the claimed use, designed with experts and ethics approval (D-11), results reviewed | Clinical lead and evaluation lead     | Results reviewed by the rule board; claims limited to what the evidence supports |
| C3  | Regulatory position confirmed in writing (device or decision-support status)                                                      | Counsel                               | Written position; obligations planned                                            |
| C4  | Scale tests: load, soak, growth in devices and map data, capacity plan, cost model                                                | Technical lead                        | Owner-set targets met                                                            |
| C5  | Resilience: disaster recovery plan with recovery time and recovery point set by the programme; rehearsed                          | Technical and security leads          | Rehearsal report                                                                 |
| C6  | Recurring independent security assurance (penetration test cycle, access reviews, key rotation exercised)                         | Security lead                         | Schedule in place; first cycle complete                                          |
| C7  | Compliance activities determined by counsel completed and scheduled (registers, assessments, subject-request procedure tested)    | Counsel and data owner                | Evidence on file                                                                 |
| C8  | Operations: support model suited to field hours, runbooks, on-call, change management, release cadence, versioned API             | Support and technical leads           | In operation for a period set by the owner                                       |
| C9  | Rule governance running in practice: board meetings, releases, monitoring reports, a periodic review completed                    | Rule board                            | Records exist                                                                    |
| C10 | Multi-jurisdiction readiness: per-state reference data, scope tests, localisation (languages), agreements                         | Programme leadership                  | Agreements and tests in place                                                    |
| C11 | Integrations built and agreed where required (D-15), with reconciliation and monitoring                                           | Technical lead and counterpart owners | Contract tests pass; agreements signed                                           |
| C12 | Sustainability: named owner organisation, funding, maintenance team, handover and exit plan                                       | Programme leadership                  | Written and funded                                                               |
| C13 | Training and onboarding at scale (train-the-trainer), quality of supervision                                                      | Pilot and programme leads             | Plan resourced and trialled                                                      |
| C14 | Decisions D-13, D-15, D-17, D-19, D-20, D-24 recorded beyond pilot defaults                                                       | Decision owners                       | Outcomes recorded                                                                |

**Fail conditions:** safety signals unresolved; pilot indicators show the loop does not work; legal position unresolved; no sustainable owner.

**Outstanding risks at pass:** drift in rule performance; scope creep towards diagnosis; dependency on external datasets; political and funding change; equity effects across states; re-identification as the data grows.

## Sign-off record

For each gate: date, attendees, evidence reviewed, decision (pass, conditional pass with named conditions and deadlines, fail), dissent recorded, next review. A conditional pass names who verifies each condition. Real data is not entered before a Gate B pass is recorded.
