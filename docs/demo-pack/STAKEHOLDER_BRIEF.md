# NTD-WATCH stakeholder brief

Status: prototype briefing for a UNICEF Femtech Ventures reviewer. Everything described as "implemented" is implemented **on synthetic data, in a browser, against a mock API**. Nothing here is clinically validated, field tested, deployed or endorsed. The last bullet of section 9 and all of section 11 are internal preparation notes: remove them from any copy shared outside the team.

## Required statements (apply to every section)

- FGS content and rules are **demonstration placeholders** awaiting appropriate clinical review and validation.
- NTD-WATCH **does not diagnose** FGS or prescribe treatment.
- **Programme priority is not clinical severity or disease prevalence.**
- Community observations are **not a representative epidemiological sample**.
- Synthetic facility and community data **do not establish** real-world coverage or disease distribution.
- The current API is a **mock implementation**. The privacy tests do not prove production-server security.
- Privacy suppression is a **prototype pattern** that still requires specialist review.

## 1. Executive summary

NTD-WATCH is a working prototype of a community-to-programme workflow. A community health worker records a short, consented, non-diagnostic assessment (for the proposed use case, concerning women and girls and freshwater contact); the app returns an explained signal category and supports a simulated, tracked referral; and, separately, a programme view shows community-level signals, contextual vulnerability and **data confidence** so that a programme can decide where further review, outreach or referral strengthening might be useful. The prototype runs entirely on synthetic data with simulated roles. Its value, if any, is a hypothesis to be tested through clinical review, privacy review and a supervised pilot. None of that has happened yet.

## 2. Problem being addressed

Community-level concerns are often noticed before a programme can act on them, but they can stay in notebooks or scattered records, and the path from a community observation to a referral, a facility outcome and a follow-up is hard to see. For conditions that affect women and girls, privacy, safeguarding and access barriers (for example distance, cost or a preference for a woman clinician) add to the gap. This brief makes no statement about the size of that gap; any statistic in an application must be separately sourced.

## 3. Intended users and workflow

| User                                         | What they do in the prototype                                                                             | Role in the build                         |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| Community health worker                      | Records a consented assessment, sees guidance, generates a referral, records a follow-up.                 | Simulated sign-in (any 4-digit demo PIN). |
| Health facility worker                       | Sees referrals sent to their own (synthetic) facility and updates the stage and outcome.                  | Simulated role.                           |
| LGA / state programme officer, administrator | Sees community-level aggregates, programme priority and data confidence; cannot see person-level records. | Simulated roles.                          |

Workflow: Community signal, assessment, guidance, referral, facility outcome, follow-up, programme intelligence, response (the referral, facility and follow-up steps are simulated against a mock API with invented facilities).

## 4. What the current prototype demonstrably does

Implemented in code and covered by automated tests (all on synthetic data):

- Women-and-girls assessment with a consent step, a decline path, age range only, a case code instead of identity, and a non-diagnostic signal category with reasons and a "rule status: DEMO" label.
- Consent withdrawal and record deletion, simulated against the mock server with audit events. Deletion removes the record from the device, the mock server and the aggregates; it is not a production deletion process and does not cover backups, logs, replicas or exports.
- Referral with synthetic facility-capability filtering (service, trained worker, female clinician, examination, referral capacity) and a simulated, tracked referral pathway with follow-up (invented facilities, mock API).
- Offline queue and sync against the mock API (connectivity loss is simulated with a switch).
- Programme dashboards, referral monitoring and reports computed from one shared aggregation layer.
- **Community programme priority (P2):** contextual vulnerability across water and environment, water contact and access and service; community signal activity; data confidence (High, Medium, Low, Insufficient); four programme priority categories plus "more information needed"; plain-language explanations; a dashboard section and a map colour mode where fainter colour means lower confidence.
- Small-cell suppression in the women-and-girls aggregate, and coarse observation ranges in the programme-priority rows.

