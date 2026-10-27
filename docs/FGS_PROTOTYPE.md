# FGS community assessment and referral prototype

Status: **prototype on synthetic data. DEMO content. Not clinically reviewed or validated.**

This document describes the women-and-girls module for female genital schistosomiasis (FGS) that
was added on branch `feat/fgs-femtech-prep`. It is a structural workflow, not a clinical tool.

## Scope

The module demonstrates one path: community signal, structured assessment, non-diagnostic
referral guidance, a suitable (synthetic) facility, referral tracking, follow-up.

It does **not**: diagnose, confirm or exclude any condition; set clinical thresholds; use real
patient data; connect to DHIS2 or any real facility registry; or claim compliance with any
data-protection law.

## The non-diagnostic boundary

- The community health worker (CHW) never sees a condition name as a result. The result is one of
  four **programme and referral categories**, mapped from the existing Low, Moderate, High and
  Urgent levels:

  | Level    | Category shown                     |
  | -------- | ---------------------------------- |
  | Low      | No priority signal identified      |
  | Moderate | Further assessment recommended     |
  | High     | Clinical assessment recommended    |
  | Urgent   | Urgent clinical review recommended |

- These are **not clinical severity classes**. The screen says so beside the category.
- The rule status is always shown with the result: "Rule status: DEMO. Clinical validation pending."
- A test fails if FGS wording contains diagnostic phrases (for example "FGS confirmed").

## Clinical-content provenance and rule status

All FGS content lives in `packages/rules-engine/src/fgs/content.ts` and is validated at load.
Each item carries source, source version or date, content status, reviewer status, last-reviewed
date and notes. Every item is `DEMO` with reviewer status `NOT_REVIEWED`.

The lifecycle is `DEMO`, `DRAFT`, `CLINICALLY_REVIEWED`, `VALIDATED`. A rule set cannot claim a
status above DEMO without the matching evidence fields, and the evaluator returns the status with
every result. The FGS rule set is `demo-fgs` version `0.1.0`, status `DEMO`, validation
`NOT_VALIDATED`.

Audit at the P1 gate: 11 content items (all DEMO, none DRAFT, none clinically reviewed, none
validated) and 4 rules (all DEMO, validation status NOT_VALIDATED). Regression tests fail if any of
those counts changes without review evidence in the repository. The CHW screens show the line "FGS
clinical content: demonstration placeholder — source review and clinical validation pending." on the
start, water-contact, signals, support-and-access and result screens.

The health-signal questions are **placeholders**. Their wording was written for the demonstration
and was not taken from, or checked against, WHO or national guidance. Nothing here is WHO-validated.

## Consent architecture

Three separate things are recorded and never merged:

1. **Consent** to assessment and data capture (given, declined, withdrawn), with the wording
   version shown (`demo-consent-0.1`).
2. **Withdrawal**: stops further use. No new referral or follow-up can be added; the record
   leaves programme views once the (mock) server has been told. It is not deletion.
3. **Deletion**: on the device, the assessment, referral, follow-ups and every queue entry for the
   case (including ones already sent) are removed straight away. If the record had been sent, an
   event is queued and the **mock** server removes its copy, keeps only a marker so a late queued copy
   cannot reappear, and writes an audit row. This is a **simulation** in browser storage. It is not a
   production deletion process: it does not cover backups, logs, replicas, exports or any other
   system, and until the event is delivered (for example while offline) the mock server copy remains.

No consent means no person-level record: declining discards the draft and saves nothing. Consent,
withdrawal and deletion are audited on the mock server using the pseudonymous case code. The
wording is demonstration text and has not had legal review.

## Participant model

Age is an **age band** (under 10, 10 to 14, 15 to 17, 18 to 49, 50 or older), configured in
`packages/domain/src/femtech.ts`. No date of birth is collected. Bands under 18 show a
safeguarding notice. Age-specific wording is DEMO until safeguarding review.

Cases use a pseudonymous code (`PC-XXXX-XXXX`) derived from a random key. No name, phone number or
address is collected.

## Assessment flow

Consent, about her (age band, community), water contact, how she has been feeling, support and
access (including whether she seems distressed and whether follow-up is safe), review, result.
The signal catalogue is short and grouped (exposure, health signals, context). Distress leads to a
supportive-counselling notice, not a mental-health assessment. The flow avoids questions about
marital status, sexual behaviour or reproductive history.

