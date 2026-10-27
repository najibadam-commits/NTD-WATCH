# Prototype validation plan (Gate A)

**Status:** plan, updated 2026-10-18. No session has been run and **no prototype change has been made in the evidence-integration update.** The prototype remains demonstration-only; it is a tool for testing comprehension, not a candidate product that needs completing. All data is synthetic and the rules are demonstration logic. **Sessions test whether people can use the workflow and understand its limits. They do not test clinical accuracy, and nothing observed is evidence about health outcomes, accuracy, sensitivity or specificity.**

## 1. Key validation question

> Can users correctly perform the intended tasks **without misunderstanding the system's limitations**?

Task completion alone is not a pass. A participant who finishes every task but believes the app diagnoses disease, or that a low level means "safe", has **failed** the safety half of the test. Liking the prototype is not a measure.

Secondary questions: where do users get confused or slow; is the terminology understood in the working language; does the output attract more trust than it deserves; would the participant actually use it, and in which role; which tasks reveal a gap in the workflow itself.

### 1.1 Entry condition and principle (updated)

- **Prototype validation follows stakeholder evidence; it does not precede it.** Prototype sessions are run only after the problem-first work (`STAKEHOLDER_VALIDATION_PLAN.md`) shows what, if anything, needs testing, and only after the ethics determination (ETH-1) is recorded. If that work returns STOP or INTEGRATE-leaning evidence, a prototype session may be unnecessary.
- **Do not build missing screens or capabilities merely to make the prototype appear complete.** The absence of a facility screen, a supervisor view or a no-rule mode is itself a finding about the prototype, not a defect to be fixed in advance.
- **Facility and supervisor concepts stay paper or mock validation** (tasks SV-1 to SV-3 and F-1 to F-3 below), recorded as concept feedback.
- **No-rule mode is not implemented** unless stakeholder or expert evidence shows it is necessary for Gate A (section 9).
- **Any prototype change must be tied to a named validation need** (section 9), reviewed against the locked criteria, and documented. No change may add clinical logic, active rules, real data, authentication, infrastructure or integration.
- Sessions test comprehension and limits. Observations never satisfy the locked gates G1 to G4 on their own (`STAGE6_DECISION_REGISTER.md` section 3.5).

## 2. What the prototype can and cannot test

Stated from the codebase (`apps/web/src/routes.tsx`, `packages/domain/src/roles.ts`).

| Persona           | What exists to test                                                                                                                                                                                                                           | What does not exist                                                                                                                                                             |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CHW               | Full mobile flow: sign-in (simulated), dashboard, new assessment (person, symptoms, context, WASH, summary), result with reasons, referral creation, referral status, follow-up list and form, history, profile, sync status, offline capture | Real login; reviewed wording; any approved rules; no-rule mode; languages other than English; paper fallback                                                                    |
| Supervisor        | **No supervisor role exists.** Closest views: LGA programme pages (overview, signals, referrals) and the CHW's own referral and sync lists shown by a facilitator                                                                             | Any supervisor view of CHW activity or sync health; QA review; reminders                                                                                                        |
| Facility worker   | The `facility` role lands on the programme **referral monitoring** page (the only programme page that role may open)                                                                                                                          | A facility screen to receive a referral or record arrival or outcome. The stage-update API route exists and is permitted for the facility role, but no facility screen calls it |
| Programme officer | LGA and State roles: overview, GIS map (fictional), signals, vulnerability, referrals, trends, reports (labelled synthetic)                                                                                                                   | Real data; suppression; actions log; escalation route                                                                                                                           |
| Administrator     | Users and settings pages (simulated users, reset of demonstration data)                                                                                                                                                                       | Real account management; rule governance tooling; audit viewer                                                                                                                  |

These limits shape what Gate A can say. Where a persona's real tool does not exist, the session tests **comprehension of a described or paper-mocked screen**, and the finding is recorded as concept feedback, not usability of an implemented feature.

## 3. Set-up and safeguards

