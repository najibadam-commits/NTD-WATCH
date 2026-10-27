# Clinical and public-health validation workplan

**Status:** workplan. Nothing here has been started, reviewed or approved by any clinical or public-health body.

**Source of truth:** `docs/CLINICAL_VALIDATION_PLAN.md` (the pathway) and `docs/RULE_GOVERNANCE.md` (the mechanics). This workplan turns that pathway into actionable work packages. It adds no clinical content and **invents no rule, threshold, evidence or expert**.

> **The current demonstration rule set (`demo-placeholder` 0.1.0) is not clinically valid.** Its rules, thresholds and wording are arbitrary placeholders. It must not be used with real people, must not be described as guidance, and must not be compared with any protocol.
>
> **A working rule engine is not a rule set that is right, and NTD-WATCH does not diagnose disease** because a rule engine has been technically implemented.

## 1. Stage 6 scope: feasibility, not validation

Stage 6 does **not** validate any rules. It answers a narrower question (Q5, objective 6): **is a responsible clinical and public-health validation feasible, and by whom, under what conditions?** Concretely it establishes whether qualified experts exist and are willing, whether usable evidence and guidance sources exist, whether the intended use is acceptable to them, and whether a no-rule pilot is a sensible fallback. Work packages CV-1 to CV-3 are within Stage 6. CV-4 onward are listed so the later workload and dependencies are visible; they start only after a PROCEED (or MODIFY/INTEGRATE) decision and approval of the owner.

| Work package            | Within Stage 6?                                    |
| ----------------------- | -------------------------------------------------- |
| CV-1 Intended use       | Yes (draft for expert comment)                     |
| CV-2 Expert selection   | Yes (identify and sound out; no appointments)      |
| CV-3 Evidence gathering | Scoping only: identify what exists and who owns it |
| CV-4 to CV-13           | No; planned only                                   |

## 2. Required expert roles

Roles, not names. Appointment is by the programme owner (D-10).

| Role                                   | Needed for                                      | Independence requirement                                                                   |
| -------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Clinical lead (NTD experience)         | Accountability for clinical content             | Not the developer or sponsor                                                               |
| NTD programme technical officer        | Alignment with national and state guidance      | Represents the programme                                                                   |
| Public-health / epidemiology expert    | Signal definitions, monitoring, evaluation      |                                                                                            |
| Primary-care / community-health expert | Realism for CHWs                                |                                                                                            |
| **Independent reviewer**               | Second review                                   | Not part of authoring team, first reviewers or implementer; preferably another institution |
| Human-factors / communication expert   | CHW comprehension in the pilot languages        |                                                                                            |
| Statistician                           | Test-set design, agreement measures, monitoring |                                                                                            |
| Rule approval board members            | Approval                                        | Quorum and composition decided in D-10                                                     |
| Technical validator                    | Technical verification                          | Not the author                                                                             |

Conflict-of-interest declarations for every role. At least one reviewer independent of the programme implementer.

## 3. Work packages

Status values: NOT STARTED, IN PROGRESS, BLOCKED, DONE. All are NOT STARTED.

### CV-1 Intended use

| Item         | Detail                                                                                                                                                                                                                                                                            |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Activity     | Draft an intended-use statement: user (CHW), population and setting, purpose (screening prompt and referral), decisions informed, explicit exclusions (diagnosis, treatment, outbreak declaration), consequences of errors (missed referral, unnecessary referral, alert fatigue) |
| Inputs       | Stakeholder findings (WS3); programme documents; `STAKEHOLDER_REVIEW.md`                                                                                                                                                                                                          |
| Owner        | Programme owner and clinical lead (draft by validation lead)                                                                                                                                                                                                                      |
| Output       | Intended-use statement v0.1 for expert comment                                                                                                                                                                                                                                    |
| Dependencies | Stage 6 Q1 and Q3 evidence; D-10, D-19                                                                                                                                                                                                                                            |
| Done when    | Clinical lead and at least one independent expert have commented and the owner accepts the wording                                                                                                                                                                                |

### CV-2 Expert selection

