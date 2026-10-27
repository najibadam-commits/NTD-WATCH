# Privacy, ethics and governance validation workplan

**Status:** tracker. Every item is currently **NOT ASKED**. **This workplan does not answer legal questions and makes no compliance claim.** Questions are answered by the named owner (counsel, the data protection officer, the ethics committee, the data owner or the policy owner). Technical safeguards (encryption, access control, audit, suppression) are design properties; they are not evidence that any law is satisfied.

**Source of truth:** `docs/STAGE5_PRIVACY_READINESS.md` (question text and grouping) and `docs/PRIVACY_SECURITY_ARCHITECTURE.md` section 13. Decision IDs refer to `docs/STAGE5_DECISION_REGISTER.md`.

## 1. Purpose in Stage 6

Stage 6 does not need these questions answered. It needs to know **whether they can realistically be answered** (objective 7): do the owners exist, will they engage, are the likely constraints compatible with the concept, and which answers could stop or reshape the project (for example a localisation rule that rules out the hosting assumed, or a regulatory finding that makes decision support impractical). So the Stage 6 tasks are:

1. Identify the owner for each question and confirm they accept it (`ASKED`).
2. Submit the questions with the minimum background the owner needs.
3. Record answers as received, with authority and date, without paraphrasing the legal substance.
4. Flag every answer that would change the concept, hosting, data model, rules or pilot (**impact flag**).
5. Report feasibility: Yes, Partly, No, Unknown, per group, in `STAGE6_REPORT.md`.

Also in scope: the ethics determination for **the Stage 6 validation activities themselves** (interviews, prototype sessions), tracked as ETH-1.

**Ethics gate (stated explicitly):** ETH-1 gates all participant contact. No stakeholder is approached, no interview, workshop or prototype session is held, and no questionnaire is circulated until ETH-1 has a written determination from the responsible body. Stage 6 documentation and code do not conduct or simulate stakeholder research. Legal and compliance content in this workplan is expressed as questions or requirements, never as claims. The session pack (`STAGE6_STAKEHOLDER_SESSION_PACK.md`) contains the consent and ethics checklist to be applied once ETH-1 is answered.

## 2. Status values

NOT ASKED, ASKED (to whom, date), ANSWERED (answer received, not yet a decision), DECIDED (decision recorded in a register with authority), BLOCKED (waiting on dependency or owner), WITHDRAWN (no longer relevant, with reason).

Rules: the "Decision" column records the owner's decision in their words or a reference to the signed record. "Date" is the date of that decision. An `ANSWERED` item is not a decision. No row may be marked DECIDED by the project team on a legal or ethics matter.

## 3. Roll-up

| Group                           | Items  | Not asked | Asked | Answered | Decided | Blocked | Feasibility (Y / Partly / N / Unknown) | Impact flags |
| ------------------------------- | ------ | --------- | ----- | -------- | ------- | ------- | -------------------------------------- | ------------ |
| Legal and privacy counsel (LEG) | 10     | 10        | 0     | 0        | 0       | 0       | Unknown                                | —            |
| Organisational policy (POL)     | 9      | 9         | 0     | 0        | 0       | 0       | Unknown                                | —            |
| Ethics review (ETH)             | 8      | 8         | 0     | 0        | 0       | 0       | Unknown                                | —            |
| Controller / processor (OWN)    | 7      | 7         | 0     | 0        | 0       | 0       | Unknown                                | —            |
| Consent and collection (CON)    | 7      | 7         | 0     | 0        | 0       | 0       | Unknown                                | —            |
| Retention and deletion (RET)    | 7      | 7         | 0     | 0        | 0       | 0       | Unknown                                | —            |
| Location precision (LOC)        | 5      | 5         | 0     | 0        | 0       | 0       | Unknown                                | —            |
| Person linkage (LNK)            | 5      | 5         | 0     | 0        | 0       | 0       | Unknown                                | —            |
| Access control (ACC)            | 5      | 5         | 0     | 0        | 0       | 0       | Unknown                                | —            |
| Exports (EXP)                   | 5      | 5         | 0     | 0        | 0       | 0       | Unknown                                | —            |
| Audit (AUD)                     | 6      | 6         | 0     | 0        | 0       | 0       | Unknown                                | —            |
| Device policy (DEV)             | 4      | 4         | 0     | 0        | 0       | 0       | Unknown                                | —            |
| **Total**                       | **78** | **78**    | 0     | 0        | 0       | 0       |                                        |              |