## 5. What is distinctive about the community-to-programme approach

Stated as a design position, not as proven novelty or uniqueness (differentiation from existing systems is an open hypothesis in the Stage 6 documents):

- One chain from consented community observation to a programme view, with referral and follow-up status in between.
- Every programme priority is **paired with its data confidence** and an explanation, so weak evidence cannot look like strong evidence.
- The programme screens are intended to show community aggregates only; in this prototype, the mock server holds the full synced record.
- Honest labelling is part of the product: a REAL / SIMULATED / FUTURE capability register and DEMO status on all clinical content.

## 6. How it supports women and girls in the proposed FGS use case

- Questions are short, private and optional; a consent choice is presented at the start; the refusal and data-handling behaviour still require technical and privacy verification.
- No name, phone number, address or exact age; an age range and a case code only; extra care wording for girls under 18 (placeholder pending safeguarding review).
- A supportive counselling option and a "safe to follow up" question, so follow-up does not cause difficulty.
- Referral guidance that can consider a preference for a woman clinician and access barriers.
- Simulated consent withdrawal and deletion controls are shown on the result screen; their behaviour has not been independently verified.

All of this wording is a **placeholder pending clinical and safeguarding review**. The prototype does not diagnose, and does not decide who needs treatment.

## 7. Current technical status and testing evidence

