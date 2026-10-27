# Demo readiness checklist

Tick every line on the day. "Evidence" says where a claim was verified in Stage 7.

## Environment

- [ ] `npm install` finished with no errors on the presenting laptop
- [ ] `npm run dev` (or `npm run demo`) opens the landing page
- [ ] Browser is a current Chrome, Edge or Firefox, window shown at laptop size; a second narrow window is ready for the CHW phone view
- [ ] Reset demo done after the last rehearsal; banner reads NTD-WATCH DEMO MODE

## Story (walked end to end)

- [ ] CHW signs in (PIN 1234), records an assessment, sees a risk result with reasons and the demonstration label
- [ ] Referral generated to Demo North Primary Health Centre
- [ ] Facility inbox shows it; Accept, Arrived, Assessed with outcome, Follow-up; stages change one at a time
- [ ] CHW refreshes status, sees the outcome, records a follow-up
- [ ] State manager Priority communities shows Streamside, Marketfield and Hillview in the three expected cells
- [ ] Drill-down, matrix cell filter, trend filter and CSV export work
- [ ] Offline demonstration: create offline, "Waiting to sync", reload, then "Synced"
- [ ] Reset returns the inbox counts and dashboard to their starting values

## Honesty

- [ ] Every screen shows the demo banner; programme pages show the synthetic notice
- [ ] Settings shows the rule governance register and the real / simulated / future table
- [ ] Nobody is told the rules are validated, the system is official, or that it detects outbreaks

## Automated evidence (Stage 7 run)

| Check                                                                                                       | Result                                                     |
| ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Type check, lint, format check, build                                                                       | Passed (`npm run check`)                                   |
| Unit and integration tests                                                                                  | See `STAGE7_IMPLEMENTATION_REPORT.md` for the final counts |
| Browser tests, phone and desktop profiles, including the cross-role story, reset and axe scans of new pages | See report                                                 |

## Not ready until

Any unticked box above. If a page misbehaves during a demo, press Reset demo and re-enter the role.
