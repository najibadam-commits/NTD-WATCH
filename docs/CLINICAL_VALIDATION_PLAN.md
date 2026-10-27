# Clinical and public-health validation plan

**Status:** Proposed process. This plan has not been started, reviewed, or approved by any clinical or public-health body. It does not name experts, cite evidence, set thresholds, or claim that any rule is valid. It describes the steps the rules must pass before they could be called validated programme logic.

## 1. The boundary

- The current rule set, `demo-placeholder` 0.1.0, is **demonstration-only**. Its rules, thresholds and wording are arbitrary placeholders.
- **A rule engine that works is not a rule set that is right.** Technical implementation, passing tests and a clean schema show the software does what the rules say. They say nothing about whether the rules are clinically or epidemiologically sound.
- **NTD-WATCH does not diagnose disease**, prescribe treatment, or declare outbreaks. Its output is a prompt to a trained CHW: a level of concern, the reasons, and a suggested next step approved by the programme. A person with a condition is confirmed by a facility, not by this system.
- Whether the product, with a validated rule set, falls under medical-device or clinical decision-support regulation is a question for counsel and the regulator (`PRIVACY_SECURITY_ARCHITECTURE.md` question 15). Until answered, no regulatory status is claimed.
- If no suitable validated rule set is approved, NTD-WATCH runs in **no-rule mode** (record, show no level, show the approved instruction, refer under CHW judgement). That is a legitimate, safe outcome.

## 2. Process

```text
Scope and intended use
  -> Expert selection
  -> Evidence gathering
  -> Rule drafting or adaptation
  -> Independent clinical/public-health review
  -> Technical validation
  -> Independent second review
  -> Test-case and scenario validation
  -> Pre-pilot usability and comprehension check
  -> Approval record
  -> Versioned, signed release
  -> Supervised deployment and monitoring
  -> Periodic revalidation
```

The governance mechanics (metadata, board, suspension, rollback, environment guards) are in `RULE_GOVERNANCE.md`. This plan covers the content-validation steps that feed it.

### 2.1 Define the intended use first

Before any rule: who uses the output (CHW), on whom (age groups, setting), for what decision (when to refer and how urgently), what the output must never be used for (diagnosis, treatment, outbreak declaration), what a wrong output costs (missed referral, unnecessary referral, alert fatigue), and which conditions are in scope. This is written by the programme and clinical lead, and every later step is judged against it.

### 2.2 Select the experts

Roles needed (names are not proposed here):

| Role                                    | Contribution                                                                  |
| --------------------------------------- | ----------------------------------------------------------------------------- |
| Clinical lead                           | Accountable for clinical content; typically a clinician with NTD experience   |
| NTD programme technical officer         | Alignment with national and state programme guidance and case definitions     |
| Public-health / epidemiology expert     | Signal definitions, population-level behaviour, evaluation design             |
| Primary-care or community health expert | Realism for CHWs: what can be asked and observed                              |
| Independent reviewer                    | Not part of the authoring team or implementer; preferably another institution |
| Human-factors / communication expert    | Comprehension of wording and instructions in the pilot languages              |
| Statistician                            | Test-set design, agreement measures, monitoring methods                       |

Selection rules: relevant qualification and current practice; conflict-of-interest declarations; at least one reviewer independent of the implementer; an odd quorum rule decided in D-10. The programme owner appoints; the developer does not.

### 2.3 Evidence sources

The experts decide which sources count. Categories to consider, in the order a reviewer would usually weigh them:

1. National and state NTD programme guidance and case definitions.
2. International normative guidance on the relevant diseases and on community case detection.
3. Published studies and reviews on community-level detection and referral for the conditions in scope.
4. Existing validated tools or algorithms used in comparable settings (adapted, not copied without permission and review).
5. Local programme data, only if approvals allow, as context.
6. Expert consensus where evidence is thin, recorded as such.

Every rule links to its evidence in the version metadata. **External research is still required**: this repository holds no evidence base, and none is asserted. Where evidence is weak the rule is marked as consensus-based and its limitation shown.

### 2.4 Rule drafting or adaptation

Options for the experts: adapt an existing approved algorithm; or draft new rules. Either way:

- Wording passes the forbidden-text check (no diagnostic or prescriptive wording).
- Missing and unknown answers fail safe: no level, or a visible warning that concern may be understated.
- Thresholds are justified in writing, not chosen for convenience.
- Each rule states what it is meant to catch and what it is likely to miss.

### 2.5 Review

