# Management validation plan

**Status:** plan and template. No management review has been held. It extends `docs/STAKEHOLDER_REVIEW.md` (the briefing content) with the way the review is run and recorded. Nothing here asks management to approve a product. It asks them to test the problem and decide what happens next, including stopping.

## 1. Objectives

1. Test whether programme leadership recognises the problem and thinks it important (Q1).
2. Learn what existing systems and decisions leadership already depends on (Q2, Q4).
3. Hear who leadership thinks the users and owners should be (Q3).
4. Confirm the scope boundary: screening and referral prompt, no diagnosis, no prescribing, no outbreak declaration (Gate A6).
5. Obtain named owners for decisions and for the validation activities.
6. Agree the decision criteria _before_ evidence is collected, and later take the decision.
7. Learn what would make leadership stop.

## 2. Participants

| Participant                                            | Role in the session                    | Notes                                                          |
| ------------------------------------------------------ | -------------------------------------- | -------------------------------------------------------------- |
| National or state NTD programme leadership             | Decision owner, sponsor candidate      | The most important voice on ownership and fit                  |
| Health information system / M&E leadership             | Owner of reporting systems             | Key for duplication and integration                            |
| Surveillance leadership                                | Owner of signal and response processes | Key for "what happens after a signal"                          |
| Clinical lead / public-health expert                   | Safety and scope                       | Not the same person as the developer or sponsor                |
| Legal or data protection representative                | Constraints and open questions         | Asks and answers legal questions; Stage 6 does not answer them |
| Implementing partner representative (if any)           | Delivery and sustainability            | Declare interests                                              |
| Validation lead (facilitator, independent if possible) | Runs the session                       |                                                                |
| Note-taker                                             | Records decisions and dissent          |                                                                |
| Developer / technical lead                             | Answers technical questions only       | Does not facilitate, argue for or score the product            |

Hold separate sessions where seniority could suppress candour. A short pre-session note asks participants to list the three biggest gaps they see in the NTD pathway, before seeing any material.

## 3. Briefing materials

Sent in advance, in this order (problem first):

1. One page: the questions Stage 6 is asking and the four possible outcomes, including STOP and INTEGRATE.
2. One page: the pathway in the brief (community signal, assessment, referral, facility, follow-up, programme action) as a blank map for participants to annotate with how it works today.
3. `docs/STAKEHOLDER_REVIEW.md` sections 1 to 3 and 6 (definition, problem hypothesis, what NTD-WATCH is not). Later sections are held until after the problem discussion.
4. A one-page limits statement: synthetic data, demonstration rules, no clinical validity, no legal review, no real integration, no evidence of benefit.

Not sent: any claim of innovation, impact, accuracy or donor interest.

## 4. Session structure and demonstration sequence

Duration is set by the sponsor; the order matters more than the length.

| Step | Content                                                                                                                                      | Purpose                       | Prototype shown? |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- | ---------------- |
| 1    | Purpose, limits, outcomes (including STOP), how notes are used                                                                               | Set expectations              | No               |
| 2    | Current state: how a community signal travels today; where it stalls (participants annotate the map)                                         | Q1 evidence                   | No               |
| 3    | Existing systems: what is used, who owns, what happens to a referral and a follow-up                                                         | Q2, Q4 evidence               | No               |
| 4    | Importance and ownership: whose problem is it, what would change if solved, what is the cost of the gap                                      | Importance                    | No               |
| 5    | **Decision pause:** "Given what we have said, is there a problem worth solving? Does it already have an owner and a tool?" Record the answer | Prevent anchoring on the demo | No               |
| 6    | Demonstration: the scripted walk-through below                                                                                               | Comprehension and fit         | Yes              |
| 7    | Questions on what the demo changes in step 5's answer                                                                                        | Compare before and after      | Yes              |
| 8    | Scope, safety and governance: what the tool must never do; who would approve rules; legal and ethics asks                                    | A6; Q5                        | Partly           |
| 9    | Decision points (section 6) and the criteria for the final decision                                                                          | Governance                    | No               |
| 10   | Close: actions, owners, what evidence would change minds                                                                                     | Next steps                    | No               |

**Demonstration sequence (step 6)**, using the synthetic scenarios in `PROTOTYPE_VALIDATION_PLAN.md`, with the banner visible and the facilitator stating "synthetic data, demonstration rules" first:

1. The CHW view: one scripted assessment, the level of concern with reasons, and the limits text.
2. The referral and its stages (note: the facility screen does not exist; describe it).
3. The programme view: signals, context, referral monitoring, ward and community display on the fictional map.
4. The role switch showing that views differ by role (simulated).
5. What is _missing_: the facility interface, real login, real data, validated rules, suppression. Say it.

## 5. Questions

Open and non-leading. The facilitator does not defend the product.

**Problem and importance**

1. Walk me through what happens today from the moment a community member with possible signs is noticed to the moment the programme learns about it.
2. Where, in your experience, do cases or referrals get lost or delayed? How do you know? Is there data?
3. Who is affected when that happens, and how?
4. Is this among the top problems for the programme? What ranks above it?
5. If this gap were closed, what decision would be made differently?

**Existing systems**

6. Which systems or tools already capture any part of this? Who owns and runs each? Who uses them?
7. What happens to the information after a signal is reported? Who acts, and how fast?
8. How are referrals and follow-up tracked now, if at all?
9. What would you do if this prototype did not exist?

**Fit**

