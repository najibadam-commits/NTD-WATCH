# Known limitations

Plain statements of what this demo cannot do and where it could mislead. None of these is hidden in the application; most are stated on screen.

## Not real

- **All data is synthetic.** No real person, place, facility or disease signal. Counts come from a seeded generator.
- **The rules are placeholders.** They are not derived from any protocol, not reviewed by clinicians and not clinically validated. Risk levels are a product category, not a finding.
- **There is no backend.** A mock API runs in the browser. Data is stored in browser storage on one device.
- **Sign-in and roles are simulated.** The role selector and PIN are not security. Data scope is enforced only by the mock server's own checks for demonstration.
- **No integration** with DHIS2, a facility directory, a WASH source, GIS boundaries, messaging or an identity provider. See `INTEGRATION_BOUNDARIES.md`.
- **Maps use fictional coordinates** and no boundaries. Do not read geography into them.
- **No notifications** of any kind.

## Behaviour to be aware of

- **Priority bands and categories are demonstration settings** (signal high at 15%, vulnerability high at index 45, at least five assessments). They have no evidence base. Changing them changes the story.
- **Signal means assessments rated HIGH or URGENT**, not cases. A community with few assessments can swing. Fewer than five assessments gives no band.
- **"Rising" compares the last 28 days with the 28 before.** Small numbers are noisy. The screen shows both counts.
- **The LGA Programme Officer demo user is Central LGA.** The demo CHW's community (Demo Riverside) is in North LGA, so the LGA officer does not see it. The State Programme Manager sees it. This is a scope choice that mirrors real hierarchy; switch to the state role for the main story.
- **Savanna State has no scenario community.** Its communities are visible to the Super Administrator only.
- **The facility worker is one simulated facility** (Demo North Primary Health Centre). Referrals to other facilities appear only to their own simulated scope.
- **A demo shortcut remains on the CHW referral screen** that moves a referral without switching role. It is labelled as a demonstration shortcut and points to the real facility view.
- **The facility outcome is a synthetic category.** It is not a clinical record. Four categories exist for the closed loop only.
- **Dates follow the browser clock.** The seed anchors to the first time the demo runs and again after a reset. Seed counts per community are the same each time; calendar dates are not.
- **Browser storage is per address and per browser.** A different address, browser or cleared site data starts clean. Two tabs on the same address share data.
- **One language (English)** and no real accessibility audit. Automated axe checks pass on the main screens, which finds only part of the problems. Manual testing with assistive technology has not been done.
- **Large map bundle.** The map library is about 1 MB and loads only on the GIS page.
- **Reports are exported from the browser** (CSV, JSON, print). Nothing is sent anywhere.

## Open decisions that limit any claim

The Stage 6 outcome (proceed, modify, integrate, stop or inconclusive) is open and success criteria are awaiting sponsor ratification. Differentiation from existing systems is a hypothesis. Nothing in the demo should be presented as proof of need or effect.
