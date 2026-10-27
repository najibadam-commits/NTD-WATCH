# Production authentication and role-based access control (proposed)

**Status: Proposed.** The prototype's roles, scopes and sign-in are **Simulated**: the role is a value in `sessionStorage`, the PIN is not checked, and the mock server trusts the `X-Demo-Role` and `X-Demo-Scope` headers. None of that is security and none of it carries into production.

What does carry over is the vocabulary: five roles, 14 named permissions, a clear split between person-level and aggregate permissions, and four scope kinds (`all`, `state`, `lga`, `facility`). This document extends that vocabulary and moves enforcement to the server.

## 1. Principles

1. **Least privilege, by purpose.** A role grants what its work needs and nothing else.
2. **Programme roles never hold person-level access.** The prototype tests this (`PERSON_LEVEL_PERMISSIONS`). Production keeps the rule and enforces it with database roles as well.
3. **Scope is part of the permission.** "Can view programme data" always means "within a geography".
4. **Elevated access is exceptional, approved, time-limited and visible.**
5. **No one approves their own access, and no one governs the rules by being an administrator.**
6. **Enforcement is server-side.** The interface hides what a role cannot use, as it does today, but the server decides.

## 2. Authentication design

| Topic                  | Proposed design                                                                                                                                                                                                                                                         |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Identity provider      | An OpenID Connect provider (decision D-02). Accounts are named individuals, never shared. No password handling in the application                                                                                                                                       |
| Factors                | CHWs: a strong password or PIN plus the registered device as a second factor. Facility, programme and administrative users: MFA required. Super Administrators and Project Administrators: phishing-resistant MFA (platform or hardware key)                            |
| PIN                    | A CHW PIN is a local unlock for the already-authenticated device, not a server credential. Limited attempts, then lockout and wipe-protection rules (`PRIVACY_SECURITY_ARCHITECTURE.md`)                                                                                |
| Sessions               | Short-lived access tokens, rotating refresh tokens bound to the device, server-side revocation. Programme web sessions have an idle and an absolute timeout                                                                                                             |
| Device binding         | A CHW device is registered by an administrator, receives a device id and a key pair, and requests are signed or bound to it. Unregistered devices cannot sync                                                                                                           |
| Account lifecycle      | Joiner (request, approval, activation, training record), mover (re-approval when role or geography changes), leaver (disable the same day, revoke devices, reassign records). Quarterly access review by the Project Administrator, countersigned by the owning manager |
| Offline authentication | A CHW can open the app and work offline after a recent online sign-in, within a maximum offline window set by policy. After it, the app locks until online re-authentication. Data stays encrypted                                                                      |

## 3. Roles

The first five exist in the prototype. Two are new and the split of the administrator is new. All additions are **decision D-16**.

| Production role               | Prototype role | Purpose                                                                                      | Geographic scope                     |
| ----------------------------- | -------------- | -------------------------------------------------------------------------------------------- | ------------------------------------ |
| Community Health Worker (CHW) | `chw`          | Assess, refer and follow up in assigned communities                                          | Own records, in assigned communities |
| CHW Supervisor (new)          | none           | Support and quality-assure a group of CHWs                                                   | The CHWs assigned to them            |
| Health Facility Worker        | `facility`     | Receive, accept and progress referrals addressed to the facility                             | One facility                         |
| LGA Programme Officer         | `lga`          | Monitor the LGA: signals, coverage, referral follow-through                                  | One LGA                              |
| State Programme Manager       | `state`        | Oversee the state programme and act on aggregates                                            | One state                            |
| Project Administrator (new)   | none           | Manage the pilot's users, devices, CHW assignments and data-quality fixes within the project | The project's geography              |
| Super Administrator           | `admin`        | Programme intelligence, user administration across the system, system oversight              | All, as aggregates                   |

Governance and oversight functions that are **not** application roles and are held by named people outside the operational app (`RULE_GOVERNANCE.md`): Rule Author, Clinical Reviewer, Public-Health Reviewer, Technical Validator, Rule Approval Board. A Data Protection Officer role has read access to the audit log and to data-subject request tools. An independent Auditor role (read-only on the audit log) is proposed so that audit review does not rest only on the people being audited.

## 4. What each role can do

`Own` means records the user created. `Scope` means the role's geography in section 3. "Aggregate" means `prog` views with small-cell suppression applied.