Update the roll-up when rows change.

## 4. Tracker

Column key: _Owner_ is the function that answers; _Evidence required_ is what must be on file for the item to count as answered; _Dependency_ is another tracker item, decision or document. Cross-references to `STAGE5_PRIVACY_READINESS.md` use its IDs (L-, P-, E-) in the question order (LEG-n = L-n, POL-n = P-n, ETH-n = E-n).

### Legal and privacy counsel (source: STAGE5_PRIVACY_READINESS section 2)

| ID     | Question                                                                                                                         | Decision ID      | Owner         | Evidence required                             | Status    | Decision | Date | Dependency            |
| ------ | -------------------------------------------------------------------------------------------------------------------------------- | ---------------- | ------------- | --------------------------------------------- | --------- | -------- | ---- | --------------------- |
| LEG-1  | Is a record personal or sensitive personal data, given the field list in entities.ts and small communities?                      | D-12, D-18, D-21 | Counsel / DPO | Written opinion on the field list             | NOT ASKED | —        | —    | D-12 options          |
| LEG-2  | What lawful basis applies to each purpose (screening/referral, intelligence, QA, evaluation, audit)?                             | D-08             | Counsel / DPO | Written opinion per purpose                   | NOT ASKED | —        | —    | Purpose list approved |
| LEG-3  | Which registration, classification, DPO, impact-assessment, records and breach duties apply, and who meets them?                 | D-23, D-11       | Counsel / DPO | Written opinion; duty-owner table             | NOT ASKED | —        | —    | D-23                  |
| LEG-4  | What are the rules on hosting health data outside the country, transfer mechanisms and contracts for hosting/identity providers? | D-01, D-02, D-13 | Counsel / DPO | Written opinion                               | NOT ASKED | —        | —    | Provider shortlist    |
| LEG-5  | Does showing a risk level make the software a regulated device or clinical decision support? Does no-rule mode avoid it?         | D-10             | Counsel / DPO | Written opinion; regulator contact if advised | NOT ASKED | —        | —    | Intended use (CV-1)   |
| LEG-6  | What health-sector confidentiality and sharing rules (federal, state, facility) apply to what a facility sees?                   | D-16, D-06       | Counsel / DPO | Written opinion                               | NOT ASKED | —        | —    | RBAC section 4        |
| LEG-7  | Can the programme require device enrolment, remote wipe and locking; what do contracts say about personal phones and loss?       | D-25             | Counsel / DPO | Written opinion; staff contract extracts      | NOT ASKED | —        | —    | Device policy options |
| LEG-8  | What rules govern sharing aggregates with funders, partners and in publications?                                                 | D-24, D-15       | Counsel / DPO | Written opinion                               | NOT ASKED | —        | —    | Export policy draft   |
| LEG-9  | Is a pseudonymous code (option B) still personal data? What does option C require beyond encryption?                             | D-12             | Counsel / DPO | Written opinion                               | NOT ASKED | —        | —    | Option descriptions   |
| LEG-10 | Are audit and security logs personal data and what is their retention basis?                                                     | D-07             | Counsel / DPO | Written opinion                               | NOT ASKED | —        | —    | Audit event list      |

### Organisational policy (source: section 3)

| ID    | Question                                                                                                                   | Decision ID | Owner                  | Evidence required                  | Status    | Decision | Date | Dependency     |
| ----- | -------------------------------------------------------------------------------------------------------------------------- | ----------- | ---------------------- | ---------------------------------- | --------- | -------- | ---- | -------------- |
| POL-1 | Who is the accountable owner of each dataset and who signs for the programme? Is there a governance body?                  | D-23        | Programme policy owner | Named owners; terms of reference   | NOT ASKED | —        | —    | Sponsor        |
| POL-2 | What access-control policy applies (joiner/mover/leaver, access reviews, who approves accounts, who may be administrator)? | D-16        | Programme policy owner | Written policy                     | NOT ASKED | —        | —    | Role set       |
| POL-3 | Is break-glass access ever acceptable, and who would approve it?                                                           | D-17        | Programme policy owner | Policy decision                    | NOT ASKED | —        | —    | D-16           |
| POL-4 | What incident, breach and safety-incident procedures, owners and notification chain exist?                                 | D-23        | Programme policy owner | Written procedures; on-call roster | NOT ASKED | —        | —    | Counsel duties |
| POL-5 | What is the export and external-sharing policy and who approves exceptions?                                                | D-24        | Programme policy owner | Written policy                     | NOT ASKED | —        | —    | LEG-8          |
| POL-6 | Which devices are permitted, who pays, what is the loss duty and consequence?                                              | D-25        | Programme policy owner | Written policy                     | NOT ASKED | —        | —    | LEG-7          |
| POL-7 | What training and confidentiality undertaking applies to each user group?                                                  | D-16        | Programme policy owner | Training plan; undertaking text    | NOT ASKED | —        | —    | Role set       |
| POL-8 | What is the policy on supervisors reviewing individual CHW records for QA?                                                 | D-16        | Programme policy owner | Policy decision                    | NOT ASKED | —        | —    | LEG-6          |
| POL-9 | Who may speak for the programme to communities, media and donors, and what may be said about early-stage work?             | D-09, D-11  | Programme policy owner | Communication protocol             | NOT ASKED | —        | —    | Sponsor        |

