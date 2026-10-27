# Innovation and differentiation assessment

**Status:** an internal, evidence-limited assessment. It uses only what is documented in this project. It does **not** survey the market, does not name or evaluate specific products, and does not claim uniqueness. Statements about other kinds of tool are general descriptions of categories, from general knowledge, and are **unverified**. Every place where outside research is needed is marked **[Research]**.

**Update (Stage 6, 2026-10-18):** this Stage 5 assessment is superseded for differentiation purposes by `docs/stage6/DIFFERENTIATION_VALIDATION.md`, which compares NTD-WATCH with CIMS-NTDs, the WHO Skin NTDs App, DHIS2 NTD, DHIS2 Community Health, WASHIMS/NTD-WASH and the national digital-health direction, using external evidence read on that date. Its hypotheses are now H1 to H5; standalone is tested against integration rather than assumed. The text below is kept unchanged as the Stage 5 record.

**Rule applied:** a user-interface feature is not an innovation. A claim of difference counts only if (a) it is a property of the whole workflow or governance model, not a screen, (b) the project documents it, and (c) it is checked against what comparable tools already do. Step (c) has not been done, so no difference below is confirmed.

## 1. What the project actually contains

From the codebase and Stage 4 documents:

1. A **closed loop** in one offline-first workflow: community assessment, risk prompt with reasons, referral with a stage lifecycle, facility interaction (designed; no interface yet), follow-up, and programme-level aggregation.
2. **Rules as governed data**, with a no-diagnosis boundary, a forbidden-wording check, a determinism guarantee, and a designed approval lifecycle (`RULE_GOVERNANCE.md`).
3. **Strict separation** of person-level and aggregate schemas, and scope clamping of every programme view to the caller's geography.
4. **Offline reliability design** with a transactional outbox, idempotent keys, ordering and conflict policy (partly tested in a desktop environment).
5. **Contextual layers** (a WASH-based vulnerability index, direction of travel, referral monitoring) over community-level signals, on synthetic data.
6. **Minimal data collection:** no names, contact details, or free text.
7. **Honest status labelling:** demonstration rules, synthetic data, simulated security.

What is _not_ there: validated rules, real data, a facility interface, field evidence, any measured benefit.

## 2. Comparison by category

For each category: what it generally does (unverified), what the project might add, what it does not, and the research still needed.

### 2.1 Existing NTD surveillance tools and programme reporting

- **General description (unverified):** programmes collect case, treatment-coverage and survey data through national reporting channels and disease-specific systems, generally facility- and campaign-oriented and periodic.
- **Possible addition:** a community-level, CHW-initiated early signal layer with referral-closure tracking, intended to sit beside, not replace, programme reporting.
- **Not an addition:** NTD-WATCH does not confirm cases, does not replace case reporting or mass-treatment monitoring, and has no validated case definitions.
- **Risk:** duplicating reporting burden; conflicting numbers.
- **[Research]:** which systems the national and state programmes use now, what community-level data already flows, what gaps the programme itself identifies, and what they would accept.

### 2.2 Skin-NTD digital tools

- **General description (unverified):** tools exist for training, image-based support, and referral for skin conditions in various settings; their scope, validation and availability differ.
- **Possible addition:** a population-level signal and referral-loop view for a programme, rather than a per-patient diagnostic aid. Image-based features are **not** in NTD-WATCH.
- **Not an addition:** NTD-WATCH has no image capture, no diagnostic support, and no clinical validation. A skin-focused tool with validated image support is clearly ahead on that dimension.
- **[Research]:** a review of existing tools for skin NTDs and community case detection (functions, evidence, licensing, deployment status, interoperability), including whether any could supply the rules or workflow instead of NTD-WATCH building them.

### 2.3 DHIS2 and community health systems

- **General description (unverified):** DHIS2 is a widely used platform for aggregate health data and can be configured for tracking and community health workflows. Community health worker applications and electronic community health information systems exist and can include screening, referral and follow-up.
- **Possible addition:** a specialised NTD early-warning workflow, rule governance and programme-intelligence views. This may be better delivered as a configuration or extension of an existing platform than as a separate system.
- **Not an addition:** referral tracking and community registers are not new categories. If a deployed community health system can host this workflow, NTD-WATCH risks being redundant.
- **Key question:** is a separate application justified, or should the rules, forms and governance be delivered through an existing platform, with NTD-WATCH as the governance and intelligence layer?
- **[Research]:** what the target states already use for CHWs, whether the platform supports offline rules, referral closure and the required privacy controls, and the cost of extending versus building.

### 2.4 Existing GIS surveillance platforms

