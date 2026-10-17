# Safety and scope

- No diagnosis, no medication prescribing, no outbreak declaration.
- All risk classifications and recommendations are demonstration-only until reviewed and validated by qualified public-health and clinical experts.
- Risk signals are assessments, not confirmed cases.
- Synthetic data only. Do not enter real patient information.
- Geography (boundaries, facilities, hotspots) will be fictional and labelled; it does not represent real Nigerian geography.
- Offline queue (Stage 2) is prototype functionality, not production-ready offline operation.
- No external integrations, real authentication, or deployment are implemented or claimed.
- No secrets or credentials are stored; `.env*` is git-ignored.

## Added in Stage 2

- Every risk result, explanation and suggested action is shown with `DEMONSTRATION ONLY — NOT CLINICALLY VALIDATED`.
- The rules are data, documented in `docs/RULES.md`, and cannot contain diagnosis, prescribing or treatment wording.
- If symptom information is missing, no level is shown.
- Sign-in, roles, the mock API and synchronisation are labelled as simulated or prototype in the interface.
