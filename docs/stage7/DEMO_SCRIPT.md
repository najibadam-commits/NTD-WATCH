# Demo script

Say "demonstration" and "synthetic" out loud early. Frame everything as a **prototype that tests a hypothesis**, not a product.

## Opening line (both versions)

"This is NTD-WATCH, a functional prototype. Everything you will see is synthetic data and simulated roles. It shows one idea: connecting a community concern to a tracked action, and showing programme users where attention may be needed. It does not diagnose, and we have not yet shown that it is needed. That is what the next phase would test."

## Part 1. Five-minute executive demo

Reset first (banner, **Reset demo**, **Yes, reset**). Open the app on the landing page. Keep a phone-width window ready for the CHW part (or just narrow the browser).

| Time | Step                                 | Do                                                                                                                                                                                                                                                                      | Say                                                                                                                                                                                                                                                         |
| ---- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0:00 | **1. Problem** (30 s)                | Landing page. Point at the banner                                                                                                                                                                                                                                       | "When a community health worker notices something, what happens next is often unclear: was it referred, did the person arrive, did anyone follow up, and where should a programme look first? This prototype tests that question. Everything is synthetic." |
| 0:30 | **2. Community** (60 s)              | Open the CHW app, PIN 1234, New assessment. Age group 5 to 14, Female. Symptom: swelling of an arm or leg, 1 to 3 months, not getting worse. Open-water contact Yes, other exposure No. Water protected, latrine used, handwashing Yes, no standing water. Review, Save | "A worker records symptoms and the household's water and sanitation. It works with no signal."                                                                                                                                                              |
| 1:30 | **3. Risk signal** (30 s)            | Result screen. Point at the reason line                                                                                                                                                                                                                                 | "A non-diagnostic signal with its reasons. The rules are illustrative, not clinically validated. It supports a decision. It never diagnoses."                                                                                                               |
| 2:00 | **4. Referral** (30 s)               | Generate referral, choose Demo North Primary Health Centre                                                                                                                                                                                                              | "The recommended action becomes a tracked referral."                                                                                                                                                                                                        |
| 2:30 | **5. Facility** (60 s)               | Banner role selector: Health Facility Worker. Open the new referral. Accept, Arrived, then choose the outcome "Follow-up in the community needed" and record it                                                                                                         | "The facility sees only its own referrals and records a synthetic outcome. The hand-off is closed, not lost."                                                                                                                                               |
| 3:30 | **6. Follow-up** (30 s)              | Role: Community Health Worker, Referrals, open the referral, Refresh status, Record a follow-up, Save                                                                                                                                                                   | "The outcome returns to the community worker, who records the follow-up."                                                                                                                                                                                   |
| 4:00 | **7. Programme intelligence** (90 s) | Role: State Programme Manager. Priority communities: point at the matrix, click **Details** on Demo Streamside. Then GIS: signal layer and vulnerability layer                                                                                                          | "Two layers: signal and vulnerability. Streamside is high on both, rising, with follow-up still open: a prompt for a person to decide where to look first, never an outbreak finding. The map uses fictional points."                                       |

**Closing statement (read it):**

> "NTD-WATCH is a functional prototype demonstrating a proposed community-to-action workflow. Today's demonstration uses synthetic data and illustrative rules. The purpose is to demonstrate the concept and gather feedback before formal stakeholder validation and pilot design."

## Part 2. Ten to fifteen minute full demo

Follow Part 1, then add the following in order.

1. **Offline (2 min).** CHW **Profile**, switch on "Simulate being offline". Create an assessment; the status reads "Waiting to sync". Reload the page to show the record survived. Switch the simulation off or reload; it syncs and shows "Synced". Optionally switch on "Simulate server outage" to show "Sync failed, will retry" and press **Sync now**. Say: "Real device storage and retry, against a mock server."
2. **CHW follow-up (1 min).** Open the referral, **Refresh status**; the facility outcome appears. **Record a follow-up** (person reached, attended, condition, further referral).
3. **Programme overview (1 min).** Overview figures: assessments, signals, referrals, **Follow-ups due**, coverage. Say: "One shared calculation feeds every page, so the numbers cannot contradict each other."
4. **GIS (1.5 min).** Signal layer and vulnerability layer toggles; select a community; open the panel. Say: "Fictional points, no boundaries."
5. **Scenarios B and C (1.5 min).** On Priority communities, select "Investigate an unusual signal" (Marketfield) and "Prevention or active surveillance opportunity" (Hillview). Say: "A high signal without vulnerability is a reason to look, not to assume. High vulnerability with no signal is a prevention opportunity."
6. **Referral monitoring and Reports (1 min).** Stage funnel, ageing, completion. Export a CSV from Priority communities or build a report.
7. **Administrator (2 min).** Super Administrator: **Settings**, "Rule governance register" (every rule is a placeholder with no source, owner or validation) and "What is real, simulated or future". **Users** shows role and scope changes with an audit trail.
8. **Reset (30 s).** Banner, **Reset demo**, **Yes, reset**. Say: "Back to the start, ready for the next audience."

## Questions you should expect, and honest answers

- **"Is this validated?"** No. The rules are placeholders. Clinical validation is a later, separate step with experts.
- **"Does it replace DHIS2 or our current reporting?"** No, and we do not know yet whether it should exist alongside, inside or instead of anything. That is the Stage 6 evidence question.
- **"Is the data real?"** No. All synthetic.
- **"Can it detect an outbreak?"** No. It shows where a human may want to look first.
- **"What would a pilot test?"** Whether the post-signal gap is real, whether workers use it, and whether the closed loop changes follow-up. See `docs/stage6`.

## Do not say

"Diagnoses", "detects outbreaks", "validated", "production-ready", "official", "replaces". If asked, say what is true and point to `PRODUCT_BOUNDARIES.md`.
