# Stakeholder validation plan

**Status:** plan and question sets, revised 2026-10-18 around the twelve post-signal questions of the Stage 6 evidence-integration update. **No stakeholder has been contacted, no ethics determination has been recorded, and no finding exists.** Nothing here is stakeholder evidence. Wording is **neutral**: it asks about current practice, problems and priorities before any proposal, and gives "no problem", "already solved" and "would not use" as ordinary answers. A question that would be answered the same way by someone who disliked the idea and by someone who liked it is acceptable; a question that assumes NTD-WATCH is valuable is not.

The session-ready version (structure, scripts, note-taking fields, coding) is `STAGE6_STAKEHOLDER_SESSION_PACK.md`. This plan sets the questions, assumptions and rules.

**Primary questions being served (v2).** (1) Does a measurable operational gap exist between community-level NTD signals and coordinated public-health action in Nigeria that is not adequately addressed by existing surveillance, CHW, HMIS, NTD and WASH platforms? (2) If so, is NTD-WATCH best a standalone platform, an interoperable layer, or a capability embedded in an existing system? Neither is answered. Supporting framing: can a lightweight, interoperable community-to-action workflow help close a real operational gap between potential NTD-related signals and timely, trackable public-health action? The stakeholder work tests whether the gap exists (H1), whether existing systems already close it (H4), and where a validated capability should live.

## 1. Rules for every session

1. **Ethics gate first.** No participant is contacted and no session is held until the ethics and participant determination for the validation activities is recorded (ETH-1 in `PRIVACY_ETHICS_VALIDATION_WORKPLAN.md`; D-11 and E-1 in `docs/STAGE5_PRIVACY_READINESS.md`). This repository does not conduct or simulate stakeholder research.
2. **Problem first, prototype last.** The twelve questions are asked before any product is shown. The prototype appears only afterwards, only where comprehension is being tested, and only if the stakeholder evidence indicates that a test is needed (`PROTOTYPE_VALIDATION_PLAN.md`).
3. **Current practice before proposals.** Start with "what happens now?"
4. **No product pitch.** The facilitator uses the neutral introduction in the session pack (section 3 there), which states that stopping, changing or integrating the idea are all possible outcomes.
5. **Disconfirmation is invited.** Each session asks what would make the idea unnecessary, already solved, or harmful.
6. **Independence.** The facilitator is not the developer, sponsor, or the participant's line manager.
7. **Consent and data.** Consent per the ethics determination. Participation is voluntary with no effect on employment or programme standing. No real patient information is discussed or recorded; participants are asked not to give identifying case details. Notes are stored under the programme's governance, not in this repository.
8. **Record roles, not names**, unless the participant agrees.
9. **Hierarchy.** Do not mix CHWs with their supervisors, or officers with their superiors, in the same session.
10. **Language.** Sessions are run in the participant's working language; the translation of the guide is checked beforehand.
11. **Incentives** follow the organisation's policy, are disclosed, and never depend on what is said.
12. **No leading questions.** The test in the session pack section 8 applies to every question before use.

## 2. The twelve questions

Every persona set draws on these. A group is asked only the questions it can answer from its own work; a question outside the group's knowledge is marked "not applicable", never answered by guesswork.

| #   | Question                                                        | What it establishes (hypothesis served)                                       | Groups best placed to answer               |
| --- | --------------------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------ |
| 1   | What happens today after a potential NTD signal?                | The current post-signal pathway (H1)                                          | CHW, supervisor, facility, LGA/state       |
| 2   | Where is it recorded?                                           | Existing records and systems; duplication risk (H1b, H4)                      | CHW, supervisor, LGA/state, digital-health |
| 3   | Who assesses or prioritises it?                                 | Who does the assessment step today, and with what information (H1a, H5)       | CHW, supervisor, facility, clinical        |
| 4   | How is referral initiated?                                      | The real referral mechanics (H1b)                                             | CHW, supervisor, facility                  |
| 5   | Who owns referral completion?                                   | Accountability for closing the loop (H1b)                                     | Supervisor, facility, LGA/state            |
| 6   | What happens when the person does not arrive?                   | Loss from referral, follow-up practice (H1b)                                  | CHW, supervisor, facility, LGA/state       |
| 7   | What information returns from the facility?                     | Return flow of outcomes (H1b)                                                 | CHW, supervisor, facility, LGA/state       |
| 8   | What tools do CHWs already use?                                 | Existing platforms and required reporting (H4, H1b)                           | CHW, supervisor, digital-health            |
| 9   | Would NTD-WATCH reduce or increase workload?                    | Burden (locked gate G3); asked only after the workflow is described neutrally | CHW, supervisor, facility, LGA/state       |
| 10  | What programme decision would change?                           | Whether any decision depends on the information (G4; H1c, H2)                 | LGA/state, supervisor, WASH                |
| 11  | Can existing DHIS2 or CHIS infrastructure support the workflow? | Hosting feasibility (H4)                                                      | Digital-health/HIS, LGA/state, supervisor  |
| 12  | Where should a validated capability live?                       | Standalone, module or extension, interoperable service, or other (H4)         | Digital-health/HIS, LGA/state, leadership  |

