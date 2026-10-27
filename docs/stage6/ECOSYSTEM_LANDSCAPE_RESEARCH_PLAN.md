# Ecosystem landscape research plan

**Status:** research framework, with a first external reading recorded on 2026-10-18. This document itself states no fact about any system. The first desk reading of six sources is recorded in `STAGE6_EVIDENCE_REGISTER.md` section 6 (XE-01 to XE-10) and compared in `DIFFERENTIATION_VALIDATION.md` section 3. Four sources were read in full (WHO Skin NTDs App, DHIS2 Community Health, WHO Nigeria NTD-WASH case study, Nigeria Digital Health); the CIMS-NTDs papers, the DHIS2 NTD design page and the DHIS2 CHIS NTD page were **not** read in full and remain priority desk research. **Nothing has been confirmed by system owners, and the full SYS profiles below are still unpopulated.**

The capability-by-capability comparison that summarises the evidence so far is `ECOSYSTEM_CAPABILITY_MATRIX.md`; it keeps global capability, Nigerian implementation and field practice separate. Additional sources integrated in v2: the Nigerian DHIS2 NTD treatment-reporting platform (XE-11), the DHIS2 CHIS module list (XE-12), the WHO WASH-NTD publication (XE-13) and WASHIMS (XE-14).

**Priority systems for the remaining desk and owner work:** CIMS-NTDs (post-signal workflow); DHIS2 CHIS including its NTD page and referral handling; DHIS2 NTD Overarching Module; WASHIMS/NTD-WASH below state level; WHO Skin NTDs App (current version and Nigerian use); the national digital health architecture documents. Positioning boundary: NTD-WATCH is not a standalone surveillance platform, an NTD diagnostic or AI product, or a replacement for any of these.

## 1. Evidence classes

Every statement recorded in this research falls into one of four classes. Mixing them is the main risk.

| Class                  | Definition                                                       | Where recorded                         | Example of correct use                                                |
| ---------------------- | ---------------------------------------------------------------- | -------------------------------------- | --------------------------------------------------------------------- |
| **Known project fact** | True of this repository or its documents                         | Cite the file                          | "The prototype has no facility interface" (`STAGE4_CURRENT_STATE.md`) |
| **External finding**   | Found in a named, dated external source or confirmed by an owner | Register with source, date, confidence | "Document X, dated D, describes Y" (none exist yet)                   |
| **Assumption**         | Believed, not evidenced                                          | Assumption list, to be tested          | "Community signals are not systematically captured" (untested)        |
| **Unknown**            | No evidence either way                                           | Evidence gap register                  | "Who owns system Z" (unknown)                                         |

Rules: no external finding without a source and date; a single secondary source is "low confidence" until confirmed with the owner; absence of evidence is recorded as an unknown, never as "does not exist".

## 2. What the research must answer

For each system, tool or flow studied (the nine questions from the brief, plus the tenth for decision use):

1. **What exists?**
2. **Who owns it?**
3. **Who uses it?**
4. **What does it do?**
5. **What data does it contain?**
6. **What workflow does it support?**
7. **What happens after a signal?**
8. **Where does referral information go?**
9. **What is missing?**
10. **Could NTD-WATCH be integrated (or replaced by it) instead?**

Overall, the research must feed the decision: what is already solved, partly solved, and operationally unresolved (Q2) and standalone versus layer (Q4).

## 3. Scope: areas to research

For each area: what is known now, assumptions, unknowns, research questions, and the kinds of source to consult. "Named in brief" means the sponsor named it; it does not mean it was verified.

### 3.1 Nigeria NTD systems and programme structure

- **Known project facts:** the prototype assumes a hierarchy of state, LGA, community and facility; it assumes a CHW does community assessment; it contains no real system names.
- **Assumptions:** a national NTD programme and state programmes exist with their own reporting lines; CHWs participate in NTD activities in some places.
- **Unknowns:** programme structure, which NTDs are in scope, who coordinates at state and LGA level, reporting calendars, existing community case-finding practice.
- **Research questions:** how is the NTD programme organised nationally and in a candidate state; which diseases and activities involve CHWs; who is responsible for a community signal.
- **Sources:** programme strategic and operational documents; ministry publications; programme officers (interview); partner organisation documentation.

### 3.2 NTD surveillance and reporting

