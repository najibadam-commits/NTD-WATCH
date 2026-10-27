# Stage 6 decision register

**Status:** register of decisions arising from Stage 6, updated 2026-10-18. **No decision has been made and the Stage 6 outcome is OPEN.** The outcome **criteria are now written down and LOCKED (v1.1, section 3) before any stakeholder evidence is collected**; locking the criteria is not a decision on the outcome. Sponsor ratification of the criteria (S6-02) is still pending. "Current position" is a proposal and is not binding. This register **does not overwrite or amend** the 25 decisions in `docs/STAGE5_DECISION_REGISTER.md` (D-01 to D-25); it cross-references them. No Stage 5 decision status is changed by this update (section 4 notes where priority or conditions are affected).

Decision IDs are `S6-nn`. Categories use the Stage 5 codes: **P** product, **T** technical, **C** clinical/public-health, **L** legal/privacy, **O** organisational/stakeholder.

## 1. Summary

| ID    | Decision                                                                                                    | Category       | Owner                                     | Final decision                               | Stage 5 links                |
| ----- | ----------------------------------------------------------------------------------------------------------- | -------------- | ----------------------------------------- | -------------------------------------------- | ---------------------------- |
| S6-01 | Approve the Stage 6 plan, scope and sponsor; confirm Q5 wording                                             | O              | Programme leadership                      | OPEN                                         | D-09, D-23                   |
| S6-02 | Ratify the locked decision criteria v1.1 (section 3) before data collection                                 | O              | Programme leadership                      | OPEN (criteria locked, ratification pending) | all                          |
| S6-03 | Ethics route for the validation activities themselves                                                       | L              | Ethics committee                          | OPEN                                         | D-11, D-08                   |
| S6-04 | Sampling, settings and stakeholder access                                                                   | O              | Programme leadership with validation lead | OPEN                                         | D-09, D-22                   |
| S6-05 | Product form: standalone, module or extension, interoperable service, or other (standalone not the default) | O (T input)    | Programme leadership                      | OPEN                                         | D-03, D-04, D-14, D-15, D-02 |
| S6-06 | Primary user                                                                                                | P (O approves) | Product lead with leadership              | OPEN                                         | D-16, D-25                   |
| S6-07 | Approve any prototype support item only on a stakeholder-evidence trigger                                   | T              | Technical lead and product lead           | OPEN                                         | D-10                         |
| S6-08 | Clinical route: adapt existing, draft new, or no-rule operation                                             | C              | Clinical lead and programme               | OPEN                                         | D-10, D-22, D-19             |
| S6-09 | Confirm the scope boundary (no diagnosis, prescribing, outbreak declaration)                                | O              | Programme leadership                      | OPEN                                         | D-10                         |
| S6-10 | Role of the vulnerability index and WASH layer                                                              | C (P input)    | Public-health experts with programme      | OPEN                                         | D-19, D-05                   |
| S6-11 | Gate A result                                                                                               | O              | Programme leadership                      | OPEN                                         | `PILOT_GATES.md` A1-A7       |
| S6-12 | Final Stage 6 outcome: PROCEED / MODIFY / INTEGRATE / STOP                                                  | O              | Programme leadership                      | OPEN                                         | all                          |
| S6-13 | Whether to start pilot-site selection and Gate B work                                                       | O              | Programme leadership                      | OPEN                                         | D-09, Gate B                 |
| S6-14 | Whether any external communication (donor, partner, public) may mention NTD-WATCH, and on what wording      | O              | Programme leadership                      | OPEN                                         | P-9 (privacy readiness)      |

## 2. Decisions

Fields: decision; category; owner; options; evidence required; current position; final decision; date; authority; impact on product; impact on pilot.

### S6-01 Approve the plan, scope and sponsor

- **Category / owner:** O; programme leadership.
- **Options:** (a) approve as written; (b) approve with changes; (c) decline to run Stage 6; (d) narrow to desk research only.
- **Evidence required:** `STAGE6_VALIDATION_PLAN.md` read by the sponsor; confirmation of named validation lead and facilitators; confirmation of fifth question wording (the brief listed four in full).
- **Current position (proposal):** (a) or (b), with a named sponsor and a validation lead independent of the build team where possible.
- **Final decision / date / authority:** OPEN.
- **Impact on product:** none until decided.
- **Impact on pilot:** none; Gate A only.

### S6-02 Decision criteria and sufficiency of evidence

