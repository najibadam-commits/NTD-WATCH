# Decisions

Approved:

1. Stack: React, Vite, TypeScript, CSS variables/CSS Modules, TanStack Query, Zustand, Zod, Vitest, Testing Library, Playwright.
2. Original prototype preserved unchanged in `prototype/`.
3. Mock API only; no production backend or database.
4. Offline: IndexedDB queue and mock sync with tests (refresh, offline capture, reconnection, duplicates, sync failures), labelled prototype functionality.
5. Authentication: demo-only login and role switching, labelled as simulated.
6. GIS: MapLibre with clearly labelled fictional demo geography.
7. Local environment checks and local Git only; no publishing or deployment.
8. English first with i18n scaffolding.

Stage 3 decisions (approved by the project owner):

9. Geography: a consistent fictional Nigerian-style hierarchy (states, LGAs, wards, communities, facilities), all named "Demo". No real boundaries. Every map and dataset is labelled synthetic.
10. Referral ids are `NTDW-YYYY-<uuid>`. The old six-digit form stays valid, so existing records and relationships keep working. A uniqueness test covers 120,000 ids. **Production identifiers need backend design** (server-issued ids, collision handling, no client-side guessing). The client-derived id here exists so offline retries stay idempotent.
11. 11 synthetic CHWs across 5 LGAs. Five communities deliberately have no CHW, to show coverage gaps.
12. Route-level modules instead of a rewrite: lazy routes, a new `programme` package, mock handlers split by concern. Existing UI and flows are unchanged.

Stage 3 design choices:

- Scope travels in a header, and the mock server clamps filters to it, so a narrower role cannot widen its view by asking.
- Referral monitoring is aggregate only (stages, ageing, facility and LGA tables). No endpoint returns a person or a single referral to a programme role.
- The map has no base map, so nothing on it can be mistaken for a real place. It needs WebGL; a table gives the same information.
- MapLibre 6.14 (not 5.x) because of a published sanitiser advisory in 5.x.
- Percent changes against the previous period are shown only when the previous period holds at least half as much data; otherwise the page says there is nothing to compare.
- The vulnerability index (mean of four WASH indicator rates) and its bands (30 and 45) are demonstration thresholds, not validated measures.

Open:

- Should the Super Administrator see programme intelligence? Currently yes.
- Stage 4 scope (not started).
