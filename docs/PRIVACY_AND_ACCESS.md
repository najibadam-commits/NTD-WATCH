# Privacy and access (intended design)

- Minimum necessary data: person-level schemas reject name, phone, address and national ID fields (tested).
- Person-level data: visible to the CHW (own records) and facility workers (relevant referrals) only.
- Programme roles (LGA, State) see aggregates only.
- Administrators manage users and settings; whether they should also see programme intelligence is an open question (see DECISIONS.md).
- In this prototype, roles and permissions are simulated in the browser. They are **not** security controls. A production system needs server-side authentication, authorisation, audit logging and a data-protection review.