### Ethics review (source: section 4)

| ID    | Question                                                                                                                                                                                           | Decision ID | Owner            | Evidence required          | Status    | Decision | Date | Dependency                |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ---------------- | -------------------------- | --------- | -------- | ---- | ------------------------- |
| ETH-1 | Is the pilot programme implementation, service improvement, surveillance or research; which body decides and what does it require? (Also needed for the Stage 6 validation activities themselves.) | D-11        | Ethics committee | Written determination      | NOT ASKED | —        | —    | Description of activities |
| ETH-2 | What approvals are needed from federal and state health ministries, the NTD programme, LGAs, facilities and community leaders?                                                                     | D-09        | Ethics committee | List of approvals; letters | NOT ASKED | —        | —    | D-09                      |
| ETH-3 | How are children, people unable to consent and people with stigmatising conditions protected, including by records and referrals?                                                                  | D-08, D-12  | Ethics committee | Ethics committee guidance  | NOT ASKED | —        | —    | LEG-2                     |
| ETH-4 | What community engagement and information must come first, in which languages?                                                                                                                     | D-22        | Ethics committee | Engagement plan approved   | NOT ASKED | —        | —    | D-09                      |
| ETH-5 | What are the risks to CHWs (for example blame) and how are they mitigated?                                                                                                                         | D-25        | Ethics committee | Risk assessment            | NOT ASKED | —        | —    | Role design               |
| ETH-6 | What happens when a person needing urgent care cannot complete a referral (distance, cost, closure) and who is responsible?                                                                        | D-06        | Ethics committee | Safety protocol            | NOT ASKED | —        | —    | Facility agreements       |
| ETH-7 | What publication, data-sharing and results-return commitments apply?                                                                                                                               | D-11        | Ethics committee | Written commitments        | NOT ASKED | —        | —    | Funder terms              |
| ETH-8 | Who monitors safety and can stop the pilot, and on what stop conditions?                                                                                                                           | D-10        | Ethics committee | Stop-condition document    | NOT ASKED | —        | —    | Gate B10                  |

### Data controller and processor ownership (source: section 5)

| ID    | Question                                                                                                                 | Decision ID | Owner      | Evidence required                   | Status    | Decision | Date | Dependency       |
| ----- | ------------------------------------------------------------------------------------------------------------------------ | ----------- | ---------- | ----------------------------------- | --------- | -------- | ---- | ---------------- |
| OWN-1 | Who determines the purposes and means of processing for CHW records?                                                     | D-23        | Data owner | Written determination               | NOT ASKED | —        | —    | LEG-3            |
| OWN-2 | Is there a joint controller arrangement between programme, state and partner?                                            | D-23        | Data owner | Agreement or opinion                | NOT ASKED | —        | —    | OWN-1            |
| OWN-3 | Who are the processors (hosting, identity, messaging, logging, implementer support)?                                     | D-23, D-01  | Data owner | Processor list                      | NOT ASKED | —        | —    | Provider choices |
| OWN-4 | What processing contract is needed with each processor (sub-processors, location, security, incidents, return/deletion)? | D-23        | Data owner | Draft contracts reviewed by counsel | NOT ASKED | —        | —    | OWN-3            |
| OWN-5 | Who owns derived aggregates and reference data and who may reuse them?                                                   | D-23        | Data owner | Data register entries               | NOT ASKED | —        | —    | D-05, D-06       |
| OWN-6 | Who handles data-subject requests, how are they verified when records carry no name, and how is a record found?          | D-12, D-23  | Data owner | Procedure; counsel opinion          | NOT ASKED | —        | —    | D-12             |
| OWN-7 | What happens to the data if the pilot ends, a partner leaves or funding stops?                                           | D-07, D-23  | Data owner | Exit plan                           | NOT ASKED | —        | —    | Agreements       |

