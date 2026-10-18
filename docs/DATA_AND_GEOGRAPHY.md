# Synthetic data and geography

**Everything here is synthetic.** No real patient, place, facility, boundary or disease burden is used.

## Hierarchy

2 states (Arewa Demo State, Savanna Demo State), 5 LGAs, 10 wards, 15 communities, 9 facilities, 11 CHWs. Every name contains "Demo". Ids are stable (`com-01`...), and CHW-0142 (the live demo account) shares Demo Riverside with CHW-0143.

## Geography

Polygons are generated in code from a jittered lattice (shared corners, so neighbours touch) near coordinates (0,0), far from any real place. The map has no base map. Boundaries are not geographically accurate and must not be read as such. The map label says so.

## Seed

`generateSeed({ anchor, seed, weeks })` creates about 650 assessments over 12 weeks, with referrals and follow-ups that follow the real pathway rules. Risk levels come from the demonstration rules engine, not from a random label. Latent community profiles (WASH, signal level, volume, trend) only drive the generator; they never appear in output. Deliberate features: three communities with rising signals, five communities with no CHW, one live account with no seeded history. `checkConsistency` verifies that every referral has an assessment, timestamps are ordered, stages match timestamps and nothing lies in the future.

## Aggregation

- Signal = a HIGH or URGENT demonstration assessment. It is not a confirmed case.
- Vulnerability index = mean of four WASH indicator rates x 100, needing at least 5 assessments and 3 known indicators. Bands: moderate from 30, high from 45 (demonstration thresholds).
- Direction compares the last 28 days with the 28 before: rising if the difference is at least 2 and the recent count is over 1.5x.
- Referral completion = share that reached ASSESSED or beyond. Unresolved = not assessed within the configured days (default 7).
- Weeks start on Monday (UTC). The previous period is an equal-length window before the start date.

## Limitations

No small-cell suppression; no statistical modelling or uncertainty; thresholds are not validated; the seed cannot show real epidemiology.