- **Category / owner:** O; programme leadership.
- **Options:** ratify the locked criteria v1.1 (section 3) as written; ratify with recorded amendments made **before** data collection; replace them (before data collection only).
- **Evidence required:** sponsor signature or minute dated before the first stakeholder contact; any amendment recorded in the change log in section 3.7.
- **Current position:** criteria are **LOCKED v1.1 (2026-10-18)** and qualitative. No numeric thresholds are set by the development team; sufficiency is stated as process rules (section 3.5). Ratification is pending.
- **Final decision:** OPEN (ratification).
- **Impact on product:** the criteria bound which outcomes are possible.
- **Impact on pilot:** none directly.

### S6-03 Ethics route for the validation activities

- **Category / owner:** L; ethics committee or institutional equivalent.
- **Options:** written determination that the activities are service evaluation or quality improvement; approval under a protocol; no determination needed (to be stated by the committee).
- **Evidence required:** the committee's written decision; consent forms; data handling plan for notes and recordings.
- **Current position:** request a determination before any session (ETH-1).
- **Final decision:** OPEN.
- **Impact on product:** none.
- **Impact on pilot:** informs the later pilot route (D-11).
- **Stage 5 link:** D-11 (evaluation design and ethics route) is **not** decided by this; it covers a later pilot.

### S6-04 Sampling, settings and access

- **Category / owner:** O; leadership with validation lead.
- **Options:** convenience sample through the sponsor (fast, biased); purposive sample across settings and seniority (recommended principle); independent recruitment channel for sceptics.
- **Evidence required:** a sampling plan listing groups, settings, language, connectivity conditions; record of who declined; no real pilot site selected.
- **Current position:** purposive, multi-setting; **does not select a pilot geography**. Settings used for validation sessions are not a pilot decision (D-09 remains open).
- **Final decision:** OPEN.
- **Impact on product:** representativeness of evidence.
- **Impact on pilot:** may inform, not decide, site selection.

### S6-05 Product form

- **Category / owner:** O with technical input; programme leadership.
- **Options:** standalone application (current prototype; **not the default**, burden of proof is on this option); module or extension on an existing platform (for example DHIS2 Community Health); interoperable service that exchanges data with existing platforms; a hybrid; none.
- **Evidence required:** WS2 platform profiles including XE-05, XE-06, XE-07; owner confirmation of hosting/extension; H4 evidence; cost and timeline comparison; leadership preference.
- **Current position:** undecided. External evidence (XE-07, XE-09) points away from standalone as a default; it does not decide the question. The integration frame in `ECOSYSTEM_LANDSCAPE_RESEARCH_PLAN.md` section 6 is the basis.
- **Final decision:** OPEN.
- **Impact on product:** determines whether the TypeScript/React app continues, becomes packages or components for another platform, or ends.
- **Impact on pilot:** determines the pilot technology.
- **Stage 5 links:** if INTEGRATE, **D-02, D-03, D-04, D-14** (identity, backend, database, client) are largely replaced by the host's choices and should be re-opened by their owner; D-15 and D-05/D-06 gain importance; D-01 and D-23 change shape. If stand-alone, D-02 to D-04 and D-14 proceed as Stage 5 describes.

### S6-06 Primary user

- **Category / owner:** P (product lead); leadership approves.
- **Options:** CHW (current assumption); supervisor; facility worker; programme officer; a combination with a defined first user.
- **Evidence required:** WS3 comparison on capacity, authority, benefit, risk, willingness (H5).
- **Current position:** CHW is an **assumption** (A2), not a finding.
- **Final decision:** OPEN.
- **Impact on product:** shapes the first workflow built and what is cut.
- **Impact on pilot:** pilot user mix.
- **Stage 5 links:** D-16 (role model), D-25 (devices), D-22 (languages).

### S6-07 Prototype support items

- **Category / owner:** T; technical lead and product lead.
- **Options:** approve none (paper mocks only, the default); approve a specific candidate item only when a named stakeholder-evidence trigger in `PROTOTYPE_VALIDATION_PLAN.md` section 9 is met and documented. Candidate items: P-1 no-rule mode switch, P-2 facilitator mode, P-3 local usability counters, P-4 facility arrival and outcome concept screen, P-5 supervisor concept screen, P-6 stronger labelling, P-7 printable scenario cards.
- **Evidence required:** a recorded validation need (what question cannot be tested otherwise), a dry run showing paper mocks are insufficient, and review that the change adds no clinical logic, authentication, infrastructure or integration; test plan.
- **Current position:** **none implemented and none recommended in advance.** Screens are not built for completeness. Facility and supervisor concepts stay paper or mock. No-rule mode is not implemented unless evidence shows it is necessary for Gate A.
- **Final decision:** OPEN.
- **Impact on product:** none unless a trigger is met.
- **Impact on pilot:** if P-1 is later justified it would also serve a no-rule first pilot.
- **Stage 5 link:** D-10 (fail-safe behaviour).