10. Which parts of what you saw duplicate something you have? Which parts, if any, do not?
11. Should this be a separate product, a part of an existing platform, or neither? Why?
12. What would make you stop pursuing it?

**Users and ownership**

13. Who should use this day to day? Who should not?
14. Who would own it, fund it, and maintain it?

**Safety and scope**

15. What must it never do? What worries you most?
16. Who would need to approve the rules and the use of data before any real use?
17. What would you need to see before agreeing to a controlled field pilot?

**Closing**

18. What evidence would change your mind either way?

## 6. Decision points

| #   | Point                                                                                                                               | Options recorded                                                 | When              |
| --- | ----------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | ----------------- |
| M1  | Is the problem recognised and important enough to continue investigating?                                                           | Yes / Partly / No / Unclear                                      | After step 5      |
| M2  | Confirm scope boundary (no diagnosis, prescribing, outbreak declaration)                                                            | Confirmed / Changed (state how)                                  | Step 8            |
| M3  | Ratify the **locked** decision criteria v1.1 (`STAGE6_DECISION_REGISTER.md` section 3) before any stakeholder evidence is collected | Ratified / Amended before data collection (record in change log) | Step 9            |
| M4  | Name owner(s) for Stage 6 decisions and sponsor                                                                                     | Named / Not yet                                                  | Step 9            |
| M5  | Authorise stakeholder access, ethics determination request and external research                                                    | Authorised / Limited (state)                                     | Step 9            |
| M6  | Final Stage 6 decision (a later session, after evidence)                                                                            | PROCEED / MODIFY / INTEGRATE / STOP / Inconclusive               | Decision workshop |

The criteria were drafted and locked on 2026-10-18 before any stakeholder evidence. A change made after data collection starts is marked post-hoc and disclosed in the report. Management sessions should also ask whether existing DHIS2 or CHIS infrastructure is mandated for community health in the target programme (twelve-question set Q8, Q11 and Q12 in `STAKEHOLDER_VALIDATION_PLAN.md`) and where leadership would expect a validated capability to live.

M1 may end the exercise: a clear "No" with reasons leads straight to M6.

## 7. Feedback capture

- One note-taker per session, writing in the participant's words where possible. Quotes are marked as such.
- Recording only with explicit consent and the organisation's rules; otherwise notes only.
- No names of patients, communities with identifiable cases, or confidential programme data are recorded.
- Notes are coded afterwards against questions Q1 to Q5 by two people; disagreements noted.
- Evidence is entered in `STAGE6_EVIDENCE_REGISTER.md` with class SS (stakeholder statement), with the role but not the name unless the participant agreed.
- Dissent and uncertainty are recorded in full.
- Notes are stored under the programme's governance, not in the code repository.

## 8. Management Validation Record (template)

Complete one record per session and one consolidated record per decision.

```text
MANAGEMENT VALIDATION RECORD
Record ID:                    MV-___
Date / place / format:
Facilitator (independent? Y/N):          Note-taker:
Participants (role and organisation only, unless consent given):
Declared interests / conflicts:

1. MATERIALS SENT BEFORE: [ ] limits statement  [ ] outcomes incl. STOP  [ ] pathway map
2. PROBLEM (before demonstration)
   Pathway as described today:
   Where gaps occur (and evidence cited):
   Importance (rank vs other priorities):
   Existing owner/tool for each gap:
   M1 result: Yes / Partly / No / Unclear     Reasons:
3. EXISTING SYSTEMS NAMED (owner; users; what it does; what happens after a signal; referral tracking):
4. DEMONSTRATION
   Scenarios shown:        Limits statement read: Y/N
   Reactions (comprehension, concerns, requests):
   Did the demonstration change the M1 answer? Y/N  How?
   Misunderstandings observed (esp. about diagnosis, validity, data being real):
5. FIT
   Duplication identified:
   Distinct value claimed by participants (their words):
   Standalone / integrated / layer / neither (their view, reasons):
6. USERS AND OWNERSHIP
   Who should use it; who should not:
   Proposed owner / sponsor / funder (if stated):
7. SAFETY, SCOPE, GOVERNANCE
   M2 result: Confirmed / Changed:
   Concerns raised:
   Approvals they say are required:
8. DECISION POINTS
   M3 locked criteria v1.1: Ratified / Amended before data collection (attach change log):
   M4 owners named:
   M5 access/ethics/research authorised:
9. WHAT WOULD CHANGE THEIR MIND:
10. ACTIONS (action | owner | date):
11. EVIDENCE REGISTER IDs CREATED:
12. DISSENT / OPEN QUESTIONS:
Signed (facilitator):            Reviewed (validation lead):         Date:
```

**Consolidated decision record** (after the decision workshop):

```text
STAGE 6 DECISION RECORD
Date / attendees / authority:
Evidence reviewed (register IDs):
Criteria applied (version and date approved):
For each criterion: met / partly / not met / no evidence, with confidence
Disconfirming evidence considered:
DECISION: PROCEED / MODIFY / INTEGRATE / STOP / INCONCLUSIVE (next evidence step and owner)
Conditions:
Dissenting views:
Gate A result: pass / conditional / fail (see PILOT_GATES.md)
Effect on Stage 5 decisions (cross-references):
Signed by decision owner:                   Date:
```

## 9. What the review must not do

It must not seek endorsement, produce donor-facing language, present synthetic output as findings, imply the rules are clinically valid, or treat attendance or politeness as evidence of need.