| Capability                          | CHW                                                 | Supervisor                           | Facility                                         | LGA                                 | State                                            | Project Admin                                    | Super Admin                             |
| ----------------------------------- | --------------------------------------------------- | ------------------------------------ | ------------------------------------------------ | ----------------------------------- | ------------------------------------------------ | ------------------------------------------------ | --------------------------------------- |
| **See person-level records**        | Own, and own communities (1)                        | No (2)                               | Referrals addressed to facility                  | No                                  | No                                               | No                                               | No (3)                                  |
| **See aggregates**                  | Own activity summary                                | Their CHWs' activity, quality        | Referral performance, own facility               | Scope                               | Scope                                            | Data quality, sync health, scope                 | All                                     |
| **Create**                          | Assessments, referrals, follow-ups                  | Support notes, correction requests   | Referral acceptance, arrival, assessment outcome | Reports                             | Reports                                          | Accounts, devices, CHW assignments               | Accounts, configuration                 |
| **Edit**                            | Own records before sync, then by correction request | Request corrections                  | Referral stage and outcome (forward only)        | None                                | None                                             | Account details, assignments                     | Accounts, configuration                 |
| **Approve**                         | None                                                | Corrections raised by their CHWs (4) | None                                             | None                                | Exports above standard (5)                       | New accounts and role changes within project (6) | Second approval for elevated grants (6) |
| **Export**                          | None                                                | None                                 | None                                             | Standard aggregate reports in scope | Standard aggregate reports, approvals for others | Operational reports (users, devices, sync)       | Aggregate reports, all scope (5)        |
| **Manage users and devices**        | No                                                  | No                                   | No                                               | No                                  | No                                               | Within project                                   | All                                     |
| **View audit log**                  | No                                                  | No                                   | No                                               | No                                  | No                                               | Own project, limited                             | Yes, itself audited                     |
| **Rule sets**                       | See result and reasons                              | Read                                 | Read                                             | Read                                | Read                                             | Read                                             | Read. **Cannot change or activate**     |
| **Break-glass person-level access** | No                                                  | No                                   | No                                               | No                                  | No                                               | No                                               | Request only (3)                        |

