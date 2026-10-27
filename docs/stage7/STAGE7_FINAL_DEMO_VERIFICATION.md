# Stage 7.1 final demo verification

## A. Verification date

2026-10-19 (Africa/Lagos). Stage 7.1 is a stabilisation pass. No product scope was added.

## B. Environment

| Item                                         | Value                                                                                       |
| -------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Operating system                             | Linux 6.18 (cloud sandbox). **Not run on a Windows laptop or any presenter machine.**       |
| Node / npm                                   | v22.22.0 / 10.9.4                                                                           |
| Browser used for automated and visual checks | Chromium 141 (Playwright), phone profile (Pixel 7) and desktop profile                      |
| Repository version                           | Not a git repository. Version is `0.1.0` (package.json); Stage 7 files plus Stage 7.1 edits |
| Map rendering                                | Verified with software WebGL in headless Chromium                                           |

## C. Automated checks

| Check                  | Result | Notes                                                       |
| ---------------------- | ------ | ----------------------------------------------------------- |
| npm install            | PASS   | 0 vulnerabilities reported                                  |
| typecheck              | PASS   | `tsc --noEmit`                                              |
| lint                   | PASS   | ESLint, no warnings                                         |
| format                 | PASS   | Prettier                                                    |
| unit/integration tests | PASS   | 21 files, 264 tests passed                                  |     |
| build                  | PASS   | Production build; map worker now emitted as its own asset   |
| E2E                    | PASS   | 56 passed (28 tests x phone and desktop profiles), 0 failed |     |
| demo startup           | PASS   | `npm run demo`; see section F                               |

React `act(...)` warnings: **none appear** in the full unit-test output of this run (searched for "act(" and "not wrapped in act"). Nothing needed cleaning. If they appear on another machine they would be test-environment noise from asynchronous query updates, not user-visible behaviour, but none was observed here.

## D. Functional verification

All items below were exercised in a real browser (automated) and, for the GIS, banner and landing pages, by looking at screenshots. "Auto" names the test that guards it.

| Area                                                                                                                                              | Result                           | Evidence                                                 |
| ------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- | -------------------------------------------------------- |
| Primary journey: landing, CHW sign-in, assessment, result with reasons, referral                                                                  | PASS                             | Auto: `demo-flow.spec.ts` (phone and desktop)            |
| Facility workflow: inbox, accept, arrived, assessed with outcome                                                                                  | PASS                             | Auto: same test; `stage7.test.ts`                        |
| Follow-up back to the CHW, outcome visible                                                                                                        | PASS                             | Auto: same test                                          |
| Programme dashboard (overview, follow-ups due)                                                                                                    | PASS                             | Auto: `programme.spec.ts`                                |
| Priority communities, matrix, filters, drill-down, CSV                                                                                            | PASS                             | Auto: `demo-flow.spec.ts`                                |
| GIS: signal and vulnerability layers                                                                                                              | PASS **after a fix** (see below) | Screenshot of production build and dev server            |
| Scenario A: Demo Streamside, Arewa, South LGA, high/high, rising, follow-up open                                                                  | PASS                             | Auto: `stage71-verification.spec.ts`, `priority.test.ts` |
| Scenario B: Demo Marketfield, Arewa, North LGA, high signal, lower vulnerability, "Investigate an unusual signal"                                 | PASS                             | Same                                                     |
| Scenario C: Demo Hillview, Arewa, North LGA, high vulnerability, low signal, "Prevention or active surveillance opportunity"; no outbreak wording | PASS                             | Same                                                     |
| Reset, then reload, restores the seeded state                                                                                                     | PASS                             | Auto: `stage71-verification.spec.ts`                     |
| Offline: capture offline, "Waiting to sync", survives reload, syncs; failed sync shown; retry; lost response gives no duplicate                   | PASS                             | Auto: `chw-journey.spec.ts`, `offline.test.ts`           |
| Role boundaries: CHW, facility, state, administrator                                                                                              | PASS                             | Auto: `stage71-verification.spec.ts`, `roles.test.ts`    |
| Console: no errors, page errors or failed local requests across the landing page and all ten programme pages                                      | PASS                             | Auto: `stage71-verification.spec.ts`                     |
| Accessibility (axe) on landing, CHW screens, every programme page, priority, settings, facility inbox                                             | PASS                             | Auto: `a11y.spec.ts`, `programme.spec.ts`                |

**Presenter reset procedure:** banner, **Reset demo**, **Yes, reset**. It clears assessments, referrals, follow-ups, users, audit, the offline queue, the draft, simulation switches and filters, regenerates the synthetic seed, and keeps the chosen role. Reload afterwards is safe.

### Defects found and fixed in Stage 7.1