- **Known project facts:** NTD-WATCH treats a signal as a HIGH or URGENT assessment, not a case, and never declares outbreaks.
- **Assumptions:** NTD reporting is largely facility-, survey- or campaign-based and periodic.
- **Unknowns:** actual reporting flows, case definitions, timeliness, completeness, whether community-level early signals are collected anywhere.
- **Research questions:** which NTD conditions are notifiable or reported; by whom; how often; into which system; what is done with it; what is the lag.
- **Sources:** surveillance guidelines; national reporting forms; surveillance and M&E officers.

### 3.3 CIMS-NTDs

- **Known:** named in the brief. Nothing else is asserted here.
- **Unknowns:** what it is exactly, who owns it, what it contains, its status in Nigeria, its users, its interfaces, whether it covers community-level signals, referral or follow-up.
- **Research questions:** the ten questions in section 2, with emphasis on data model, workflow, and whether it can accept or supply information.
- **Sources:** owner documentation; programme users; the owning organisation's technical contacts.

### 3.4 WHO skin-NTD tools

- **Known:** named in the brief ("WHO Skin NTD tools"). Nothing else asserted.
- **Unknowns:** which tools exist, what they support (training, recognition, screening, referral, data capture), their evidence base, licence, adaptation rights, deployment in Nigeria, whether they provide a validated decision pathway that could replace the demonstration rules.
- **Research questions:** the ten questions; plus whether they could be the source of validated content under `CLINICAL_VALIDATION_PLAN.md` (R2).
- **Sources:** WHO publications and product pages; programme clinicians; expert panel.

### 3.5 DHIS2 and community systems

- **Known project facts:** `INTEROPERABILITY.md` describes only a possible aggregate exchange with DHIS2; no connection exists.
- **Assumptions:** DHIS2 or an equivalent is used for routine aggregate reporting; it may support tracker or community modules.
- **Unknowns:** the version and configuration in use, which data sets and tracker programs exist for NTDs, whether community or CHW modules are used, API access policy, who administers it.
- **Research questions:** is there an NTD data set; is there a community or tracker workflow that already does assessment, referral and follow-up; how are org units organised; how are changes requested; could the rules and workflow be configured there.
- **Sources:** the national and state HMIS teams; system documentation; DHIS2 administrators.

### 3.6 CHW platforms

- **Known:** none identified.
- **Unknowns:** which CHW digital tools are used in the target states (for any programme), who owns them, what forms and rules they support, offline capability, referral features, data flows, licensing.
- **Research questions:** the ten questions; whether an existing CHW application could host an NTD assessment with approved rules and referral closure; what it would take (R3).
- **Sources:** state primary health care agencies; implementing partners; CHW supervisors; vendor and open-source documentation.

### 3.7 NTD-WASH information flows

- **Known project facts:** the prototype's vulnerability index uses four WASH answers with placeholder thresholds (30 and 45); it is not validated.
- **Unknowns:** which WASH datasets exist, at what geography and date, who owns and updates them, how NTD and WASH data currently meet, whether a community-level WASH context is wanted.
- **Research questions:** what WASH information do NTD programme officers use now; at which unit; in which system; would they act on a community index.
- **Sources:** WASH sector documents and datasets; programme officers; GIS and data specialists.

### 3.8 Referral and follow-up systems

- **Known project facts:** the prototype defines a referral stage lifecycle and a follow-up record; no real facility interface exists.
- **Assumptions:** referrals from CHWs are often paper-based or informal, and closure is rarely tracked (untested).
- **Unknowns:** actual referral forms, receiving practice, counter-referral, follow-up responsibility, any digital tracking.
- **Research questions:** how a referral is made, received, recorded and returned; how a CHW learns the outcome; who follows up a missed referral.
- **Sources:** facility staff; CHWs; supervisors; referral forms and registers (blank templates, not patient records).

### 3.9 GIS and surveillance platforms

- **Known project facts:** the prototype's map is fictional; the GIS design is in `GIS_PRODUCTION_ARCHITECTURE.md`.
- **Unknowns:** GIS platforms used by programmes, their data holdings, boundary sources and versions, whether community-level layers exist, access rules.
- **Research questions:** ten questions; plus: which boundary release is authoritative; whether NTD signals could be fed to an existing GIS as an aggregate layer (R4).
- **Sources:** GIS and data specialists; boundary custodians; programme dashboards documentation.

### 3.10 Relevant digital health infrastructure

- **Unknowns:** national digital health architecture and standards, facility registries, interoperability layers, identity services, data protection expectations for digital health systems, hosting options.
- **Research questions:** what national frameworks any new health application is expected to follow; what registries exist and who may use them; what endorsement, registration or approval a digital health tool needs.
- **Sources:** ministry digital health units; official frameworks (read by counsel); registry owners.

