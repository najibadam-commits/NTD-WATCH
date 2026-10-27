# Stage 6 report (result document, not yet populated)

**Status: result document with no stakeholder findings and no outcome.** Updated 2026-10-18 for the Stage 6 evidence-integration update. It holds (a) project facts, (b) external evidence read in the update (XE-01 to XE-10, none stakeholder-validated), and (c) placeholders. **No stakeholder, expert, legal, ethics, prototype-session or management evidence has been collected. The outcome is OPEN and is not recommended.** Every `[PENDING]` marker must be replaced with evidence-based text, or with "evidence gap" and a reason, before the report is used. Do not fill a section with expectations, hopes or the project's own hypotheses. Findings cite register IDs in `STAGE6_EVIDENCE_REGISTER.md`. Decisions cite `STAGE6_DECISION_REGISTER.md`.

The only content that is real today is in sections 0 and 0A (project facts, external evidence read, and the status of everything else).

| Field            | Value                                                                                                                                  |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Report version   | 0.2 (evidence-integration update; unpopulated)                                                                                         |
| Date             | 2026-10-18                                                                                                                             |
| Prepared by      | [PENDING: validation lead]                                                                                                             |
| Reviewed by      | [PENDING]                                                                                                                              |
| Decision owner   | [PENDING: S6-01]                                                                                                                       |
| Criteria version | 1.0, LOCKED 2026-10-18 before any stakeholder evidence (`STAGE6_DECISION_REGISTER.md` section 3); sponsor ratification pending (S6-02) |

## 0. Preparation status (project facts)

### 0.1 Automated test results on a clean copy (2026-10-18)

A clean copy of the repository (without installed packages, build output or test results) was installed with `npm ci` and tested.

