# Stage 6 master validation plan

**Status:** plan, updated 2026-10-18 by the **Stage 6 evidence-integration update** (a Stage 6 update, not a new development stage). External landscape evidence has been read and recorded (`STAGE6_EVIDENCE_REGISTER.md` section 6, XE-01 to XE-10); **no stakeholder has been interviewed, no expert consulted and no prototype session run.** The outcome criteria are locked (`STAGE6_DECISION_REGISTER.md` section 3) and the outcome is OPEN. Every result field in the Stage 6 documents is a placeholder.

**Principle.** Stage 6 generates evidence for the next decision. The existence of a working prototype is not a reason to continue building it. **PROCEED, MODIFY, INTEGRATE and STOP are all legitimate outcomes, and PROCEED is not the desired one.**

## 1. Purpose and Nigeria-first framing

**Two primary validation questions (v2, 2026-10-18).** Stage 6 must now answer these two. **Neither has been answered.**

1. **Primary question.** Does a measurable operational gap exist between community-level NTD signals and coordinated public-health action in Nigeria that is not adequately addressed by existing surveillance, CHW, HMIS, NTD and WASH platforms?
2. **Second question.** If such a gap exists, is NTD-WATCH best implemented as a standalone platform, an interoperable layer, or a capability embedded within an existing system?

**Working hypothesis (not a product decision).** NTD-WATCH is a proposed interoperable community-to-action decision-support layer for NTD programmes, designed to connect community signals, contextual risk, referral and follow-up workflows and programme intelligence with existing health and WASH information systems. Standalone remains possible but carries the burden of proof.

**Supporting framing question.** Can a lightweight, interoperable community-to-action workflow help close a real operational gap between potential NTD-related signals and timely, trackable public-health action?

**Why the framing changed (external evidence, not stakeholder validated; see `ECOSYSTEM_CAPABILITY_MATRIX.md`).** The Nigeria-first landscape reading shows that Nigeria already has community digital NTD signal generation (CIMS-NTDs, XE-01 to XE-03), WHO frontline recognition and management support for skin NTDs (XE-04), DHIS2 NTD and DHIS2 Community Health configurations with offline capture, tracking and follow-up lists (XE-05 to XE-07), national and state NTD-WASH intelligence on WASHIMS (XE-08), and a stated national direction towards interoperability and fewer fragmented platforms (XE-09). NTD-WATCH is therefore **not** tested as another standalone surveillance platform, an NTD diagnostic or AI product, or a replacement for DHIS2, CHIS, WASHIMS, CIMS-NTDs or WHO tools. It is tested only as a possible **interoperable community-to-action layer**.

**Workflow hypothesis (project hypothesis, AS).** Community signal → structured symptom, severity and context assessment → risk and context prioritisation (decision support, not diagnosis) → recommended action → referral where appropriate → referral status and follow-up → aggregate programme intelligence → programme or public-health action.

**Standalone versus integration is a first-class decision**, not an implementation detail. Standalone carries the burden of proof (H4 in `DIFFERENTIATION_VALIDATION.md`).

To establish, with evidence from the people who would own, use and be affected by it, whether NTD-WATCH should be taken toward a controlled field pilot (PROCEED), changed (MODIFY), delivered inside or interoperable with an existing platform (INTEGRATE), or stopped (STOP).

## 2. Stage 5 starting position

Taken from the repository and the Stage 4 and 5 documents (project facts, not external findings):

