# Final stakeholder pack verification report

## A. Audit identification

- **Date and time:** 28 October 2026, about 16:40 to 17:00, Africa/Lagos (UTC+01:00).
- **Repository:** `C:\Users\User\Desktop\NTD-WATCH\NTD-WATCH` (the laptop). The audit ran in a cloud workspace, which has no shell on the laptop. Files were copied from the laptop read-only and inspected there.
- **Branch and HEAD, from the laptop's `.git` files:** `refs/heads/feat/fgs-femtech-prep`, `3f91e8c5d3e94d20d593f000d67fbcbbf471ccd9`. This matches the expected values.
- **Deliverables inspected** (SHA-256 prefixes `ce6176510bfa` and `fe77f2ebc13e`; byte-identical to what was written earlier that day):
  - `artifacts/demo-evidence/NTD-WATCH_FINAL_STAKEHOLDER_DEMO_PACK.md`: 39,423 bytes, modified 15:43:05.
  - `artifacts/demo-evidence/NTD-WATCH_FINAL_STAKEHOLDER_DEMO_PACK.html`: 1,398,848 bytes, modified 15:43:09.
- **Method:** read both files in full; compared their text; decoded every embedded image and hashed it against the screenshot files; viewed the images; searched for risky wording; traced the test statements to the run logs; checked the script word count; opened the HTML in a headless browser at 1200 px and 390 px; scanned for personal data and secrets.
- **Limitations of this audit:**
  1. **Not independent.** The same assistant that built the pack audited it.
  2. **No fresh git query.** I tried to run a read-only script on the laptop (a hash and `git status` script). The laptop's File Explorer window was masked and could not be operated, so it was not run. The working tree is therefore **not freshly verified**. The latest status is from run 10 at 15:43:36. The `.git/index` file was last modified at 12:30:20, before any of today's edits, which indicates nothing was staged since; that is an inference.
  3. **No fresh tests.** No tests were run in this audit.
  4. **Not scanned.** The repository as a whole was not scanned for real data, and the two Word documents were not opened.
  5. **Stray script.** A script I placed outside the repository, `C:\Users\User\Desktop\NTD-WATCH\run-audit-readonly.cmd`, was never run and writes no repository files.

## B. Executive verdict

**APPROVED WITH CONDITIONS**

For a qualified demonstration using synthetic data only. The correct three GIS images are used in both files and are embedded. No prohibited claim was found. The test disclosure is accurate. Four issues should be fixed or accepted before an external audience: the display-rule caveat is not attached to each GIS image; the intermittent test failure is not mentioned in the opening banner; the test evidence has no log paths; and two referral phrases lack the word "simulated". There is no blocker. This approval is not approval of security, privacy compliance or clinical validity, and it is not production approval.

## C. Verification matrix