### Consent, notice and data collection (source: section 6)

| ID    | Question                                                                                                                                                      | Decision ID | Owner            | Evidence required                  | Status    | Decision | Date | Dependency      |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ---------------- | ---------------------------------- | --------- | -------- | ---- | --------------- |
| CON-1 | What must a person be told before an assessment and in what form (verbal, written, assisted)?                                                                 | D-08        | Counsel / DPO    | Notice text approved               | NOT ASKED | —        | —    | LEG-2, ETH-3    |
| CON-2 | Is consent required or another basis; can it be withdrawn; what happens to data already shared with a facility?                                               | D-08        | Counsel / DPO    | Opinion                            | NOT ASKED | —        | —    | LEG-2           |
| CON-3 | Who can consent for a child and what if no adult is present?                                                                                                  | D-08        | Ethics committee | Ethics guidance                    | NOT ASKED | —        | —    | ETH-3           |
| CON-4 | How is notice recorded without identifying the person (reserved fields notice_version, notice_given_at)?                                                      | D-08        | Counsel / DPO    | Design review                      | NOT ASKED | —        | —    | CON-1           |
| CON-5 | Is every assessment field necessary for the stated purpose (each with a purpose, user and retention rule)?                                                    | D-12, D-21  | Data owner       | Field-by-field justification table | NOT ASKED | —        | —    | Clinical lead   |
| CON-6 | Which data must not be collected unless justified (name, phone, address, identifiers, exact location, photographs, free text, household details, biometrics)? | D-12, D-21  | Data owner       | Confirmed exclusion list           | NOT ASKED | —        | —    | LEG-1           |
| CON-7 | How is the person told the result is a prompt to seek care and not a diagnosis?                                                                               | D-08, D-10  | Ethics committee | Approved wording                   | NOT ASKED | —        | —    | Clinical review |

### Retention and deletion (source: section 7)

| ID    | Question                                                                                           | Decision ID | Owner                  | Evidence required           | Status    | Decision | Date | Dependency |
| ----- | -------------------------------------------------------------------------------------------------- | ----------- | ---------------------- | --------------------------- | --------- | -------- | ---- | ---------- |
| RET-1 | What retention period applies to each data class? (No period is proposed in the project.)          | D-07        | Counsel / DPO          | Retention schedule approved | NOT ASKED | —        | —    | LEG-3      |
| RET-2 | After the period, delete or anonymise; what standard of anonymisation is accepted for small areas? | D-07, D-18  | Counsel / DPO          | Opinion; statistician input | NOT ASKED | —        | —    | D-18       |
| RET-3 | What is the deletion-request process and timeline, including backups?                              | D-07        | Counsel / DPO          | Procedure                   | NOT ASKED | —        | —    | RET-1      |
| RET-4 | When are synced records removed from phones; what happens to unsynced records on a lost phone?     | D-07, D-25  | Programme policy owner | Device data policy          | NOT ASKED | —        | —    | D-25       |
| RET-5 | Can data be kept for evaluation or research beyond operational need, and on what basis?            | D-07, D-11  | Ethics committee       | Ethics determination        | NOT ASKED | —        | —    | D-11       |
| RET-6 | What happens to the audit trail when the record is deleted?                                        | D-07        | Counsel / DPO          | Opinion                     | NOT ASKED | —        | —    | AUD-2      |
| RET-7 | What is the legal-hold / investigation exception process?                                          | D-07        | Counsel / DPO          | Procedure                   | NOT ASKED | —        | —    | RET-1      |

### Location precision (source: section 8)

| ID    | Question                                                                                                                    | Decision ID | Owner         | Evidence required                       | Status    | Decision | Date | Dependency     |
| ----- | --------------------------------------------------------------------------------------------------------------------------- | ----------- | ------------- | --------------------------------------- | --------- | -------- | ---- | -------------- |
| LOC-1 | Is community (or ward) the finest geography justified; what evidence says finer is necessary?                               | D-21        | Data owner    | Justification or confirmation           | NOT ASKED | —        | —    | Clinical lead  |
| LOC-2 | If finer location were proposed: is it personal data, how protected, who sees it, is it mapped?                             | D-21        | Counsel / DPO | Opinion                                 | NOT ASKED | —        | —    | LOC-1          |
| LOC-3 | Can community + age group + sex + level + date re-identify a person in a small community; what is the small-community rule? | D-18        | Data owner    | Statistician analysis on synthetic data | NOT ASKED | —        | —    | D-18           |
| LOC-4 | Do facility locations and CHW assignments reveal anything sensitive?                                                        | D-06        | Counsel / DPO | Review                                  | NOT ASKED | —        | —    | Reference data |
| LOC-5 | What basemap approach avoids sending viewers' locations to third parties?                                                   | D-20        | Data owner    | Technical option paper                  | NOT ASKED | —        | —    | D-01           |

