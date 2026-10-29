# Final GIS disclosure review

Reviewed 28 October 2026. All data in the demonstration is synthetic. The API is a mock. This review tests a **client-side display rule**, not a security control.

## 1. Repository baseline and working-tree status

- Branch `feat/fgs-femtech-prep`, HEAD `3f91e8c5d3e94d20d593f000d67fbcbbf471ccd9`, unchanged throughout. Nothing was reset, cleaned, stashed, staged, committed or pushed. No remote and no LICENSE; the repository is not described as open source.
- Git commands were run on the laptop through the check scripts (`run-gisfix-r6.cmd`, `run-gisfix-r7.cmd`), not on the cloud working copy, which is not a git repository.
- Working tree at the start of the final run: 29 modified files (web programme components, pages, i18n, mock tests, `packages/programme` aggregate, priority, reports, types, index and tests, and six demo-pack documents) and untracked: the two Word documents (untouched), `artifacts/`, `docs/SMALL_COUNT_POLICY.md`, `labelLayout.ts` and its test, `suppression.ts` and its test, `e2e/gis-privacy-labels.spec.ts`, `e2e/export-disclosure.spec.ts`, `packages/programme/src/disclosure.test.ts`.
- Threshold: **5** (a placeholder, not a justified value). Zero is published. 1 to 4 become `null` ("n/s"). 5 or more are exact. No new threshold was introduced.
- Scope of complementary suppression: `complementAcross` (a second row is hidden when exactly one row of a column is hidden), `publishRiskGroup` (smallest visible non-zero cell hidden when exactly one cell is hidden), `publishTotal` (a total is withheld when it is small, when one part of a partition is hidden, or when the hidden parts could only be all ones or all fours), `publishReached` (cumulative referral stages), and the rules added in this review (section 4). The FGS aggregate keeps its simpler threshold plus one-cell complement and was not changed.

## 2. Disclosure pathways inspected

| Pathway                                                            | Uses published values only?           | Notes                                                                                                                                                                  |
| ------------------------------------------------------------------ | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GIS map badges, aria labels, tooltips                              | Yes                                   | Read from the published community rows. Tested for agreement with the table (unit and e2e).                                                                            |
| GIS community table                                                | Yes                                   | "n/s" for withheld, 0 for a true zero, a separate text for missing.                                                                                                    |
| DOM attributes and map presentation data                           | Yes                                   | The aggregate boundary returns no `raw*` key; tested. Exact counts are not in the DOM or in the GeoJSON built from published rows.                                     |
| Overview, Signals, Trends, Referrals, Priority views               | Yes                                   | All read `programmeSummary`, `communityDetail` and `referralMonitor`, which publish at the shared boundary.                                                            |
| Reports page, CSV and JSON, four report kinds                      | Yes                                   | `buildReport` accepts only the published summary and monitor. Downloads tested in a real browser.                                                                      |
| Priority CSV (`DEMO-SYNTHETIC-ntd-watch-priority-communities.csv`) | Yes                                   | Built from priority rows. The filename carries the DEMO-SYNTHETIC marker and the first row carries the notice.                                                         |
| Community detail and facility lists                                | Yes                                   | Lone-hidden-row checks pass.                                                                                                                                           |
| **Facility referral inbox** (`referralInbox`)                      | **No, by design**                     | Returns record-level referral and assessment details (age group, sex, symptoms, risk level) for a simulated facility scope. It is a care-workflow path, not an export. |
| Admin, CHW write and reset routes                                  | Not aggregate paths                   | Inspected for any aggregate output; none found.                                                                                                                        |
| Raw-record export                                                  | **None exists in the UI**             | The only downloads are the two above. The mock server and browser database still hold full records.                                                                    |
| Other FGS aggregate                                                | Threshold 5 and a one-cell complement | Does not defend differencing. Not changed.                                                                                                                             |

## 3. Tests performed and observed results

Deterministic synthetic fixtures only; no randomised counts. New files: `packages/programme/src/disclosure.test.ts` (24 tests) and `e2e/export-disclosure.spec.ts` (2 tests on each of 2 browser projects).

The unit test attacks as a reader would: it takes the published figures (total, signals = HIGH plus URGENT, cells, community and week lists, percentages) as equations over hidden positive integers and solves them with a bounded enumerating solver.

- **A. Table and map.** No 1 to 4 under any count key; zero kept distinct. Risk cells, summary and single-community cases checked for solvable hidden cells. Map, table, tooltip and aria text agree.
- **B. Exports.** All four report kinds, four filters, CSV and JSON, in unit tests and downloaded in the browser: no 1 to 4 in count columns, and the "not zero" explanation present. Priority CSV checked the same way.
- **C. Filters and totals.** Single community, combinations, weekly series, each risk level, cumulative referral stages, facility lists: no lone hidden row beside a published total, no solvable hidden cell. **Separate-query differencing is not defended** (documented residual tests assert the attack still works).
- **D. Derived indicators.** Tested as described in section 5.

Before and after: the failing tests recorded in section 4 failed as listed before each fix and pass afterwards. No test was weakened or removed.

Final regression: see section 9 for the exit codes and counts of the last full run.