| Area            | Position                                                                                                                                                                                                                                 |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Product         | A prototype with synthetic data, demonstration rules (`demo-placeholder` 0.1.0), simulated access control, a browser-hosted mock server, fictional map                                                                                   |
| Tests           | 236 unit/integration and 36 end-to-end tests (re-run in Stage 6; see `STAGE6_REPORT.md`)                                                                                                                                                 |
| No-rule mode    | **Specified** (Stage 4 and 5: record, show no level, show an approved instruction). **Not implemented** in the application; a code search finds no such mode                                                                             |
| Facility side   | A facility role exists; there is no facility interface                                                                                                                                                                                   |
| Decisions       | 25 open (D-01 to D-25), classified in `docs/STAGE5_DECISION_REGISTER.md`; none made                                                                                                                                                      |
| Differentiation | Two plausible, unproven candidates at Stage 5 (integrated loop; governed rules), now narrowed to H1 to H5 in `DIFFERENTIATION_VALIDATION.md` using the external evidence. Research tasks R1 to R8 are in `docs/INNOVATION_ASSESSMENT.md` |
| Gates           | Gate A (prototype validation), B (controlled pilot), C (production scale) defined in `docs/PILOT_GATES.md`; none passed                                                                                                                  |
| Not established | That the problem is real or important; that existing systems do not already solve it; that anyone wants this; that a stand-alone product is appropriate; that rules can be validated; that legal and ethics requirements can be met      |

## 3. Stage 6 objectives

1. Determine whether the operational problem is real and important.
2. Determine what existing systems already solve, partly solve, or leave unresolved.
3. Determine whether NTD-WATCH adds meaningful, defensible value.
4. Determine the right product form: standalone, module or extension on an existing platform, interoperable service, or another model (standalone is not the default).
5. Determine whether the proposed workflow is usable and understood, including its limits.
6. Determine whether clinical and public-health validation is feasible.
7. Determine whether privacy, ethics and governance requirements can realistically be met.
8. Determine whether the concept is credible and safe enough to justify planning a controlled field pilot.

## 4. Core validation questions

The brief names five questions; four were stated in full (Q1 to Q4) and the fifth is **inferred** from objectives 5 to 8 and marked for confirmation by the programme owner.

| #   | Question                                                                                                                                                                                                                                     | Primary workstream |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| Q1  | Is the problem real? Are there important gaps between community signal, assessment, referral, facility, follow-up and programme action? If stakeholders say the gap does not meaningfully exist, change the concept                          | WS1                |
| Q2  | Is NTD-WATCH actually different? What is already solved, partly solved, and operationally unresolved? (not a competitor matrix)                                                                                                              | WS2, WS4           |
| Q3  | Who actually needs it, and who should the primary user be? The CHW-as-primary-user assumption is tested, not assumed                                                                                                                         | WS3                |
| Q4  | Should it be standalone, or a workflow and intelligence capability within or interoperable with an existing health-information platform (for example DHIS2 Community Health)? A first-class decision; standalone carries the burden of proof | WS4                |
| Q5  | (Inferred) Is the concept safe, usable, validatable and governable enough to justify planning a controlled field pilot?                                                                                                                      | WS5, WS6, WS7      |

### 4.1 Questions that must be answered before an outcome

These twelve questions drive the stakeholder work (`STAKEHOLDER_VALIDATION_PLAN.md`): (1) what happens today after a potential NTD signal; (2) where it is recorded; (3) who assesses or prioritises it; (4) how referral is initiated; (5) who owns referral completion; (6) what happens when the person does not arrive; (7) what information returns from the facility; (8) what tools CHWs already use; (9) whether NTD-WATCH would reduce or increase workload; (10) what programme decision would change; (11) whether existing DHIS2 or CHIS infrastructure can support the workflow; (12) where a validated capability should live.

### 4.2 What a "measurable gap" would mean (candidate measures, no thresholds)

The primary question asks for a **measurable** gap. These are candidate measures to be collected from programme records or stakeholder accounts; **no value is assumed and no threshold is proposed here**. Whether any is available is itself an unknown.

- Share of potential signals that receive a structured assessment.
- Share of assessed signals that are referred; share of referrals with a recorded arrival; share with a recorded outcome that reaches the CHW or programme.
- Elapsed time from signal to assessment, to referral, to arrival, to programme awareness, to programme action.
- Share of missed or unfollowed referrals, and how they are found.
- Number of reporting systems a CHW or facility must update for one signal.
- Programme decisions that were delayed or not made for want of post-signal information.