1. **Environment:** the existing prototype run locally or from a build; no network services; fictional data only. Reset between participants using the in-app "Reset demonstration data".
2. **Labelling:** the demo banner is visible throughout (`DemoBanner`). The facilitator reads the limits statement aloud before every session: "Everything here is made up. The questions and levels are placeholders and have no clinical meaning. This tool does not diagnose and has not been tested with real people."
3. **No real data:** participants are told not to enter real people, real places or real names. If a participant begins to describe a real patient, the facilitator interrupts and moves on; nothing is recorded.
4. **Accounts:** the role switcher in the banner provides stable demonstration roles; no credentials are issued.
5. **Devices:** CHW sessions run on a representative phone in portrait orientation when possible; at least one run is performed with the network switched off to observe offline behaviour.
6. **Observation:** facilitator plus note-taker; screen recording only with consent; no audio of third parties.
7. **Ethics:** sessions follow the ethics determination (ETH-1). Participation is voluntary and has no consequence for the participant's employment.
8. **Facilitator independence:** facilitators are not the developers for user sessions; the developer may attend as observer to answer technical failures only.
9. **Pilot the sessions:** a dry run with internal staff to fix the script before external sessions (results excluded from evidence).
10. **Language:** sessions run in the participant's language where possible; because the interface is English only, record when English was a barrier (this is itself a finding).

## 4. Scenarios

Scenarios are **workflow scenarios**, not clinical ones. Each is a scripted card with the answers to select. The usability lead assembles the answer lists from the existing option sets in the app; the clinical lead checks that no card is presented as a realistic presentation of any disease and that the wording does not look like guidance. The cards are labelled "synthetic scenario" and no card names a disease.

| ID  | Scenario type                                                                            | Purpose                                                   | Applies to             |
| --- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------- | ---------------------- |
| S1  | Complete assessment, result shown, no referral chosen                                    | Basic flow; what the participant takes the result to mean | CHW                    |
| S2  | Complete assessment, then create a referral and read its status                          | Referral creation and stage understanding                 | CHW, facility          |
| S3  | Assessment started and completed with the network off, then reconnect                    | Offline understanding; "waiting to sync"; reassurance     | CHW                    |
| S4  | Several answers unknown or skipped                                                       | Understanding of missing-data warning; false reassurance  | CHW                    |
| S5  | Simulated server failure then retry                                                      | Error comprehension; trust in saved data                  | CHW                    |
| S6  | Double tap on submit / duplicate attempt                                                 | Duplicate protection comprehension                        | CHW                    |
| S7  | Follow-up record where the person was not reached; and where condition reported as worse | Follow-up flow; understanding of further referral         | CHW                    |
| S8  | Programme overview: find where signals increased; read a trend                           | Interpretation of "signal", "direction", "vulnerability"  | Programme officer      |
| S9  | Programme referral monitoring: find stalled referrals                                    | Interpretation of stages and delays                       | Facility, officer      |
| S10 | Open a community detail from the map; try to find a person                               | Understanding that no person data is shown                | Programme officer      |
| S11 | Generate a report and read its labelling                                                 | Understanding of synthetic labelling and report limits    | Programme officer      |
| S12 | Switch role to see what each role can open                                               | Access boundary comprehension                             | Administrator, officer |
| S13 | Administrator: reset data, review users, settings                                        | Administrative clarity; scope of admin power              | Administrator          |

## 5. Scripted tasks by persona

Expected behaviour is the behaviour the design intends; "limits probe" questions are asked immediately after the task and scored against the answer key in section 6.

### 5.1 CHW (S1 to S7)

| Task | Instruction (neutral)                                                   | Expected                                                            | Limits probe                                                                                    |
| ---- | ----------------------------------------------------------------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| C-1  | "Using the card, record an assessment."                                 | Completes all steps; corrects a deliberate mistake; reaches summary | "What does the summary tell you about this person?"                                             |
| C-2  | "Submit and tell me what the result is."                                | Reads level and reasons; reads the limits text                      | "Does this tell you what condition the person has?" "If the level were LOW, what would you do?" |
| C-3  | "Decide whether to start a referral, and do so if you would."           | Can start a referral; understands destination (synthetic facility)  | "Who decided to refer: you or the app?"                                                         |
| C-4  | "Find the referral and tell me where it is now."                        | Finds status and stage meaning                                      | "What does this stage mean for the person?"                                                     |
| C-5  | "Switch the network off; record another assessment; then switch it on." | Understands record saved; sees pending sync; sees synced afterward  | "Is the record safe? Who can see it now?"                                                       |
| C-6  | "Leave several answers unknown and look at the result."                 | Notices warning that concern may be understated                     | "What does it mean that some answers are unknown?"                                              |
| C-7  | "The app shows an error. What do you do?"                               | Retries; understands nothing was lost or doubled                    | "How can you tell whether it saved?"                                                            |
| C-8  | "Record a follow-up for this person."                                   | Completes; understands further-referral option                      | "Does the follow-up change the earlier level?"                                                  |
| C-9  | "Tell me what you would do next in real life."                          | Describes own process, not the app's as authority                   | "Would you rely on this instead of your training? Why/why not?"                                 |