## 4. System profile template

One page per system. Leave unknown fields as "UNKNOWN" and add an evidence gap entry.

```text
SYSTEM PROFILE
ID: SYS-___           Researcher:          Date:         Confidence: low / medium / high
Name / alternative names:
1. What exists (description; version; status: operational / pilot / retired / unknown):
2. Owner (organisation; contact role; governance body):
3. Users (roles; number if stated; geographic coverage):
4. What it does (functions):
5. Data it contains (entities; person-level or aggregate; geography unit; time unit):
6. Workflow supported (who does what; from signal to action):
7. After a signal: who is notified; how fast; what action; what record:
8. Referral information: where it goes; who sees it; is closure recorded; how follow-up is done:
9. Gaps (what it does not do; as stated by its users, with source):
10. Integration or replacement potential:
    - Interfaces/APIs/file exchange:     - Hosting/extension options:
    - Data sharing terms:                - Owner's attitude (as stated):
    - What NTD-WATCH would add / duplicate:
SOURCES (type; title; date; link or reference; primary/secondary):
CLASSIFICATION of each statement above: PF / EF / SS / AS / UK
EVIDENCE REGISTER IDs:
```

## 5. Synthesis matrix: solved, partly solved, unresolved

Completed after research, one row per step of the pathway. This is the output Q2 asks for; it is not a feature matrix.

| Pathway step                   | Already solved (by what; evidence) | Partly solved (what remains) | Operationally unresolved (why) | Evidence IDs | Confidence |
| ------------------------------ | ---------------------------------- | ---------------------------- | ------------------------------ | ------------ | ---------- |
| Community signal               | [pending research]                 |                              |                                |              |            |
| CHW assessment                 |                                    |                              |                                |              |            |
| Risk prompt / decision support |                                    |                              |                                |              |            |
| Referral initiation            |                                    |                              |                                |              |            |
| Facility reception and outcome |                                    |                              |                                |              |            |
| Follow-up                      |                                    |                              |                                |              |            |
| Programme intelligence         |                                    |                              |                                |              |            |
| Programme action               |                                    |                              |                                |              |            |
| Governance of rules            |                                    |                              |                                |              |            |

## 6. Integration-versus-standalone assessment frame

After the profiles, assess each candidate platform on the questions below. Scores are qualitative and must cite evidence IDs.

| Question                                                                                                     | Evidence  | Finding   |
| ------------------------------------------------------------------------------------------------------------ | --------- | --------- |
| Does a platform already reach the CHWs and supervisors in the candidate setting?                             | [pending] | [pending] |
| Can it run offline with versioned rules, including no-rule mode, and keep a record of the rule version used? |           |           |
| Can it track referrals to closure with facility input?                                                       |           |           |
| Can it give scope-limited, suppressed programme views and maps?                                              |           |           |
| Can governance of rules (approvals, suspension, rollback) be implemented without forking it?                 |           |           |
| Who owns, hosts, and can extend it; at what cost; on what timeline?                                          |           |           |
| What does the platform owner say about hosting this workflow?                                                |           |           |
| What data protection and hosting terms apply?                                                                |           |           |
| What would be lost by not being standalone (control, speed, safety)?                                         |           |           |
| What would be lost by being standalone (reach, sustainability, duplication)?                                 |           |           |

Outcomes feed `DIFFERENTIATION_VALIDATION.md` hypothesis H4 (standalone versus integration) and decision S6-05.

## 7. Method and discipline

- Desk review first; then confirm with owners; then record.
- Prefer primary sources (the owner's documentation or the owner) over reports about the system.
- Record the date; systems change.
- When two sources disagree, record both and the disagreement.
- Do not infer that an organisation supports an idea because it is named in a document.
- Do not contact system owners in a way that implies endorsement or commitment.
- Do not request credentials or live access. Walkthroughs use demonstration environments the owner offers.
- No patient-level data is collected, requested or discussed.
- Searches done by the research lead are logged: date, terms, sources checked, results, and sources that could not be reached.

## 8. Outputs

Completed system profiles; the synthesis matrix; the integration frame; an updated assumptions list (confirmed, refuted or still open); evidence register entries; a list of evidence gaps with reasons; and a short statement for `STAGE6_REPORT.md` section "Landscape findings". Until then those sections stay as placeholders.

## 9. Owners and sequence

Research lead (with GIS lead and technical lead for their areas). Runs in phase S1 (desk) and S3 (owner conversations) of `STAGE6_VALIDATION_PLAN.md`. Ethics and sponsor authorisation (M5) precede contact with owners.