If records do not exist, the finding is "not measurable with current records", recorded as an unknown, not as "no gap". Stakeholder accounts of the gap are SS evidence; measurements, where available, are stronger.

Supporting questions the plan must also answer: Is the problem **important** (frequency, consequence, who bears it)? Who **experiences** it? What decisions would NTD-WATCH **improve**? Is the workflow **safe and understandable**? Is a **controlled pilot feasible**?

## 5. Workstreams

| ID  | Workstream                                          | Questions      | Main document                                   |
| --- | --------------------------------------------------- | -------------- | ----------------------------------------------- |
| WS1 | Problem and workflow validation                     | Q1, importance | `STAKEHOLDER_VALIDATION_PLAN.md`                |
| WS2 | Ecosystem landscape research                        | Q2, Q4         | `ECOSYSTEM_LANDSCAPE_RESEARCH_PLAN.md`          |
| WS3 | Stakeholder and primary-user validation             | Q3             | `STAKEHOLDER_VALIDATION_PLAN.md`                |
| WS4 | Differentiation and standalone-versus-integrate     | Q2, Q4         | `DIFFERENTIATION_VALIDATION.md`                 |
| WS5 | Prototype usability and safe understanding (Gate A) | Q5             | `PROTOTYPE_VALIDATION_PLAN.md`                  |
| WS6 | Clinical and public-health feasibility              | Q5             | `CLINICAL_PUBLIC_HEALTH_VALIDATION_WORKPLAN.md` |
| WS7 | Privacy, ethics and governance feasibility          | Q5             | `PRIVACY_ETHICS_VALIDATION_WORKPLAN.md`         |
| WS8 | Management review and decision                      | All            | `MANAGEMENT_VALIDATION_PLAN.md`                 |

Tracking: `STAGE6_EVIDENCE_REGISTER.md` (evidence), `STAGE6_DECISION_REGISTER.md` (decisions), `STAGE6_REPORT.md` (synthesis).

## 6. Stakeholder groups

CHWs; CHW supervisors; facility workers; LGA and programme officers; state programme officers; surveillance and M&E officers; GIS and data specialists; clinical, NTD and public-health experts; technical and platform stakeholders (owners of existing systems); programme leadership (management); and, where appropriate, community representatives (to be decided with ethics). Details in `STAKEHOLDER_VALIDATION_PLAN.md`.

## 7. Evidence required

Evidence is classed so that nothing is mistaken for something else.

| Class                      | Meaning                                                                                                                                     | Treatment                                                             |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Project fact (PF)          | True of this repository, checkable by reading it                                                                                            | Cite file                                                             |
| External finding (EF)      | Found in a named external source (published research, official documentation), with date and source recorded. **Not stakeholder-validated** | Cite source; record confidence and what could not be read             |
| Stakeholder statement (SS) | Said by an identified stakeholder category in a recorded session                                                                            | Record role, date, method; not generalised from one voice             |
| Expert statement (XS)      | Said by an identified clinical, public-health, epidemiology or digital-health expert in a recorded consultation                             | Record role, date, conflicts declared; not generalised from one voice |
| Observation (OB)           | Seen in a prototype session                                                                                                                 | Record scenario, participant category, count                          |
| Assumption (AS)            | Believed but not evidenced                                                                                                                  | Listed; converted or retired                                          |
| Unknown (UK)               | No evidence yet                                                                                                                             | Registered as an evidence gap                                         |

**Required before a recommendation can be made:** for each of Q1 to Q4, evidence from at least two independent stakeholder categories _and_ one external document or system review, or an explicit statement that it could not be obtained and why. The sufficiency rules are in `STAGE6_DECISION_REGISTER.md` section 3.5 (locked). Statements are labelled PF, EF, SS, XS, AS or UK; an assumption is never converted into a fact, and external evidence is never relabelled stakeholder evidence.

## 8. Validation methods

