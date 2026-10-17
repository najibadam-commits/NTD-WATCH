# Architecture

npm-workspaces monorepo; packages are consumed as TypeScript source (no per-package build step).

- **Rules are data, not code.** The rules engine will be a pure function over a rule set, so rules can be reviewed and replaced by clinical experts without touching the UI.
- **Person-level vs aggregate.** `assessmentSchema` and `referralSchema` are strict zod objects requiring `demo: true`. `communityAggregateSchema` has no person fields; dashboards and the map consume only aggregates.
- **Idempotency.** Assessments carry a `clientKey` so retried or offline-queued submissions cannot duplicate.
- **RBAC in the domain package.** Roles, permissions and page access are pure data and functions, tested, shared by UI and (later) the mock API. It is a simulated interface-shaping mechanism only.
- **Session.** Zustand store persisted to `sessionStorage`; no tokens, no credentials.
- **Design system.** CSS variables (light/dark), CSS Modules. Risk is always symbol + text, never colour alone. Fonts are self-hosted.
- **i18n.** `react-i18next`, English only, all UI strings in `locales/en.json`.
- **Routing.** `routes.tsx` exports route objects; the browser router is created in `main.tsx`, a memory router in tests.
