# Small-count policy for the programme views (prototype, synthetic data)

Status: implemented in `packages/programme/src/suppression.ts` and applied at the shared aggregation boundary in `packages/programme/src/aggregate.ts`. All figures in this prototype are synthetic. This is a prototype display rule. It has not had privacy or data-protection review and the threshold of 5 is a placeholder.

## The rule

| Count of records | Published as                                             |
| ---------------- | -------------------------------------------------------- |
| 0                | `0` (a true zero)                                        |
| 1 to 4           | `null`, shown as "n/s" or "Not shown (small-count rule)" |
| 5 or more        | the exact number                                         |

`null` is never zero, never "no data" and never a range. "No data" is carried by other fields (for example a vulnerability band of `INSUFFICIENT_DATA`). Views must not write "fewer than 5" for a `null`: a count can also be withheld because a small count could be worked out from the figures around it, and that count may be large.

## Documented exception: demo-created count on the Overview

The Overview summary carries a data-provenance figure (`dataSources` in `packages/programme/src/aggregate.ts`). Its generated-baseline count (`seeded`) follows the rule above. Its demo-created count (`live`) is published exactly, including 1 to 4, only when every assessment in the view that does not have a generated `seed-` key passes `isVerifiedDemoCreated`: a non-`seed-` key, a stored `demo` flag equal to `true`, and a rule-set identifier starting `demo-`. If even one such assessment fails, the rule applies to the whole figure and it is shown as not shown. No other view, export, map badge or table uses this exception.

Source evidence (checked against the laptop copy on 29 October 2026): `isVerifiedDemoCreated` and `demoCreatedCount` are used only to build `dataSources.live` in `packages/programme/src/aggregate.ts`, and `dataSources` is read only by the Overview page. The mock API's assessment endpoint validates records with `assessmentSchema` (`packages/domain/src/entities.ts`), which requires `demo: true`; it does not validate the rule-set identifier, and the key is chosen by the app that creates the record.

Limits of this exception: it is a prototype-specific classification of demo-created records, not an authentication or security guarantee. The three markers are supplied by the creating app, so a pass means "carries the prototype's demonstration markers", not "proven synthetic". It is a display decision and not a privacy guarantee. Because the baseline count is published exactly, a hidden demo-created count could in principle be inferred by subtraction where an exact total is also published; this has not been comprehensively audited across combinations of views, filters and dates, and no claim is made that hidden counts cannot be reconstructed. Other views and exports keep the rules described below; this check found no other use of the exception but did not re-audit them line by line. Referral and follow-up provenance is not summarised. See `artifacts/demo-evidence/PHASE4_SEED_LIVE_TRANSPARENCY_REPORT.md`, Phase 4A section.

## Where it runs

`summarise`, `communityDetail` and `monitorReferrals` compute exact counts internally and return only published values. The map badges, the tables, the charts, tooltips, accessible names, the priority rows and the CSV/JSON reports are all built from those values, so they cannot disagree with each other. The map's GeoJSON no longer carries a signal count at all.

## Protection against working a hidden count out by subtraction

- A total is withheld when exactly one of its parts is hidden, and when its hidden parts add up to the smallest or largest sum they could have (all ones or all fours). With two or more hidden parts and a sum in between, the total is published: it narrows the sum of the hidden parts but identifies none of them.
- Within one group of risk levels, if one cell is hidden the smallest other non-zero cell is hidden too.
- Across a list (communities, weeks, facilities, LGAs), if exactly one row of a column is hidden, the smallest other row that still has a hidden cell of its own is hidden too.
- Cumulative "reached this stage or beyond" counts are hidden whenever a current-stage count at or below them is hidden. "Assessed or beyond" is withheld if the remainder would be a small count.
- Two published sums that overlap cannot be subtracted: when both the total and the signals figure (HIGH plus URGENT) are published, their difference (LOW, MODERATE and unclassified together) must itself be safe to publish, otherwise the total is withheld.
- A risk level that is also the sum of a list (communities, weeks) is withheld when exactly one row of that list is hidden, or when the hidden rows could only be all ones or all fours.
- In the weekly series, every column (assessments, signals and each risk level) is checked against every other, and a second week is hidden entire when needed, repeating until no column has a lone hidden week.
- A completion percentage is published only when both sides of the split (assessed or beyond, and the rest) are 0 or 5 or more. A percentage of a published total pins the split (1 of 5 is 20%).
- The signal band is withheld ("not placed") when the signals count is not shown and the values 1 to 4 would give different bands at that number of assessments (for example 8 assessments: 1 signal is MODERATE, 2 to 4 are HIGH).
- Medians are not shown for fewer than 5 observations. Shares are not shown when either count behind them is hidden.

## Pathways inspected

See the remediation report in `artifacts/demo-evidence/RECAPTURE_REPORT.md` (section 11) for the table of every place a count can appear and its outcome.

## Limits (do not overstate)

1. **Not a security boundary.** The protection boundary is the return value of the aggregation functions, which in this prototype is the mock server's response. The mock server and the browser database hold the full synthetic records. Anyone with access to them, or to the source, can read exact values.
2. **Differencing across separate requests** (overlapping filters, date ranges, LGA against community, week against community) is not defended. A reader who can issue many queries can recover small counts.
3. **Derived categories are computed from exact counts before suppression**: signal band, trend direction (rising, steady, falling) and programme priority. Each is a coarse label, but a reader who knows the rule can narrow a hidden count. The signal band no longer narrows a hidden signals count (see above), but it can still show that a count which is not shown is larger than 4 when it was withheld only to protect a neighbour. The direction label is not protected: with both 28-day window counts hidden, "rising" still means the recent count is at least 2 more than, and more than 1.5 times, the earlier one (tested as a documented residual).
4. **Two or more hidden parts** under a published total leave their sum bounded (see above).
5. **Not suppressed, and not protected:** the WASH percentages are exact ratios of household answers, so a community of 12 with 1 household without sanitation publishes 8.3% (tested as a documented residual); the vulnerability index is built from them; the number of CHWs (staff) is exact; and so is the age of the oldest unresolved referral.
6. The threshold of 5 is a placeholder, not a validated disclosure-control standard.
7. **Facility referral inbox.** It returns record-level referral and assessment details for a simulated facility scope. It is a care-workflow path and is not covered by this rule.
8. **Scope and review.** The rule applies to selected published programme views and exports only. No independent privacy review and no production-security validation has taken place.
9. **Priority CSV.** Downloaded as `DEMO-SYNTHETIC-ntd-watch-priority-communities.csv`; its first row also identifies it as synthetic demonstration data. A detached copy can still be forwarded without context.