| #   | Check                                          | Status  | Severity | Evidence inspected                                                                             | Finding                                                                                                                                                                                                                                              | Required action                                         |
| --- | ---------------------------------------------- | ------- | -------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| 1   | Correct GIS screenshots                        | PASS    | LOW      | `.md` lines 56 to 66; HTML `<img>` tags; SHA-256 of 7 embedded images against screenshot files | The three embedded GIS images are byte-identical to `08l`, `08m` and `08n`. `08-gis-priority.png`, `08o`, `08b`, `08c` and `08d` to `08k` appear only in the "not for use" table. See F2.                                                            | None required. Optional: F2.                            |
| 2   | GIS display-rule / security caveat             | PARTIAL | MEDIUM   | `.md` lines 8, 56 to 68                                                                        | The caveat exists, but only in the paragraph after the third image ("a security or privacy guarantee") and the opening banner. Under `08m` and `08n` the text says only "Same limits". Alt text and captions do not carry it.                        | Add F1's caption under each image.                      |
| 3   | Referral prototype wording                     | PARTIAL | LOW      | `.md` lines 32, 44, 46, 78, 157, 171, 221                                                      | No phrase implies a real facility, patient or completed referral. Two phrases lack "simulated" in their own sentence (F3). Row 44 and the claims table cover it nearby.                                                                              | Add "(simulated)" in F3's two places.                   |
| 4   | Intermittent unit-test failure disclosure      | PARTIAL | MEDIUM   | `.md` lines 8, 224, 229 to 240, 257                                                            | Accurate and clear in section 9, the Q&A and section 10 ("not stably green"). It is absent from the opening "Read this first" banner and section 1, so it is not prominent. See F4.                                                                  | Add one sentence to the banner.                         |
| 5   | Clinical validation and diagnosis claims       | PASS    | INFO     | Full text search                                                                               | Every "validated", "diagnos" and "clinical" occurrence is a negation or a limitation. None found asserting validation or diagnosis.                                                                                                                  | None.                                                   |
| 6   | Privacy/security claims and unresolved leakage | PASS    | INFO     | `.md` lines 8, 68, 162, 172, 189 to 208, 221, 246 to 262                                       | No claim of protection, security, compliance or non-identifiability. The pack lists differencing, WASH and the vulnerability index, staff counts, direction and band, the inbox, full records, the threshold, and no independent review.             | None.                                                   |
| 7   | Deployment, pilot and health-outcome claims    | PASS    | INFO     | Full text search                                                                               | The pilot is proposed only (section 5.2, "No timeline, budget, partner or outcome is stated"). No outcomes, partners, endorsements, users or testimonials. DHIS2 appears only as FUTURE.                                                             | None.                                                   |
| 8   | Synthetic-data and fictional-geography notices | PASS    | LOW      | `.md` lines 3 to 8, 43, 58; images                                                             | Stated at the top, in section 7 and under each concept. The fictional-geography badge is visible in all three GIS images. The page-level DEMONSTRATION DATA banner is above the GIS frames, and the pack says so.                                    | None.                                                   |
| 9   | Test evidence traceability                     | PARTIAL | MEDIUM   | `gisfix-r6/r7/r9` logs and `checks-run` files; section 9                                       | Every number in section 9 matches the logs (section E). The pack cites no log paths or times, so a reader cannot trace them.                                                                                                                         | Add the paths from section E.                           |
| 10  | Markdown/HTML consistency                      | PASS    | INFO     | Word-level comparison                                                                          | 3,937 and 3,923 words; the only differences are the HTML title and list numerals. No contradiction.                                                                                                                                                  | None.                                                   |
| 11  | HTML rendering and embedded images             | PASS    | LOW      | Headless browser at 1200 px and 390 px                                                         | 7 of 7 images embedded as data URIs and loaded; no external requests; no console errors or page errors; no horizontal overflow; 11 sections, 9 tables. At 390 px the screenshots are too small to read and cannot be enlarged.                       | Optional: present the images at full size when sharing. |
| 12  | Two-minute script word count and claims        | PASS    | INFO     | `TWO_MINUTE_SCRIPT.md` and pack section 4                                                      | Spoken text is 247 words in both, within the stated 230 to 260. The six spoken blocks are identical in both files. No stronger claim than the evidence.                                                                                              | None.                                                   |
| 13  | Personal-data and secret exposure              | PARTIAL | LOW      | Search of both files; images                                                                   | No emails, tokens, local paths or phone numbers. The demo PIN `1234` appears once (F5). Images show synthetic names, "Demo" LGAs and case codes (`PC-24ED-B243`, `A-2B3B5`). Absence of real data across the whole repository was not verified here. | See F5.                                                 |
| 14  | Repository state and deliverable integrity     | PARTIAL | LOW      | `.git/HEAD`, the branch ref, `.git/index` time, run 10 log                                     | Branch and HEAD match. The working tree was last seen at 15:43:36 as 29 modified and 11 untracked entries. Both deliverables exist and are readable. Not freshly queried (section A).                                                                | Re-run `git status --short` before presenting.          |

## D. Findings by severity

There are no BLOCKER or HIGH findings.

