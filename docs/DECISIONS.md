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

Open:

- Should the Super Administrator see programme intelligence? Currently yes (`programme:view_state`).
- Which fictional demo state/LGA structure to use for the GIS (Stage 3 proposal).
