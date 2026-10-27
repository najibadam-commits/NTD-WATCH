# Stage 5 privacy and legal readiness

**Status:** a list of questions, not answers. **This document does not claim legal compliance, does not interpret any law, and is not legal advice.** Primary legal and regulatory texts must be read and applied by qualified counsel and the organisation's data protection officer. Where Stage 4 cited a law or a secondary summary, it was for orientation only and must be verified against the primary text.

It extends `PRIVACY_SECURITY_ARCHITECTURE.md` section 13 (questions Q1 to Q15 there) with the exact questions that must be answered before any real data is collected, grouped as the Stage 5 brief asks. Each question names the decision it feeds (`STAGE5_DECISION_REGISTER.md`), who should answer it, and what the technical design offers while waiting.

## 1. Technical safeguards are not legal compliance

| Technical safeguard (a design property)                       | What it can do                            | What it does not establish                                             |
| ------------------------------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------- |
| No names, phone, address or free text in person-level records | Reduces what could leak                   | That the remaining data is not personal or sensitive data in law       |
| Encryption, row-level security, role scoping                  | Reduces unauthorised access               | That processing has a lawful basis, or that notices were given         |
| Audit log                                                     | Allows review of who did what             | That accountability duties, records of processing or reporting are met |
| Suppression of small counts                                   | Reduces re-identification from aggregates | That an aggregate is anonymous in law                                  |
| Retention automation                                          | Can enforce a schedule                    | That the schedule is lawful or sufficient                              |
| Device encryption and remote revoke                           | Limits loss impact                        | That device ownership, employment and liability terms are settled      |

Labels used below: **[Counsel]** legal or privacy counsel or data protection officer; **[Policy]** organisational policy owner; **[Ethics]** ethics or institutional review; **[Clinical]** clinical or public-health lead; **[Tech]** technical team can supply facts but not the answer.

## 2. Questions requiring legal or privacy counsel

| #    | Question                                                                                                                                                                                                                                                                                             | Feeds            | Stage 4 ref |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | ----------- |
| L-1  | Given the actual field list in `packages/domain/src/entities.ts` (age group, sex, symptoms, duration, exposure answers, WASH answers, community, timestamps, risk level), is a record personal data, sensitive personal data, or neither, taking small communities and rare conditions into account? | D-12, D-18, D-21 | Q1          |
| L-2  | What is the lawful basis for each purpose: CHW screening and referral, programme intelligence, quality assurance, evaluation, audit, service improvement? Is the basis different for each?                                                                                                           | D-08             | Q2          |
| L-3  | Are the registration, classification, data protection officer, impact assessment, records of processing and breach-reporting duties triggered, and by whom must they be met?                                                                                                                         | D-23, D-11       | Q5, Q6, Q7  |
| L-4  | What are the rules on hosting health data outside the country, transfer mechanisms, government cloud expectations, and what contracts bind a hosting or identity provider?                                                                                                                           | D-01, D-02, D-13 | Q11, Q4     |
| L-5  | Does showing a risk level to a CHW make the software a regulated medical device or clinical decision support? What would that require, and does no-rule mode avoid it?                                                                                                                               | D-10             | Q15         |
| L-6  | What health-sector confidentiality and sharing rules apply (federal, state, facility)? Do they restrict a facility seeing the data in `PRODUCTION_RBAC.md` section 4?                                                                                                                                | D-16, D-06       | Q8          |
| L-7  | What do staff contracts and policies say about personal phones, loss and liability? Can a programme require device enrolment, remote wipe and locking?                                                                                                                                               | D-25             | Q14         |
| L-8  | What are the rules for sharing aggregates with funders, partners and in publications, including small-area results?                                                                                                                                                                                  | D-24, D-15       | Q13         |
| L-9  | Is a pseudonymous code (option B) still personal data? What does option C require beyond encryption?                                                                                                                                                                                                 | D-12             | new         |
| L-10 | Can audit and security logs themselves be personal data, and what is their retention basis?                                                                                                                                                                                                          | D-07             | new         |

## 3. Questions requiring organisational policy