### S6-08 Clinical route

- **Category / owner:** C; clinical lead and programme.
- **Options:** adapt an existing validated algorithm; draft new rules through the panel; operate in no-rule mode only; end the decision-support feature.
- **Evidence required:** CV-1 to CV-3 outputs; panel feasibility; regulatory view (LEG-5).
- **Current position:** no proposal; the demonstration rules are not a candidate.
- **Final decision:** OPEN.
- **Impact on product:** whether a risk prompt exists at all.
- **Impact on pilot:** whether the first pilot is no-rule.
- **Stage 5 links:** D-10, D-19, D-22.

### S6-09 Scope boundary

- **Category / owner:** O; leadership.
- **Options:** confirm no diagnosis, prescribing or outbreak declaration; amend with reasons.
- **Evidence required:** minuted confirmation (M2).
- **Current position:** the boundary is already in every project document; confirmation is for Gate A6.
- **Final decision:** OPEN.
- **Impact on product / pilot:** a change would require a new safety, clinical and legal review.

### S6-10 Vulnerability index and WASH layer

- **Category / owner:** C with product input; public-health experts and programme.
- **Options:** keep as a contextual layer to be defined; remove from scope; define now with experts.
- **Evidence required:** H2 evidence on community-level decisions and data availability (XE-08 shows NTD-WASH planning exists at national and state level).
- **Current position:** the placeholder bands (30 and 45) are not validated; no definition exists.
- **Final decision:** OPEN.
- **Impact on product:** a feature kept or removed.
- **Impact on pilot:** hidden or labelled in the pilot (Stage 5 default).
- **Stage 5 links:** D-19, D-05.

### S6-11 Gate A result

- **Category / owner:** O; leadership.
- **Options:** pass; conditional pass with named conditions; fail.
- **Evidence required:** items A1 to A7 in `PILOT_GATES.md`, with the PROTOTYPE_VALIDATION_PLAN records.
- **Current position:** A4 evidenced by the Stage 6 run (project fact); all else pending.
- **Final decision:** OPEN.
- **Impact on product:** a fail on labelling or safety understanding requires design changes and re-test.
- **Impact on pilot:** a pass allows only planning toward Gate B.

### S6-12 Final Stage 6 outcome

- **Category / owner:** O; programme leadership (the developer team recommends only).
- **Options:** **PROCEED**, **MODIFY**, **INTEGRATE**, **STOP**, or INCONCLUSIVE with a named evidence step.
- **Evidence required:** the completed `STAGE6_REPORT.md`; criteria as locked in section 3; disconfirming evidence reviewed.
- **Current position:** none. **No outcome is preferred.**
- **Final decision:** OPEN.
- **Impact on product:** see section 4.
- **Impact on pilot:** see section 4.

### S6-13 Start pilot-site selection and Gate B work

- **Category / owner:** O; leadership.
- **Options:** start now; start after PROCEED/MODIFY/INTEGRATE; do not start.
- **Evidence required:** S6-12 outcome; Stage 5 decisions assigned owners.
- **Current position:** **not started automatically.**
- **Final decision:** OPEN.
- **Impact on product / pilot:** gates all later stages.
- **Stage 5 link:** D-09.

### S6-14 External communication

- **Category / owner:** O; leadership.
- **Options:** none until Stage 6 completes; limited neutral description; fuller communication after outcome.
- **Evidence required:** agreed wording that states the prototype is synthetic, unvalidated and unapproved.
- **Current position:** no donor claims; no statements of impact, accuracy, compliance or uniqueness.
- **Final decision:** OPEN.

## 3. Locked outcome criteria (v1.1)

**Locked 2026-10-18 (v1.1, after the v2 sponsor brief) before any stakeholder evidence was collected. Sponsor ratification pending (S6-02).** These criteria say how the evidence will be read. They do **not** select an outcome, and no outcome is preferred. Labels follow the research discipline: project fact (PF), external evidence (EF), stakeholder evidence (SS), expert evidence (XS), assumption (AS), unknown (UK). Published external evidence (XE items) can inform but cannot satisfy a criterion that needs stakeholder or owner confirmation.

### 3.1 Meaning of each outcome

