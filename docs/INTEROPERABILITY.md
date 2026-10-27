# Interoperability architecture (proposed)

**Status: Proposed.** The prototype connects to **no** external system. Everything below is a design for later stages. No live DHIS2, NTD programme system, facility registry or national dataset is contacted in Stage 4, and no credentials, endpoints or real identifiers appear in this repository.

Candidate source systems are named only as examples of the kind of source involved. Whether each exists, is accessible, is authoritative, and what its terms of use are must be **confirmed with its owner** (decision D-15). Nothing here is an agreement with any of them.

## 1. Principles

1. **Aggregate outbound by default.** Person-level data does not leave NTD-WATCH. Outbound exchange to programme and national systems is aggregate and passes the same small-number suppression as the in-app views (`DATA_ARCHITECTURE.md` section 5).
2. **Reference data inbound is read-only reference, not patient data.** Boundaries, facility lists and indicators come in as versioned reference sets with provenance.
3. **All exchange goes through one integration module** (`PRODUCTION_ARCHITECTURE.md` section 3) with its own service identity, narrow database role, retry queue and audit trail. The application's other modules never call an external system directly.
4. **Mapping tables, not hard-coded identifiers.** Each external identifier is stored beside the NTD-WATCH identifier (`ref.external_id`), with the system, the version and the date.
5. **Standards where they fit, not as a goal.** REST with JSON and OpenAPI for the application. DHIS2's own Web API for DHIS2. HL7 FHIR is considered only if a counterpart requires it (D-15); it is not adopted by default.
6. **Failure is normal.** Every exchange is idempotent, queued, retried with back-off, monitored, and visibly "pending" or "failed" to the operator.
7. **No silent overwrite.** Inbound changes to reference data create a new version for the Reference Data Steward to approve.

## 2. Integration summary

| #   | Integration                       | Direction          | Data class                      | Person-level? | Frequency (proposed)    |
| --- | --------------------------------- | ------------------ | ------------------------------- | ------------- | ----------------------- |
| I-1 | DHIS2                             | Outbound, maybe in | Aggregate counts; org-unit list | No            | Monthly or weekly batch |
| I-2 | NTD programme information systems | Outbound, maybe in | Aggregate; programme coverage   | No (default)  | Per programme schedule  |
| I-3 | Facility directories / registries | Inbound            | Facility reference              | No            | Quarterly + on request  |
| I-4 | WASH datasets                     | Inbound            | Indicators by area              | No            | Per release of dataset  |
| I-5 | GIS administrative boundaries     | Inbound            | Polygons, codes                 | No            | On new official release |
| I-6 | Other national or state systems   | To be determined   | To be determined                | To be decided | To be determined        |
| I-7 | Identity provider                 | Inbound (auth)     | User identity, MFA              | Staff only    | Real time               |
| I-8 | Notification providers (SMS/push) | Outbound           | Minimal message content         | Minimised     | Event-driven            |

I-7 and I-8 are platform integrations rather than health-system integrations, and are covered in `PRODUCTION_ARCHITECTURE.md` and `PRIVACY_SECURITY_ARCHITECTURE.md`.

## 3. Per-integration specification

### I-1 DHIS2

| Item                 | Design                                                                                                                                                                                                                                    |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Purpose              | Give the health information system aggregate community-level signals and referral counts, and keep the geographic hierarchy aligned with the national one                                                                                 |
| Data exchanged       | **Out:** aggregate data values by org unit and period (for example assessments completed, HIGH or URGENT signals, referrals initiated, completed), with suppression applied. **In (optional):** the org unit hierarchy and codes          |
| Direction            | Outbound aggregate push; inbound org units read-only                                                                                                                                                                                      |
| Frequency            | Batch on the reporting period the owner prefers (weekly or monthly). Not real time                                                                                                                                                        |
| Identifier strategy  | Store DHIS2 org unit UID and code beside the NTD-WATCH `geo_unit_id` in `ref.external_id`. Map NTD-WATCH indicators to DHIS2 data elements by an explicit, versioned mapping table that DHIS2 administrators approve. No guessed mappings |
| Authentication       | Dedicated integration account issued by the DHIS2 owner, least privilege (write only to the agreed data sets), credentials held in the secret store, rotated. No personal accounts                                                        |
| Ownership            | DHIS2 data model and instance: its owner (the ministry or state programme that runs it). Mapping and the outbound feed: NTD-WATCH data steward. Joint approval of changes                                                                 |
| Privacy              | Aggregates only. Small-cell suppression before export. No person identifiers, no per-assessment coordinates. A signal is not a case count, and the exported label says so, to avoid it being read as surveillance data (see section 4)    |
| Technical dependency | Access to a test instance; DHIS2 version known; agreed data set and data elements; org unit alignment; a window agreed with the owner. Uses DHIS2's own Web API. Behaviour on version change is monitored                                 |