| Method                                           | Used for                | Safeguards                                                                                    |
| ------------------------------------------------ | ----------------------- | --------------------------------------------------------------------------------------------- |
| Desk review of documents and system descriptions | WS2                     | Source and date recorded; no claim without a source                                           |
| Key-informant interviews                         | WS1, WS2, WS3, WS4, WS6 | Open questions first; prototype shown last; consent for recording; ethics determination first |
| Process mapping workshops (current state)        | WS1                     | Map how things work today before any proposal                                                 |
| Short questionnaires                             | WS1, WS3                | Neutral wording; includes "not a problem" options                                             |
| Scripted prototype sessions (think-aloud)        | WS5                     | Synthetic data only; labelled demonstration; facilitator script                               |
| Comprehension and misuse probes                  | WS5                     | Test understanding of limits, not liking                                                      |
| Technical walkthroughs with platform owners      | WS2, WS4                | No credentials; no live access                                                                |
| Expert panel consultations                       | WS6                     | Independent members; conflicts declared                                                       |
| Counsel and ethics consultations                 | WS7                     | Questions only; answers by them                                                               |
| Decision workshop                                | WS8                     | Pre-set criteria; disconfirming evidence presented first                                      |

**Bias controls.** Show the problem before the product. Ask about current practice before proposals. Include a "devil's advocate" role. Record disconfirming evidence with equal weight. Do not let the sponsor or developer conduct sessions with their own subordinates or dependants. Report negative findings in full. Do not describe the prototype as a solution until WS1 is complete.

**Research ethics.** Interviews and prototype sessions with health workers are themselves activities that may need institutional approval, consent and data handling rules. **Ethics gate:** no interview, workshop or prototype session is held, and no participant is contacted, until the ethics and participant determination for the validation activities (E-1 in `docs/STAGE5_PRIVACY_READINESS.md`; ETH-1 in `PRIVACY_ETHICS_VALIDATION_WORKPLAN.md`) is recorded. This work does not conduct or simulate stakeholder research in code. No real patient information is discussed or recorded in any session. Legal and compliance points are questions or requirements, never claims.

## 9. Decision framework

**The criteria are written down and locked (v1.1, 2026-10-18) before any evidence collection**: see `STAGE6_DECISION_REGISTER.md` section 3 for the meaning of PROCEED, MODIFY, INTEGRATE and STOP, the four gates (real operational gap, no critical safety or governance blocker, workload not increased without offsetting benefit, identifiable programme decision), the conditions and disqualifiers, the order of evaluation (STOP first; standalone carries the burden of proof; hybrids allowed; conflicting or thin evidence leaves the outcome OPEN) and the process rules for sufficiency. Sponsor ratification is pending (S6-02). A change after evidence collection starts is recorded as post-hoc.

| Outcome       | Meaning (locked summary)                                                                                                |
| ------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **PROCEED**   | Evidence supports the problem, user need, safety and feasibility, and sufficient value to justify a controlled pilot    |
| **MODIFY**    | The problem is real but the product or workflow needs substantive change before a pilot                                 |
| **INTEGRATE** | The problem is real but evidence favours a capability within or interoperable with an existing platform, not standalone |
| **STOP**      | Evidence does not establish sufficient unmet need, value, feasibility or safety to justify continuing                   |

**The outcome is OPEN.** None is preferred; PROCEED is not the desired result. Outcomes can be combined. **INCONCLUSIVE is a permitted conclusion** and means the outcome stays OPEN with a named next evidence step.

**Who decides.** Programme leadership (D-23 owner), advised by the evidence. The developer team recommends but does not decide.

## 10. Gate A relationship

`docs/PILOT_GATES.md` Gate A items A1 to A7 are covered as follows:

| Gate A item                                    | Stage 6 coverage                                                                                         |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| A1 stakeholder review and recorded feedback    | `MANAGEMENT_VALIDATION_PLAN.md`                                                                          |
| A2 walkthroughs with each user group           | `PROTOTYPE_VALIDATION_PLAN.md`                                                                           |
| A3 demonstration labelling verified            | `PROTOTYPE_VALIDATION_PLAN.md` section 8                                                                 |
| A4 automated suite passes on clean checkout    | Stage 6 test run (`STAGE6_REPORT.md`)                                                                    |
| A5 decision owners named                       | `STAGE6_DECISION_REGISTER.md` and Stage 5 register                                                       |
| A6 scope confirmed by leadership               | `MANAGEMENT_VALIDATION_PLAN.md` decision points                                                          |
| A7 differentiation reviewed, research assigned | `DIFFERENTIATION_VALIDATION.md` (updated with external evidence), `ECOSYSTEM_LANDSCAPE_RESEARCH_PLAN.md` |

**Gate A status: not passed.** No item has validated evidence. **Gate A is not passed by running the sessions.** It is passed only when the evidence meets the pass conditions and the owner signs. Passing Gate A would not approve a pilot. It would only allow planning Gate B work.

## 11. Risks

| Risk                                                          | Effect                                   | Mitigation                                                                      |
| ------------------------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------- |
| Confirmation bias (team wants PROCEED)                        | False positive                           | Pre-set criteria; independent facilitators; devil's advocate; publish negatives |
| Politeness bias (participants approve a demo to be courteous) | Inflated enthusiasm                      | Problem-first sessions; ask for current practice; ask what they would not use   |
| Small or unrepresentative sample                              | Overgeneralisation                       | State sample and limits; avoid single-voice conclusions                         |
| Power effects (junior staff speaking in front of managers)    | Unreliable answers                       | Separate sessions by seniority                                                  |
| Stakeholder access delays                                     | Stage overruns                           | Start approvals early; accept partial evidence; mark gaps                       |
| Prototype mistaken for a product                              | Premature expectations; safety confusion | Banner; script; "demonstration" language; no donor claims                       |
| Synthetic output mistaken for real                            | Harm to credibility                      | Labelling checks (Gate A3)                                                      |
| Research itself breaches privacy or ethics rules              | Harm; reputational damage                | Ethics determination; no real patient data; consent                             |
| Landscape research relies on outdated or secondary sources    | Wrong differentiation conclusion         | Date and source each fact; confirm with system owners                           |
| Decision made on insufficient evidence                        | Wasted pilot or missed stop              | Inconclusive is permitted; explicit confidence ratings                          |
| Sunk-cost pressure                                            | Continuing because it was built          | Stage 6 principle stated to leadership; STOP and INTEGRATE are normal           |

## 12. Dependencies

- A named programme sponsor and the decision owner (D-23).
- Ethics and institutional determination for the validation activities (D-11).
- Introductions to stakeholders and systems owners (programme leadership).
- Permission to describe the project externally (P-9 in the privacy readiness list).
- Access to documents about existing systems; no credentials or live access are sought.
- Facilitators who are independent of the developers for at least the user and management sessions.
- Counsel and clinical experts' time for consultation (not for decisions).

## 13. Deliverables

All under `docs/stage6/`: this plan; `ECOSYSTEM_CAPABILITY_MATRIX.md`; `STAGE6_STAKEHOLDER_SESSION_PACK.md`; `MANAGEMENT_VALIDATION_PLAN.md`; `ECOSYSTEM_LANDSCAPE_RESEARCH_PLAN.md`; `STAKEHOLDER_VALIDATION_PLAN.md`; `CLINICAL_PUBLIC_HEALTH_VALIDATION_WORKPLAN.md`; `PRIVACY_ETHICS_VALIDATION_WORKPLAN.md`; `PROTOTYPE_VALIDATION_PLAN.md`; `DIFFERENTIATION_VALIDATION.md`; `STAGE6_EVIDENCE_REGISTER.md`; `STAGE6_DECISION_REGISTER.md`; `STAGE6_REPORT.md` (template with placeholders). Data collected later (notes, recordings, completed forms) is stored under the programme's own governance, not in the code repository.

## 14. Owners