### 5.2 Supervisor (concept session; no supervisor screen exists)

| Task | Instruction                                                                                                  | Purpose                                                                  |
| ---- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| SV-1 | Facilitator shows a CHW's referral list and sync status and asks: "What would you want to see to supervise?" | What supervisors want, unprompted                                        |
| SV-2 | Shown the LGA overview and signals pages: "Which of this would you use? Which would you ignore?"             | Whether supervisor-first use is plausible                                |
| SV-3 | Paper mock of a supervisor sync-health list: "What would you do on seeing this?"                             | Concept feedback, recorded as concept (not usability of a built feature) |

### 5.3 Facility worker

| Task | Instruction                                                                      | Expected                                                           | Limits probe                                                              |
| ---- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| F-1  | "Open the referrals page. Find the referral to your facility."                   | Finds list and filters                                             | "What does the level tell you about the person?"                          |
| F-2  | "What information do you see? What information would you need that is missing?"  | Identifies gaps (no arrival/outcome recording, no person identity) | "Who can you contact to find the person?" (tests expectation of identity) |
| F-3  | Paper mock of arrival/outcome recording: "Would you do this? When? Who does it?" | Concept feedback on burden and willingness                         | "Would you enter this in addition to your own register?"                  |

### 5.4 Programme officer (LGA / State)

| Task | Instruction                                                    | Expected                                 | Limits probe                                                            |
| ---- | -------------------------------------------------------------- | ---------------------------------------- | ----------------------------------------------------------------------- |
| P-1  | "From the overview, find the community with the most signals." | Finds it                                 | "What is a signal? Does it mean there is an outbreak?"                  |
| P-2  | "Is it going up or down? How do you know?"                     | Reads direction (28 days vs previous 28) | "What would you do on seeing this? What would you want to check first?" |
| P-3  | "Open the map and select a community. What do you see?"        | Understands map is fictional             | "Does this map show where cases are? What does the colour mean?"        |
| P-4  | "Open vulnerability. What does the band tell you?"             | Recognises it as contextual              | "Would you base a decision on this? What would you need to trust it?"   |
| P-5  | "Find stalled referrals."                                      | Finds referral monitoring                | "What could explain a stalled referral?"                                |
| P-6  | "Generate a report. Read it."                                  | Notes synthetic labelling                | "Could you send this to your supervisor as it is? Why/why not?"         |
| P-7  | "Try to find an individual person."                            | Cannot; understands the separation       | "Is that what you expected?"                                            |

### 5.5 Administrator

| Task | Instruction                                 | Expected                                | Limits probe                                                                     |
| ---- | ------------------------------------------- | --------------------------------------- | -------------------------------------------------------------------------------- |
| A-1  | "Show me how you would add a user."         | Finds users page; sees simulated nature | "Is this real access control?"                                                   |
| A-2  | "Reset the demonstration data."             | Finds settings; understands what resets | "What would happen to real data if you did this?"                                |
| A-3  | "What can you see that other roles cannot?" | Notes extra pages                       | "Could you change a rule from here?" (answer: no; governance is outside the app) |
| A-4  | "Switch roles and compare."                 | Observes differences                    | "Which role should be able to see individual records?"                           |

## 6. Measures and coding

Each task is observed and coded by two people.