| #   | Question                                                                                                                                                            | Feeds      |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| P-1 | Who is the accountable data owner for each dataset and who signs for the programme? Is there a data governance body?                                                | D-23       |
| P-2 | What access-control policy applies: joiner, mover and leaver steps, periodic access reviews, who approves accounts for each role, who may hold administrator roles? | D-16       |
| P-3 | Is break-glass access ever acceptable, and who would approve it?                                                                                                    | D-17       |
| P-4 | What are the incident, breach and safety-incident procedures, owners, and notification chain, and who is on call?                                                   | D-23       |
| P-5 | What is the export and external-sharing policy, and who approves exceptions?                                                                                        | D-24       |
| P-6 | Which devices are permitted, who pays, what is the loss reporting duty and the consequence of non-compliance?                                                       | D-25       |
| P-7 | What is the staff training and confidentiality undertaking required of CHWs, supervisors, facility staff, officers and administrators?                              | D-16       |
| P-8 | What is the policy for supervisors reviewing individual CHW records for quality assurance?                                                                          | D-16       |
| P-9 | Who may speak for the programme to communities, media and donors, and what may be said about a pilot on synthetic or early data?                                    | D-09, D-11 |

## 4. Questions requiring ethics review

| #   | Question                                                                                                                                                                       | Feeds      | Stage 4 ref |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- | ----------- |
| E-1 | Is the pilot programme implementation, service improvement, surveillance or research? Which body decides, and what does it require (protocol, registration, approval letters)? | D-11       | Q9          |
| E-2 | What approvals are needed from the Federal and State Ministries of Health, the NTD programme, LGA health authorities, facilities and community leaders?                        | D-09       | Q10         |
| E-3 | How are children, people unable to consent, and people with stigmatising conditions protected, including the risk that a record or a referral reveals a condition?             | D-08, D-12 | Q3          |
| E-4 | What community engagement and information must come first, in which languages?                                                                                                 | D-22       | new         |
| E-5 | What are the risks to CHWs (for example being blamed for results) and how are they mitigated?                                                                                  | D-25       | new         |
| E-6 | What will be done if a CHW finds a person needing urgent care and the referral cannot be completed (distance, cost, closure)? Who is responsible?                              | D-06       | new         |
| E-7 | What publication, data-sharing and results-return commitments apply?                                                                                                           | D-11       | new         |
| E-8 | Who monitors safety and can stop the pilot, and on what stop conditions?                                                                                                       | D-10       | new         |

## 5. Data controller and processor ownership

Questions only; no role is assigned here.

1. Who determines the purposes and means of processing for CHW records (the programme, the state, a partner)?
2. Is there a joint controller arrangement between programme, state and partner?
3. Who are the processors: hosting provider, identity provider, SMS or push provider, monitoring and logging provider, support staff of the implementer?
4. What contract (data processing agreement) is needed with each, covering sub-processors, location, security, assistance with incidents and requests, return and deletion on exit?
5. Who owns derived aggregates and the reference data, and who may reuse them?
6. Who handles data-subject requests, how are they verified given that records carry no name, and how is a record found without identifying the person (this depends on D-12)?
7. What happens to the data if the pilot ends, the partner leaves, or funding stops?

Feeds D-23, D-01. Answered by **[Counsel]** and **[Policy]**.

## 6. Consent and data-collection questions

1. What must a person be told before an assessment (purpose, what is recorded, who sees it, sharing with the facility, retention, rights, whom to contact) and in what form (verbal, written, assisted)?
2. Is consent required, or another basis? Can it be withdrawn, and what then happens to data already shared with a facility?
3. Who can consent for a child, and what if no adult is present?
4. How is notice recorded without identifying the person (`notice_version`, `notice_given_at` are reserved fields)?
5. Is every data field in the assessment necessary for the stated purpose? Each field needs a purpose, a user and a retention rule. The reviewer should challenge, among others: exposure answers, household-similar illness, WASH answers (often area-level information), and sex.
6. What data should not be collected unless justified: name, phone, address, national identifier, exact location, photographs, free text, household member details, biometric data. **None is collected by the prototype.** Any addition is a design change with a privacy review (`PRIVACY_SECURITY_ARCHITECTURE.md` section 14). Photographs in particular (relevant to skin conditions) have not been designed and would need their own review.
7. How is the person told the result is a prompt to seek care, not a diagnosis?

Feeds D-08, D-11, D-12, D-21, D-22. Answered by **[Counsel]**, **[Ethics]**, **[Clinical]**.

## 7. Retention and deletion questions

