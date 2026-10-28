# Live demo checklist

Status: for a presenter running the prototype on their own laptop. Startup steps below were checked against `README.md`, `package.json` and `docs/stage7/DEMO_SETUP_GUIDE.md`. Everything runs in the browser against a **mock API**; nothing here demonstrates production behaviour.

## 1. Start the app (about 5 minutes, do this before the audience arrives)

**Requirements:** Node.js 20.19.0 or newer (`engines` in `package.json`; `.nvmrc` pins 22). The full check run (tests, build, Playwright) passed on the founder's laptop with Node v24.22.1 and npm 11.19.1. Check yours with `node -v`.

1. Open a terminal in the repository folder (the folder that contains `package.json`).
2. `npm install` (first time only).
3. `npm run demo` (builds, then serves the built app). Open `http://localhost:4173`.
   - Windows PowerShell blocked? Use `npm.cmd install` and `npm.cmd run demo`, or run `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned` once.
   - To demo on a second device, use the "Network" address the command prints (same Wi-Fi; data is stored per browser and per address).
4. Leave the terminal window open and out of the shared screen.

## 2. Browser and screen

- [ ] Current Chrome or Edge, fresh profile or a private window (a private window starts with clean data every time).
- [ ] Zoom 100 percent. Desktop capture at 1440 x 900 or 1920 x 1080; phone-width window (about 390 px) ready for the CHW part.
- [ ] WebGL available (the map needs it). If the map cannot draw, the page shows a notice and the table below it carries the same information.
- [ ] Notifications off, bookmarks bar hidden, other tabs closed, developer tools closed.

## 3. Synthetic data confirmation

- [ ] Landing page `/` shows the **NTD-WATCH DEMO MODE** banner and the disclaimer.
- [ ] The landing page has no reset button. Choose any role first (for example **Open as Super Administrator**); the banner then shows **Reset demo** and **Exit demo**. Press **Reset demo**, then **Yes, reset** ("Reset all demo records, queue and views to the start?"). The synthetic data is re-created from the time of the reset, so reset again on the day you record.
- [ ] Programme pages carry the synthetic/demonstration notice (confirm on screen); the women-and-girls priority section and the GIS page show **DEMONSTRATION DATA**.
- [ ] Say "synthetic" and "demonstration" out loud in the first sentence.

## 4. Consent and decline path (CHW app)

- [ ] **Open the CHW app**, PIN `1234` (any 4-digit PIN works in the demo; it is not security).
- [ ] On the dashboard use **Women and girls: community assessment**. The larger first button, **Start new assessment**, opens the general NTD assessment, which uses a different rule set and can return HIGH or URGENT. Do not use it, and do not follow `docs/stage7/DEMO_SCRIPT.md` for this demo, because that script runs the general flow. A general-flow result is not evidence of the women-and-girls workflow.
- [ ] Dashboard, **Women and girls: community assessment** (`/chw/fgs`), **Start**.
- [ ] Consent screen "Her permission" (`/chw/fgs/consent`) shows the demonstration-wording line.
- [ ] Decline path: choose **No, she does not agree** to reach `/chw/fgs/declined` ("No answers or details about her were saved."). Start again for the main run.
- [ ] Use only made-up answers.

## 5. Non-diagnostic result

- [ ] Complete the steps (age range 18 to 49, water contact, one signal, two support questions) and **Save and see guidance**.
- [ ] Result "Guidance for this case" shows the signal category, "Rule status: DEMO. Clinical validation pending.", the "not a diagnosis and not a clinical severity" line and the clinical-content placeholder notice.
- [ ] Do **not** read the category as a finding. Say "signal category, not a diagnosis".
- [ ] The result badge reads **Synced** and the top banner reads **Everything is synced**. If either reads **Rejected by server** or **waiting**, stop and use section 10.

## 6. Referral and follow-up

- [ ] **Generate referral** (`/chw/assessments/<key>/referral`). Point at the "invented for the demonstration" facility notice.
- [ ] Optional (adds about 90 seconds, not in the two-minute script): switch role to **Health Facility Worker**, open the referral in the inbox (`/programme/inbox`), move it through the stages one at a time; switch back to the CHW, **Referrals**, **Refresh status**, record a follow-up. Facility capabilities are synthetic.
- [ ] The CHW referral screen also has a labelled demonstration shortcut; avoid it when speaking to a technical reviewer.

## 7. Programme dashboard

