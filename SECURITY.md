# Security policy

NTD-WATCH is a **demonstration prototype** that uses synthetic data only. It has no production backend, no real authentication and no real patient data. Sign-in, roles and permissions in the prototype are simulated and are not security controls (see `docs/PRIVACY_AND_ACCESS.md`). Reports are still welcome: they help us fix the code, and they matter more if the project is ever extended towards real data.

## Supported versions

Only the default branch of this repository receives security fixes. The default branch is currently `feat/fgs-femtech-prep`; the intention is for `main` to be the single supported branch once it exists, and this file will be updated then. Older commits, tags and forks are not supported.

## Reporting a vulnerability

Please report privately. Do **not** open a public issue or pull request for a suspected vulnerability.

- Email: **najibadam911@gmail.com**
- Subject line: `NTD-WATCH security report`
- Include: what you found, the affected file or screen, steps to reproduce, and the commit you tested. Do not include real personal or health data in a report.

## What to expect

- **Acknowledgement within 48 hours** of receipt.
- A first assessment (accepted, needs more information, or out of scope) after the acknowledgement.
- Credit in the fix notes if you want it, and no credit if you prefer to stay anonymous.

This is a small, volunteer-run project: the 48-hour commitment is for acknowledgement, not for a completed fix. We will give you an honest estimate once the report has been assessed.

## Scope

In scope: the code in this repository, including its build and test tooling and the container files.

Out of scope: findings that only restate documented prototype limits (for example, that the simulated role switch can be changed in the browser, that the mock API runs in the browser, or that exports are visible to the person who downloads them), and issues in third-party dependencies that should be reported upstream. If you are unsure, send the report anyway.
