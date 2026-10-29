# Contributing to NTD-WATCH

Thank you for helping. NTD-WATCH is a **prototype with synthetic data only**. Please read `README.md` and `docs/SAFETY_AND_SCOPE.md` before you start, and follow the [Code of Conduct](CODE_OF_CONDUCT.md). Security issues go to the private channel in [SECURITY.md](SECURITY.md), not to public issues.

## Ground rules

- **No real data.** Never commit, paste or attach real patient, community, facility or programme data, names, phone numbers, coordinates of real households, credentials or `.env` files. Use the synthetic data in `packages/demo-data` and `packages/programme`.
- **No clinical claims.** The prototype supports early recognition, triage, referral and programme decisions. It does not diagnose, prescribe or declare outbreaks. User-facing text must not name conditions or treatments; tests in `apps/web/src/safety.test.ts` and the FGS content tests enforce this.
- **Rules and content are placeholders** until qualified public-health and clinical reviewers approve them (`docs/RULE_GOVERNANCE.md`). Do not present them as validated.
- **Disclosure rules stay on.** Do not weaken the small-count display rule (`docs/SMALL_COUNT_POLICY.md`), and do not add an export or view that bypasses it.

## Branch naming

Branch from the default branch and use one of these prefixes, then a short kebab-case description:

| Prefix           | Use for                                                                            | Example                             |
| ---------------- | ---------------------------------------------------------------------------------- | ----------------------------------- |
| `feature/`       | New behaviour, screens, rules or documents                                         | `feature/facility-inbox-filters`    |
| `fix/`           | Bug fixes and regression tests                                                     | `fix/reset-sync-race`               |
| `data-pipeline/` | Synthetic data generation, aggregation, GIS layers, exports and integration design | `data-pipeline/dhis2-mapping-draft` |

Existing long-lived branches (for example `feat/fgs-femtech-prep`) predate this convention and are not renamed.

## Set up

Requirements: Node.js 20.19 or newer (`.nvmrc` pins 22) and npm 10 or newer.

```bash
npm install
npm run dev        # http://localhost:5173
```

## Testing requirements

Every pull request must pass, from the repository root:

```bash
npm run check      # typecheck, lint, format:check, unit tests, build
```

In addition:

- **Add or update tests** for any change to behaviour. Rules, aggregation, offline sync and the mock API each have unit tests next to the code (`*.test.ts` and `*.test.tsx`).
- **Run the browser tests** (`npx playwright install chromium` once, then `npm run test:e2e`) when you change a screen, route, map, export, accessibility behaviour or anything in the offline layer. Set `CHROMIUM_PATH` to use an installed Chromium.
- **Report what you ran.** In the pull request, paste the commands and results. Do not write "tests pass" for something you did not run. If a test fails or is intermittent, say so and keep the output; do not hide or retry it away.
- Do not weaken, skip or delete an existing test to make a change pass. If a test is wrong, explain why in the pull request.
- Run `npm run format` before committing; CI-style checks use `prettier --check`.

## Pull request guidelines

1. Keep each pull request to one purpose and a reviewable size. Separate refactoring from behaviour changes.
2. Use a clear title in conventional style (`feat:`, `fix:`, `docs:`, `test:`, `chore:`) and describe **what changed, why, and how you checked it**.
3. Link the issue or the document the change follows (for example a decision in `docs/STAGE5_DECISION_REGISTER.md`).
4. Update the documentation in the same pull request when behaviour, scope or claims change. Documents must not claim more than the code and tests show, and each claim should keep its limits (synthetic, prototype, not validated, not a security control).
5. Do not commit build output, logs, `node_modules`, test results or secrets (see `.gitignore`).
6. Be ready to answer review comments. A maintainer must approve before merge. Do not force-push over reviewed commits without telling the reviewer.

## Reporting problems

Open an issue for bugs and ideas. Include the commit, your Node and browser versions, and steps to reproduce, using synthetic data only.

## Licence

By contributing you agree that your contribution is licensed under the [Apache License 2.0](LICENSE), the same as the project.