| Function                           | Responsibility                                                                                               |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Programme sponsor / decision owner | Approves plan and criteria; makes the Stage 6 decision; authorises access                                    |
| Validation lead                    | Runs the plan; keeps registers; compiles the report (should be independent of the build team where possible) |
| Research lead                      | Landscape research (WS2)                                                                                     |
| Usability lead                     | Prototype sessions (WS5)                                                                                     |
| Clinical lead                      | WS6 consultation and expert panel                                                                            |
| Data protection officer / counsel  | WS7 answers                                                                                                  |
| Ethics contact                     | Determination for the validation activities                                                                  |
| Technical lead                     | Prototype support, test results, technical walkthroughs                                                      |
| GIS lead                           | GIS stakeholder sessions and data landscape                                                                  |

Names are not assigned here.

## 15. Proposed sequence

Aligned to the sponsor brief's execution sequence. No durations are proposed; phases are ordered, and each has an exit check. Steps 1 to 4 are done by this update; steps 5 onward are human-led and **not started**.

| Phase | Name                                      | Content                                                                                                           | Status / exit check                                        |
| ----- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| S0a   | External evidence into the register       | XE-01 to XE-10 recorded with retrieval limits                                                                     | Done in this update                                        |
| S0b   | Differentiation updated                   | `DIFFERENTIATION_VALIDATION.md` H1 to H5; six system comparisons                                                  | Done in this update                                        |
| S0c   | Criteria locked                           | `STAGE6_DECISION_REGISTER.md` section 3 (v1.1)                                                                    | Done; sponsor ratification pending (S6-02)                 |
| S0d   | Stakeholder questions and session pack    | `STAKEHOLDER_VALIDATION_PLAN.md`; `STAGE6_STAKEHOLDER_SESSION_PACK.md`                                            | Done in this update                                        |
| S0e   | **Ethics gate**                           | Ethics and participant determination for the validation activities (ETH-1); named facilitators; consent materials | **Required before any contact; not done**                  |
| S1    | Complete desk research                    | Read the primary texts still unread (XE-01, XE-02, XE-03, XE-05, XE-06); list system owners                       | Register entries updated; gaps listed                      |
| S2    | Problem-first stakeholder work            | Interviews and workflow mapping **without** showing the prototype                                                 | Q1 and Q3 evidence entered                                 |
| S3    | System-owner and HIS conversations        | Hosting, extension, interoperability, platform stance                                                             | Q2 and Q4 evidence entered                                 |
| S4    | Clinical, privacy and ethics consultation | Expert and counsel input on feasibility, not approval                                                             | WS6 and WS7 trackers updated                               |
| S5    | Prototype validation (only if indicated)  | Only after S2 and S3 show what needs testing; scripted sessions; paper mocks for facility and supervisor          | Gate A test records for the items needed                   |
| S6    | Synthesis and decision workshop           | Evidence reviewed against the locked criteria                                                                     | Decision recorded with authority, or OPEN with a next step |
| S7    | Report                                    | `STAGE6_REPORT.md` completed                                                                                      | Report reviewed and signed                                 |

S2 and S3 may overlap; S5 follows S2 (problem first). If S2 returns "not a real problem", the sequence may stop at S6 with STOP or MODIFY and S5 is not run.

## 16. Exit criteria

Stage 6 ends when all of the following are true:

1. The decision criteria were locked and ratified before data collection and any change is recorded (post-hoc changes disclosed).
2. Every question Q1 to Q5 has evidence or a documented evidence gap with a reason.
3. The evidence register has no OPEN item without an owner and a next action.
4. The Gate A pass or fail result is recorded with its evidence.
5. The decision workshop has produced one of PROCEED, MODIFY, INTEGRATE, STOP (or a named inconclusive with next step), with authority and date.
6. `STAGE6_REPORT.md` is complete, with no fabricated finding and no claim of validity, accuracy, impact or compliance.
7. Gate B work is **not** started automatically.
8. The ethics determination for the validation activities was recorded before the first contact.