## 4. Confirmed defects and corrections

All four were reproduced by a failing test first and fixed at the shared aggregation boundary (`packages/programme/src/aggregate.ts`, with wording in `priority.ts`). Demo seed values and priority categories did not change.

| #   | Defect                                                                                                                                                 | Failing before the fix              | Correction                                                                                                                                                                                                   |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| D1  | Total and signals (HIGH plus URGENT) were both published; their difference exposed LOW or MODERATE when several cells were hidden.                     | 20 community cases, 4 summary cases | Total withheld when the difference (LOW, MODERATE, unclassified) is not itself safe to publish.                                                                                                              |
| D2  | The completion percentage (KPI, facility, LGA rows) pinned small splits, for example 1 of 5 is 20%.                                                    | 62 leaking totals (5 to 60)         | `publishedCompletion`: published only when both sides of the split are 0 or at least 5.                                                                                                                      |
| D3  | The signal band narrowed a hidden signals count (8 assessments: MODERATE means exactly 1).                                                             | 44 totals between 7 and 50          | `publishedSignalBand`: "not placed" when values 1 to 4 would give different bands. Priority label and reason text updated; "fewer than 5" wording removed because it was false for complement-hidden counts. |
| D4  | A lone hidden weekly cell, or a community risk-level column that is also the sum of a list, sat beside a published total (for example LOW 28 exposed). | Several weekly and community cases  | `publishWeeks` repeats complementary hiding across every column until no lone hidden week remains; `publishRiskGroup` takes list parts. A true zero stays 0.                                                 |

Also changed: `docs/SMALL_COUNT_POLICY.md` (new rules and corrected residual limits).

## 5. Derived indicators

| Indicator                            | Built from                    | Can it reveal a suppressed value?                                                                                                                                  | Status                   |
| ------------------------------------ | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------ |
| Signal band, priority category       | Exact counts, then suppressed | Signal band: no longer narrows a hidden count (D3). It can still show that a count withheld only to protect a neighbour is larger than 4.                          | Tested, partly protected |
| Completion percentage                | Exact counts, then suppressed | Not after D2.                                                                                                                                                      | Tested, protected        |
| Direction (rising, steady, falling)  | Exact 28-day window counts    | **Yes.** With both counts hidden, "rising" means the recent count is at least 2 more than, and more than 1.5 times, the earlier one (3 recent against 1 previous). | Residual, not protected  |
| WASH percentages                     | Exact household ratios        | **Yes.** 1 of 12 households publishes 8.3%, which pins the count.                                                                                                  | Residual, not protected  |
| Vulnerability index                  | Built from WASH and others    | Inherits the WASH exposure.                                                                                                                                        | Residual, not protected  |
| Staff counts (CHWs assigned, active) | Exact                         | Exact, not suppressed. They are not counts of people assessed, but a small team is itself identifying.                                                             | Residual, not protected  |
| Age of oldest unresolved referral    | Exact                         | Exact.                                                                                                                                                             | Residual, not protected  |

These residuals are asserted by tests that pass **because the attack still works**, so the limits cannot be overstated.

## 6. Client-side display suppression versus security controls

What exists: a display rule applied in shared TypeScript when the aggregate response is built, over a mock API and a browser database that hold the full records. Anyone with the browser tools, the mock handlers, or the database can read exact counts. The facility inbox returns record-level detail.

What does not exist, and would be needed in a real system: server-side enforcement on a production API, authentication and authorisation that are not simulated, a query budget and logging to limit differencing across requests, a disclosure-control method reviewed by a specialist (including a justified threshold), and a data-protection impact assessment and legal review.

Nothing here supports a statement that the platform is privacy-protected, secure or compliant.

## 7. Screenshot approval recommendations

| Screenshot                                                | Recommendation                                                                                                                                                     |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `08l-gis-map-compact-1440.png`, `08m` (1280), `08n` (768) | **Approve for a qualified presentation**, captioned "display rule on synthetic data, not a security control". Seed values are unchanged by the fixes in section 4. |
| `08o-gis-map-compact-390.png`                             | Internal diagnostic only: 5 of 15 names hidden at phone width.                                                                                                     |
| `08b-gis-table-small-count-rule-1440.png`                 | Not approved (rows cut off). Diagnostic only.                                                                                                                      |
| `08-gis-priority-remediated-1440.png`, `08c-...-390.png`  | Not approved. Superseded; the map is not in frame.                                                                                                                 |
| `08d` to `08g`, `08h` to `08k`                            | Not approved. Superseded captures.                                                                                                                                 |
| `08-gis-priority-labels-diagnostic.png`                   | Not approved. Exact counts visible.                                                                                                                                |
| `08-gis-priority.png` (original)                          | **Prohibited.** Shows exact counts of 3 and 2.                                                                                                                     |

The screenshots were captured before the section 4 fixes. The fixes did not change any value shown on the seed, so they were not re-captured; no original screenshot was overwritten.

## 8. Recommended wording for the stakeholder demonstration