### MEDIUM

**F1. PARTIAL, MEDIUM. The display-rule caveat is not attached to each GIS image.**

- _Where:_ `.md` lines 56 to 68; the HTML alt texts.
- _Evidence:_ under `08m`: "The same view at 1280 px. Same limits." Alt text for `08l`: "GIS map at 1440 px: fictional geography, programme-priority colouring, "n/s" in place of counts of 1 to 4". The sentence "a security or privacy guarantee" appears once, after the third image.
- _Why it matters:_ an image copied into a slide or message loses its caveat.
- _Minimum action:_ add under each image "Synthetic demonstration data. Prototype. Small-count display rule, not a security control." Put the same words in the alt text.

**F4. PARTIAL, MEDIUM. The intermittent failure is not prominent.**

- _Where:_ "Read this first" (line 8) and section 1 do not mention it; it is in section 9 (line 229 on), the Q&A ("Are the tests all passing?", line 224) and section 10 (line 257).
- _Evidence:_ "Open engineering issue: `DatabaseClosedError`. In one full unit-test run, vitest reported an unhandled `DatabaseClosedError` ... The unit-test suite is not described as stably green."
- _Why it matters:_ a reader who stops at the banner would not see that an unexplained test failure is open.
- _Minimum action:_ add to the banner "One unit-test run failed with an unexplained, intermittent error (section 9); the unit suite is not described as stably green."

**F6. PARTIAL, MEDIUM. The test evidence has no traceable log paths.**

- _Where:_ section 9.
- _Why it matters:_ every figure is correct (section E) but unsupported in the document. The logs are under `artifacts/demo-evidence/`, which is untracked, so they are not in any commit.
- _Minimum action:_ cite the log paths and times in section E, and state that the logs are untracked.

### LOW

**F3. PARTIAL, LOW. Two referral sentences lack "simulated".**

- _Where:_ line 32: "The app returns an explained signal category and supports a tracked referral." Line 44 (the Referral row): "A tracked pathway with facility stage, outcome and follow-up follows."
- _Why it matters:_ read alone, they could suggest a working referral service. Nearby text ("a fictional facility", "Not a real referral", and claim [7] SIMULATED) corrects this. No screenshot in the pack shows a facility acknowledgement or a follow-up stage; the claim rests on code and tests.
- _Minimum action:_ write "supports a simulated, tracked referral" and "A simulated tracked pathway ... follows".

**F2. INFORMATIONAL/LOW. The approved images are byte-identical to superseded captures.**

- _Evidence:_ `08l` = `08h` (1440), `08m` = `08i` (1280), `08n` = `08j` (768). The index lists `08h` to `08k` as superseded because the 390 px layout was not yet fixed.
- _Why it matters:_ a reader comparing files may think a superseded image is in use. The compact-badge change only affects widths under 500 px.
- _Minimum action:_ a one-line note in `SCREENSHOT_INDEX.md`. Optional.

**F5. INFORMATIONAL. The demo PIN appears in the script.**

- _Where:_ line 112: "PIN `1234`". The checklist says any 4-digit PIN works.
- _Minimum action:_ write "any 4-digit demo PIN".

**F7. LOW. A defined term is never used.**

- _Where:_ line 8: `Where this pack says "privacy rule" it means a client-side display rule`. The pack otherwise says "small-count rule".
- _Minimum action:_ replace "privacy rule" with "small-count rule".

**F8. LOW. Wording observation on `08m`.**

- _Evidence:_ in `08m` the facility circles sit very close to the "Salt Pan" and "Hillview" labels. The pack claims "no overlap or clipping" only for `08l`, and calls `08m` "the same view", so no claim is wrong.
- _Minimum action:_ none.

### What the images show (visible details)