Questions 9 and 12 are asked last because they require a neutral description of the proposed workflow; they are asked only after questions 1 to 8 (and, for 11 to 12, only of those with knowledge of the systems).

## 3. Assumptions being tested

Each is an assumption (class AS), not a fact. Results go into `STAGE6_EVIDENCE_REGISTER.md`. Hypothesis numbers follow `DIFFERENTIATION_VALIDATION.md`.

| ID  | Assumption                                                                                                        | Hypothesis | Tested with (persona)                        |
| --- | ----------------------------------------------------------------------------------------------------------------- | ---------- | -------------------------------------------- |
| A1  | There are important gaps between community signal, assessment, referral, facility, follow-up and programme action | H1         | All personas                                 |
| A2  | The CHW is the right primary user (capacity, time, devices, motivation, literacy)                                 | H5         | CHW, supervisor, LGA/state                   |
| A3  | A CHW can complete a structured assessment in realistic field conditions, including without connectivity          | H1a        | CHW, supervisor                              |
| A4  | Facility staff will record arrival and outcome somewhere                                                          | H1b        | Facility                                     |
| A5  | Supervisors have a role in oversight that a tool could support                                                    | H1b, H5    | Supervisor, CHW                              |
| A6  | Programme officers would act on community-level signals                                                           | H1c        | LGA/state                                    |
| A7  | Surveillance and M&E teams want a community action layer rather than another reporting stream                     | H1c, H4    | LGA/state, digital-health                    |
| A8  | Boundary and facility reference data can be obtained; a community unit can be defined                             | H2         | Digital-health/HIS, WASH                     |
| A9  | A feasible route exists to validate rules with qualified experts                                                  | H3         | Clinical/public-health                       |
| A10 | Existing platforms do not already provide this workflow, and their owners would not prefer to host it             | H4         | Digital-health/HIS, supervisor, LGA/state    |
| A11 | Users understand that the output is a prompt to a trained worker, not a diagnosis                                 | H1a        | CHW, facility (prototype, only if indicated) |
| A12 | Referral is practically possible (distance, cost, opening hours, willingness)                                     | H1b        | CHW, facility                                |
| A13 | Periodic aggregate views would be used in decisions                                                               | H1c        | LGA/state                                    |
| A14 | Vulnerability or WASH context changes a decision at community level beyond what state-level planning does         | H2         | LGA/state, WASH                              |
| A15 | A governance process for decision-support content would be needed and operated                                    | H3         | Clinical, digital-health/HIS, LGA/state      |

A14 and A15 are new. The earlier surveillance/M&E and GIS/data groups are covered within the LGA/state and digital-health personas.

## 4. Persona question sets

Each set lists the purpose, the questions in neutral wording (numbers refer to section 2), evidence to capture, and what a **successful piece of validation** looks like (we learned something reliable, including that the problem does not exist or is already solved). "Probe" lines are follow-ups used only if the participant has not already covered the point. Open questions come first.

### 4.1 CHW / community worker

**Purpose:** current practice after a potential signal, tools in use, workload, capacity. (Q1, 2, 3, 4, 6, 7, 8, 9)

1. Please tell me about the last time you came across someone in the community with a skin change, swelling, or another sign that might need attention for a neglected tropical disease. What happened next, step by step? _(Q1)_
2. Where, if anywhere, did you write or report it? Which form, register or phone application? _(Q2, Q8)_ Probe: who receives it?
3. How did you decide what to do about that person? What do you rely on: training, a job aid, a supervisor, a call to someone? _(Q3)_
4. How did the person get referred, if they were? Who decided, and how was the facility told? _(Q4)_
5. What happens if the person does not go to the facility? Who notices, and what is done? _(Q6)_
6. How do you find out what happened to someone you referred, if you do? _(Q7)_ Probe: how long does it usually take?
7. Which phone applications, forms or registers are you required to use now? Which take the most time? _(Q8)_
8. Which parts of your work around this work well already? _(disconfirmation)_
9. Think of a typical week. How much time does recording and reporting take now? _(Q9, baseline)_
10. _(After a neutral description of the proposed steps)_ Compared with what you do now, would the steps described take more time, less time, or about the same? What would you stop doing, if anything? What would worry you? _(Q9)_
11. What would make you stop using something new? Who else should be asked about this?

**Capture:** current steps, tools, time estimates (stated), devices and connectivity, who the CHW reports to. **Success:** a reliable account of the current pathway and workload from at least two settings.

