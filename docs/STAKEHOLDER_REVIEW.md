# NTD-WATCH stakeholder review package (draft structure)

**Status:** draft for internal review before any external use. It makes **no donor claims and no claims of validated impact, accuracy or compliance.** All data shown by the prototype is synthetic. Items in `[brackets]` are for the programme to supply. Wording is intended to be accurate for a reader who has never seen the project.

## 1. Product definition (one paragraph)

NTD-WATCH is a prototype of a community-level early-warning, decision-support, referral, follow-up and programme-intelligence tool for neglected tropical diseases. It would let a trained community health worker record a short structured assessment offline, receive a prompt about the level of concern with reasons, start a referral to a confirmed health facility, and follow up; and it would let programme staff see privacy-protected, geographically limited summaries of signals, referrals and community context. It does not diagnose disease, prescribe treatment, or declare outbreaks. Its clinical rules are placeholders until qualified experts review and approve them.

## 2. Problem statement

> **To be confirmed with programme staff (research R1 and R7).** The working hypothesis is that signs of NTDs in communities may be noticed late, referrals from the community may not be completed or tracked, and programme staff may lack a timely, community-level view of where signals and referral gaps are appearing. The project has not measured any of these. The first task of the review is to test whether this is the problem the programme recognises, and to hear which parts of it are already solved by current systems.

Questions for the audience: where do delays and losses occur today; who currently sees community-level signals; how are referrals tracked; what decisions would change with better information.

## 3. Proposed solution

A workflow across five groups of users, supported by a governance model:

- CHWs: structured assessment, offline.
- Risk prompt: rules evaluated under an approved version, with reasons and an approved suggested next step.
- Referral and facility: referral code, destination, stage history, facility records arrival and outcome.
- Follow-up: CHW records whether the person was reached and attended.
- Programme intelligence: scope-limited, suppressed aggregates, map and reports.
- Governance: rule approval lifecycle, role-based access, audit, data ownership.

## 4. Current prototype capabilities

Demonstrated with **synthetic data** only (Stages 1 to 3, tested):

| Capability                                                                                           | State                                        |
| ---------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| CHW assessment flow, offline-capable, with reasons                                                   | Working prototype; demonstration rules       |
| Referral creation and stage lifecycle with duplicate protection                                      | Working prototype                            |
| Follow-up recording                                                                                  | Working prototype                            |
| Programme views: signals, community vulnerability context, trends, referral monitoring, report kinds | Working prototype on synthetic data          |
| Map of communities with signals and context                                                          | Fictional geometry; no basemap               |
| Role-scoped views (CHW, facility, LGA, State, administrator)                                         | Simulated access control                     |
| English interface; accessible, responsive design                                                     | English only; automated accessibility checks |
| Automated tests                                                                                      | 236 unit/integration and 36 end-to-end tests |

What is **not** working or not real: real authentication, a real server, real data, a facility interface, validated rules, encryption, audit coverage, suppression of small counts, any field testing.

## 5. What may be genuinely innovative

Stated cautiously (see `INNOVATION_ASSESSMENT.md`):

- The _integration_ of an offline community workflow, referral closure and a scope-limited programme view in one governed system.
- A _governance model_ in which rules cannot become active without independent review and a signed approval record, and in which the system is designed not to diagnose.

These are hypotheses to test, not demonstrated advantages. Several features (offline sync, role-based access, maps, accessible design) are good practice, not innovation. A comparison against existing tools has not been completed, and a possible conclusion is that the governance and intelligence layers are better contributed to an existing platform.

## 6. What NTD-WATCH is NOT

- Not a diagnostic tool, and not a substitute for clinical examination or national protocols.
- Not a prescribing or treatment tool.
- Not an outbreak declaration system; no automated declaration, and signals are not case counts.
- Not a patient record system or a register of people with a condition.
- Not a replacement for national NTD surveillance, DHIS2 or case reporting.
- Not clinically validated, not approved by any health authority, not legally reviewed, and not proven to improve health outcomes.
- Not a consumer symptom checker.
- Not deployed anywhere, and holding no real data.

## 7. Relationship to existing NTD surveillance systems

NTD-WATCH is intended to complement, not replace, existing systems.

- It would not duplicate case reporting. Exports to other systems would be aggregate only, human-reviewed, and clearly labelled as signals (`INTEROPERABILITY.md`).
- It could receive reference data (administrative boundaries, facility lists, WASH indicators) from authoritative owners.
- Which systems exist, who owns them, and how this should relate to them are open (D-15, research R1, R3).
- The review should decide whether this should be a stand-alone application or a layer on existing platforms.

## 8. CHW workflow