### I-2 NTD programme information systems

| Item                 | Design                                                                                                                                                                                                                               |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Purpose              | Align NTD-WATCH with disease-programme data (for example mass administration coverage, case reporting) so programme officers see community signals beside coverage, without duplicating the programme's own reporting                |
| Data exchanged       | **In:** programme coverage by area and period where the owner agrees. **Out:** aggregate signals and referral volumes. Case-level exchange is **not** proposed; if a programme requires it, that is a separate legal decision (D-12) |
| Direction            | Mainly inbound coverage, outbound aggregates                                                                                                                                                                                         |
| Frequency            | Per programme cycle                                                                                                                                                                                                                  |
| Identifier strategy  | Area codes aligned to the administrative hierarchy. Disease and indicator codes per the programme's own code list, held in a mapping table                                                                                           |
| Authentication       | As the owner's system supports (API key or OAuth client credentials), issued to a service identity                                                                                                                                   |
| Ownership            | The programme owns its data and its definitions. NTD-WATCH never redefines a programme indicator                                                                                                                                     |
| Privacy              | Aggregate only by default. Any request for person-level exchange goes to counsel and the data protection officer first (`PRIVACY_SECURITY_ARCHITECTURE.md` section 13)                                                               |
| Technical dependency | The programme's systems and their interfaces are unknown to this project; each must be assessed. File exchange may be the realistic first step                                                                                       |

### I-3 Facility directories and registries

| Item                 | Design                                                                                                                                                                                                      |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Purpose              | Provide the authoritative facility list (name, code, type, level of care, location, status) for referral destinations, instead of a hand-maintained list                                                    |
| Data exchanged       | Inbound facility records and updates. Outbound: only proposed corrections for the owner to accept                                                                                                           |
| Direction            | Inbound; correction proposals outbound                                                                                                                                                                      |
| Frequency            | Scheduled refresh (quarterly proposed) and on request                                                                                                                                                       |
| Identifier strategy  | Keep the registry's facility id as the external key. NTD-WATCH keeps its own `facility_id` UUID. A facility is never matched by name alone; fuzzy matches go to a Reference Data Steward queue              |
| Authentication       | Registry-defined; read-only credentials                                                                                                                                                                     |
| Ownership            | The registry owner owns the facility record. NTD-WATCH owns the **verification state** it assigns for its own use (`GIS_PRODUCTION_ARCHITECTURE.md` section 5) and whether a facility accepts NTD referrals |
| Privacy              | Facility data is organisational, not personal. Named staff contacts are not imported unless needed and agreed                                                                                               |
| Technical dependency | A usable registry or file; coordinates and a stable code; a data sharing agreement                                                                                                                          |

### I-4 WASH datasets

| Item                 | Design                                                                                                                                                                                                          |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Purpose              | Replace the prototype's synthetic WASH indicators with validated indicators for context layers and the vulnerability index                                                                                      |
| Data exchanged       | Inbound indicators by area (for example access to water, sanitation, hygiene facilities) with source, reference date and method                                                                                 |
| Direction            | Inbound                                                                                                                                                                                                         |
| Frequency            | When the source publishes. Datasets are dated and can be years old; the age is shown with the layer                                                                                                             |
| Identifier strategy  | Join by the administrative code of the source, via a crosswalk to the NTD-WATCH hierarchy that records the boundary version. Where the source geography differs, the crosswalk method is documented, not hidden |
| Authentication       | Usually public download or an agreement. Credentials, if any, in the secret store                                                                                                                               |
| Ownership            | The originating organisation. Licence and attribution terms recorded per dataset                                                                                                                                |
| Privacy              | Area aggregates. Household-level survey data is **not** imported                                                                                                                                                |
| Technical dependency | Licence check; a documented method; an agreed way to treat indicators below the community level                                                                                                                 |