- **General description (unverified):** public-health GIS and dashboard tools map cases, coverage and risk surfaces, often at administrative level, and use environmental and WASH datasets.
- **Possible addition:** direct linkage of CHW community signals and referral outcomes to the same map with scope-limited, suppressed views.
- **Not an addition:** the current map is fictional, has one polygon per community, no CRS, no basemap, and no real data. A mature GIS platform is far ahead in spatial analysis, data sources and modelling.
- **Risk:** the community unit problem (D-19) may limit the value of spatial claims.
- **[Research]:** which platforms the programme already uses; whether signals could simply be fed to them as an aggregate layer.

### 2.5 Generic symptom-checker applications

- **General description (unverified):** consumer applications that ask about symptoms and suggest possible conditions or actions.
- **Difference that is documented:** NTD-WATCH is not consumer-facing; it is used by trained CHWs within a referral and supervision system; it produces a prompt with reasons, never a diagnosis; its rules are governed, versioned and reviewable; it feeds programme-level aggregation with scope limits.
- **Not a difference:** a structured question flow with a risk level is, on its surface, the same pattern. The difference lies in governance, workflow integration and the no-diagnosis boundary, not in the interaction.
- **[Research]:** regulatory expectations for symptom-checking and decision-support functions in the target country (L-5).

## 3. Differentiation test

| Claimed difference                                                        | Documented in project                        | Evidence it is different from comparable tools | Verdict now                                                    |
| ------------------------------------------------------------------------- | -------------------------------------------- | ---------------------------------------------- | -------------------------------------------------------------- |
| Closed loop from CHW assessment to referral closure to programme view     | Yes (prototype; facility side missing)       | Not checked **[Research]**                     | Plausible, unproven                                            |
| Governed rules with explicit no-diagnosis boundary and approval lifecycle | Yes (design; rules demonstration-only)       | Not checked **[Research]**                     | Plausible, unproven; depends on actually operating the process |
| Person versus aggregate separation with scope clamping                    | Yes (prototype)                              | Good practice, likely not unique               | A strength, not an innovation                                  |
| Offline-first sync with idempotency and conflict policy                   | Partly proven in tests                       | Standard good practice                         | Not a differentiator                                           |
| WASH-informed community vulnerability context                             | Yes (synthetic; thresholds are placeholders) | Not checked; index undefined                   | Not established                                                |
| Minimal data, no free text                                                | Yes                                          | Good practice                                  | Not a differentiator                                           |
| Honest labelling of demonstration status                                  | Yes                                          | n/a                                            | Not a product feature                                          |
| Modern accessible UI                                                      | Yes                                          | n/a                                            | **Not** a differentiator                                       |

**Assessment.** The only candidate differentiators are the **integration of the loop** and the **governance model** — i.e. an NTD-specific, governed, community-to-programme workflow. Both are plausible but unproven: the loop is unfinished and unvalidated, and the governance model is a design that has not been exercised. Nothing here is unique by construction, and each candidate could possibly be delivered through existing platforms. The project should not describe itself as unique, innovative or proven until the research below is done and a pilot shows value.

## 4. Fair statement for stakeholders today

> NTD-WATCH is a prototype that explores whether a governed, offline-capable, community-to-programme workflow for NTD early warning and referral could add value alongside existing programme systems. Its value has not been demonstrated, its rules have not been clinically validated, and its difference from existing tools has not yet been established.

## 5. External research required

| #   | Research question                                                                                                        | Who                                | Informs                         |
| --- | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------- | ------------------------------- |
| R1  | Which NTD surveillance, CHW, and health information systems operate in the target states and nationally, and their roles | Programme staff, product           | Duplication risk; D-15          |
| R2  | Existing digital tools for skin NTDs and community case detection: scope, evidence, licence, deployment                  | Clinical lead, researcher          | Build, adapt or adopt; D-10     |
| R3  | Whether an existing CHW platform could host this workflow, including offline rules and referral closure                  | Technical lead                     | D-03, D-14; avoid redundancy    |
| R4  | GIS platforms already used by the programme and the data they hold                                                       | GIS lead                           | D-05, D-19, I-5                 |
| R5  | Regulatory expectations for decision-support and symptom-checking in the target country                                  | Counsel                            | D-10; L-5                       |
| R6  | Published evidence on community-based detection and referral for the conditions in scope, and on early-warning signals   | Clinical and public-health experts | Rule content; evaluation design |
| R7  | Stakeholder needs: what decisions would programme officers change with these views?                                      | Product lead                       | Programme usefulness indicator  |
| R8  | Cost and sustainability comparison with alternatives                                                                     | Programme leadership               | Gate C12                        |

**A possible outcome of this research is that the best route is to contribute the governance and intelligence layers to an existing platform rather than build a stand-alone application.** That would be a legitimate result and should be treated as one.