**Latest reported evidence (founder's laptop terminal, reported 29 October 2026; not independently rerun by the person who edited this brief):** `npx vitest run` passed 44 test files and 554 of 554 tests; the dedicated Phase 4C regression tests (`resetRace.test.ts` and `demoEpoch.test.ts`) passed 6 of 6; `npm run typecheck`, `npm run lint` and `npm run format:check` passed (exit 0); `npm run build` exited 0 (407 modules transformed); and `git diff --check` reported no issues. The commit and working-tree state of that run were not re-verified here. The Playwright end-to-end suite was not part of that report, so its status after the Phase 4C changes is not established (the last reported end-to-end result, 80 of 80, is from the earlier 28 October working tree).

**What Phase 4C does (demo consistency, not security):** in the mock server, state-changing operations are processed one at a time, and a request that carries the identifier of a demo epoch that has already ended (that is, one from before **Reset demo**) is rejected with a conflict response instead of being written. This keeps the demonstration consistent when a reset happens while a sync is in flight. It is a demo-consistency mechanism in a mock API, not a production security or concurrency control.

**Test history (the earlier failure is neither a current reproduced failure nor a conclusively resolved root cause):** on 28 October 2026 one full unit-test run (496 of 496 tests passed) exited 1 because of an unhandled Dexie `DatabaseClosedError`; four other runs exited 0. That failure was intermittent and its cause was not diagnosed at the time. A reset/sync race was then identified and addressed in Phase 4C, and in the latest reported run the dedicated regression tests and the full suite passed. That does not conclusively show that the race caused the earlier error, and it does not show that every possible reset/sync failure has been eliminated. The latest result is one reported run, so the unit suite is described as passing in that run, not as proven stable.

**Earlier commit-level evidence (superseded for unit-test counts by the latest reported run above)** is from the founder's Windows laptop at commit `2b03f53` (`fix: narrow mock API fallback detection`, the `apiFetch` fix that makes the app's in-page mock answer when the browser's mock service worker is not answering), with explicit exit codes:

| Check                                                                    | Result at `2b03f53`                                        |
| ------------------------------------------------------------------------ | ---------------------------------------------------------- |
| Vitest unit, integration and component tests                             | 434 passed of 434 (35 files)                               |
| TypeScript, strict                                                       | exit 0                                                     |
| ESLint (including accessibility rules)                                   | exit 0                                                     |
| Prettier                                                                 | exit 0                                                     |
| Production build                                                         | exit 0                                                     |
| Playwright end-to-end (`npm run test:e2e`, which runs `playwright test`) | 64 passed, 0 failed, 0 skipped, 0 flaky or retried, exit 0 |

The Playwright run covered 32 tests on the `mobile-chromium` profile and 32 on `desktop-chromium`. It includes the 10 automated accessibility (axe) tests in `a11y.spec.ts`, which passed. A stale server on port 4173 was stopped beforehand so that Playwright built and served the current code. The cloud workspace gave the same Vitest count at this commit.

**Historical evidence (superseded, kept for the record):** on 27 October 2026 at the earlier P2 head of branch `feat/fgs-femtech-prep`, Vitest passed 423 of 423 (34 files), and TypeScript, ESLint, Prettier and the production build exited 0 in the cloud workspace and on the founder's laptop. Playwright with axe passed 64 of 64, exit 0. The figures in the table above replace these; do not quote 423 or 34 files as the current result.

**Earlier working-tree evidence (uncommitted changes on HEAD `3f91e8c`, founder's laptop, 28 October 2026; superseded for unit tests by the latest reported run above):** TypeScript, ESLint, Prettier and the production build exited 0, and Playwright passed 80 of 80. Vitest passed 496 of 496 (38 files) in one run that nevertheless exited 1 because of an unhandled Dexie `DatabaseClosedError` in a test teardown, and in four other runs it exited 0. These results are on an uncommitted tree; the table above is for commit `2b03f53`.

What these results do and do not show: they show the prototype behaves as designed on synthetic data in a browser. They do **not** show clinical validity, production security, field performance or full accessibility (automated axe scans are not equivalent to manual accessibility testing and find only part of the problems; manual assistive-technology testing has not been done and remains outstanding).

## 8. Privacy and safety by design

- Synthetic data only; every programme output and export carries a synthetic notice.
- A consent choice is presented before the assessment (the refusal and data-handling behaviour still require technical and privacy verification); simulated withdrawal and deletion controls are shown, and their behaviour has not been independently verified. Deletion is simulated: it covers the device, the mock server and the aggregates, and does not cover backups, logs, replicas or exports.
- The programme-priority rows carry **community-level bands, coarse ranges and explanations**, not counts. Exact counts are used inside the aggregation calculation and are not published in those rows. The separate women-and-girls aggregate and the GIS, Signals, Trends, Overview and Referrals views publish counts at or above the placeholder threshold of 5 (with complementary suppression; 1 to 4 appear as "n/s"), and the Priority page shows the women-and-girls referral total once it reaches 5. One exception: the Overview data-provenance line can show an exact count of demo-created records (including 0 to 4) when every such record passes the prototype's demonstration-marker check (a non-baseline key, a demo flag and a demonstration rule set). That check is a prototype classification, not an authentication or security guarantee. Publishing the baseline count beside another total could allow a hidden figure to be inferred by subtraction; this has not been comprehensively audited across combinations of views, filters and dates, and this pack does not claim that hidden counts cannot be reconstructed. This is a client-side display rule, not a security boundary. No programme view receives case codes, participant keys, answers or coordinates. Tests cover the aggregation function and the mock API, including role refusal and filter attempts.
- No household coordinates; the map uses fictional boundaries only.
- Safety-wording tests scan the new P2 text for diagnostic and prevalence language.
- **Known limits:** The prototype applies a small-count display rule to selected published programme views and exports. This is a client-side display measure, not a security control. Unresolved: differencing across separate queries and date ranges; exact WASH percentages and the vulnerability index; staff counts; direction labels and signal bands that can narrow hidden counts; the facility referral inbox, which returns record-level data; full records held in the browser database and mock server; the threshold of 5 is a placeholder not justified by specialist review; and there has been no independent privacy review or production-security validation. Sign-in and roles are simulated and are not security controls. Full detail: `docs/SMALL_COUNT_POLICY.md` and `artifacts/demo-evidence/FINAL_GIS_DISCLOSURE_REVIEW.md`.

## 9. Current limitations

- All data, places, facilities and boundaries are synthetic. The API is a mock that runs in the browser.
- Rules, bands, thresholds and weights are demonstration settings with no evidence base; they have not been reviewed by clinicians or statisticians.
- No clinical validation, ethics determination, field testing, pilot or user research has taken place.
- No integration with DHIS2, a facility directory, an authoritative WASH source or an identity provider.
- English only; manual accessibility and real-phone testing not done; offline use in a real field setting is untested.
- Observations are not a representative sample, so shares are not prevalence.
- Privacy: see the known limits in section 8. Nothing here is privacy-protected, secure or compliant.
- Test history: an earlier unit-test run exited 1 with an unhandled Dexie `DatabaseClosedError` although all tests passed; its cause was not diagnosed at the time. A reset/sync fix (Phase 4C) was applied and the latest reported run passed in full, but the earlier cause is not conclusively established, not every reset/sync failure is shown to be eliminated, and stability across repeated runs has not been shown.
- Repository ownership and licensing are not resolved (see `CLAIMS_AND_EVIDENCE.md`). The repository has no licence file and has not been published. (Internal: remove or rephrase in any external copy until ownership is resolved.)

## 10. Proposed validation and pilot pathway

This is a proposal, not a commitment, and the Stage 6 outcome (proceed, modify, integrate, stop, inconclusive) is still open. Existing planning documents: `docs/CLINICAL_VALIDATION_PLAN.md`, `docs/PILOT_BLUEPRINT.md`, `docs/PILOT_GATES.md`, `docs/stage6/`.

1. Resolve ownership and licensing; record an ethics determination before any stakeholder session.
2. Clinical and safeguarding review of the FGS content, wording and rules; replace the DEMO status only with documented review.
3. Privacy and data-protection review, including a specialist review of the suppression approach and applicable law.
4. Stakeholder validation of the problem and the workflow with programme, facility and community representatives (and, where appropriate, women and girls' advocates).
5. Decide integration boundaries (for example with DHIS2) and a real facility and WASH data source.
6. A small, supervised, ethics-approved pilot with defined gates, only after steps 1 to 5.

## 11. Questions a reviewer may ask (internal preparation; not for external copies)

| Question                                                         | Evidence-grounded answer                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Does it diagnose FGS?                                            | No. It returns a non-diagnostic signal category and says so on screen. The content is a placeholder pending clinical review.                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Is it clinically validated?                                      | No. All FGS content and rules have DEMO status. Validation is a future step (`docs/CLINICAL_VALIDATION_PLAN.md`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Has it been tested with real communities, workers or facilities? | No. There has been no field test, pilot or user research. Facilities and communities are invented.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Is the data real?                                                | No. Everything is generated from a fixed seed.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Does programme priority mean a community has a high burden?      | No. It indicates where a programme might look first, together with data confidence. It is not severity or prevalence, and observations are not a representative sample.                                                                                                                                                                                                                                                                                                                                                                                                                               |
| How is privacy protected?                                        | The current demonstration uses synthetic data and illustrates proposed privacy safeguards. However, the small-count display rule covers only selected published programme views and exports, is a client-side measure and not a security control, and the mock server and browser database hold full records. The intended design is to minimise personal data exposure and restrict access according to user responsibilities. These protections, including access controls, data handling and disclosure control, require further technical, privacy and legal review before real-world deployment. |
| Can small counts be worked out?                                  | Possibly. Suppression does not stop every differencing attack; this is documented as a limitation.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Is there a real backend or authentication?                       | No. The server is a mock and roles are simulated.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Does it work offline?                                            | The offline queue and sync work against the mock API in tests; real-field offline use is untested.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Is it open source or publicly available?                         | No. There is no licence and the repository has not been published. Ownership clearance is outstanding.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Do you have WHO, ministry or partner endorsement?                | No. None is claimed.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| What happens next?                                               | See section 10.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
