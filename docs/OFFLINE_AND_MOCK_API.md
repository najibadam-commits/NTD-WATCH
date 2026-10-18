# Mock API, offline capture and synchronisation

> **Prototype functionality. Not production-ready offline operation.**
> There is no production backend. Authentication, API operations and synchronisation are all
> simulated, and the interface says so.

## What exists

| Part         | Where                                  | What it is                                                                                                                                                                     |
| ------------ | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Device store | `apps/web/src/offline/localDb.ts`      | IndexedDB (Dexie): the CHW's assessments, referrals, follow-ups and an **outbox** of changes waiting to be sent                                                                |
| Mock server  | `apps/web/src/mock/`                   | MSW handlers answering `/api/v1/...`. Runs in the browser through a service worker (and in Node for tests). Its data is a second IndexedDB database, standing in for a backend |
| Contract     | `packages/api-contract`                | Routes and the permission each needs                                                                                                                                           |
| Sync         | `apps/web/src/offline/sync.ts`         | Sends the outbox oldest first, with retries                                                                                                                                    |
| Connectivity | `apps/web/src/offline/connectivity.ts` | Browser online/offline events plus a deliberate "simulate offline" switch                                                                                                      |

## Behaviour

- **Save first.** A record and its outbox entry are written in one IndexedDB transaction.
- **Idempotency.** Every record has a client key. The outbox entry is keyed by kind and client key,
  so saving twice queues once. The request carries `Idempotency-Key`; the mock server answers a
  repeated key with the existing record (`200`, `duplicate: true`) instead of creating another.
  Referral ids are derived deterministically from the assessment key, so the device and the
  server always agree.
- **Ordering.** A referral or follow-up waits until its assessment has synced. The mock server
  also refuses it with `409 PARENT_MISSING` if it arrives early, which the device treats as retryable.
- **Failure handling.** Network errors, `5xx`, `408`, `429` and `PARENT_MISSING` mark the item
  `failed` and schedule a retry with back-off (2 s, 4 s, 8 s, up to 60 s). Other `4xx` responses
  (for example `422` validation) mark it `rejected`: it is not retried and the CHW can see why.
- **Lost responses.** If the server stored a record but the response never arrived, the retry is
  answered as a duplicate and the item becomes `synced` without creating a second record.
- **Refresh.** Everything is in IndexedDB. On start, items left "syncing" are returned to pending.
- **Single flight.** Concurrent sync requests share one run. A request made during a run triggers one
  more pass, so records saved in the meantime are picked up.
- **Reconnection.** Going online (browser event or the simulation switch) triggers an immediate sync.
  A 10 second timer lets back-off retries fire.

## Simulated permissions on the mock API

The mock reads an `X-Demo-Role` header and applies the same permission table as the interface.
This is **simulated**: the header is supplied by the client and anyone can change it. It exists to
show the intended rules, not to protect anything.

## What the tests cover (`offline.test.ts`, `workflow.test.tsx`)

Offline capture without network calls; delivery on reconnection; reload with queued and
interrupted items; double saves; simultaneous saves; simultaneous sync runs; lost responses;
server errors with back-off and recovery; a server outage over several attempts; manual retry;
validation rejection with no retry; dependency ordering; connection loss mid-run; role checks;
forward-only referral status; and the full journey through the interface in a simulated browser.

## What is not covered or not real

- Real device storage limits, eviction, a second tab writing at the same time, and a browser that
  clears site data.
- Conflict resolution between two devices (there is one device and one mock server).
- Background sync while the app is closed. Sync only runs while the CHW app is open.
- Encryption of data on the device.
- Any real network, authentication, rate limiting or server-side validation beyond the schemas.

## Stage 3 endpoints

| Route                                          | Roles that may call it                 | Returns                                            |
| ---------------------------------------------- | -------------------------------------- | -------------------------------------------------- |
| `GET /api/v1/intelligence/summary`             | LGA, State, Admin                      | KPIs, risk mix, communities, weekly series, stages |
| `GET /api/v1/intelligence/communities/:id`     | LGA, State, Admin (community in scope) | One community's aggregates                         |
| `GET /api/v1/intelligence/referrals`           | Facility, LGA, State, Admin            | Stage counts, ageing, facility and LGA tables      |
| `POST /api/v1/reports`                         | LGA, State, Admin                      | Audit entry for a generated report                 |
| `GET /api/v1/users`, `PATCH /api/v1/users/:id` | Admin                                  | Simulated user directory and audit log             |
| `GET/PATCH /api/v1/config`                     | Admin                                  | Unresolved-days setting, rule-set summary          |
| `POST /api/v1/demo/reset`                      | Admin                                  | Clears the mock server and regenerates the seed    |

Filters: `from`, `to` (UTC dates, inclusive) and optional `stateId`, `lgaId`, `wardId`, `communityId`.
Errors: 400 `BAD_FILTER`, 403 `FORBIDDEN` / `SCOPE_NOT_ALLOWED` / `OUT_OF_SCOPE`, 404, 409 `PROTECTED` / `REFERRAL_EXISTS`, 422 invalid body.

Programme views update only after a CHW record has **synced** to the mock server. The server's seed is fixed the first time it is used and stored with the mock database.