The vulnerability index in the prototype uses placeholder thresholds (bands at 30 and 45). With real indicators, its definition, weights and bands must be agreed and documented by the programme (D-19). Until then the index is labelled as contextual.

### I-5 GIS administrative boundaries

See `GIS_PRODUCTION_ARCHITECTURE.md` for the model.

| Item                 | Design                                                                                                                             |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Purpose              | Authoritative state, LGA and ward polygons and codes                                                                               |
| Data exchanged       | Inbound polygons (vector files), codes, names, official release identifier                                                         |
| Direction            | Inbound                                                                                                                            |
| Frequency            | When an official release occurs. Always versioned, never overwritten                                                               |
| Identifier strategy  | Official code as the external key; internal `geo_unit_id` stable across versions through a succession table (split, merge, rename) |
| Authentication       | Typically none (file) or per agreement                                                                                             |
| Ownership            | The official custodian of boundaries (to be confirmed, D-05). NTD-WATCH holds a licensed copy                                      |
| Privacy              | Not personal data                                                                                                                  |
| Technical dependency | Licence and permitted use; a quality check (topology, overlaps, coverage); agreement on which release is the baseline              |

### I-6 Other national or state systems

For example a national surveillance system, a state health management information system, a laboratory system, a state emergency or outbreak coordination platform, or a national immunisation or logistics system. **None is in scope** and none is assumed to exist. Each candidate is assessed with the same template before any work:

1. The purpose and whether it is aggregate or person-level.
2. Data exchanged, direction and frequency.
3. Identifier strategy and the crosswalk.
4. Authentication supported.
5. Owner, agreement, legal basis.
6. Privacy impact. A person-level link requires the legal position in D-12 and a data protection impact assessment.
7. Technical dependency and effort.

**Outbreak declaration stays human.** NTD-WATCH never automatically notifies an outbreak system or declares an outbreak. A signal can only be forwarded as a signal, by a named officer's action, labelled as unverified.

## 4. Cross-cutting design

| Topic                 | Design                                                                                                                                                                        |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Integration module    | One module and one worker role, with its own queue and audit. Connectors are plug-ins behind an interface so a counterpart can be added or replaced without touching the core |
| Idempotency           | Each outbound batch has a deterministic id from (system, dataset, period, content hash). Re-sending does not double count                                                     |
| Change detection      | Inbound reference sets compared with the current version, producing a diff for review                                                                                         |
| Reconciliation        | A report of what was sent, what the receiver acknowledged, and any rejections, per period. Disagreements go to a queue, not silently fixed                                    |
| Data quality gates    | Outbound batches are held if completeness or validation checks fail, and an officer is told                                                                                   |
| Labelling             | Every exported figure carries its definition ("signal" means a HIGH or URGENT assessment under rule set X version Y), the period and the suppression applied                  |
| Rule set provenance   | Exports state the rule set version, so counts are not compared across rule changes unknowingly                                                                                |
| Contracts and testing | A sandbox or recorded-fixture counterpart for each connector in tests. Contract tests for mappings. No test touches a live system                                             |
| Credentials           | Held in the secret store, scoped per integration, rotated, never in the repository, never on devices                                                                          |
| Governance            | A data sharing agreement per integration, covering purpose, owners, retention, onward use and exit                                                                            |
| Monitoring            | Success rate, lag, rejection count, schema change alarms, per integration                                                                                                     |

## 5. What is and is not in the prototype

| Item                                 | State                                                                             |
| ------------------------------------ | --------------------------------------------------------------------------------- |
| Any external connection              | **None.** The mock API runs in the browser and in tests                           |
| Synthetic geography and facilities   | Implemented (`packages/demo-data`)                                                |
| Exports                              | None. The `exports:aggregate` and related permissions exist as names only         |
| Aggregate shapes suitable for export | Partly: `summarise` and `communityDetail` produce aggregates, without suppression |

## 6. Dependencies and decisions

- D-15: which counterparts, their owners, and the order. The sequence proposed in `STAGE4_REPORT.md` section 14 puts reference data in (I-5, I-3, I-4) before any outbound feed (I-1, I-2).
- D-12: any person-level exchange.
- D-19: the vulnerability index definition and the community unit.
- D-23: who owns the data at each end.
- Legal: data sharing agreements; cross-border considerations if any hosting or counterpart is outside Nigeria (questions in `PRIVACY_SECURITY_ARCHITECTURE.md` section 13).