### 4.2 Supervisor / community-health coordinator

**Purpose:** oversight, referral ownership, follow-up, tools, reporting burden. (Q1, 2, 3, 5, 6, 7, 8, 9, 11)

1. When a CHW in your area identifies someone who might need attention for an NTD concern, what is your role? _(Q1, Q3)_
2. What do you record or receive, in what form, and where does it go next? _(Q2)_
3. Who is responsible for making sure a referred person reaches the facility? How is that known? _(Q5, Q6)_
4. When someone does not arrive, what is the process? Can you give a recent example without identifying anyone? _(Q6)_
5. What information comes back from facilities, how, and how often? _(Q7)_
6. Which systems or dashboards do you and your CHWs use now (for example any DHIS2 or CHIS configuration)? What do they cover for NTD concerns? _(Q8, Q11)_ Probe: does it include referral and follow-up?
7. Which parts already work well? _(disconfirmation)_
8. _(After a neutral description)_ What would it change for your team's workload, if anything? Who else would have to change what they do? _(Q9)_
9. Who do you think should be the first person to record a community assessment, and why? _(H5)_

**Capture:** supervisor's actual role, tools, follow-up routines, burdens. **Success:** clarity on who owns closure today.

### 4.3 Facility worker

**Purpose:** what arrives, what is recorded, what returns, burden. (Q1, 3, 4, 5, 6, 7, 9)

1. When someone arrives from a community worker for an NTD concern, what happens at the facility, from arrival to departure? _(Q1)_
2. How do you know they were referred? What information, if any, comes with them? _(Q4)_
3. Where is the visit and outcome recorded? Does that information go back to the community worker or programme? How? _(Q7)_
4. How many referred people arrive compared with those you would expect? How would you know? _(Q6)_
5. Who is responsible for follow-up after a facility visit? _(Q5)_
6. Which registers or systems must you use for this already? How much time do they take? _(Q8, Q9 baseline)_
7. _(After a neutral description)_ What would recording arrival or outcome in addition to your current records mean for your workload? What would make it workable or unworkable? _(Q9)_
8. What would you stop doing, or not do, if asked to add a step?

**Capture:** facility recording practice, return-flow routes, time and staffing constraints. **Success:** a reliable account of the facility side of the loop, which the prototype cannot show (no facility interface exists; this is evidence from people, not from the app).

### 4.4 LGA / state NTD programme

**Purpose:** programme decisions, lag, existing dashboards and platform stance. (Q1, 2, 5, 6, 7, 10, 11, 12)

1. When a potential NTD signal is reported in your area, what comes to your office, in what form and how soon? _(Q1, Q2)_
2. What do you do with it? Please describe a recent decision, in general terms. _(Q10)_
3. What information do you wish you had earlier or more reliably? Why? _(Q10)_
4. Who is responsible for confirming that referred people received care? _(Q5)_
5. What happens when the follow-up is not done? _(Q6, Q7)_
6. Which dashboards or data sets do you use for NTDs now (for example DHIS2 NTD, a treatment-reporting platform, WASH-linked planning)? What decisions do they support, at what level? _(Q8, Q11; XE-05, XE-08, XE-11)_
7. What systems, if any, are used for community-reported signals (for example reports received through digital channels), and what happens to a report once it is received? Who acts, and how is it known? _(Q1, Q2; XE-01, XE-03)_
8. What would you need to see, at what interval, for it to change a decision? What would you do with it that you cannot do now? _(Q10)_
9. If a capability like this were useful, where should it be run and who should own it? _(Q12)_
10. What would make it unnecessary, or harmful?

**Capture:** named decisions, intervals, data sources, ownership views. **Success:** decisions identified (or confirmed absent).

### 4.5 Clinical / public-health expert

**Purpose:** safety, scope, rule content and governance, relation to existing guidance. (Q3, plus gate G2)

1. What guidance do community workers and facilities use today to prioritise people with possible skin or other NTD signs? _(Q3)_ Probe: how is it approved and updated?
2. What tools already provide recognition or management support (for example the WHO Skin NTDs App)? How are they used in practice? _(XE-04)_
3. What risks do you see in giving community workers any structured prioritisation prompt? _(G2)_
4. What would be necessary before any rule content could be used in the field? Who approves? _(H3)_
5. What must a decision-support tool never do?
6. What would you want the tool to say when it has no approved guidance for a situation?
7. Which existing sources should content come from, if any?
8. What would you consider reasons not to proceed?

**Capture:** safety conditions, approval routes, content sources, boundaries. **Success:** a clear, expert-owned statement of what is and is not acceptable. No expert approves the demonstration rules here; they are placeholders.

### 4.6 Digital-health / HIS stakeholder

**Purpose:** platforms in use, hosting, interoperability, alignment. (Q2, 8, 11, 12)