| Item         | Detail                                                                                                                                                                                          |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Activity     | Identify candidates for each role in section 2 through the programme and independent channels; sound out willingness and conditions; collect conflict declarations; record who declined and why |
| Output       | Candidate list per role; feasibility note: can a panel with independence be formed? (Yes / Partly / No)                                                                                         |
| Owner        | Programme owner                                                                                                                                                                                 |
| Dependencies | Sponsor authorisation (M5); D-10                                                                                                                                                                |
| Done when    | Feasibility note recorded in the evidence register. **No appointment is made in Stage 6.**                                                                                                      |

### CV-3 Evidence gathering (scoping)

| Item         | Detail                                                                                                                                                                                                                                                                                                                                                             |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Activity     | Experts list the categories of source they would accept: national and state guidance and case definitions; international normative guidance; published studies; existing validated tools or algorithms; local data (only if approved); consensus where evidence is thin. Identify owners and licences. Record which exist and whether they can be adapted (R2, R6) |
| Output       | Evidence source inventory (class EF once confirmed) and gap list. **No evidence is cited in this repository until an expert supplies and verifies it.**                                                                                                                                                                                                            |
| Owner        | Clinical lead with research lead                                                                                                                                                                                                                                                                                                                                   |
| Dependencies | CV-2; `ECOSYSTEM_LANDSCAPE_RESEARCH_PLAN.md` areas 3.3 and 3.4                                                                                                                                                                                                                                                                                                     |
| Done when    | Inventory complete enough for experts to say: adapt an existing algorithm, draft new rules, or run no-rule mode only                                                                                                                                                                                                                                               |

### CV-4 Rule drafting or adaptation (later)

Experts choose to adapt an approved algorithm or draft new rules. Requirements: wording passes the forbidden-text check; missing and unknown answers fail safe; thresholds justified in writing; each rule states what it aims to catch and likely misses; each rule linked to evidence or marked consensus. Output: a draft rule set version in `DRAFT` status held in the governance store, not as an active file. Owner: clinical lead. Dependencies: CV-1, CV-3, D-10, D-22.

### CV-5 First clinical and public-health review (later)

Written review of each rule, threshold, action text and limitation against evidence and intended use; author responds; disagreements recorded. Owner: clinical reviewers. Output: review record.

### CV-6 Technical validation (later)

Schema valid; forbidden-wording check; determinism; test cases pass; comparison with previous version; device versus server equivalence once a server exists. Owner: technical validator (not the author). Output: validation report. This proves implementation, not correctness.

### CV-7 Independent second review (later)

Independent reviewer examines evidence, first review and validation report, and may reject. Output: written second review.

### CV-8 Test scenarios and agreement testing (later)

Expert-written scenarios (synthetic, not real records) with expected levels written independently of the current output; boundary, missing-answer, combination and subgroup cases; an expert panel rates a scenario set independently; agreement measured by the statistician. **The agreement measure and acceptable level are fixed before the test is run; no level is proposed here.** Output: case set in the governance store; agreement report.

### CV-9 CHW comprehension check (later)

With CHWs, not developers: do they understand the questions, the level, the reasons, the suggested action, and the limitations in their language? Do they over-trust or ignore the output? This overlaps with Gate A observations (`PROTOTYPE_VALIDATION_PLAN.md`) but uses the candidate wording. Findings can require re-review. Owner: human-factors expert with the usability lead.

### CV-10 Approval (later)

The board records its decision with scope, effective date and review date, using the metadata in `RULE_GOVERNANCE.md` section 3. Signed by named approvers. Only an approval record makes a rule set eligible to be active; editing a file never does.

### CV-11 Versioning and release (later)

Immutable semantic versions; signed bundle; release to the pilot geography first; CHW training before effect; rollback and suspension procedures tested. Owner: release manager (cannot approve).

### CV-12 Monitoring (later)

Distribution of levels, unknown-answer rate, device versus server mismatch, CHW disagreement reports, referral outcomes (as a signal, not proof), safety reports, equity checks. A trigger opens a review; it never changes a rule automatically.

### CV-13 Periodic revalidation (later)

