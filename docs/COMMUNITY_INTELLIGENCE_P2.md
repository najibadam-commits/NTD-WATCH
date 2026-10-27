# Community programme priority intelligence (P2)

> **This P2 intelligence layer is a prototype decision-support and programme-prioritisation pattern. It is not a validated epidemiological model and does not diagnose disease or estimate prevalence.**

Status: prototype on **synthetic data only**. Every limit, band and category below is a
demonstration setting chosen for the prototype. None comes from WHO or national guidance, and none
has been validated, clinically reviewed or checked against real data. This document makes no WHO,
national-programme or regulatory validation claim.

## 1. Purpose

P1 added a women-and-girls (FGS) community assessment and referral module. P2 shows how
**community-level** signals could help a programme decide where further review, outreach,
referral strengthening or further assessment may be worth considering:

```
COMMUNITY
  -> COMMUNITY CONTEXT / VULNERABILITY
  -> STRUCTURED COMMUNITY SIGNALS
  -> PROGRAMME PRIORITY (with data confidence)
  -> PROGRAMME REVIEW / OUTREACH / FURTHER ASSESSMENT
```

It never says that a person or community has a condition. A programme priority is a prompt for a
human decision, not a finding.

## 2. Architecture (what was reused and what is new)

Reused unchanged: the programme aggregation layer (`packages/programme/src/aggregate.ts`), the
`generalView` / `fgsOnly` / `fgsAggregate` privacy split from P1, the community model and
vulnerability index, the simulated roles and scope clamping, the mock API and store, the fictional
MapLibre geography, the capability register, and the existing Stage 7 priority matrix
(`priority.ts`, left as it was).

New:

| Piece                                                 | File                                                                                  |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Pure rules: bands, confidence, priority, explanations | `packages/programme/src/intelligence.ts`                                              |
| Aggregation into the programme summary                | `communityIntelligence()` in `aggregate.ts`; `ProgrammeSummary.intelligence`          |
| Synthetic women-and-girls seed                        | `packages/programme/src/fgsSeed.ts` (loaded by `apps/web/src/mock/programmeStore.ts`) |
| Dashboard section                                     | `programme/components/IntelligenceSection.tsx`, shown on the Priority page            |
| Pills (priority, data confidence)                     | `programme/components/Intelligence.tsx`                                               |
| Map colour mode "Programme priority"                  | `programme/components/RiskMap.tsx`, `pages/GisPage.tsx`                               |
| Wording                                               | `apps/web/src/i18n/locales/en.intelligence.json`                                      |

No new page, route, role, service or dependency was added.

## 3. Data flow

1. The CHW app (or the synthetic seed) produces FGS assessments. They exist at person level only
   on the mock server and in the CHW's browser.
2. `summarise()` calls `communityIntelligence()`, which first applies `fgsOnly()` and the caller's
   scope and date filters.
3. For each community it computes **counts only** (observations, with a signal, with freshwater
   contact, with a reported access barrier, weeks with data) and hands those to the pure rules in
   `intelligence.ts`.
4. The rules return bands and a category. **Only bands, coarse ranges and explanations leave the
   aggregation function.** The counts are discarded.
5. The programme UI renders the rows. It never receives an assessment, case code, participant key
   or response.

## 4. Vulnerability dimensions

Contextual vulnerability combines up to three dimensions, each shown as Lower / Moderate / Higher:

| Dimension             | Source                                                                                                                                                                        | Rule (demonstration limits)                                     |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Water and environment | The existing community WASH index from general CHW answers (already published).                                                                                               | Existing band.                                                  |
| Water contact         | Share of the community's observations reporting freshwater contact.                                                                                                           | under 25% lower; 25% to under 50% moderate; 50% or more higher. |
| Access and service    | Share reporting a barrier to visiting a facility, plus a **synthetic** service gap (LGA facilities in the invented capability list that could examine and accept a referral). | 0 to 4 points: 0 to 1 lower, 2 moderate, 3 to 4 higher.         |

Overall vulnerability is the share of available points across the dimensions that are shown
(under 30% lower; 30% to under 60% moderate; 60% or more higher). A dimension that cannot be shown
is left out, not counted as zero.

## 5. Community signal activity

The share of a community's observations in the period whose demonstration FGS category is above
"no priority signal": under 15% lower activity, 15% to under 35% some activity, 35% or more
elevated activity. Below the threshold of 5 observations it is "Not shown". This counts
assessments rated by demonstration rules. It is not a count of cases.

## 6. Data confidence

Points (0 to 5): observations 20 or more = 2, 10 or more = 1; weeks with data 4 or more = 2,
2 or more = 1; all three context dimensions shown = 1. Then 4 to 5 = **High**, 2 to 3 =
**Medium**, 0 to 1 = **Low**. Fewer than 5 observations = **Insufficient**.

Confidence is shown beside every priority. On the map, lower confidence draws a fainter fill, and
"more information needed" is grey. In the tables the meter has a word as well as shapes, so
colour is never the only cue. A community with few observations cannot look the same as one with
strong evidence.

## 7. Programme priority logic

