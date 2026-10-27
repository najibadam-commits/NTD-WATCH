# Stage 7 implementation report: demo-ready MVP

**Date:** 2026-10-19. **Nature:** integration, completion and demo-readiness of the Stage 1 to 6 prototype. Synthetic data only. Not a production system, not clinically validated, not an official system, no DHIS2 or other integration.

## 1. Recommendation

**DEMO READY** for an internal or stakeholder demonstration on a laptop, using synthetic data, as an explained prototype. **Not production-ready, and not evidence of need or effect.** The Stage 6 outcome is still open and its criteria await sponsor ratification.

Basis: the full cross-role story runs end to end in a real browser on both a phone and a desktop profile; the whole automated suite passes; and a reset returns the demo to its starting state. What this does not establish is stated in section 8.

## 2. What was built

| Area                  | Change                                                                                                                                                                                                                 | Label                             |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| Facility experience   | New **Referral inbox** page: scoped to the facility, counts, open/all filter, referral detail with the assessment summary and the reasons behind the signal, one-stage-at-a-time actions, recorded outcome at ASSESSED | REAL on a SIMULATED role          |
| Closed loop           | Outcome recorded by the facility (four synthetic categories) is stored on the referral, returned to the CHW, and shown on the CHW referral screen                                                                      | REAL                              |
| Priority intelligence | New **Priority communities** page: 2 x 2 matrix, ranked table, category / trend / open-work filters, drill-down with plain-language reasons, CSV export. Shared logic in `packages/programme/src/priority.ts`          | REAL, demonstration settings      |
| Follow-ups due        | New figure (assessed referrals without a community follow-up) in the shared aggregation, overview, community stats and priority rows                                                                                   | REAL                              |
| Scenarios A, B, C     | Seed profiles tuned and seed generation made per-CHW stable so each scenario community stays in its cell                                                                                                               | SIMULATED data                    |
| Reset Demo            | One `resetDemoEnvironment()` for every role, with confirmation, in the banner. Clears mock server data, device database and offline queue, draft, simulation switches, connectivity state, filters and cached views    | REAL                              |
| Demo mode             | Banner names **NTD-WATCH DEMO MODE** on every screen                                                                                                                                                                   | REAL                              |
| Rule governance       | Settings table per rule: id, what it says, level, version, status, source, owner, validation. All shown honestly as placeholders                                                                                       | REAL display of SIMULATED content |
| Honest register       | Settings table of every capability labelled REAL, SIMULATED or FUTURE (`packages/domain/src/capabilities.ts`)                                                                                                          | REAL                              |
| Facility scope        | Facility demo user is now North PHC, so the cross-role story works without extra selectors                                                                                                                             | SIMULATED                         |
| Mobile layout fix     | A visually hidden table header widened pages on phones; fixed once in the shared table wrapper                                                                                                                         | n/a                               |
| One-command demo      | `npm run demo` builds and serves for presenting; `npm run dev` unchanged                                                                                                                                               | n/a                               |

Not changed: the CHW app, offline layer, mock API structure, existing programme pages, Stage 5 and 6 documents. Nothing was rebuilt.

## 3. End-to-end demo flow (verified)

CHW assessment (symptoms, exposure, WASH) -> explainable non-diagnostic signal -> referral to Demo North Primary Health Centre -> facility inbox shows it -> Accept -> Arrived -> Assessed with outcome -> CHW refreshes and sees the outcome -> CHW records a follow-up -> State Programme Manager sees the community in Priority communities. This runs as a single automated test (`e2e/demo-flow.spec.ts`) on both profiles. Scripts: `DEMO_SCRIPT.md`; scenarios: `DEMO_SCENARIOS.md`.

## 4. Test results

| Suite                                                               | Result                                          |
| ------------------------------------------------------------------- | ----------------------------------------------- |
| `npm run check` (type check, lint, format check, unit tests, build) | **Passed**, exit 0                              |
| Unit and integration tests                                          | **264 passed** in 21 files (236 before Stage 7) |
| Browser tests (Playwright, phone and desktop)                       | **46 passed** (36 before Stage 7)               |

New tests:

- **Priority and scenarios** (`priority.test.ts`): matrix cells, band limits, insufficient data, scenarios A, B, C, ranking stability, agreement with shared aggregation, no outbreak wording.
- **Facility and loop** (`stage7.test.ts`): inbox role and scope, no personal fields, live referral appears after sync, outcome only at ASSESSED, stage skipping refused, no double counting, follow-ups due, reset.
- **Safety** (`safety.test.ts`): every user-facing string scanned for diagnosis, prescription, outbreak declaration, validation and "official" claims outside a negation; rule text scanned for disease and drug names.
- **Capability register** (`capabilities.test.ts`): every item labelled, integrations never REAL.
- **Cross-role e2e**, **priority interactions**, **reset**, **role landing and demo-mode label**, and **axe scans** of the priority page, settings (governance) and the facility inbox with detail.
- **Offline** (save, queue, retry, sync, lost response, no duplicates): existing browser and unit tests from earlier stages still pass and were not weakened.

## 5. Defects found while walking the demo, and fixed

1. Facility demo scope pointed at a facility the CHW does not refer to, so the inbox would have been empty.
2. Seeded referrals could not be updated; fixed by copying on first update without double counting.
3. Editing one community's seed profile reshuffled all the others; seed generation now uses a stream per CHW.
4. A hidden table header made pages wider than a phone screen, which left the inbox action button unreachable; fixed in the shared table wrapper.
5. Scenario C community originally sat in a state the State role cannot see; moved to Demo Hillview.
6. The previous test that expected three communities to be "rising" depended on that shared random stream; it now asserts the two the stories rely on.

## 6. Decisions made

| Decision                                                         | Reason                                                                                                                             |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Keep four risk levels, map to "signal" in documentation          | The brief's low / elevated / high wording is covered by the share of HIGH or URGENT assessments; renaming would churn earlier work |
| Only the top band counts as "high" in the matrix                 | Keeps the four-cell reading unambiguous; stated on screen                                                                          |
| Priority categories computed in the shared package, not the page | One calculation, tested, cannot contradict other views                                                                             |
| Facility role is one simulated facility                          | A single clear inbox is better than a selector for the demo                                                                        |
| Keep the CHW "demo shortcut" button, relabelled                  | Useful for solo rehearsal; points to the real facility view                                                                        |
| LGA demo user stays Central LGA                                  | Avoids breaking scope tests; the story uses the State role                                                                         |

## 7. Files

New: `docs/stage7/*` (this report plus eight documents), `packages/programme/src/priority.ts`, `priority.test.ts`, `packages/domain/src/capabilities.ts` and test, `apps/web/src/demo/resetDemo.ts`, `apps/web/src/programme/pages/InboxPage.tsx`, `PriorityPage.tsx`, `apps/web/src/mock/stage7.test.ts`, `apps/web/src/safety.test.ts`, `e2e/demo-flow.spec.ts`.
Changed: domain (referral outcome, roles and pages, entities), api-contract (inbox route), programme package (follow-ups due, types, seed), demo-data (facility scope, profiles), mock handlers and store, programme API client and hooks, settings, overview, banner, CHW referral screen, navigation, translations, styles, `package.json` (`demo`), existing role tests, README.

## 8. What this does not show

- It has not been run on the sponsor's own machine by me; the commands in `DEMO_SETUP_GUIDE.md` are standard but a dry run is recommended.
- Automated accessibility checks cover part of the problems. No manual screen-reader test was done.
- No real users have used it. Nothing shows the post-signal gap is real or that this approach is better than existing systems.
- Rules, bands and categories are demonstration settings without evidence behind them.

## 9. Remaining blockers for anything beyond a demo

Sponsor ratification of the Stage 6 criteria (S6-02); stakeholder evidence from the Stage 6 plan; a privacy and data-protection position; expert-governed rules; a real backend, identity and hosting decision. None is addressed by Stage 7 and none was meant to be.

## 10. Recommended next step

Do a timed dry run of the five-minute script on the presenting laptop, then take `STAGE6_STAKEHOLDER_SESSION_PACK.md` into the first stakeholder session, using the demo only to make the questions concrete.