Mandatory review date and hard expiry; earlier triggers (guidance changes, new case definition, safety report, drift, population or language change). Repeat CV-5 to CV-10 for changes.

## 4. Evidence requirements

For the validation to proceed, the following evidence must be available and recorded (none is currently held):

| Requirement                                                      | Held now?                            |
| ---------------------------------------------------------------- | ------------------------------------ |
| Programme-approved intended use                                  | No                                   |
| Named, independent expert panel and board                        | No                                   |
| Source guidance and case definitions with owners and permissions | No                                   |
| A rule set or algorithm to review or adapt                       | No (the demo set is not a candidate) |
| A statistical plan for agreement testing, set before testing     | No                                   |
| CHW comprehension results in the pilot languages                 | No                                   |
| Ethics determination for any evaluation of performance           | No                                   |
| Regulatory position on decision-support status                   | No (a question for counsel)          |

## 5. Dependencies and open decisions

| Decision   | Effect on this workplan                                                                                                  |
| ---------- | ------------------------------------------------------------------------------------------------------------------------ |
| D-10       | Board, quorum, independence, fail-safe wording                                                                           |
| D-11       | Whether a performance study (separate from this validation) is planned                                                   |
| D-19       | What the vulnerability index shows and whether it is ever used in decisions (index definition is clinical/public-health) |
| D-22       | Languages and translation review for CHW comprehension                                                                   |
| D-08, D-12 | What data may be used for evaluation                                                                                     |
| L-5        | Whether showing a level makes the product regulated decision support                                                     |
| R2, R6     | External research on existing tools and evidence                                                                         |

## 6. No-rule mode

No-rule mode is the safe state when no approved, valid rule set exists. It is the expected state for a first controlled pilot unless validation completes.

**Requirements (specified, not implemented):**

1. The CHW records the structured assessment as usual.
2. The app shows **no risk level, no reasons derived from rules, and no urgency indicator**.
3. The app shows the programme-approved instruction for this state (wording to be approved by clinical reviewers; for example to follow national guidance and refer if concerned). No instruction text is proposed here.
4. Referral remains available under CHW judgement, without a rule recommendation.
5. Records state that no rule set was applied (`ruleSetId` and `ruleSetVersion` null, as the schema already allows for unclassified results) and record why.
6. Aggregates must not present "signals" derived from absent levels; programme views show counts of assessments and referrals only, and label signals as unavailable.
7. The server (when it exists) refuses to load any rule set without a valid approval record, and the pilot environment refuses `demo-` sets.
8. Training makes clear that the app is recording and prompting a referral process, not assessing risk.

**Current implementation status:** the application has **no no-rule mode** (a code search finds none). It always runs the demonstration rule set, with demonstration banners. For Stage 6 usability sessions, either synthetic demonstration logic with prominent labelling is used, or, **only if expert or programme evidence shows that testing it is necessary for Gate A**, a no-rule mode is built as a small prototype enhancement (`PROTOTYPE_VALIDATION_PLAN.md` section 9, support item P-1, evidence trigger required). No-rule mode is **not** to be built for completeness and is not implemented. Neither option introduces a clinical rule.

**External guidance note (EF, XE-04):** WHO already provides a Skin NTDs App with an offline algorithm for diagnosis and management decisions for 24 skin diseases. Any rule content NTD-WATCH might one day carry would need to be adapted from approved sources by qualified experts, not invented here; NTD-WATCH must not duplicate recognition or diagnosis. Whether and how existing WHO guidance can be used is a question for the clinical panel.

## 7. Stage 6 outputs from this workstream

For `STAGE6_REPORT.md`, "Clinical/public-health findings":

- CV-1: draft intended use and expert comments (placeholder).
- CV-2: panel feasibility (Yes / Partly / No) and who declined.
- CV-3: evidence source inventory and gaps.
- A statement of whether (a) adapting an existing validated algorithm, (b) drafting new rules, or (c) no-rule operation only is the realistic route.
- Expert views on harm potential and the stop conditions.

If the experts judge that responsible validation is not feasible, the finding supports MODIFY (for example no-rule recording and referral tracking only) or STOP, and is reported as such.
