# Privacy and security architecture (proposed)

**Read this first.** This document designs a security and privacy model **before any real health information exists in the system**. It is not a statement that the system is secure or that it complies with any law. Nothing here has been reviewed by a lawyer, a data-protection specialist, a security assessor or an ethics committee.

Every control is tagged:

| Tag                       | Meaning                                                                       |
| ------------------------- | ----------------------------------------------------------------------------- |
| **Implemented**           | Exists in this repository as a prototype control, with tests                  |
| **Simulated**             | Present only to demonstrate; protects nothing                                 |
| **Proposed**              | Designed, not built                                                           |
| **Requires legal review** | A legal, ethics or privacy-specialist question that engineers must not settle |

## 1. Where the prototype stands

| Area                                     | State                                                                                                                                                                             |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Data minimisation                        | **Implemented.** Strict person-level schemas reject name, phone, address, national id and free text (tested). Age is a four-band value, location is a community only              |
| Person-level versus aggregate separation | **Implemented** as a code and API convention in a mock. Programme endpoints return aggregates only and a test checks the responses contain no client key, referral id, age or sex |
| Input validation                         | **Implemented** at the mock API with the shared zod schemas. Idempotency key must match the body                                                                                  |
| Labelling                                | **Implemented.** Every screen, export row and file name says synthetic, demonstration only, not clinically validated                                                              |
| Dependency hygiene                       | `npm audit` reports 0 vulnerabilities at the time of Stage 3. A MapLibre 5.x advisory was avoided by moving to 6.x. **No automated scanning**                                     |
| Secrets                                  | None exist. `.env` is git-ignored                                                                                                                                                 |
| Authentication, roles, scope, audit      | **Simulated.** Client-supplied headers, unchecked PIN, editable browser audit table                                                                                               |
| Encryption in transit or at rest         | **Not implemented.** The prototype has no network. Local IndexedDB is plain                                                                                                       |
| Anything else in this document           | **Proposed**                                                                                                                                                                      |

## 2. Threats that shape the design

| Threat                                       | Why it matters here                                                              | Main controls                                                                                     |
| -------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Lost or stolen CHW phone                     | Phones hold unsynced person-level records and a signed-in app                    | Local encryption, device binding, remote revocation, lock, minimal local retention                |
| Curious or over-privileged insider           | Health information about neighbours is tempting. Administrators have broad reach | Least privilege, no standing person-level access for programme roles, break-glass, audit of reads |
| Re-identification through aggregates         | Small communities and small counts can identify a person                         | Small-cell suppression, complementary suppression, export controls                                |
| Data leaving through exports and screenshots | Reports are shared on messaging apps                                             | Suppressed aggregates only, classification labels, watermarking, approval, link expiry            |
| Credential theft or phishing                 | Account takeover exposes records                                                 | MFA, phishing-resistant MFA for administrators, short sessions, device binding, anomaly alerts    |
| Abuse of the API                             | Enumeration, scraping, replay, mass assignment, injection                        | Authorisation per object, rate limits, strict validation, idempotency, unguessable ids            |
| Supply chain                                 | A web app has hundreds of dependencies                                           | Lockfile, scanning, SBOM, review of updates, CI with provenance                                   |
| Browser-origin compromise (XSS)              | Script in the app origin can read local data                                     | Strict CSP, no inline script, output encoding, dependency review                                  |
| Operational error                            | Wrong restore, wrong environment, real data in a demo                            | Separate environments, restore drills, no real data outside the pilot environment                 |
| Legal or ethical non-compliance              | Collecting health data without a basis and approvals                             | The review questions in section 13. **Requires legal review**                                     |

## 3. Encryption in transit (Proposed)

- TLS 1.2 or later everywhere, with TLS 1.3 preferred, HSTS, modern cipher suites only, and automated certificate renewal with expiry alerts.
- Every hop is encrypted: browser to gateway, gateway to services, services to database, jobs to storage. No plain HTTP internally in the pilot environment.
- Certificate pinning is not used for the web app. For a wrapped app, pinning is considered, with the operational cost of rotation weighed.
- Notification, SMS and email providers receive no health detail (`PRODUCTION_ARCHITECTURE.md` section 8).

## 4. Encryption at rest (Proposed)

| Place                    | Control                                                                                                                                         |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Database and volumes     | Full-disk or volume encryption with keys held in a key-management service, managed separately from the database administrators                  |
| Sensitive columns        | If decision D-12 chooses option C (identifiers), column-level application encryption with separate keys, so a database dump alone is not enough |
| Backups and exports      | Encrypted with different keys from the live data. Keys are escrowed under dual control                                                          |
| Object storage (exports) | Server-side encryption, private by default, short-lived signed links                                                                            |
| Device                   | Section 5                                                                                                                                       |
| Keys                     | Rotated on a schedule and on suspected compromise. A documented procedure exists for destroying a key to render data unrecoverable              |

## 5. On-device protection (Proposed)

The prototype stores plain records in IndexedDB. Browser storage is **not a vault**: any script running in the app's origin, and anyone with the unlocked phone, can read it. The design reduces exposure and is honest about its limits.

