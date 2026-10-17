# Privacy and access (intended design)

- Minimum necessary data: person-level schemas reject name, phone, address and national ID fields (tested).
- Person-level data: visible to the CHW (own records) and facility workers (relevant referrals) only.
- Programme roles (LGA, State) see aggregates only.
- Administrators manage users and settings; whether they should also see programme intelligence is an open question (see DECISIONS.md).
- In this prototype, roles and permissions are simulated in the browser. They are **not** security controls. A production system needs server-side authentication, authorisation, audit logging and a data-protection review.

## Permission matrix (simulated in this milestone)

`Y` = permission held. Person-level permissions are in the first block; no programme role holds one.

| Permission                                                                    | CHW | Facility | LGA | State | Admin |
| ----------------------------------------------------------------------------- | :-: | :------: | :-: | :---: | :---: |
| `assessment:create`, `assessment:view_own`                                    |  Y  |          |     |       |       |
| `referral:initiate`, `followup:perform`                                       |  Y  |          |     |       |       |
| `referral:view_relevant`, `referral:update_status`, `referral:record_outcome` |     |    Y     |     |       |       |
| `programme:view_lga`                                                          |     |          |  Y  |       |       |
| `programme:view_state`                                                        |     |          |     |   Y   |   Y   |
| `programme:monitor_referrals`                                                 |     |          |  Y  |   Y   |   Y   |
| `reports:generate`                                                            |     |          |  Y  |   Y   |   Y   |
| `users:manage`, `config:manage`, `rules:manage`                               |     |          |     |       |   Y   |

### What is simulated

- The role is chosen on the landing page or sign-in screen and kept in `sessionStorage`.
- Page hiding, route guards and the mock API's `X-Demo-Role` check all run in the browser against that
  choice. Anyone can change it. **None of this is a security control.**
- The Super Administrator's pages for programme intelligence, users and settings are navigable, but their
  content is built in Stage 3 and still shows as "Not built yet".

### Separation of person-level and aggregate data

- Person-level schemas (`assessment`, `referral`, `followUp`) are strict objects with no free text and no
  name, phone, address or national id. Tests reject those fields.
- Programme screens will read only the aggregate schema (`communityAggregateSchema`), which has no person
  fields. The mock API implements no endpoint that returns person-level records to a programme role.
- CHWs see the records they captured; the assessment code is not an identity.