> "This is a synthetic prototype. The programme views use made-up data on a fictional geography. Counts of 1 to 4 are shown as 'n/s', and 'n/s' means not shown, not zero. Where hiding one count would let it be calculated from a total, a second figure is hidden too. This is a display rule in the prototype that we tested against straightforward subtraction. It is not a security control: the underlying mock data is complete, and repeated queries can still be compared. It needs specialist disclosure-control and security review before any real data is used."

**Prohibited claims:** privacy-protected; secure; compliant; cannot be re-identified; small counts cannot be recovered; WASH, staff counts or the direction label are protected; any suggestion that the data is real; showing the original `08-gis-priority.png`.

## 9. Remaining risks and final regression

**Remaining risks.** (1) Cross-request differencing: for example an all-scope total of 23 minus one community's 20 gives the other as 3, and a date-range split gives 30 minus 27 as 3. Tested as a documented residual; it would need server-side query controls. (2) Section 5 residuals. (3) A sum bound over two or more hidden parts can still be inferred. (4) Facility inbox record-level data. (5) Priority CSV filename has no DEMO marker. (6) The FGS aggregate does not defend differencing. (7) Threshold 5 is unjustified.

**Final regression.** Run 7 (started 15:00, working tree as in section 1, HEAD unchanged), executed on the laptop:

| Check                    | Exit  | Observed                                                                                                                                                                                                  |
| ------------------------ | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `git diff --check`       | 0     |                                                                                                                                                                                                           |
| `npm run typecheck`      | 0     |                                                                                                                                                                                                           |
| `npm run lint`           | 0     |                                                                                                                                                                                                           |
| `npm run format:check`   | 0     |                                                                                                                                                                                                           |
| `npm run test`           | **1** | 38 files and 496 of 496 tests passed, but vitest reported 1 unhandled error (`DatabaseClosedError` from a Dexie teardown race attributed to `app.test.tsx`, which this work did not change) and exited 1. |
| `npm run build`          | 0     |                                                                                                                                                                                                           |
| `npm run test:e2e`       | 0     | 80 of 80 passed (desktop and mobile projects, including the 4 export-disclosure tests).                                                                                                                   |
| final `git diff --check` | 0     |                                                                                                                                                                                                           |

The failed `npm run test` was repeated three times on its own (run 9): exit 0, 0 and 0, each with 38 files, 496 of 496 tests and no unhandled error. The earlier run 6 also exited 0 on 496 of 496. So the unhandled error is **intermittent and was not reproduced**; its cause was not diagnosed and no code was changed for it. It is recorded here as an open item, not as a pass. Run 7 is a failed run for `test`; the later repeats are separate evidence.

**Final git status.** Final Git status was not captured for this historical review; the working-tree state at that time cannot be independently verified.

## 10. Open items

- **Unit-test stability (open, unresolved).** One `npm run test` run (run 7) exited 1 with an unhandled Dexie `DatabaseClosedError` although 496 of 496 tests passed; four other runs (run 6 and three repeats) exited 0. The failure is intermittent and its root cause has not been established. It is not described as harmless, and the unit suite is not described as stably green. `app.test.tsx` and the error handling were not changed.
- Privacy and disclosure limits: sections 5, 6 and 9 above.

## 11. Addendum, 29 October 2026: evidence and wording update (documentation only)

Sections 1 to 10 are the record of the 28 October review and are left as written, including the run-7 figures in section 9. The disclosure rules, prohibited claims and the excluded-image list in this review are unchanged by this update.

- **Latest reported test evidence (founder's laptop; not rerun by the assistant that wrote this addendum):** `npx vitest run` 44 files and 554 of 554 passed; the dedicated Phase 4C tests 6 of 6; typecheck, lint and format check exit 0; build exit 0 (407 modules transformed); `git diff --check` clean. Playwright was not part of that report. A later founder-reported Playwright result (80 of 80, not independently verified) is recorded in `FINAL_STAKEHOLDER_PACK_VERIFICATION_REPORT.md`, section H. The full-suite run presumably includes `packages/programme/src/disclosure.test.ts`, but its individual result was not separately reported.
- **Supersedes the open item in section 10 only for the unit-test count.** The run-7 `DatabaseClosedError` remains a historical, intermittent, undiagnosed failure. A reset/sync race was later addressed in Phase 4C (serialised mock-server writes; requests from an ended demo epoch are rejected), and the latest reported run passed. That does not establish that the race caused the earlier error or that every reset/sync failure is eliminated. It is a demo-consistency mechanism, not a security control.
- **Post-review change affecting the disclosure statements (Phase 4A):** the Overview page now shows a data-provenance line that can display an exact count of demo-created records, including 0 to 4, only when every non-seed assessment in the view is verified as a synthetic demonstration record; otherwise the small-count rule applies to the whole figure. The GIS map and table were not changed and still show 1 to 4 as "n/s". Statements in sections 1 to 10 that the Overview shows 1 to 4 as "n/s" predate this change, and the disclosure analysis has not been re-done for it. See `PHASE4_SEED_LIVE_TRANSPARENCY_REPORT.md`, Phase 4A section.
- **Placeholder resolved (29 October 2026):** the literal `R7_STATUS` token in section 9 was replaced by an explicit statement that the final Git status was not captured. No current status output was inserted as historical evidence.