- **`08l`, `08m`, `08n`:** badge counts 12, 21, 8, 10 and 12, and "n/s" on five communities. The table row for "Demo Riverside" shows 73 assessments, 12 signals, direction "Rising", index 47.9, band "Higher". These are counts of 5 or more or derived values; the pack says the derived values are not protected. No counts of 1 to 4 appear.
- **`06`, `07`:** "Observations 20 to 49", "9 of 15", the figures 5 and 6, and "Not shown (fewer than 5)". Digit glyphs in the category chips render oddly, as the index notes.
- **`04`, `05`:** synthetic case codes and invented facility names. No personal or sensitive detail.

## E. Test evidence assessment

**Previously reported results (from logs; not re-run in this audit):**

| Run | Time (log file modified) | Unit tests                  | Exit    | End-to-end                                     |
| --- | ------------------------ | --------------------------- | ------- | ---------------------------------------------- |
| r6  | 14:55:02                 | 38 files, 496 of 496 passed | 0       | 80 passed (`gisfix-r6-test_e2e.log`, 14:57:28) |
| r7  | 15:04:08                 | 38 files, 496 of 496 passed | **1**   | 80 passed (`gisfix-r7-test_e2e.log`, 15:12:22) |
| r9  | 15:15:21 to 15:19:41     | three runs, each 496 of 496 | 0, 0, 0 | not run                                        |

- **Known intermittent failure:** in r7 (`artifacts/demo-evidence/gisfix-r7-test.log`) vitest printed "Unhandled Rejection: DatabaseClosedError ... Database has been closed" and "Errors 1 error", attributed to `apps/web/src/app.test.tsx`. The cause is undiagnosed. The pack's description (five runs, four exit 0, one exit 1) matches the logs and exit codes in `gisfix-r6/r7/r9-checks-run.txt`.
- **Other results quoted:** typecheck, lint, format and build exit 0 in r6 and r7; 24 tests in `disclosure.test.ts` (counted); 4 export-disclosure browser tests in the r7 end-to-end log.
- **Checks not rerun:** all tests, in this audit. The last full run (r7) ended at 15:12; later changes were documentation only. `format:check` and `git diff --check` last ran at 15:43:17 (run 10).
- **What the evidence supports:** "passed in these five runs", not "stably passing". Four passes out of five runs with one unexplained failure do not establish stability. The pack does not claim stability.
- **Gap:** the logs are not committed, so they would not travel with the repository.

## F. Final decision and presentation conditions

**Decision: APPROVED WITH CONDITIONS, for a qualified synthetic-data demonstration only.**

Conditions before an external audience:

1. Fix F1, F4 and F6 (or knowingly accept them), and F3 if the pack is read without the presenter.
2. Re-run `git status --short` and `git diff --check` on the laptop on the day, and confirm both files are unchanged (hashes in section A).
3. Show the approved images only with the caveat caption; do not show `08-gis-priority.png`, `08o` or any superseded GIS capture.
4. Say aloud that the data is synthetic and the geography fictional, and that the page-level demonstration banner is not in the GIS frames.
5. Do not claim privacy protection, security, compliance, clinical validation, field testing, pilot results, outcomes, endorsement or a stable test suite.

No correction was applied. The suggested wording above is for your approval.

## G. Addendum, 29 October 2026: documentation reconciliation after Phase 4C

Sections A to F above are the record of the 28 October audit and are left as written. This addendum records what a later documentation-only update did and did not change. It is not a new audit: no tests were run and no Git query was made when it was written.

**Evidence reported by the founder after the audit (not rerun by the assistant):** `npx vitest run` 44 files and 554 of 554 passed; the dedicated Phase 4C tests (`resetRace.test.ts` and `demoEpoch.test.ts`) 6 of 6; typecheck, lint and format check exit 0; build exit 0 (407 modules transformed); `git diff --check` clean. Playwright was not part of that report. The log files for this run are not under `artifacts/demo-evidence/`, so section E's traceability gap (F6) also applies to these figures.

**Phase 4C, described accurately:** mock-server state-changing operations are serialised, and a request carrying the identifier of an ended demo epoch is rejected. It is a demo-consistency mechanism, not a production security control. The earlier `DatabaseClosedError` is not claimed to be conclusively diagnosed, and no claim is made that every reset/sync failure is eliminated.