### Person linkage (source: section 9)

| ID    | Question                                                                                                                                     | Decision ID | Owner            | Evidence required                  | Status    | Decision | Date | Dependency              |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ---------------- | ---------------------------------- | --------- | -------- | ---- | ----------------------- |
| LNK-1 | What clinical or programme need requires recognising the same person across assessment, referral and follow-up; could option A or B meet it? | D-12        | Data owner       | Needs statement from clinical lead | NOT ASKED | —        | —    | Workflow evidence (WS1) |
| LNK-2 | If identifiers are stored (option C): which, why, who sees them, how encrypted separately, what does the impact assessment conclude?         | D-12        | Counsel / DPO    | Impact assessment                  | NOT ASKED | —        | —    | LNK-1                   |
| LNK-3 | Does linkage create a register of people with a condition, with stigma and legal risk?                                                       | D-12        | Ethics committee | Ethics guidance                    | NOT ASKED | —        | —    | LNK-1                   |
| LNK-4 | How is duplicate detection done without identifiers and what duplicate rate is acceptable?                                                   | D-12        | Data owner       | Technical note; pilot indicator 9  | NOT ASKED | —        | —    | D-12                    |
| LNK-5 | How would a person exercise rights if only a code identifies them?                                                                           | D-12, D-23  | Counsel / DPO    | Procedure                          | NOT ASKED | —        | —    | OWN-6                   |

### Access control (source: section 10)

| ID    | Question                                                                                                    | Decision ID | Owner                  | Evidence required               | Status    | Decision | Date | Dependency |
| ----- | ----------------------------------------------------------------------------------------------------------- | ----------- | ---------------------- | ------------------------------- | --------- | -------- | ---- | ---------- |
| ACC-1 | Which roles may see which fields (facility view, supervisor access to individual records, programme roles)? | D-16        | Programme policy owner | Approved field-visibility table | NOT ASKED | —        | —    | LEG-6      |
| ACC-2 | How are accounts approved, reviewed and removed; what review cadence?                                       | D-16        | Programme policy owner | Procedure                       | NOT ASKED | —        | —    | POL-2      |
| ACC-3 | What controls and independent oversight apply to administrators and the Super Administrator?                | D-16, D-17  | Programme policy owner | Control description             | NOT ASKED | —        | —    | POL-3      |
| ACC-4 | How is access across jurisdictions handled (a person from another LGA at a facility)?                       | D-16        | Programme policy owner | Rule                            | NOT ASKED | —        | —    | ACC-1      |
| ACC-5 | How are former staff and device loss handled?                                                               | D-16, D-25  | Programme policy owner | Procedure                       | NOT ASKED | —        | —    | POL-6      |

### Exports (source: section 11)

| ID    | Question                                                                                            | Decision ID | Owner                  | Evidence required       | Status    | Decision | Date | Dependency      |
| ----- | --------------------------------------------------------------------------------------------------- | ----------- | ---------------------- | ----------------------- | --------- | -------- | ---- | --------------- |
| EXP-1 | What can be exported, by whom, in what form; the pilot default is standard suppressed reports only. | D-24        | Data owner             | Approved export list    | NOT ASKED | —        | —    | D-18            |
| EXP-2 | What labelling must exports carry (definition of signal, period, rule version, suppression)?        | D-24        | Data owner             | Template approved       | NOT ASKED | —        | —    | Rule governance |
| EXP-3 | What are the conditions for sharing with partners and funders; what is the approval record?         | D-24        | Counsel / DPO          | Policy and agreement    | NOT ASKED | —        | —    | LEG-8           |
| EXP-4 | How is onward sharing by recipients controlled?                                                     | D-24        | Counsel / DPO          | Agreement clause review | NOT ASKED | —        | —    | EXP-3           |
| EXP-5 | How are screenshots and manual copies addressed?                                                    | D-24        | Programme policy owner | Training content        | NOT ASKED | —        | —    | POL-7           |

### Audit requirements (source: section 12)