1. What retention period applies to each class (assessments, referrals, follow-ups, referral events, aggregates, audit log, sync logs, backups, device copies, support tickets)? **No period is proposed.**
2. After the period, is data deleted or anonymised, and what standard of anonymisation is accepted for small areas?
3. What is the process and timeline for deletion requests and how do they reach backups?
4. When can a phone's synced records be removed (grace period), and what happens to unsynced records on a lost phone?
5. Can data be kept for evaluation or research beyond operational need, and on what basis?
6. What happens to the audit trail when the underlying record is deleted?
7. What is the legal hold or investigation exception process?

Feeds D-07, D-11, D-25. Answered by **[Counsel]**, **[Policy]**, **[Ethics]**.

## 8. Location precision

1. Is the community (or ward) the finest geography that can be justified? What is the evidence that finer location is necessary?
2. If a finer location were ever proposed, is it personal data, how is it protected, who sees it, and is it ever mapped?
3. Can the combination of community, age group, sex, risk level, and date re-identify a person in a small community? What is the rule for small communities (D-18)?
4. Do facility locations and CHW assignments reveal anything sensitive?
5. What basemap or tile approach avoids sending viewers' locations to third parties (D-20)?

Feeds D-21, D-18, D-19, D-20. Answered by **[Counsel]**, **[Clinical]**, with **[Tech]** facts.

## 9. Person linkage

1. What clinical or programme need requires recognising the same person across assessments, referral and follow-up? Could it be met by the CHW holding a local code (option B), or without linkage (option A)?
2. If identifiers are stored (option C), which, why, who can see them, how are they encrypted separately, and what is the impact assessment conclusion?
3. Does linkage create a register of people with a condition, with stigma and legal risk?
4. How is duplicate detection handled without identifiers, and what duplicate rate is acceptable (`PILOT_READINESS.md` indicator 9)?
5. How would a person exercise their rights if only a code identifies them?

Feeds D-12, D-23. Answered by **[Counsel]**, **[Clinical]**, **[Ethics]**.

## 10. Access control

1. Which roles may see which fields (`PRODUCTION_RBAC.md` section 4)? In particular what a facility sees, whether supervisors see individual records, whether programme roles ever see person-level data.
2. How are accounts approved, reviewed and removed? What access review cadence?
3. What controls apply to administrators and the Super Administrator, who is not given standing access to person-level data, and what is the independent oversight?
4. How is access across jurisdictions (a person from another LGA treated at a facility) handled?
5. How are former staff and device loss handled?

Feeds D-16, D-17, D-25. Answered by **[Policy]**, **[Counsel]**.

## 11. Exports

1. What can be exported, by whom, in what form, and what review applies? The pilot default is the four standard suppressed report kinds only.
2. What labelling must exports carry (definition of a signal, period, rule set version, suppression applied)?
3. What are the conditions for sharing with partners and funders (D-24), and what is the approval record?
4. How is onward sharing by the recipient controlled?
5. How are screenshots and manual copies addressed (training, policy, watermarking if used)?

Feeds D-24, D-18. Answered by **[Policy]**, **[Counsel]**.

## 12. Audit requirements

1. Which events must be logged (the list in `PRODUCTION_RBAC.md` section 7, versus the 3 events logged by the prototype), and is anything additional required by law or policy?
2. How long are audit logs kept, who can read them, and are they themselves protected as personal data?
3. Who reviews the audit log, how often, and with what escalation?
4. What evidence of audit integrity is required (hash chain, separate role, offsite copy)?
5. What must the audit show about rule set versions and approvals (`RULE_GOVERNANCE.md`)?
6. Is audit required to show who viewed which person-level record, and what is the effect on the performance and the privacy of staff?

Feeds D-07, D-16, D-17. Answered by **[Policy]**, **[Counsel]**, with **[Tech]** feasibility.

## 13. Gate: what must be answered before real data

A decision is "answered" when it is recorded in the decision register with a named owner, a date, and the source of authority. Before any real data:

- L-1 to L-5 answered in writing by counsel, with the conclusions applied to the data model.
- E-1, E-2 answered; approvals obtained.
- Section 5 questions answered; processing agreements signed.
- Sections 6, 7, 8, 9 answered, producing decisions D-08, D-07, D-21, D-12.
- Sections 10, 11, 12 answered, producing D-16, D-17, D-24 and the audit policy.
- A data protection impact assessment completed and signed off by the accountable owner, if counsel confirms it is required (planning for one is recommended regardless).
- The technical safeguards in section 1 verified by tests in `TESTING_ROADMAP.md` tier 2.

Completing this list shows the questions were answered. It does not by itself show compliance; that conclusion belongs to counsel and the accountable owner.