| Priority | Defect                                                                                                                                                                                       | Fix                                                                                                                                                           |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **P0**   | In the production build the map's worker script failed to load, so the vulnerability polygons never drew; only the signal markers showed. The GIS step of the story would have looked broken | The worker is emitted as its own asset and its address is given to the map library (`RiskMap.tsx`). Confirmed visually in the production build and dev server |
| P1       | Banner wording did not match the required statement and used four lines on a phone                                                                                                           | Required wording used; a short form on phone-width screens (`DemoBanner.tsx`)                                                                                 |
| P1       | Browser console 404 on the landing page (no favicon)                                                                                                                                         | Inline icon added                                                                                                                                             |
| P1       | Integrations were labelled FUTURE or SIMULATED but not "NOT CONNECTED"                                                                                                                       | Labels added in the capability register and `INTEGRATION_BOUNDARIES.md`                                                                                       |
| P1       | Setup guide and five-minute script did not follow the brief's shortest-path and seven-step structure                                                                                         | Rewritten                                                                                                                                                     |

Test updates only (no behaviour change): the map-library mock gained the new export; two banner assertions were widened; one new verification spec was added.

## E. Safety verification

| Check                  | Result                                                                                                                                                                           |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| No diagnosis claims    | PASS. Automated scan of every user-facing string (`safety.test.ts`) plus a manual search of the README and Stage 7 documents. Remaining hits are negations or "do not say" lists |
| No outbreak claims     | PASS. Priority page says it "does not declare an outbreak"; scenario C checked for outbreak wording                                                                              |
| No prescribing         | PASS. Rule actions and outcome categories contain no drug or treatment names (automated)                                                                                         |
| No real data           | PASS. Searched demo data for names, phone numbers, addresses: none. Facilities and communities carry "Demo" names                                                                |
| Synthetic data         | PASS. Banner, every programme page and exports carry the synthetic notice                                                                                                        |
| Illustrative rules     | PASS. Banner and Settings rule governance register state they are placeholders without source, owner or validation                                                               |
| Simulated integrations | PASS. Settings capability table and `INTEGRATION_BOUNDARIES.md`: DHIS2, facility directory, WASH, GIS sources, notifications and identity are NOT CONNECTED                      |

## F. Network verification

| Item                      | Value                                                                                                                                                                                                |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Command                   | `npm run demo` (builds, then serves with `--host`)                                                                                                                                                   |
| Localhost URL             | `http://localhost:4173` (Vite moves to the next free port, for example 4174, if 4173 is taken; use the URL it prints)                                                                                |
| Network URL               | The "Network" line it prints, in the form `http://<laptop-ip>:4173`                                                                                                                                  |
| Verified here             | The server started and answered HTTP 200 on both `localhost` and the machine's non-loopback address, and the app loaded and its mock API answered there                                              |
| **Second device tested?** | **No.** No second physical device on the same Wi-Fi was available. Reachability from another device, firewall prompts and guest-network isolation are untested and are documented in the setup guide |

## G. Remaining warnings

**Blocking issues:** none known.

**Non-blocking warnings:**

- The map library chunk is about 1 MB (loads only on the GIS page). The build prints a size notice for it.
- Headless Chromium prints GPU performance warnings on the map page. They are not application errors.
- If port 4173 is busy the demo moves to another port. Use the printed URL.

**Known limitations:** see `KNOWN_LIMITATIONS.md`. In short: synthetic data, placeholder rules, no backend, simulated roles and login, fictional geography, no integrations, no notifications, LGA demo user is Central LGA so the main story uses the State role, offline behaviour is a demonstration and not production-grade synchronisation, no manual screen-reader test, not run on the presenter's own machine or a second device.

## H. Final status

```text
DEMO READY WITH CONDITIONS
```

Conditions: (1) do a dry run on the presenting laptop before the real audience, including the network URL from a second device if one will be used; (2) present it only as an internal functional prototype with synthetic data and illustrative rules. It is not production-ready, not clinically validated and not an official system.

---

## Addendum — dry-run finding on the presenting laptop (Stage 7.1b)

**Finding (P0 for the demo).** On the presenter's Windows machine only the CHW app loaded; every programme page and the facility inbox showed "Could not load this view — Unexpected token '<', "<!doctype"… is not valid JSON". The in-browser mock service was not answering, so the page server returned its HTML page for API calls. The root cause on that machine is not confirmed (stale or blocked service worker are the suspects); it did not reproduce in the test browser.

**Fix.** API calls now go through `apiFetch()` (`apps/web/src/offline/apiClient.ts`). If a call receives HTML instead of JSON, the same mock handlers answer in-page. A genuine network failure is unchanged, so offline and retry behaviour is unaffected. If the service worker cannot start at all, the app now still renders (`apps/web/src/mock/browser.ts`) instead of showing a blank page.

**Evidence.** New test `e2e/mock-fallback.spec.ts` (service worker blocked, API returns HTML): programme Priority page shows the scenario rows with no JSON error. `npm run check` exit 0 (21 files, 264 tests). Full e2e: 58 passed (29 specs × 2 profiles), 0 failed. **Not yet confirmed on the presenting laptop** — re-run the dry run there.
