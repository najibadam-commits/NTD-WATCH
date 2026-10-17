# Demonstration rule set

> **DEMONSTRATION ONLY. NOT CLINICALLY VALIDATED.**
> These rules are placeholders that exist to exercise the product workflow. They were not
> derived from any national or international protocol, were not reviewed by clinical or
> public-health experts, and must not be used to make decisions about real people.

Every result, every explanation and every suggested action produced by this rule set is shown
with the label `DEMONSTRATION ONLY — NOT CLINICALLY VALIDATED`.

## Where the rules live

| What                               | File                                              |
| ---------------------------------- | ------------------------------------------------- |
| Rule content (data)                | `packages/rules-engine/src/demo-ruleset.ts`       |
| Shape and validation of a rule set | `packages/rules-engine/src/types.ts`, `schema.ts` |
| The evaluator (pure function)      | `packages/rules-engine/src/evaluate.ts`           |
| Tests                              | `packages/rules-engine/src/index.test.ts`         |

No screen contains a rule. To review or change one, edit the data file. No interface code
changes.

## How a result is produced

1. The form answers are turned into **facts**: the symptom list, the number of symptoms, the
   duration as an ordered rank, whether symptoms are worsening, how many exposures were
   reported, whether the household has similar signs, and how many water or sanitation risks
   were reported.
2. Every enabled rule whose conditions **all** hold is said to fire.
3. The result is the **highest** level among the rules that fired, or `LOW` if none fired.
   A lower rule, missing data or a conflict can never lower a result.
4. The explanation lists one plain-language reason per rule that fired. The suggested action
   comes from the action wording for that level.

### Missing data

- A condition on a missing fact is false. It never fires a rule.
- Missing and `unknown` answers are listed as `incompleteInputs` and the result carries the note
  "Some information was missing or unknown. The result may understate the level of concern."
- If nothing is known about symptoms, no level is produced (`INSUFFICIENT_DATA`).

### Conflicting inputs

| Conflict                                               | Handling                                               |
| ------------------------------------------------------ | ------------------------------------------------------ |
| "None of these" recorded together with listed symptoms | The listed symptoms are used; the conflict is flagged. |
| Duration or progression given with no symptom          | Ignored; the conflict is flagged.                      |

## Rules

Levels are product design categories, not clinical thresholds.

| Id                     | Level    | Reason shown                                                                                        | Fires when                                                                 |
| ---------------------- | -------- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `U-DANGER-SIGN`        | URGENT   | One or more warning signs from the demonstration list were reported.                                | Any of: eye pain or loss of vision, severe weakness, unable to drink       |
| `H-WORSENING-MULTIPLE` | HIGH     | Two or more indicators were reported and they are getting worse.                                    | Worsening = yes and 2 or more symptoms                                     |
| `H-LIMB-DURATION`      | HIGH     | Limb swelling has lasted one month or longer.                                                       | Limb swelling and duration of 1 month or more                              |
| `H-SKIN-WATER`         | HIGH     | A painless skin sore has lasted one month or longer and the person has had contact with open water. | Painless skin sore, duration of 1 month or more, and at least one exposure |
| `H-NUMB-PATCH`         | HIGH     | A skin patch with reduced feeling was reported.                                                     | Skin patch with reduced feeling                                            |
| `H-MANY-INDICATORS`    | HIGH     | Three or more indicators were reported together.                                                    | 3 or more symptoms                                                         |
| `H-HOUSEHOLD`          | HIGH     | An indicator was reported and others in the household have similar signs.                           | Household similar = yes and 1 or more symptoms                             |
| `M-DURATION`           | MODERATE | An indicator has lasted longer than one week.                                                       | 1 or more symptoms and duration of 1 week or more                          |
| `M-EXPOSURE`           | MODERATE | An indicator was reported together with a relevant exposure.                                        | 1 or more symptoms and at least one exposure                               |
| `M-ENVIRONMENT`        | MODERATE | An indicator was reported in a household with several water or sanitation risks.                    | 1 or more symptoms and 2 or more water or sanitation risks                 |

The thresholds above (2, 3, one week, one month) are arbitrary placeholders.

## Safeguards against being mistaken for a protocol

- The rule set id must start with `demo-` while its status is `DEMO_PLACEHOLDER`.
- A rule set can only claim `VALIDATED` if it records at least two reviewers and an approval
  date. None in this repository does.
- Rule and action text may not contain words about diagnosing, prescribing, doses, drugs or
  treatment. The rule set is rejected at load time if it does, and a test checks the shipped text.
- Every action starts with "Demonstration action:".

## Review process for qualified experts (proposed)

1. Clinical and public-health reviewers read this document and `demo-ruleset.ts`.
2. They replace the facts, thresholds and wording with an agreed protocol, in the same data format.
3. The reviewers and approval date are recorded in the rule set's `review` field, and the status
   changes to `VALIDATED` through an explicit change that the programme owners approve.
4. The unit tests are updated to the agreed expected outputs.