| ID    | Question                                                                                                            | Decision ID | Owner                  | Evidence required   | Status    | Decision | Date | Dependency      |
| ----- | ------------------------------------------------------------------------------------------------------------------- | ----------- | ---------------------- | ------------------- | --------- | -------- | ---- | --------------- |
| AUD-1 | Which events must be logged and is anything additional required by law or policy?                                   | D-16, D-17  | Counsel / DPO          | Required event list | NOT ASKED | —        | —    | RBAC section 7  |
| AUD-2 | How long are audit logs kept, who reads them, and are they protected as personal data?                              | D-07        | Counsel / DPO          | Policy              | NOT ASKED | —        | —    | LEG-10          |
| AUD-3 | Who reviews the audit log, how often, with what escalation?                                                         | D-23        | Programme policy owner | Procedure           | NOT ASKED | —        | —    | POL-4           |
| AUD-4 | What evidence of audit integrity is required (hash chain, separate role, offsite copy)?                             | D-17        | Programme policy owner | Requirement         | NOT ASKED | —        | —    | Security lead   |
| AUD-5 | What must audit show about rule set versions and approvals?                                                         | D-10        | Programme policy owner | Requirement         | NOT ASKED | —        | —    | Rule governance |
| AUD-6 | Is audit of who viewed which person-level record required, and what is the effect on staff privacy and performance? | D-16        | Counsel / DPO          | Opinion             | NOT ASKED | —        | —    | ACC-1           |

### Device policy (source: Stage 4/5 device questions; extends L-7, P-6, E-5)

| ID    | Question                                                                                                             | Decision ID | Owner                  | Evidence required    | Status    | Decision | Date | Dependency       |
| ----- | -------------------------------------------------------------------------------------------------------------------- | ----------- | ---------------------- | -------------------- | --------- | -------- | ---- | ---------------- |
| DEV-1 | Programme-issued, enrolled or personal phones; who owns, pays and supports?                                          | D-25        | Programme policy owner | Decision with budget | NOT ASKED | —        | —    | Funding          |
| DEV-2 | What minimum OS/browser baseline and what device registration/security controls?                                     | D-25, D-14  | Programme policy owner | Baseline document    | NOT ASKED | —        | —    | Real-device test |
| DEV-3 | May unsynced data on a lost device ever be recovered under supervision?                                              | D-25        | Counsel / DPO          | Opinion; decision    | NOT ASKED | —        | —    | LEG-7            |
| DEV-4 | What is the user's duty and the programme's response when a device is lost or stolen (reporting time, revoke, wipe)? | D-25        | Programme policy owner | Procedure            | NOT ASKED | —        | —    | POL-6            |

## 5. Sequencing

1. **First:** ETH-1 (ethics determination for the validation work itself), POL-9 (who may speak about the project), OWN-1 (who is the owner).
2. **Early, because answers can reshape the concept:** LEG-4 (hosting and transfer), LEG-5 (regulatory status of a displayed level), LEG-1 (what counts as personal data), LNK-1 (is linkage needed).
3. **Before any pilot planning:** all others in the groups above.
4. **Never by the project team:** legal and ethics conclusions.

## 6. Impact flags (concept-changing answers)

When an answer arrives, check these and record in `STAGE6_EVIDENCE_REGISTER.md` and, if relevant, `STAGE6_DECISION_REGISTER.md`:

| If the answer is...                                                    | Possible effect on the concept                                     | Outcome it supports |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------- |
| Hosting must be in-country and no suitable option exists               | Cannot host as designed; consider integration with a host that can | INTEGRATE / STOP    |
| A displayed risk level is a regulated function that cannot be obtained | Run in no-rule mode only, or remove the prompt                     | MODIFY              |
| Person-level data must not be held centrally                           | Aggregate-only design; local-only storage                          | MODIFY              |
| Consent cannot be obtained in practice at point of care                | Redesign the data collected                                        | MODIFY / STOP       |
| Ethics body requires a full research protocol                          | Timeline and design change                                         | MODIFY              |
| An existing system owner already holds the legal responsibility        | Integrate rather than duplicate                                    | INTEGRATE           |
| No data owner can be named                                             | Cannot proceed                                                     | STOP                |

## 7. Output for the report

For `STAGE6_REPORT.md`, "Privacy/ethics findings": the roll-up; the list of answers received (with authority); impact flags raised; the feasibility rating per group; and a plain statement that **no compliance is claimed**. Placeholders remain until answers are received.