1. **First review:** clinical and public-health experts review each rule, threshold, action text and limitation against the evidence and the intended use. Written findings; the author responds.
2. **Technical validation:** the engineering team proves the schema, wording check, determinism and case results.
3. **Independent second review:** a reviewer independent of the authors and first reviewers examines the evidence, reviews and validation report, and may reject.

No reviewer reviews their own work. Disagreements are recorded and resolved by the board, not by the developers.

### 2.6 Test cases and scenario validation

- A fixed case set held in the governance store, separate from developer-edited unit tests.
- **Expected results written by the clinical reviewers independently of the current rule output.**
- Cover: each rule firing and not firing; each threshold boundary; missing and unknown answers; combinations; age and sex groups; plausible real-world presentations written by experts from field experience (synthetic, not real patient records).
- Compare each new version against the previous one and review every case that changes level.
- Measure agreement between the rule output and an expert panel's independent classification on a panel-rated set of synthetic scenarios. The agreement measure and the acceptable level are chosen by the statistician and clinical lead, and recorded _before_ the test is run. **No acceptance threshold is proposed here.**

### 2.7 Validation methodology: what kind of evidence

Three kinds of evidence, which must not be confused:

| Kind                    | Question                                                                       | Method (to be designed by experts)                                                    | Can be done without real patients |
| ----------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- | --------------------------------- |
| Content validity        | Do the rules reflect accepted guidance and expert judgement?                   | Structured expert review; consensus method chosen by the panel                        | Yes                               |
| Technical verification  | Does the software implement the rules exactly?                                 | Tests, determinism, device-versus-server equivalence                                  | Yes                               |
| Performance in practice | Does it help CHWs find people who need care, and at what cost in false alarms? | Prospective evaluation with ethics approval, comparison against facility confirmation | **No**                            |

The first two can support a controlled pilot in which rules are advisory and CHW judgement prevails. The third is a separate study (D-11) and is the only basis for any claim about accuracy or impact. **Until it is done, no accuracy, sensitivity, specificity or impact claim is made.**

### 2.8 Comprehension and usability check

Before pilot, with CHWs (not developers): do CHWs understand the questions, the level, the reasons, the suggested action and the limitations in the working language? Do they over-trust or ignore the output? Findings can change wording and require re-review.

### 2.9 Approval record

Held in the governance store, not the repository: rule set id and content hash; intended use; evidence list; reviewers, roles and declarations; independence statement; technical validation report; case results and version comparison; the board's decision with date, scope and quorum; effective date; review-by and expiry dates; known limitations; monitoring plan. Signed by named approvers with strong authentication. Fields are listed in `RULE_GOVERNANCE.md` section 3.

### 2.10 Versioning and release

Semantic versions, immutable once approved. Signed bundle served only when the approval record verifies. Release to the pilot geography first. CHWs trained on any change before it takes effect. The previous version stays available for rollback. Every assessment stores the rule set id, version and hash.

### 2.11 Monitoring after deployment

Distribution of levels by community and time; unknown-answer rate; device-versus-server mismatch; CHW feedback on disagreement; referral outcomes recorded by facilities (a signal, not proof of accuracy); safety reports; equity across age, sex and geography. A monitoring trigger opens a review; it never changes a rule automatically. Emergency suspension by any clinical reviewer or the safety lead.

### 2.12 Periodic revalidation

Mandatory review date and hard expiry on every version. Triggers for earlier review: a change in programme guidance, a new case definition, a safety report, monitoring drift, a change of population or setting, a language change. Revalidation repeats sections 2.5 to 2.9 for the changed parts, and the whole set at the scheduled interval the board sets.

## 3. Who does what

| Step                                | Accountable                                 |
| ----------------------------------- | ------------------------------------------- |
| Intended use                        | Programme owner and clinical lead           |
| Expert appointment                  | Programme owner                             |
| Evidence selection and rule content | Clinical lead and panel                     |
| Technical validation                | Engineering (not the author)                |
| Independent review                  | Independent reviewer                        |
| Approval                            | Rule approval board                         |
| Release                             | Release manager (cannot approve)            |
| Monitoring                          | Clinical lead and programme monitoring lead |
| Suspension                          | Any clinical reviewer or safety lead        |

## 4. Prerequisites and open items

- D-10: the board, quorum and fail-safe.
- D-11: whether a performance study is planned.
- D-22: languages and reviewed translations.
- Counsel's position on regulation.
- Evidence gathering by qualified people.
- A governance store separate from the code repository (a build item for the first implementation phase).

## 5. What this plan does not do

It does not choose conditions, thresholds, evidence, or experts; does not set acceptance levels; does not state that any rule is validated; and does not allow the demonstration rules to be used with real people.