## Referral workflow and facility capability

The existing state machine is unchanged: Generated, Accepted, Arrived (`PATIENT_ARRIVED`),
Assessed, Follow-up, Closed (outcome). Stages move forward one step at a time; skips, reversals
and repeats are refused.

Facility choice for FGS referrals uses **synthetic** capability fields: relevant service, trained
worker, female clinician, examination, referral capacity (`packages/demo-data/src/facilityCapabilities.ts`).
Facilities are ranked, never hidden. A facility that cannot take referrals ranks last and is
flagged. If she asked to be seen by a woman, that raises facilities with a female clinician. The
screen states that the capabilities are invented. No real facility is described as having an
FGS-trained worker, a female clinician, examination capability or referral capacity.

## Privacy controls in the prototype

- **Separation:** women-and-girls (FGS) records are removed at the start of every general
  programme aggregate (summary, community detail, referral monitor, and so reports and exports).
  FGS reaches programme output only through one block, `fgs`, on the summary and community-detail
  responses. A test checks that general aggregates are byte-identical with and without FGS records.
- **Small-cell suppression (prototype pattern):** in the `fgs` block, counts below
  `SMALL_CELL_THRESHOLD` (5) are returned as `null`, or omitted for per-signal counts. If exactly
  one category cell is hidden, a second is hidden so it cannot be derived from the total. The
  suppression is applied in the programme layer, where the API response is built, not in the UI.
  The value 5 is a **placeholder for demonstration**. It is not a validated disclosure-control
  threshold, not a regulatory requirement and not claimed to be appropriate for any real setting.
  It requires privacy and data-protection review before any real deployment.
- **Known gaps in the pattern:** it does not defend against differencing across overlapping
  filters or time ranges, repeated queries, or combination with other data. There is no community
  breakdown of FGS data. There is no pagination, and sorting happens on the client over
  already-suppressed data.
- **No person-level or location data in aggregates:** programme responses carry no case code, no
  household coordinates and no individual map points (tested at the API boundary).
- **Facility inbox:** a facility sees the referrals sent to it, including age band, signals and
  case-level detail. That is by design for care, and is a simulated role scope, not a security
  control.
- **Device and cache:** the in-progress FGS draft is held in session storage and cleared when the
  record is saved or consent is declined. Deletion removes the local copy of the case.
- Roles are simulated and are not security controls.

## Localisation

FGS text is data in `apps/web/src/i18n/locales/en.fgs.json`, referenced by key. A reviewed
translation can be added as another locale file. Clinical content has not been translated and must
not be until validated source wording exists.

## Tests

Vitest covers consent, withdrawal, deletion, rule evaluation, content provenance, the CHW flow,
the referral path, facility ranking, offline queueing, programme privacy and small-cell
suppression. A Playwright and axe spec (`e2e/fgs.spec.ts`) covers keyboard use, error states,
automated accessibility checks and horizontal overflow on mobile and desktop viewports. Software
tests say nothing about clinical validity, and automated accessibility checks catch only part of
the problems; manual testing with assistive technology has not been done.

## Known limitations

- No clinical review of any question, rule or wording.
- No real facility data; capabilities are synthetic.
- Small-cell suppression is a prototype pattern covering the FGS aggregate block only; it is not a formal statistical disclosure control and needs privacy review (see Privacy controls).
- The facility-side workflow was not redesigned for FGS; it still shows the general referral screens and the synthetic-capability ranking is only on the CHW referral screen.
- Deletion is simulated against a mock server in browser storage (see Consent architecture).
- No DHIS2 or other integration exists. This is a prototype, not a deployed or field-tested system and not production-ready.
- Consent wording and the privacy design have had no legal or security review.
- Only English; no field testing; offline behaviour is tested against a mock server.
- Facility-side screens still show general referral fields; they are not yet tailored to FGS.

## What needs clinical or expert review before any real use

Every health-signal question and its wording; the rule logic and the mapping to categories; the
suggested actions; age-specific and safeguarding wording; the counselling pathway; consent wording
(legal); facility service definitions; translations.