| Check                                                                          | Result                                                                                                                                                                                                                                                                                                               |
| ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm ci`                                                                       | Completed; 0 vulnerabilities reported                                                                                                                                                                                                                                                                                |
| Type check, lint, format check                                                 | Passed (`npm run check`)                                                                                                                                                                                                                                                                                             |
| Unit and integration tests                                                     | 236 passed, 17 files                                                                                                                                                                                                                                                                                                 |
| Production build                                                               | Passed                                                                                                                                                                                                                                                                                                               |
| Playwright end-to-end (including axe accessibility checks), mobile and desktop | 36 passed, 0 failed, 1.3 minutes, using the pre-installed Chromium via `CHROMIUM_PATH`. A first attempt without that variable failed to start a browser because the freshly installed Playwright expected a newer browser build than the sandbox holds; this was an environment mismatch, not an application failure |
| Application code changed in Stage 6                                            | None                                                                                                                                                                                                                                                                                                                 |
| Tests weakened or deleted                                                      | None                                                                                                                                                                                                                                                                                                                 |

**Re-run after the evidence-integration update (2026-10-18):** `npm run check` passed (236 tests in 17 files, build passed) and Playwright passed 36 of 36 (with `CHROMIUM_PATH` as above). A comparison of `apps/` and `packages/` against the earlier clean copy found no application-code difference. Only documentation changed.

These results show the Stage 1 to 3 application remains intact. They are **not** evidence of clinical validity, field reliability, accuracy, impact, security or compliance.

### 0.2 What the prototype is and is not (unchanged)

Synthetic data only; demonstration rule set `demo-placeholder` 0.1.0 (not clinically valid); simulated access control and a browser-hosted mock server; fictional map; no no-rule mode implemented; no facility screen; no supervisor role. No real patient data, production deployment, active clinical rules, live integration, or compliance claim has been introduced.

### 0.3 Stage 6 documents produced

`STAGE6_VALIDATION_PLAN.md`, `STAGE6_STAKEHOLDER_SESSION_PACK.md`, `MANAGEMENT_VALIDATION_PLAN.md`, `ECOSYSTEM_LANDSCAPE_RESEARCH_PLAN.md`, `STAKEHOLDER_VALIDATION_PLAN.md`, `CLINICAL_PUBLIC_HEALTH_VALIDATION_WORKPLAN.md`, `PRIVACY_ETHICS_VALIDATION_WORKPLAN.md`, `PROTOTYPE_VALIDATION_PLAN.md`, `DIFFERENTIATION_VALIDATION.md`, `STAGE6_EVIDENCE_REGISTER.md`, `STAGE6_DECISION_REGISTER.md`, and this document. The evidence-integration update revised the validation plan, differentiation, evidence register, decision register (criteria locked), stakeholder plan and prototype plan, and added the session pack. No application code was changed.

## 0A. Status ledger: what is collected, pending, assumed, decided, unresolved

This ledger keeps six things apart so none is mistaken for another.

### 0A.1 Evidence collected

| Class | What                                                                                                                                                                                                                                                                                                                 | Status                                                              |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| PF    | Repository facts (tests, no no-rule mode, no facility screen, no supervisor role, labelling) EV-001 to EV-004                                                                                                                                                                                                        | EVIDENCE FOUND (EV-004 in progress)                                 |
| EF    | External sources read in full: WHO Skin NTDs App (XE-04), DHIS2 Community Health (XE-07), WHO Nigeria NTD-WASH case study (XE-08), Nigeria Digital Health (XE-09)                                                                                                                                                    | EVIDENCE FOUND; not stakeholder-validated; medium confidence        |
| EF    | External sources only partly read or relayed by the brief: CIMS-NTDs papers (XE-01 to XE-03; v2 figures per brief), Nigerian DHIS2 treatment-reporting platform article (XE-11, per brief), DHIS2 NTD design page (XE-05), DHIS2 CHIS module pages (XE-06, XE-12), WHO WASH-NTD publication (XE-13), WASHIMS (XE-14) | EVIDENCE FOUND or IN PROGRESS; low confidence; primary texts unread |
| SS/XS | Stakeholder or expert evidence                                                                                                                                                                                                                                                                                       | **None**                                                            |
| OB    | Prototype session observations                                                                                                                                                                                                                                                                                       | **None**                                                            |

One discrepancy: the research brief describes DHIS2 Community Health as supporting tracking and referral; the page read supports tracking and follow-up but does not describe referral (XE-07). Referral support is unconfirmed.

### 0A.2 Evidence pending

All stakeholder evidence (12 questions across 7 personas), expert consultation, legal and ethics answers, owner confirmation of platform capabilities, the unread primary texts, any prototype session, and management review. 58 original register rows remain OPEN.

### 0A.3 Assumptions (not facts)

The workflow hypothesis (community signal to programme action); the CHW as primary user (H5); that a gap exists after the signal (H1); that a vulnerability layer adds community-level value (H2); that content governance would be needed and operated (H3); that a standalone platform is justified (H4, not the default). Assumptions A1 to A15 are in `STAKEHOLDER_VALIDATION_PLAN.md`.

### 0A.4 Decisions

- **Locked (process, not outcome):** the PROCEED / MODIFY / INTEGRATE / STOP criteria v1.1, with gates G1 to G4, conditions, order of evaluation and sufficiency rules. Sponsor ratification pending.
- **Open:** S6-01 to S6-14 (all). No Stage 5 decision (D-01 to D-25) has changed status.

### 0A.5 Unresolved questions

What happens after a signal today; whether referral is tracked and closed; who owns closure; whether CHIS or DHIS2 NTD already covers the workflow (including referral) in the target states; what a CIMS-NTDs signal triggers; whether any programme decision would change; whether the workload burden is acceptable; where a capability should live; what clinical content is approvable; what ethics and privacy routes apply.

### 0A.6 Eventual outcome

**OPEN. Not selected.** No outcome is preferred. See section 13.

### Primary questions for the report (v2)

1. Does a measurable operational gap exist between community-level NTD signals and coordinated public-health action in Nigeria that is not adequately addressed by existing surveillance, CHW, HMIS, NTD and WASH platforms? **Answer: [PENDING]. Not answered.**
2. If so, is NTD-WATCH best implemented as a standalone platform, an interoperable layer, or a capability embedded within an existing system? **Answer: [PENDING]. Not answered.**

Capability comparison across the ecosystem: `ECOSYSTEM_CAPABILITY_MATRIX.md` (global capability, Nigerian implementation and field practice kept separate). Permitted conclusions: PROCEED, MODIFY, INTEGRATE, STOP, INCONCLUSIVE.

## 1. Executive summary

[PENDING] In plain language, no more than one page: the question asked, the evidence base (what was done, with whom, how many), the main findings for Q1 to Q5 and the twelve questions, the Gate A result, the recommendation, and the main uncertainty. Include the sentence: "No clinical validity, accuracy, impact or compliance is claimed."

## 2. Problem validation (Q1, importance)

[PENDING]

| Pathway step                       | Gap recognised by (categories, counts) | Not recognised / already solved | Evidence IDs | Confidence |
| ---------------------------------- | -------------------------------------- | ------------------------------- | ------------ | ---------- |
| Community signal to CHW assessment | [PENDING]                              | [PENDING]                       |              |            |
| Assessment to referral             | [PENDING]                              |                                 |              |            |
| Referral to facility arrival       | [PENDING]                              |                                 |              |            |
| Facility outcome to CHW            | [PENDING]                              |                                 |              |            |
| Follow-up                          | [PENDING]                              |                                 |              |            |
| Information to programme action    | [PENDING]                              |                                 |              |            |

Importance (frequency, consequence, rank against other priorities): [PENDING]. Statement of whether stakeholders say the gap "does not meaningfully exist": [PENDING].

## 3. Landscape findings (Q2)

External evidence read so far is in `STAGE6_EVIDENCE_REGISTER.md` section 6 (XE-01 to XE-10) and `DIFFERENTIATION_VALIDATION.md` section 3. It is external evidence only. [PENDING] Owner-confirmed capability and Nigerian configuration. Per system profile (SYS-xxx): what exists, owner, users, function, data, workflow, what happens after a signal, referral information, what is missing, integration potential. Then the synthesis matrix: already solved / partly solved / operationally unresolved. Sources and dates for every external finding; unknowns listed.

## 4. Stakeholder findings (Q3)

[PENDING] By group: sample, settings, assumptions A1 to A15 (supported / contradicted / mixed / no evidence), key statements (role only), contradictions. **Primary-user finding:** [PENDING] with the comparison of CHW, supervisor, facility and officer candidates.

## 5. Clinical and public-health findings

[PENDING] Panel feasibility (CV-2): [Yes / Partly / No / Unknown]. Evidence source inventory (CV-3). Intended use comments (CV-1). Realistic route: adapt / draft / no-rule only / end the feature. Safety concerns and stop conditions raised by experts. Statement: the demonstration rule set remains clinically invalid.

## 6. Privacy and ethics findings

[PENDING] Roll-up from the tracker (items asked, answered, decided). Answers received with authority. Impact flags. Feasibility per group. Ethics determination for validation work (ETH-1) and for a later pilot. Statement: no compliance is claimed.

## 7. Prototype validation findings (Gate A)

[PENDING]

| Persona              | Sessions (n) | Task completion | Errors | Confusion points | Terminology issues | Safety misunderstandings | Over-trust | Friction | Usefulness (incl. "would not use") |
| -------------------- | ------------ | --------------- | ------ | ---------------- | ------------------ | ------------------------ | ---------- | -------- | ---------------------------------- |
| CHW                  | [PENDING]    |                 |        |                  |                    |                          |            |          |                                    |
| Supervisor (concept) |              |                 |        |                  |                    |                          |            |          |                                    |
| Facility worker      |              |                 |        |                  |                    |                          |            |          |                                    |
| Programme officer    |              |                 |        |                  |                    |                          |            |          |                                    |
| Administrator        |              |                 |        |                  |                    |                          |            |          |                                    |

Misunderstanding register summary and remedies: [PENDING]. Labelling check (Gate A3): [PENDING].

## 8. Differentiation findings

[PENDING]

| Hypothesis                                          | Result (supported / partly / refuted / no evidence) | Evidence IDs | Confidence | Remaining |
| --------------------------------------------------- | --------------------------------------------------- | ------------ | ---------- | --------- |
| H1a Structured assessment and prioritisation        | [PENDING]                                           |              |            |           |
| H1b Referral status and follow-up                   | [PENDING]                                           |              |            |           |
| H1c Aggregate programme intelligence and action     | [PENDING]                                           |              |            |           |
| H2 Signal plus vulnerability context                | [PENDING]                                           |              |            |           |
| H3 Governance-aware decision support                | [PENDING]                                           |              |            |           |
| H4 Standalone platform (tested against integration) | [PENDING]                                           |              |            |           |
| H5 CHW as primary user                              | [PENDING]                                           |              |            |           |

Mapping to the earlier draft numbering is in `DIFFERENTIATION_VALIDATION.md` section 7.

No uniqueness is claimed.

## 9. Standalone versus integration assessment (Q4)

[PENDING] Options compared: standalone, module or extension (for example DHIS2 Community Health), interoperable service, other. Standalone carries the burden of proof. Candidate platforms and the integration frame results (including the unread CHIS NTD page, XE-06); owners' stated positions; cost and time comparison; leadership preference; the option supported by the evidence and the conditions for it.

## 10. Major risks

[PENDING] Updated from `STAGE6_VALIDATION_PLAN.md` section 11 with risks observed during the work (bias, access, ethics delays, sample limits), and risks to the concept raised by stakeholders.

## 11. Evidence gaps

[PENDING] The list of OPEN, BLOCKED and DEFERRED register items at the time of writing, with reasons and the effect of each on confidence in the recommendation.

## 12. Gate A result

[PENDING]

| Item | Result                                                                                           | Evidence    |
| ---- | ------------------------------------------------------------------------------------------------ | ----------- |
| A1   | [PENDING]                                                                                        |             |
| A2   | [PENDING]                                                                                        |             |
| A3   | [PENDING]                                                                                        |             |
| A4   | Evidenced by section 0.1 for the Stage 6 date; re-run on the programme's machine before sessions | Section 0.1 |
| A5   | [PENDING]                                                                                        |             |
| A6   | [PENDING]                                                                                        |             |
| A7   | [PENDING]                                                                                        |             |

Overall: [PENDING: pass / conditional pass with conditions / fail]. A pass permits only planning toward Gate B.

## 13. Recommendation

**Outcome: OPEN. Not selected.** When evidence has been collected and the decision workshop has applied the locked criteria, select one and state the reasons, evidence, confidence, conditions and dissent. Do not pre-select.

- [ ] **PROCEED** toward a controlled field pilot as a distinct product
- [ ] **MODIFY** the concept (state what changes: user, scope, workflow, data, geography)
- [ ] **INTEGRATE** with or into an existing platform (state which and how)
- [ ] **STOP**
- [ ] **INCONCLUSIVE** (state the next evidence step, owner and review date)

Criteria applied (version): 1.0 (locked 2026-10-18); any post-hoc change must be disclosed here: [PENDING]. Which criteria were met, partly met, not met, or lacked evidence: [PENDING]. Disconfirming evidence considered: [PENDING].

**Effect on Stage 5 decisions:** see `STAGE6_DECISION_REGISTER.md` section 4.

**Next stage:** [PENDING: depends on outcome]. Gate B and production implementation do not start automatically.

## 14. Required statements

The report must include, unchanged, in its final version:

1. No real patient data, production deployment, active clinical rules, live integration or real facility or geography dataset was introduced by Stage 6.
2. No clinical validity, accuracy, sensitivity, specificity, health impact or regulatory or legal compliance is claimed.
3. The demonstration rule set is not clinically valid.
4. Findings are limited to the evidence listed and its stated confidence.

## 15. Sign-off

Validation lead: [PENDING]. Decision owner: [PENDING]. Date: [PENDING].