- **Application-level encryption** of record payloads with AES-GCM through the Web Crypto API. Index fields (ids, timestamps, status) stay clear enough to run the queue.
- **Key handling:** a random data key wrapped by a key derived from the user's unlock secret and, where the browser supports it, a device-bound secret (for example a passkey with a derived-secret extension). Keys are held as non-extractable `CryptoKey` objects while unlocked. They are cleared on lock.
- **Lock:** after a short idle period and on app background, the app locks. The unlock secret has limited attempts, with escalating delay, then a server-side lock.
- **Limits, stated plainly:** non-extractable keys stop copying the key out but not use of it by script in the origin. A rooted device, a malicious browser extension or a compromised origin defeats this. The controls are therefore a deterrent for casual theft and loss, not protection against a determined attacker. Whether this is good enough, or a native wrapper with hardware-backed storage is needed, is part of decision D-14 and is tested on real devices before the pilot.
- **Minimal residency:** only what offline work needs stays on the device. Synced records are removed after a grace period set by decision D-07. No device holds other CHWs' records.
- **No sensitive data in** URLs, `localStorage`, logs, crash reports or analytics. The prototype keeps the assessment draft in `sessionStorage`; production moves it into the encrypted store and clears it on sign-out.
- **Screens:** no person-level content in notifications or in the app-switcher preview where the platform allows.

## 6. Credential handling (Proposed)

No application-held passwords (identity provider). No secrets in source control, build output or client bundles. Server secrets in a secrets manager with rotation, injected at runtime. Separate credentials per environment and per service. Break-glass credentials sealed and monitored. Developer access to the pilot environment is exceptional, approved and logged, and developers never see real person-level data in the course of ordinary work.

## 7. Session management and token lifecycle (Proposed)

| Item           | Design                                                                                                                                                                        |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Access token   | Short-lived, audience-restricted, carries user, role, scope and device id. Never stored in `localStorage`                                                                     |
| Refresh token  | Rotating and single-use, bound to the device, revocable. Reuse of an old refresh token revokes the whole family and raises an alert                                           |
| Web sessions   | Secure, HttpOnly, SameSite cookies with CSRF protection, idle and absolute timeouts, re-authentication for sensitive actions (export, role change, break-glass)               |
| Revocation     | Immediate for access by a deny-list check at the gateway, and by expiry for tokens. Account disable and device revoke propagate within seconds                                |
| Concurrent use | Alert on the same account from two devices or distant networks at once                                                                                                        |
| Offline        | A signed offline grant lets a device work for a maximum period without contact (`PRODUCTION_RBAC.md` section 2). The server checks revocations the next time the device syncs |

## 8. Device registration, loss and theft (Proposed)

**Registration:** an administrator creates the device record, the CHW enrols it with a one-time code, the device generates a key pair and the server stores the public key. The server records model, app version and last contact. Unregistered devices cannot sync.

**If a phone is lost or stolen:**

1. The CHW or supervisor reports it. The administrator revokes the device. Revocation blocks sync and token refresh at once.
2. At the next contact (or when the app next opens online) the app is told to wipe its encrypted store and destroys its data key. Even if it never reconnects, the data is encrypted and locked behind the unlock secret.
3. The audit log records the report, the revocation, the last sync, and the wipe confirmation if received.
4. The CHW enrols a replacement device and signs in. Server-held records are re-pulled for the CHW's current scope (`OFFLINE_SYNC_ARCHITECTURE.md` section 11).
5. **Unsynced records on the lost phone are at risk of loss** (and the data on it at risk of exposure). Mitigations: frequent sync when online, a visible "waiting to sync" count, supervisor prompts for stale devices. Whether to allow a time-limited supervised recovery is decision D-25.
6. The incident is assessed against breach procedure (section 11). Whether it triggers a notification duty is **Requires legal review**.

Device policy (personal or programme-issued phones, mobile-device management, OS minimum versions) is decision D-25.

## 9. Access monitoring and least privilege (Proposed)

- Alerts on: repeated denials, access outside normal hours or geography, a facility user reading unusually many referrals, bulk or custom exports, role or scope changes, break-glass use, new device for an existing account, audit read by anyone, changes to suppression policy.
- Monthly access review by the Project Administrator and the owning manager. Quarterly review of privileged accounts by someone independent.
- Least privilege is structural: separate database roles, programme roles with no `ops` privilege, services with only the schema grants they need, no shared accounts, no standing production access for developers.

## 10. Data minimisation, retention and deletion

- **Minimisation (Implemented in the prototype, Proposed to preserve):** keep the strict schemas, bands instead of exact age, community instead of address, coded answers instead of free text, no GPS per assessment unless a decision adds it. Any new field needs a recorded purpose and review.
- **Retention (Proposed framework, Requires legal review for periods):** a schedule per dataset with a purpose, a clock and a disposal action (`DATA_ARCHITECTURE.md` section 11). No period is set here.
- **Deletion:** soft delete, then purge after the window. Backups expire on their own schedule and the lag is documented. Device copies are removed by wipe or after sync. A deletion log records what was deleted and when, never the content.
- **Data-subject requests:** a procedure for access, correction and objection that works despite the system holding no name. If identifiers are held (option C), the procedure and its identity check are designed with the Data Protection Officer. **Requires legal review.**