1. The CHW signs in (offline-capable session) and works in an assigned community.
2. After the person has been informed (notice per D-08), the CHW records age group, sex, symptoms, duration, progression, and exposure and water, sanitation and hygiene answers. No name, phone number, address or free text is collected.
3. The app shows a level of concern with the reasons and an approved suggested step. Missing answers produce a visible warning, not a guess. If no approved rule set exists, the app shows no level and an approved instruction.
4. If referral is appropriate, the CHW starts a referral to a confirmed facility and the person is told where to go.
5. The record syncs when connectivity allows; the CHW sees what is waiting to sync.
6. The facility records arrival and outcome.
7. The CHW follows up and records whether the person was reached and attended.

The CHW's judgement always prevails. Paper processes continue in parallel in any pilot.

## 9. Programme intelligence workflow

1. Aggregates are calculated from person-level records, limited to the viewer's geography, with small counts suppressed (D-18).
2. Officers see signals (HIGH or URGENT assessments), community context, trends, and where referrals are stalled.
3. An officer decides on programme action (for example supervision, a community visit, a resupply, a message to a facility) and records it. The system does not decide.
4. Standard reports are produced under approval rules; exports beyond standard reports need the data owner's approval (D-24).
5. A signal is not a confirmed case and is not an outbreak declaration. Declaration and escalation follow the programme's existing human process.

## 10. GIS concept

- Hierarchy: state, LGA, ward, community, facility, from official boundary sources (to be agreed, D-05).
- Published maps at ward level; community is an attribute until the community-unit question is resolved (D-19).
- Layers: signals, community context, facilities, referral activity, programme coverage, WASH indicators.
- Server-side clipping to the viewer's scope; no individual locations; no per-assessment GPS.
- The current prototype's map is fictional and carries no geographic meaning.

## 11. Privacy and safety boundaries

- Minimal data; person-level and aggregate data are separate.
- Access by role and geography, enforced on the server; no standing access to person-level data for administrators.
- Encryption, audit, small-number suppression, retention limits (periods to be set by the owner after legal review).
- No diagnosis, prescribing or automated outbreak declaration.
- No real data until legal, ethics and governance gates are met (`PILOT_GATES.md`, `STAGE5_PRIVACY_READINESS.md`).
- Technical safeguards are not a claim of legal compliance.
- Rules are inactive for real people until independent clinical and public-health approval, or the app runs in no-rule mode (`CLINICAL_VALIDATION_PLAN.md`).

## 12. Pilot concept

A two-stage approach (`PILOT_BLUEPRINT.md`):

1. **Usability pilot** with scripted synthetic scenarios to learn whether users understand and can use the workflow and wording. No real data.
2. **Controlled field pilot**, only after Gate B, at a site chosen by the programme `[site: not selected]`, with a small number of trained CHWs, confirmed facilities, an approved rule set or no-rule mode, and stop conditions.

Pilot measures are operational (completion, sync success, referral closure, time to referral, usability, usefulness). The pilot is not designed to prove clinical accuracy or health impact unless an evaluation is separately designed and approved.

## 13. Support required

| Need                                                            | From                                               |
| --------------------------------------------------------------- | -------------------------------------------------- |
| Programme sponsor and named decision owners                     | Programme leadership                               |
| Clinical and public-health experts, and an independent reviewer | Clinical lead and ministry or programme            |
| Legal, privacy and ethics review                                | Counsel, data protection officer, ethics committee |
| Authoritative reference data (boundaries, facilities, WASH)     | Data custodians                                    |
| Pilot site, facilities, CHWs and supervisors                    | State and LGA authorities                          |
| Hosting, devices, connectivity                                  | Programme and partners                             |
| Funding and a sustainable owner                                 | Leadership, partners `[to be identified]`          |
| Engineering, security and operations capacity                   | Implementing team                                  |

## 14. Key decisions required from management

The full register is `STAGE5_DECISION_REGISTER.md`. The decisions management should address first:

1. Do you recognise the problem in section 2, and is a new tool, an extension of an existing platform, or neither the right response? (R1, R3)
2. Who is the accountable data owner and sponsor? (D-23)
3. Is the programme willing to pursue a controlled pilot, and where? (D-09)
4. Who will form the clinical and public-health review panel and the rule approval board? (D-10)
5. What is the ethics and institutional route? (D-11)
6. Which legal advisers will review the privacy questions? (`STAGE5_PRIVACY_READINESS.md`)
7. Which hosting and residency constraints apply? (D-01)
8. Which reference data owners will be approached? (D-05, D-06, D-15)
9. What device policy will apply? (D-25)
10. What is the funding and sustainability path? (Gate C12)

## 15. How to present it

Show the prototype with an unambiguous label that data and rules are synthetic. State limits before features. Invite criticism of the problem and of the differentiation. Record feedback and decisions in the register. Do not circulate figures from the prototype as findings.