- [ ] Role selector: **Super Administrator** (sees every community; the LGA and State officers see only their scope).
- [ ] **Priority communities** (`/programme/priority`): the "Community programme priority" section is at the top, followed by the earlier signal-by-vulnerability matrix.
- [ ] Point at: programme priority, data confidence meter (with a word), observation range ("Fewer than 5"), the suppression notice.
- [ ] Click **Why this priority** on one community and read the sentence aloud.
- [ ] Expected shape of the synthetic data, as observed in a browser on 28 October 2026 after a reset (the same after a second reset, and unchanged after one made-up case with a referral), Super Administrator, default filters: three communities at "High priority for programme attention" with High confidence (Demo Palmgrove, Demo Riverside, Demo Streamside); two at "Priority for review" (Demo Reedbed, Demo Wadi Bend); two at "Monitor" (Demo Hillview, Demo Marketfield); two at "Low priority" with Medium confidence (Demo Baobab Flats, Demo Greenbelt); six at "More information needed". The mix depends on the date: a test run on 27 October, with a fixed test clock, gave Demo Marketfield at "Priority for review" and Demo Greenbelt at "Monitor" with Low confidence. Confirm on screen on the day, name only what the screen shows, and do not promise exact figures. The women-and-girls referral total should still read "Not shown (fewer than 5)"; reset if it does not.

## 8. GIS priority mode and confidence cues

- [ ] **GIS map** (`/programme/gis`): **DEMONSTRATION DATA** banner and the fictional-geography notice are visible.
- [ ] Choose **Programme priority** under "Colour communities by". The legend appears with "Fainter colour means lower data confidence. Grey means more information is needed."
- [ ] Show that a lower-confidence community is fainter than the High-confidence ones (on 28 October, Demo Baobab Flats and Demo Greenbelt at Medium confidence; use a Low-confidence community if one appears on the day), that communities needing more information are grey, and that the table under the map lists priority and confidence for every community.
- [ ] Say: fictional boundaries, no household locations, not disease distribution.

## 9. Privacy warnings and known limitations to state

- [ ] Programme screens show community aggregates only. Priority rows show observation ranges, not counts; exact counts are used in the calculation but not published in those rows. The separate women-and-girls aggregate can show counts at or above 5, and the Priority page shows a women-and-girls referral total once it reaches 5. Small numbers below 5 are suppressed.
- [ ] Deletion is simulated: it removes the record from the device, the mock server and the aggregates, and is not a production deletion process (no backups, logs, replicas or exports are covered).
- [ ] Suppression is a **prototype pattern** that does not prevent every differencing attack and needs specialist review.
- [ ] The server is a **mock**; sign-in and roles are simulated; the privacy tests do not prove production-server security.
- [ ] FGS content and rules are placeholders awaiting clinical review; nothing is validated, field tested or endorsed.
- [ ] Observations are not a representative sample; priority is not severity or prevalence.

## 10. Recovery steps

| Problem                                                                | Do this                                                                                                                                                                                   |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Numbers or pages look wrong                                            | **Reset demo**, **Yes, reset**.                                                                                                                                                           |
| Blank page after a restart                                             | Reload normally (F5 or the reload button). Do not use Ctrl+Shift+R, which bypasses the browser's mock service worker. If still blank, stop and rerun `npm run demo`.                      |
| Port 4173 busy                                                         | Stop the other process or note the port the command prints.                                                                                                                               |
| Map blank or missing                                                   | Use the table below the map; the page shows a notice when WebGL is unavailable.                                                                                                           |
| A save shows "Rejected by server" (see Profile, Synchronisation queue) | Stop and do not press Retry. Reload normally, press **Reset demo**, and repeat the assessment. Check that it reads **Synced** before continuing. Never use a rejected record as evidence. |
| Women-and-girls draft stuck                                            | The start screen says "An assessment is already in progress"; continue it, or **Reset demo**.                                                                                             |
| Everything fails                                                       | Open the same address in a private window (clean storage), or use the screenshots from `SCREENSHOT_STORYBOARD.md` captured earlier. Do not improvise with real data.                      |

## 11. Final checks before sharing the screen

- [ ] No secrets, tokens, `.env` files, terminal history or password managers visible.
- [ ] No personal records or real names on screen. The only person in the demo is the synthetic CHW 0142 (Demo Riverside); do not show your own email or account.
- [ ] Do not open `docs/` files that name individuals (for example the provenance record) on a shared screen.
- [ ] The two Word proposal documents in the repository root are not open or shown.
- [ ] Case codes shown (format `PC-XXXX-XXXX`) belong to made-up answers.

## 12. Honest scope reminder

Tested mock-server behaviour (offline queue, sync, role refusal, suppression) is **not** production functionality. Do not say the product works offline "in the field", is secure, is compliant, or is validated.