1. Which platforms are CHWs and facilities in your states required to use for community health and NTDs? Which are mandated and which optional? _(Q8)_
2. What is configured in your DHIS2 for NTDs and community health (for example any NTD or CHIS packages)? _(Q11; XE-05, XE-06, XE-07)_
3. Does the current configuration cover signal recording, assessment, referral, referral status and follow-up? Which parts, and how well? _(Q11)_ Probe: how is referral handled? Probe: which of the global DHIS2 capabilities are actually configured and used here, and which are not? (what a platform can do, what is set up locally and what workers actually do are three different things)
4. How could a new workflow be added: configuration, extension, separate service exchanging data? What would each need? _(Q11, Q12)_
5. What alignment or approval is expected for new digital health tools in Nigeria? _(XE-09 does not state this)_
6. What are the main risks of adding a separate application?
7. Who would own and maintain a validated capability? _(Q12)_
8. Under what conditions would you advise against it?

**Capture:** platform inventory, configuration status, alignment requirements, owners. **Success:** an owner-grade answer on whether the workflow can be hosted.

### 4.7 WASH stakeholder (where relevant)

**Purpose:** context data use at community level. (Q10, and Q11 as relevant)

1. How are WASH and NTD data used together in planning today, and at what geographic level? _(XE-08)_
2. Which decisions have changed because of the combined indicators? _(Q10)_
3. What data exist below state level, who holds them, and how current are they?
4. What would community-level information add to or conflict with agreed thresholds and indicators?
5. Where does this information live (for example WASHIMS), and how would other tools connect?
6. What would make a community-level layer unnecessary or problematic?

**Capture:** data availability by level, decisions, owners. **Success:** evidence on whether community-level context is usable and wanted.

## 5. Short questionnaire (optional, for wider reach)

Used only to broaden what interviews found, never to replace them, and only after the ethics determination. Neutral wording; every scale has "not a problem" and "don't know".

```text
STAKEHOLDER QUESTIONNAIRE   (anonymous unless consent given; 10 minutes)
Role (select one): CHW / supervisor / facility worker / LGA officer / state officer /
  surveillance-M&E / GIS-data / clinical-public-health / digital-health-HIS / WASH / other
Setting: urban / rural / mixed      Years in role: <1 / 1-3 / 4-10 / >10

1. In the last 3 months, how often did you handle or hear about someone who might need
   referral for an NTD concern? Never / 1-2 / 3-10 / more than 10 / don't know
2. For those people, how often did you learn what happened after referral?
   Always / Often / Sometimes / Rarely / Never / not applicable
3. Which of these are problems in your work? (tick all; none is allowed)
   [ ] Signs noticed late  [ ] Referral not made  [ ] Referral not completed
   [ ] Outcome not known  [ ] Follow-up not done  [ ] Information does not reach the programme
   [ ] Information reaches the programme too late  [ ] Duplicate reporting  [ ] Other: ___  [ ] None of these is a problem
4. For each ticked problem, how serious is it? Not serious / Somewhat / Serious / Very serious / Don't know
5. Which tools or forms do you use for any of the above? (free text; "none" allowed)
6. Which of the problems above is already well handled by something you use? (free text)
7. Do you use a smartphone at work? Yes / Sometimes / No.  Connectivity at work: none / sometimes / usually
8. Which systems are you required to use for community health or NTD reporting? (free text)
9. In your view, who is best placed to record first assessments in communities? (select one + why)
10. If an additional tool were introduced, would your workload be: much lower / lower / the same / higher / much higher / don't know? Why?
11. What would make you stop using a new tool?
```

Questionnaires are not presented as representative unless the sampling is designed and described.

## 6. Sampling and sufficiency

Sample sizes are not proposed here; the validation lead proposes and the sponsor approves them (S6-04). Principles: more than one setting per group; both experienced and new staff; include people sceptical of digital tools; include at least one setting with poor connectivity; do not recruit only through the sponsor; record who declined. Nigerian programme settings only for sufficiency. A finding is "supported" only per the locked sufficiency rules (`STAGE6_DECISION_REGISTER.md` section 3.5): at least two independent stakeholder categories, or one category plus the owner of the system or process. A single voice is recorded as an observation.

## 7. Synthesis

- Two coders per record; disagreements discussed (coding approach in the session pack, section 11).
- A matrix of assumptions A1 to A15 by persona: supported, contradicted, mixed, no evidence.
- A matrix of the twelve questions by persona, with the answers coded.
- Quotes, counts and confidence in the evidence register, with the class SS or XS.
- A specific section for contradictions and surprises, and for what existing systems already do.
- Primary-user finding (H5): compare CHW, supervisor and other candidates on capacity, authority, benefit, risk and willingness, using evidence only.
- Findings go to the decision workshop before any recommendation is drafted; the outcome is read against the locked criteria.
