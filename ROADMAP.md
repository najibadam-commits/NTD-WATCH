# NTD-WATCH 12-month technical roadmap

**Status: planned direction, not a commitment.** NTD-WATCH is a demonstration prototype with synthetic data only. Nothing below is implemented, funded, approved or validated unless a later commit says so. Quarters count from the start of the funded work (Q1 is months 1 to 3), not from calendar dates.

Each quarter is limited by the project's own gates (`docs/PILOT_GATES.md`), the open decisions in `docs/STAGE5_DECISION_REGISTER.md`, and the safety scope in `docs/SAFETY_AND_SCOPE.md`: no diagnosis, no prescribing, no outbreak declaration, and no real data until ethics, data-protection and clinical review are recorded.

## Q1 (months 1 to 3): epidemiological matrix hardening, FGS screening protocols and GIS layer standardisation

- Review the signal-by-vulnerability matrix and its rules with qualified public-health reviewers, and replace demonstration placeholders only through the process in `docs/RULE_GOVERNANCE.md`.
- Agree the women-and-girls (FGS) screening protocol wording and referral pathway with clinical and gender-safeguarding reviewers (`docs/FGS_PROTOTYPE.md`, `docs/CLINICAL_VALIDATION_PLAN.md`). Wording stays non-diagnostic until they approve it.
- Standardise GIS layers: a documented schema for administrative boundaries, facilities and communities, and a decision on real boundary sources (`docs/GIS_PRODUCTION_ARCHITECTURE.md`). The current map uses fictional geography.
- Close known privacy and disclosure gaps, starting with the unresolved items listed in `docs/SMALL_COUNT_POLICY.md` (for example differencing across queries), and commission an independent privacy review.
- Add a test for the server-side reset path, which currently has none.

**Exit evidence:** reviewed and recorded rule and protocol versions; a published GIS layer standard; a privacy review report.

## Q2 (months 4 to 6): edge and mobile packaging for field health officers

- Make the web app installable and loadable offline (web app manifest and app-shell caching, which do not exist yet), package it for low-end Android devices, and measure it on real phones.
- Harden the offline-first capture and synchronisation layer (`docs/OFFLINE_SYNC_ARCHITECTURE.md`): encrypted on-device storage, conflict handling, and recovery from lost connectivity or server data loss.
- Replace the in-browser mock API with a real, minimal server behind real authentication and server-side permission checks (`docs/PRODUCTION_RBAC.md`). Until this exists, roles remain simulated.
- Usability and accessibility testing with field health officers using synthetic scenarios, including manual screen-reader checks.

**Exit evidence:** offline behaviour measured on target devices; server-side authorisation tests; usability findings recorded.

## Q3 (months 7 to 9): observational field pilot in 10 districts with state epidemiological surveillance teams

- Run only if the relevant gates in `docs/PILOT_GATES.md` have been passed and signed: ethics determination, data-protection arrangements, clinical sign-off of the rules and content in use, and agreement with the state teams.
- Observational design: the system supports triage and referral prompts alongside existing procedures. It does not replace clinical judgement or any national system.
- Pre-register what will be measured (usability, data completeness, referral completion, false-prompt feedback) before starting. No success thresholds are set in this document; the pilot owner sets and records them first (`docs/PILOT_BLUEPRINT.md`).
- Report results, including negative results and problems, openly.

**Exit evidence:** a pilot report with methods, limits and the stop or continue decision.

## Q4 (months 10 to 12): DHIS2 interoperability and DPGA registry submission

- Design and test an explicit, versioned mapping from NTD-WATCH aggregates to DHIS2 aggregate data elements and organisation units, approved by DHIS2 administrators, with no guessed mappings (`docs/INTEROPERABILITY.md`). Align indicators with WHO NTD reporting only where the programme confirms the definitions.
- Publish an integration specification and a reference export, tested against a DHIS2 test instance.
- Complete the Digital Public Goods self-assessment honestly against all nine indicators (see the README), close the gaps found, and submit to the DPGA registry only if the criteria are met.

**Exit evidence:** a tested DHIS2 mapping; a completed self-assessment; a registry submission or a documented list of what blocks it.

## Always

- Keep the project open under the Apache License 2.0 and keep documentation in step with the code.
- Treat security reports as described in `SECURITY.md`.
- Revisit this roadmap each quarter and record changes, including items dropped.