| Finding                                  | Status after this update                                                                                                                                                                                                                                 | Where                                                                                                                          |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| F1 display-rule caveat on each GIS image | Addressed in the supporting documents only. The stakeholder pack itself (`NTD-WATCH_FINAL_STAKEHOLDER_DEMO_PACK.md` and `.html`) was outside the permitted edit list and is **not** changed.                                                             | `SCREENSHOT_STORYBOARD.md` (new caption section), `LIVE_DEMO_CHECKLIST.md` section 8                                           |
| F3 "simulated" in two referral phrases   | The matching phrases in `STAKEHOLDER_BRIEF.md` (section 1 and section 4) now say "simulated"; the workflow line in section 3 and the storyboard's optional-shot text were also qualified. The phrases at pack `.md` lines 32 and 44 are **not** changed. | `STAKEHOLDER_BRIEF.md`, `SCREENSHOT_STORYBOARD.md`, `TWO_MINUTE_SCRIPT.md`                                                     |
| F4 intermittent failure not prominent    | Test-history wording updated in the brief, claims register, checklist and script. The pack's "Read this first" banner is **not** changed.                                                                                                                | `STAKEHOLDER_BRIEF.md` sections 7 and 9, `CLAIMS_AND_EVIDENCE.md`, `LIVE_DEMO_CHECKLIST.md` section 11, `TWO_MINUTE_SCRIPT.md` |
| F6 log paths                             | Not addressed: no new log files were provided.                                                                                                                                                                                                           | Open                                                                                                                           |
| F2, F5, F7                               | Not addressed (not in scope).                                                                                                                                                                                                                            | Open                                                                                                                           |

**Still open, not changed here:** the stakeholder pack files carry the pre-Phase-4C wording (496 of 496, one exit 1, "not stably green") and the three issues above. They need a separate, authorised edit and a regenerated HTML. Phase 4A also changed the Overview page after this audit; see the post-review note in `CLAIMS_AND_EVIDENCE.md`.

## H. Supplementary note, 29 October 2026 (evening): later founder-reported Playwright result

This note is added after section G and does not change sections A to G or any historical test record. Section G accurately described the evidence available when it was written on the morning of 29 October: it recorded the founder-reported unit, typecheck, lint, format and build results and stated that Playwright was not part of that report. That statement was correct then and is left as written.

**Later report.** The founder subsequently reported that the Playwright end-to-end suite passed **80 of 80** tests, exit 0, on the founder's laptop after the Phase 4C change, covering the desktop and mobile Chromium profiles. This is **founder-reported evidence**. It was not rerun on the laptop or independently verified by the pack preparer, the exact command output, commit and working-tree state of that run were not captured here, and no log for it is under `artifacts/demo-evidence/`, so finding F6 (traceability) applies to it as well.

**Distinct from the earlier 80 of 80.** The pack's "Earlier logged results" table records a different 80 of 80 end-to-end run from 28 October (logs `gisfix-r6-test_e2e.log` and `gisfix-r7-test_e2e.log`), made before Phase 4C. The later report is a separate run and does not replace or alter that record.

**Preparer's own run, for completeness.** While preparing a verification pass on 29 October, the pack preparer ran `npm run test:e2e` in a cloud copy of the laptop's project files (not on the laptop). It passed 80 of 80 (exit 0); the same copy passed `npx vitest run` (44 files, 554 of 554), typecheck, lint, build and `format:check`. That is a result for a copy of the files, not for the laptop's working tree, and the pack does not rely on it.

**What this does not establish.** It does not show that the whole pack is independently verified, that the unit suite is stable, that the cause of the intermittent `DatabaseClosedError` is known, or that every reset/sync failure is eliminated. All clinical, synthetic-data, GIS privacy, small-count and production-readiness limitations stand. The laptop `git status --short` and `git diff --check` still need to be run by the founder on the day.