| Measure                 | Definition                                                                                                                                                                                                                                                     | How recorded                                      |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| Task completion         | Completed unaided / with hint / with substantial help / not completed                                                                                                                                                                                          | Per task                                          |
| Errors                  | Slips (wrong tap, corrected), mistakes (wrong action not noticed), count and type                                                                                                                                                                              | Tally                                             |
| Confusion               | Pauses, repeated back-navigation, "what does this mean?", stated confusion; location in the flow                                                                                                                                                               | Timestamped note                                  |
| Time                    | Time per task, with the clock started at the instruction and stopped at completion; interrupted time excluded                                                                                                                                                  | Stopwatch / recording                             |
| Terminology             | Words or labels misread, asked about, or paraphrased differently (signal, level, referral stage, vulnerability, direction, synced)                                                                                                                             | Term list per participant                         |
| Safety misunderstanding | Any statement or action showing the participant believes: the app diagnoses; LOW means no need for care; the result replaces judgement or training; synthetic data is real; a signal is a confirmed case or outbreak; the map is real; the rules are validated | Coded by answer key (below); each instance quoted |
| Inappropriate trust     | Following the app's level against the participant's own stated judgement without questioning; or ignoring a warning the app displays                                                                                                                           | Observed behaviour plus probe                     |
| Workflow friction       | Steps the participant says do not match their real process; duplicated effort; missing steps                                                                                                                                                                   | Free note; linked to workflow evidence (WS1)      |
| Usefulness              | Participant's statement of what, if anything, they would use and when; what they would not use                                                                                                                                                                 | Quote; also record "would not use"                |
| Recovery                | Ability to recover from an error without losing data                                                                                                                                                                                                           | Observed                                          |
| Accessibility           | Barriers: text size, contrast, reading level, touch targets, language                                                                                                                                                                                          | Observed                                          |

**Answer key for limits probes.** Understanding is scored **Correct** (states the intended limit unprompted or after the probe), **Partly** (states it only after prompting), **Incorrect** (states a misunderstanding), or **Not asked**.

| Concept            | Intended understanding                                                                       |
| ------------------ | -------------------------------------------------------------------------------------------- |
| The result         | A prompt to a trained worker that may help decide on referral; not a diagnosis               |
| LOW / lowest level | Does not mean the person does not need care; CHW judgement and national guidance still apply |
| Unknown answers    | Mean the level may understate concern                                                        |
| Referral decision  | Made by the CHW, not the app                                                                 |
| Signal             | An aggregated indicator of HIGH/URGENT assessments, not a confirmed case or outbreak         |
| Vulnerability      | Contextual information based on placeholder bands; not validated                             |
| Map                | Fictional; not real geography                                                                |
| Data               | Synthetic; not real                                                                          |
| Rules              | Placeholders; not clinically validated                                                       |
| Offline            | Record is saved on the device and syncs later; it is not yet seen by the programme           |

**No numeric pass thresholds are proposed here.** The decision owner sets, in S0 and before any session, what proportion of each persona must complete tasks and what proportion of safety misunderstandings is tolerable (the expectation for the most serious misunderstandings, such as believing the app diagnoses, is that **none are accepted without a design change**). Each safety misunderstanding is analysed individually.

## 7. Session structure

1. Welcome, consent, limits statement (5 minutes, read verbatim).
2. Background: role, devices, experience (no questions about real patients).
3. Pre-task expectation: "What do you think a tool like this would do?" (recorded to detect assumptions).
4. Scripted tasks for the persona with probes.
5. Free exploration (unscripted, two minutes) to see what draws attention.
6. Post-task interview: what was clear, unclear, missing; what they would do differently; what they would not use it for; who should use it.
7. Safety closing check: "In your own words, what is this tool and what is it not?"
8. Close, thanks, explanation of what will be done with the notes.

A short standard usability questionnaire may be added if chosen by the usability lead; its scores are not used for go/no-go decisions.

## 8. Demonstration labelling check (Gate A3)

Performed by a person not on the build team on a clean checkout, for every screen reachable by every role (CHW screens, all programme pages, reports, error states, empty states, printed or downloaded files):

| Check                                                                                | Result |
| ------------------------------------------------------------------------------------ | ------ |
| Banner visible and not hidden at phone and desktop widths                            | [ ]    |
| Level, reasons and result pages state they are demonstration or show the limits text | [ ]    |
| Map labelled fictional; no real place names; no basemap                              | [ ]    |
| Reports labelled synthetic in the file name and content                              | [ ]    |
| Signals, vulnerability and trends carry synthetic or demonstration labelling         | [ ]    |
| No screen uses "diagnosis", "confirmed", "outbreak declared" or similar              | [ ]    |
| Role and sign-in screens say access is simulated                                     | [ ]    |
| No screenshot or export suitable for use as real evidence lacks the labels           | [ ]    |

The automated end-to-end suite already tests some labelling (for example report file names and the landing disclaimer); it does not replace this human check.

## 9. Prototype support: evidence triggers (nothing implemented)