Signal activity (0 to 2) plus overall vulnerability (0 to 2):

| Total               | Programme priority                    |
| ------------------- | ------------------------------------- |
| 4                   | High priority for programme attention |
| 3                   | Priority for review                   |
| 2                   | Monitor                               |
| 0 to 1              | Low priority                          |
| any input not shown | More information needed               |

With **Low** data confidence the top category is held at "Priority for review" and the reason says
so. These are programme-attention categories. They are intentionally not called Low / Moderate /
High / Urgent, which are the non-diagnostic referral categories in the CHW workflow.

Every row carries a plain-language explanation built only from the bands, for example: "Priority
for review because community signal activity is elevated and contextual vulnerability is moderate,
with high data confidence." An explanation contains no number, so it cannot reveal a suppressed
count.

## 8. Privacy boundary

- Community level only. The row type has a fixed, tested field list: community, location ids,
  observation **range**, bands, confidence, category, cap flag, explanation.
- No participant id, case code, client key, worker id, name, response, consent record or
  household coordinate. Geography is the existing fictional community geography.
- Fewer than 5 observations: nothing about signals, water contact or access is shown. Above the
  threshold the number of observations is only a range (5 to 9, 10 to 19, 20 to 49, 50 or more), so
  summing communities against a total cannot exactly difference a hidden count.
- Filters and scope go through the same slice as every other programme view; a one-day window
  suppresses every community; a community filter returns the same row as the all-community view.
- The general (non-FGS) programme views are unchanged and are tested to be identical with and
  without FGS records.
- CHW and facility roles are refused the summary; programme roles have no route to person-level
  records; the facility inbox stays facility-only (Stage 7).

**This is not a claim that suppression solves differencing.** Small-cell suppression with coarse
ranges is a prototype pattern. Repeated or overlapping queries, small differences between
filters, or outside knowledge can still reveal or narrow a hidden value. It is **not a reviewed
statistical disclosure control** and needs privacy and data-protection review before any real
use (capability register: `disclosure-control`, FUTURE). The P1 limitation text is unchanged.

## 9. Synthetic and demonstration data

- `generateFgsSeed()` invents women-and-girls assessments from a fixed seed, passes them through
  the same DEMO rules as the CHW app, and varies communities on purpose (many observations, few,
  none, one week only) so the demonstration shows different priorities, low confidence and
  suppression. The community patterns are arbitrary settings, **not epidemiology**.
- The service and access context uses the invented facility capability list.
- The map uses the fictional geography. Every P2 view carries a **DEMONSTRATION DATA** banner and
  the fictional-geography notice. The words "diagnosis", "treatment" and "hotspot" are not used in
  the P2 interface text (checked by a test); the preferred terms are community signal, contextual
  vulnerability, programme priority, priority for review, outreach, further assessment, referral
  strengthening, programme attention and data confidence.

## 10. Limitations

- All bands, limits and weights are demonstration settings. They need to be agreed with
  programme, clinical and statistical stakeholders and tested on real data before any real use.
- Observations come from who a CHW happened to assess. They are not a representative sample, so
  shares are not prevalence and a "lower activity" result does not mean absence.
- A community with no observations is "more information needed", never "low priority".
- Water and environment context comes from the general CHW WASH answers, not an authoritative
  WASH source (capability `wash-source`, FUTURE).
- Service and access context uses invented facilities. No real facility directory is connected.
- The coarse ranges and threshold reduce, but do not remove, the chance of working out a hidden
  count (section 8).
- No time trend, forecasting or outbreak logic. No machine learning.
- Single language (English); no localisation of the new wording.
- The facility-side workflow was not redesigned.

## 11. What is NOT being claimed

- That any community or person has FGS or any other condition.
- Any estimate of prevalence, incidence, burden or risk of disease.
- Any clinical, diagnostic or treatment recommendation, or any mass-treatment recommendation.
- Any clinical, epidemiological, statistical or regulatory validation, or WHO or national
  endorsement.
- Any real data, real place, real facility or real person.
- Production readiness, production authentication, DHIS2 integration or a reviewed privacy
  control.

## 12. Tests

- `packages/programme/src/intelligence.test.ts`: observation ranges, signal activity, access
  band, vulnerability, data confidence, priority and the confidence cap, explanations, ranking.
- `packages/programme/src/intelligenceBoundary.test.ts`: seed consistency, community
  aggregation, privacy boundary, suppression, filters and scope.
- `apps/web/src/mock/intelligenceApi.test.ts`: the same boundary through the mock API and roles.
- `apps/web/src/i18n/intelligenceSafety.test.ts`: the safety-language scan of all P2 text.
- `apps/web/src/programme/programme.test.tsx`: dashboard, explanation, map colour mode, legend.
- `e2e/a11y.spec.ts` and `e2e/programme.spec.ts`: axe scans and the end-to-end view.
- All P1 tests are retained. Two fixtures were adjusted (not weakened): the P1 boundary tests turn
  the new synthetic seed off so they still start from an empty women-and-girls store, and the
  "general aggregates identical with and without FGS records" test now also excludes the
  intentionally FGS-derived `intelligence` block.