1. A CHW sees only records created through their own account and registered devices, and may be limited to their assigned communities after a reassignment. The prototype stores everything under one `chwId`.
2. A supervisor needs quality assurance. Options: aggregate-only (default), or a logged, reason-required view of a CHW's records for QA. **Decision D-16.** Nothing here grants it.
3. See section 5. The Super Administrator has no standing person-level access.
4. Corrections follow section 8 and `DATA_ARCHITECTURE.md` section 9.
5. "Standard" means a predefined report built from suppressed aggregates (the prototype's four report kinds). Anything else, such as a custom cut, a wider geography, or a share outside the programme, needs approval and is logged. **Decision D-24.**
6. Role grants follow the approval rules in section 6.

### Minimum fields for a facility worker

The facility sees what is needed to receive a referral and nothing else: referral code, community, referral time and risk level with its reasons, age group, sex, the reported symptoms and duration, and the stage history. WASH and exposure answers are excluded by default. The exact list is **a clinical and privacy decision** (D-10, D-08). The prototype's referral carries only level, facility and stages, so this is a new design.

## 5. The Super Administrator

The brief asks for programme intelligence, user administration and system oversight, with auditable elevated access. The prototype already gives this role aggregate programme views, users, settings and read-only rule information, and no person-level permission (`roles.ts`). Production keeps that and adds controls.

**What the role has as standing access**

- Programme intelligence for the whole system, as aggregates.
- User, role and device administration for the whole system.
- System oversight: health, sync and job status, configuration, reference-data release status, audit read.

**What the role does not have**

- Person-level records. Any need is met by break-glass (below), not by a permission.
- Authority to change, approve or activate a rule set. That sits with the Rule Approval Board. Today's `rules:manage` permission on `admin` is **removed** in production and replaced by read-only `rules:view`.
- Authority to alter or delete audit records, in any technical way.
- Authority to approve their own role grants, device registrations or break-glass requests.

**Elevated access: break-glass (decision D-17)**

For rare, defined purposes (a correction that cannot be made another way, a safety investigation, a lawful request) a Super Administrator may request time-limited person-level access to a **named record or small set**, not a broad query.

1. Request with a mandatory reason, the specific records, and the purpose category.
2. Approval by a second authorised person from a different function (for example the Data Protection Officer or the data owner). Never the requester.
3. Access is scoped to those records, expires automatically after a short period fixed by policy, and cannot be extended without a new request.
4. Every read is logged. The Data Protection Officer and the data owner are notified when access starts and when it ends.
5. A review of every break-glass event takes place within a defined period, and results are reported.
6. If no one is available to approve, there is **no override**. The request waits.

**Controls on the role itself**

- Phishing-resistant MFA, a small number of named holders (a minimum of two so one person leaving does not strand the system), and no shared accounts.
- Creating a Super Administrator needs two existing holders to approve.
- A separate day-to-day account is used for ordinary programme work. The privileged account is used only for administration.
- All privileged actions, and the audit log reads of this role, are themselves audited and reported to an independent reviewer.

## 6. Approval rules

| Action                                       | Proposed approver                                                         |
| -------------------------------------------- | ------------------------------------------------------------------------- |
| Create a CHW, facility, LGA or State account | Project Administrator proposes, the owning manager approves               |
| Raise a user's role or widen their scope     | Project Administrator proposes, owning manager and a second administrator |
| Create or elevate a Super Administrator      | Two existing Super Administrators                                         |
| Register or revoke a device                  | Project Administrator (revocation takes effect immediately)               |
| Correct a submitted assessment               | The CHW's supervisor, with a reason, re-evaluated by the rules service    |
| Export beyond a standard report              | State Programme Manager or data owner (D-24)                              |
| Activate or roll back a rule set             | Rule Approval Board, not an application role (`RULE_GOVERNANCE.md`)       |
| Release a new boundary or facility version   | Reference Data Steward (`GIS_PRODUCTION_ARCHITECTURE.md`)                 |
| Break-glass access                           | Data Protection Officer or data owner (section 5)                         |

## 7. Actions that require audit logging

Every item writes an `audit.event` in the same transaction as the action. Content is never logged, only who, what, which record id, which scope, when, from which device, and why.

| Category            | Events                                                                                                                                                             |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Authentication      | Sign-in success and failure, MFA failure, lockout, token refresh failure, sign-out, session revoked                                                                |
| Device              | Register, revoke, lost report, remote wipe requested and confirmed, first sync after a long gap                                                                    |
| Authorisation       | Every denied request (role, scope or object), role grant and revoke, scope change, approvals and rejections                                                        |
| Person-level data   | Create, amend (with revision id), delete, restore, **every read by a role other than the creating CHW**, every facility read of a referral, every break-glass read |
| Referral            | Each stage change with actor and device, reassignment                                                                                                              |
| Programme data      | Unsuppressed or custom queries, scope changes in a session, suppression policy changes                                                                             |
| Exports and reports | Request, generation, approval, download, link expiry, any failed or blocked export                                                                                 |
| Administration      | User, role, device, configuration and reference-data changes, rule set views and any attempted change, retention job runs, backup and restore                      |
| Audit               | Any read of the audit log, any failed integrity check                                                                                                              |

The prototype logs three of these (report generated, user updated, config updated) in a browser database that anyone can edit.

## 8. Separation of duties

- Whoever raises a request does not approve it.
- Administrators do not alter rules. Rule approvers do not administer users.
- The Super Administrator's own access reviews are done by someone else.
- Corrections to data and changes to aggregates' definitions never occur through direct database edits. They go through the application and are logged.

## 9. Permission vocabulary

| Prototype permission (14)                                                                          | Production                                                                                                  |
| -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `assessment:create`, `assessment:view_own`                                                         | Kept. Add `assessment:request_correction`                                                                   |
| `referral:initiate`, `referral:view_relevant`, `referral:update_status`, `referral:record_outcome` | Kept. Add `referral:accept` and `referral:view_for_facility` (row-filtered)                                 |
| `followup:perform`                                                                                 | Kept                                                                                                        |
| `programme:view_lga`, `programme:view_state`                                                       | Replaced by one `programme:view` plus a scope grant                                                         |
| `programme:monitor_referrals`                                                                      | Kept                                                                                                        |
| `reports:generate`                                                                                 | Split into `export:standard` and `export:approve`                                                           |
| `users:manage`                                                                                     | Split into `users:administer`, `users:grant_role`, `users:approve_elevation`, `devices:manage`              |
| `config:manage`                                                                                    | Kept, with a list of what it covers                                                                         |
| `rules:manage`                                                                                     | **Removed.** Replaced by `rules:view`. Proposing, reviewing and approving exist only in the governance tool |
| none                                                                                               | New: `audit:read`, `breakglass:request`, `breakglass:approve`, `reference:release`, `system:view_health`    |

## 10. Enforcement points

1. **Gateway:** authentication, token and device checks, coarse permission, rate limits.
2. **Service:** authorisation with scope and object checks on every route. The check is written once and used by all routes.
3. **Database:** separate roles per service, row-level security on `ops`, and views only for the programme roles (`DATA_ARCHITECTURE.md`).
4. **Interface:** hides unavailable pages and actions. This is convenience only, as the prototype already states.

## 11. How this is tested

The prototype generates its role tests from the permission data (`roles.test.ts`). Production extends this: an authorisation matrix test generated from the role table here, run against the real API with a token per role and a deliberately out-of-scope object per case, plus tests that a programme-role database connection cannot read `ops`, that audit rows cannot be updated or deleted, and that break-glass access expires.