**Stage 6 and this update made no application change.** Each candidate below is built only if a named **trigger** is met by recorded evidence, the technical lead and programme owner approve it (S6-07), and the change and its reason are documented. None adds clinical logic, authentication, infrastructure or integration. The identifiers P-1 to P-7 here are **support items** and are distinct from the programme-officer tasks P-1 to P-7 in section 5.4.

| Support item | Candidate                                                                        | Trigger (evidence required before it is considered)                                                                                                       | Default if trigger not met                                |
| ------------ | -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| P-1          | No-rule mode switch (record, no level, show an approved-instruction placeholder) | Clinical or programme evidence (XS/SS) that a pilot or session must run without any rule level, **and** that Gate A cannot be assessed without testing it | Describe the state on paper; test comprehension of a mock |
| P-2          | Facilitator mode: scenario cards, reset, visible scenario id                     | A dry run shows sessions cannot be run consistently with the existing Settings reset and paper cards                                                      | Paper cards and manual reset                              |
| P-3          | Local usability counters (no content, no identifiers)                            | The usability lead shows that stopwatch timing is inadequate for a question the stakeholder evidence has raised                                           | Stopwatch                                                 |
| P-4          | Facility arrival/outcome concept screen (static, synthetic)                      | Facility evidence (SS) shows that a paper mock cannot elicit the answer to a question that bears on G1 or G3                                              | Paper mock F-3                                            |
| P-5          | Supervisor concept view (static, synthetic)                                      | Supervisor evidence shows that a paper mock cannot elicit the answer, **and** supervisors are a candidate primary user (H5)                               | Paper mock SV-3                                           |
| P-6          | Stronger "synthetic scenario" label on the result screen                         | The Gate A3 labelling check or a session shows participants treating output as real despite current labelling                                             | Current labelling                                         |
| P-7          | Printable scenario cards from the existing synthetic option sets                 | Consistency problems in sessions; content reviewed by the clinical lead                                                                                   | Hand-prepared cards                                       |

**Previously recommended items withdrawn:** the first Stage 6 draft recommended P-1 and P-6 for consideration. That recommendation is **withdrawn**; neither is recommended until a trigger is met, and P-4 and P-5 are no longer suggested as a way to make Gate A easier. If no trigger is met, paper mocks and the facilitator script suffice for Gate A.

**Procedure if a trigger is met:** record the evidence ID and the question it serves; record the minimal change; run `npm run check` and the Playwright suite; do not weaken any test; note the change in `STAGE6_REPORT.md` (prototype changes) and, if it affects the labelling, repeat the section 8 check.

## 10. Analysis and outputs

- Per persona: completion table, error tally, confusion points, term list, safety misunderstanding log, trust observations, friction notes, usefulness statements.
- A **misunderstanding register** listing every safety misunderstanding with its cause (wording, layout, expectation) and the proposed remedy; each remedy decided by the product owner and re-tested.
- A **workflow gap list**: steps users say are missing or wrong, feeding WS1 and the standalone-versus-integration question (H4).
- Findings are kept separate by participant category; one participant's behaviour is not generalised.
- Enter results in `STAGE6_EVIDENCE_REGISTER.md` (class OB) and summarise in `STAGE6_REPORT.md` "Prototype validation findings".

## 11. Gate A decision

Using `docs/PILOT_GATES.md` Gate A:

| Item | Evidence from this plan                                                                 | Result                       |
| ---- | --------------------------------------------------------------------------------------- | ---------------------------- |
| A1   | `MANAGEMENT_VALIDATION_PLAN.md` records                                                 | [pending]                    |
| A2   | Completed sessions for each persona (including concept sessions where no screen exists) | [pending]                    |
| A3   | Section 8 checklist complete                                                            | [pending]                    |
| A4   | Clean-checkout automated results (recorded in `STAGE6_REPORT.md`)                       | Done in Stage 6 (see report) |
| A5   | Owners named for all decisions                                                          | [pending]                    |
| A6   | Scope confirmation (M2)                                                                 | [pending]                    |
| A7   | Differentiation review (`DIFFERENTIATION_VALIDATION.md`)                                | [pending]                    |

**Fail conditions** (from Gate A): stakeholders cannot complete core tasks; confusion about what the system claims; any tendency to treat synthetic or demonstration output as real. A single serious safety misunderstanding that cannot be fixed by wording or layout is a Gate A fail for that design.

**Interpretation limit:** Gate A cannot show the tool is effective, safe in the field, accurate or wanted at scale. It shows only whether people can use and understand the prototype as described.