## 11. Backup security and recovery (Proposed)

Encrypted, automated, off-site backups of the database and object storage, with separate keys and separate administrator access. Point-in-time recovery for the database. Immutable (write-once) copies for the audit log. Restore tested in an isolated environment on a schedule, recording the time taken and the result. Recovery objectives are set from the pilot design, not here. Deletions are honoured in backups at expiry.

**Incident and breach response:** a written procedure with named roles, triage, containment, evidence preservation (audit and logs), assessment of harm, notification decisions, and review. Notification duties and deadlines under Nigerian law are **Requires legal review**.

## 12. Export controls, rate limiting, validation and abuse protection (Proposed)

| Control               | Design                                                                                                                                                                                                                                                                |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Exports               | Suppressed aggregates only. Classification label, watermark with requester and time, approval beyond standard reports, expiring link, audit event, no person-level export for programme roles (`PRODUCTION_ARCHITECTURE.md` section 11)                               |
| Rate limiting         | Per account, device, address and route, with stricter limits on sign-in, token refresh, exports and lookups by code. Numbers are set after load testing, not guessed here                                                                                             |
| Enumeration           | Unguessable UUID keys. Human codes carry a check character, are rate-limited and are useless without authorisation. Not found and not permitted look alike                                                                                                            |
| API validation        | The shared zod schemas, strict (unknown fields rejected, as in the prototype), maximum body and batch sizes, type and range checks, server-side recomputation of anything derived (risk level, aggregates), allow-lists for fields a role may set, no mass assignment |
| Injection and output  | Parameterised queries only. Spreadsheet-formula neutralisation on CSV, already implemented in `reports.ts` and tested                                                                                                                                                 |
| Replay and duplicates | Idempotency keys scoped to device, signed requests, timestamp window                                                                                                                                                                                                  |
| Abuse of sync         | Per-device batch limits, anomaly detection on volume, quarantine of a device that submits implausible data                                                                                                                                                            |
| Web hardening         | Strict Content Security Policy, no inline script, frame denial, referrer policy, subresource integrity for any third-party script, no third-party analytics in the app origin. **None of these is configured in the prototype**                                       |
| Software supply chain | Lockfile, automated dependency and licence scanning, software bill of materials, protected branches and reviews, build in CI with a clean environment, signed artefacts. **The repository has no CI today**                                                           |

## 13. Questions that must be answered before a Nigerian field pilot

All are **Requires legal review** or ethics or privacy-specialist input. They are questions, not findings. Primary legal texts must be read by qualified Nigerian counsel. A secondary summary of the 2025 implementation directive says it treats health care services and sensitive data as triggers for a data protection impact assessment, which is exactly why the pilot should plan one. That summary was not verified against the primary text.

**Legal basis and classification**

1. What data is personal data and what is sensitive personal data under the Nigeria Data Protection Act 2023 and the 2025 General Application and Implementation Directive, given that the prototype's records carry no name but could be re-identified in a small community?
2. What is the lawful basis for each processing purpose (consent, public interest, legitimate interest, vital interests), and who decides?
3. Is consent or notice required for a CHW assessment, in what form, in which languages, and what about children and people unable to consent (the prototype includes ages 0 to 4)?
4. Who is the data controller and who are processors (hosting, identity, SMS)? What contracts are needed?

**Registration, governance and impact**

5. Must the controller register with the Nigeria Data Protection Commission, and at what classification? Is a data protection officer required?
6. Is a data protection impact assessment mandatory, who performs it, and what must it cover?
7. What records of processing, retention schedule, breach procedure and data-subject request procedure are required, and what are the notification deadlines?

**Health-sector and ethics**

8. What does the National Health Act and any health-records rule require for confidentiality and sharing of health information? Do federal, state and facility policies add rules?
9. Is the pilot health research, programme implementation, or routine surveillance? That decides whether review by a registered health research ethics committee under the National Health Research Ethics Committee framework is required, and whether the state ministry of health must approve.
10. What permissions are needed from the Federal Ministry of Health, the NTD programme, the State Ministry of Health, LGA health authorities and facility managers, and from community leaders?

**Location, transfer and use**

11. May data be hosted outside Nigeria? What are the cross-border transfer rules and any government cloud or localisation expectations?
12. Which sharing is allowed with DHIS2 and other systems, in what form (aggregate only), and under what agreement?
13. What rules apply to a funder or partner receiving aggregates, and to publication of results?
14. How are lost-device exposures, unsynced data loss and device ownership (personal phones) treated in law and in employment terms?
15. Does the rule engine's output, shown to a CHW, make it a regulated medical device or clinical decision support under any Nigerian regulatory framework? The product is designed as a screening and referral prompt, not a diagnosis, and the question is for regulators and counsel.

## 14. Privacy by design checklist for each release (Proposed)

A new field, screen, export, integration or role change is not released until: its purpose is recorded, the data is minimal, the threat model section is updated, the audit events are defined, retention is set, tests for denial paths exist, and the privacy reviewer has signed off.