| Outcome             | Meaning                                                                                                                                                           |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PROCEED             | Evidence supports the problem, user need, safety and feasibility, and sufficient value to justify a **controlled pilot**.                                         |
| MODIFY              | The problem is real, but the product or workflow needs substantive change before a pilot.                                                                         |
| INTEGRATE           | The problem is real, but evidence favours a capability within, or interoperable with, an existing platform rather than a standalone system.                       |
| STOP                | The evidence does not establish sufficient unmet need, value, feasibility or safety to justify continuing.                                                        |
| OPEN / INCONCLUSIVE | Not enough evidence, or conflicting evidence, to select one. A named next evidence step is recorded. INCONCLUSIVE is a permitted conclusion and is not a failure. |

### 3.2 Gates every outcome other than STOP needs

- **G1 Real, measurable operational gap not already addressed.** Independent stakeholders describe, from their own work, an unclosed step between a community-level NTD signal and coordinated public-health action (for example a referral that is not tracked, or no information returning from the facility), it matters to them, it can be characterised with at least indicative measures or records (`STAGE6_VALIDATION_PLAN.md` section 4.2; "not measurable with current records" is an unknown, not a pass), **and** it is not adequately addressed by existing surveillance, CHW, HMIS, NTD and WASH platforms in the Nigerian setting. Global platform capability alone does not show it is addressed; Nigerian configuration and field practice must be established.
- **G2 No critical safety or governance blocker.** Clinical and public-health experts see a safe route (decision support, not diagnosis; no prescribing; no outbreak declaration), and no privacy, legal or ethics question is answered in a way that prevents the activity. Legal items are questions or requirements until counsel answers; they are never treated as satisfied by assumption.
- **G3 Workload not increased without offsetting benefit.** CHWs and supervisors state that the workflow does not add reporting burden that is not offset, taking into account tools they must already use.
- **G4 An identifiable programme decision.** At least one named programme decision (who, what, how soon) that would change with the information the workflow produces.

### 3.3 Conditions for each outcome

| Outcome   | Required                                                                                                                                                                                                                                                                                                                                                                                                                        | Disqualifying (any one)                                                                                                                                                                                    |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PROCEED   | G1 to G4 met; **no host platform** confirmed by its owner or by HIS stakeholders as able to host or materially support the workflow, or hosting shown to be unworkable; standalone duplication and added burden shown acceptable; difference beyond signal generation, NTD + WASH combination and recognition tools evidenced (not asserted); a feasible route for ethics, privacy and clinical content; a named pilot sponsor. | A host owner confirms it can host the workflow with acceptable effort; unresolved safety, legal or ethics blocker; difference limited to what existing tools already do; primary user unwilling or unable. |
| MODIFY    | G1 met (the need is real), but the evidence shows a specific substantive change is needed first: a different primary user, narrower scope (for example drop the vulnerability layer), a different workflow, a different positioning, or removal of features. The change is named.                                                                                                                                               | G1 not met (use STOP); the change needed is only integration (use INTEGRATE).                                                                                                                              |
| INTEGRATE | G1 met; an owner of an existing platform (for example DHIS2 Community Health, DHIS2 NTD) or HIS stakeholders confirm it can host or materially support the workflow, or an interoperable service model is workable; standalone duplication is not justified (parallel burden, fragmentation, sustainability).                                                                                                                   | The host cannot support the key steps (for example referral closure) with acceptable effort; the host owner declines; no sustainable owner path.                                                           |
| STOP      | Any of: G1 not met (no sufficient unmet need, or already adequately solved); G2 blocked with no feasible route; G3 failed (burden outweighs value) with no change that fixes it; G4 not met (no programme decision would change); no sustainable owner or sponsor.                                                                                                                                                              | Not applicable.                                                                                                                                                                                            |

### 3.4 Order of evaluation and tie rules

1. **STOP triggers are evaluated first.** If a STOP trigger is evidenced, the outcome is STOP unless disconfirming evidence of equal weight is recorded.
2. **Standalone carries the burden of proof.** Absent affirmative evidence that no host can support the workflow, standalone PROCEED is not selected.
3. **Hybrids are allowed.** For example INTEGRATE for the workflow with a MODIFY of the governance layer; each part is recorded with its own evidence.
4. **Conflicting or thin evidence leaves the outcome OPEN** with a named next evidence step. It is not resolved by choosing the most favourable reading.
5. **Disconfirming evidence is recorded and weighed with the same care** as confirming evidence.
6. The development team recommends; **programme leadership decides** (S6-12).

### 3.5 Sufficiency of evidence (process rules, not numeric thresholds)

