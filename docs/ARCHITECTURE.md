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

## Stage 2 additions

- **Rules engine** (`packages/rules-engine`): rule sets are validated data, evaluated by a pure function. See `docs/RULES.md`.
- **Offline layer** (`apps/web/src/offline`): IndexedDB store with an outbox, a single-flight sync loop, back-off retries and idempotency keys. See `docs/OFFLINE_AND_MOCK_API.md`.
- **Mock API** (`apps/web/src/mock`): MSW handlers implementing the contract in `packages/api-contract`, backed by a separate IndexedDB database. It runs in a service worker in the browser and in Node for tests.
- **CHW app** (`apps/web/src/chw`): the assessment draft lives in a persisted Zustand store; saved records are read live from IndexedDB; referral status is refreshed through TanStack Query.
- **Design system**: form components (`ChoiceGroup`, `ErrorSummary`, `StepProgress`) and `buttonClass` for link-buttons.

## Stage 3 additions

- **`packages/programme`**: pure functions. `generateSeed` builds deterministic synthetic records (risk levels come from the real demo rules engine); `summarise`, `communityDetail` and `monitorReferrals` aggregate them; `buildReport` and `toCsv` build exports.
- **Data flow**: CHW app -> outbox -> mock API (server database) -> programme handlers load seed plus live records, clamp the filters to the caller's scope, aggregate, and return aggregates only -> TanStack Query -> pages. A `BroadcastChannel` (`ntd-watch-data`) tells other tabs to refetch after a sync or a facility update.
- **Scope**: `X-Demo-Scope` (`all`, `state:<id>`, `lga:<id>`, `facility:<id>`). Each role may use only some kinds; a filter outside scope is dropped and the response says `clamped`.
- **Geography**: `packages/demo-data/src/geography.ts` generates GeoJSON from a jittered lattice near (0,0). The map draws no base map and no text from tiles. Names and signal counts are DOM markers, so they are keyboard-reachable buttons.
- **Route modules**: React Router `lazy` per route. The CHW screens form one chunk, each programme page its own, and MapLibre (about 1 MB) loads only on the GIS page. The mock server is imported dynamically.
- **Charts**: small hand-built SVG/HTML components with legends, symbols as well as colour, and a "Data table" alternative.
