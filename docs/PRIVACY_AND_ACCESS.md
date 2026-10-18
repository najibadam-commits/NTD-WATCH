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
- Each role also has a simulated **data scope** (Facility: its facility; LGA: Demo Central LGA; State: Arewa Demo State; Admin: all). The mock server clamps every programme query to it. Not a security control either.

### Separation of person-level and aggregate data

- Person-level schemas (`assessment`, `referral`, `followUp`) are strict objects with no free text and no
  name, phone, address or national id. Tests reject those fields.
- Programme screens will read only the aggregate schema (`communityAggregateSchema`), which has no person
  fields. The mock API implements no endpoint that returns person-level records to a programme role.
- CHWs see the records they captured; the assessment code is not an identity.

## Programme views (Stage 3)

- Programme endpoints return aggregates only. A test checks that no response contains a client key, a referral id or age/sex fields.
- Selecting a community shows its aggregate summary. The CHW role gets 403 on every programme route; a facility role may call only referral monitoring, scoped to referrals sent to its own facility.
- **No small-cell suppression.** With 15 communities and a synthetic seed, counts can be very small. A real system needs a disclosure-control policy (minimum counts, suppression, rounding) before any aggregate leaves a secure environment.
- Exports are labelled synthetic in the file name, a header and footer notice, and a `data_status` column on every row. Spreadsheet formula characters are neutralised.
- User management and the audit log are simulated and live in the mock server's database only.