- A criterion is met only when evidence comes from **at least two independent stakeholder categories** (or one category plus the owner of the relevant system or process) and is recorded in the evidence register with a coded finding. Single-source statements are Low confidence.
- A criterion that depends on a system's capability (for example hosting referral) needs confirmation by that system's owner or an informed implementer; published pages (XE items) are inputs, not confirmation.
- Stakeholder evidence must come from the Nigerian programme setting. Evidence from other countries is context only.
- A prototype session reaction (preference, ease of use) never satisfies G1 to G4.
- No numeric sample sizes or percentage thresholds are set here; the sponsor may add them by amendment before data collection (section 3.7).

### 3.6 What no outcome may claim

Whatever the outcome, Stage 6 evidence does not establish clinical validity, accuracy, sensitivity, specificity, impact, cost-effectiveness, compliance, or uniqueness. PROCEED means eligibility to plan a **controlled pilot** subject to Gate B and Stage 5 decisions, not deployment.

### 3.7 Change log

| Version | Date       | Change                                                                                                                                             | Before or after evidence collection? | Authority                    |
| ------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | ---------------------------- |
| 1.0     | 2026-10-18 | Initial lock, derived from the sponsor's brief                                                                                                     | Before (no stakeholder evidence yet) | Pending ratification (S6-02) |
| 1.1     | 2026-10-18 | G1 reworded to the v2 primary question (measurable gap, not already addressed by existing platforms); INCONCLUSIVE named as a permitted conclusion | Before (no stakeholder evidence yet) | Pending ratification (S6-02) |

Any later change is added here with the reason; a change made after evidence collection starts is marked **post-hoc** and must be disclosed in `STAGE6_REPORT.md`.

## 4. How each outcome affects the Stage 5 decisions

Recorded so the effect is visible; the Stage 5 register is not edited by this document. Columns use the outcome names; "PROCEED (stand-alone)" means a standalone controlled pilot.

| Stage 5 decision                   | PROCEED (stand-alone)  | MODIFY                     | INTEGRATE                                             | STOP      |
| ---------------------------------- | ---------------------- | -------------------------- | ----------------------------------------------------- | --------- |
| D-01 hosting                       | Proceeds as written    | Scope may shrink           | Host platform's hosting governs                       | Withdrawn |
| D-02 identity                      | Proceeds               | May change                 | Largely replaced by host                              | Withdrawn |
| D-03, D-04                         | Proceed                | May change                 | Replaced by host choices (reusable packages possible) | Withdrawn |
| D-05, D-06                         | Proceed                | May change                 | Important; supplied through host                      | Withdrawn |
| D-07, D-08, D-12, D-18, D-21, D-23 | Proceed                | Reviewed against new scope | Still required (data law applies to any host)         | Withdrawn |
| D-09 pilot site                    | Opens after outcome    | Opens after redesign       | Opens in host programme                               | Withdrawn |
| D-10 rules board                   | Proceeds               | May change                 | Applies to content on host                            | Withdrawn |
| D-11 ethics                        | Proceeds               | Reviewed                   | Proceeds                                              | Closed    |
| D-13, D-20                         | Defaults               | Defaults                   | Host decides                                          | Withdrawn |
| D-14 client                        | Proceeds (conditional) | May change                 | Replaced by host client                               | Withdrawn |
| D-15 integrations                  | Proceeds (later)       | May change                 | Central                                               | Withdrawn |
| D-16 roles                         | Proceeds               | Depends on primary user    | Host roles                                            | Withdrawn |
| D-17, D-24, D-25                   | Defaults               | Defaults                   | Host policies apply                                   | Withdrawn |
| D-19, D-22                         | Proceed                | Depends on scope           | Proceed                                               | Withdrawn |

### 4.1 Effect of this update on Stage 5 decisions

No Stage 5 decision status is changed. Notes only:

- **D-15 (integrations):** priority is raised for the owner to consider, because standalone is no longer the default (XE-07, XE-09). Status unchanged.
- **D-02, D-03, D-04, D-14 (identity, backend, database, client):** now conditional on S6-05 as before; no change in status.
- **D-10 (rules board):** unchanged; WHO guidance (XE-04) is a candidate content source to be assessed, not adopted.

## 5. Procedure

For each decision: the owner reviews the evidence and criteria; records the decision, date and authority (minute or signed note); the validation lead updates this register and the evidence register; the product and technical leads record the effect on the product and pilot; Stage 5 decision owners are notified of any effect. A decision taken without the evidence listed is recorded as "decided with evidence gaps" and the gaps are named.
