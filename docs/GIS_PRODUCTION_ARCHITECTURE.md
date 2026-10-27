# GIS production architecture (proposed)

**Status: Proposed.** No real administrative boundary, facility location or community coordinate is imported in Stage 4. The prototype map is fictional geometry, generated near (0, 0), and stays so.

## 1. What the prototype does

| Aspect              | Prototype (Implemented unless marked)                                                                      |
| ------------------- | ---------------------------------------------------------------------------------------------------------- |
| Geometry            | GeoJSON generated from synthetic data. One polygon per community. Positions near longitude and latitude 0  |
| Spatial reference   | **Not declared.** Coordinates are treated as WGS 84 longitude and latitude by MapLibre, by convention only |
| Basemap             | None. No tile source, so no external request                                                               |
| Rendering           | MapLibre GL 6.14 in a lazily loaded chunk (about 1.06 MB). DOM markers for names and signal buttons        |
| Fallback            | Where WebGL is unavailable, a table shows the same data                                                    |
| Layers              | Signals, vulnerability bands (thresholds 30 and 45, demonstration), community selection                    |
| Hierarchy           | State, LGA, community, facility in the data. No ward level                                                 |
| Boundary versioning | None                                                                                                       |
| Facility positions  | Synthetic points                                                                                           |
| Spatial queries     | None. Filtering is by id and scope on the application side                                                 |

Gaps this document closes: no coordinate reference system, no ward, no versioning, no verification state, one-polygon-per-community assumption, no layer governance.

## 2. Administrative hierarchy

```text
Country
  State           (official boundary, code)
    LGA           (official boundary, code)
      Ward        (official boundary, code)   <- missing in the prototype
        Community (programme-defined unit)    <- see 3
          Facility (point, with a catchment relation to wards/communities)
```

- State, LGA and ward come from official boundary sources (I-5 in `INTEROPERABILITY.md`). They are reference data with an owner.
- **Community is different.** There is no standard national polygon for a community or settlement. The prototype treats it as a polygon; production cannot assume that. Decision D-19 chooses the community unit. Options:
  1. **Point** (settlement centroid) with an optional radius for display. Cheapest, least precise. Reveals less.
  2. **Programme-defined catchment** (for example a CHW's service area), drawn or validated by the programme. Needs a controlled editing process.
  3. **Ward-level choropleth** as the finest published geography, with community as an attribute list inside the ward. Safest for privacy and simplest to maintain.

  The reference option for a pilot is 3 for published maps, with 1 held internally for CHW assignment. This is a proposal, not a decision.

- A facility has a point, a type, a level of care, a status and a relation to the wards it serves. Referral routing uses relationship tables, not distance alone.
- Every unit has a stable internal id (`geo_unit_id`, UUID), the official code as an external key, and a parent. A succession table records splits, merges and renames across boundary versions.

## 3. Spatial reference and storage

| Question                  | Proposal                                                                                                                                                                                                                                                                                                               |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Storage CRS               | **EPSG:4326** (WGS 84, longitude and latitude) for stored geometries and for web delivery. It is what sources and web maps use                                                                                                                                                                                         |
| Area and distance         | Compute in a projected or equal-area CRS, or with geography types, not on raw degrees. Nigeria spans several UTM zones (31N to 33N), so one UTM zone is not appropriate for the whole country. An equal-area national CRS (for example Africa Albers, ESRI:102022) is a candidate; **to be confirmed by the GIS lead** |
| Web display               | EPSG:3857 in the browser, as MapLibre does by default                                                                                                                                                                                                                                                                  |
| Declared on every dataset | Yes. `ref.geo_dataset.srid` is required. An import without a declared CRS is rejected                                                                                                                                                                                                                                  |
| Database                  | PostgreSQL with PostGIS: `geometry(MultiPolygon, 4326)` for areas and `geometry(Point, 4326)` for facilities, GiST indexes                                                                                                                                                                                             |
| Validity                  | `ST_IsValid` checked on import, with repair logged. No overlaps within a level and a version, no gaps against the parent, children inside their parent within a tolerance                                                                                                                                              |
| Precision                 | Published geometry simplified per zoom for display; the stored geometry stays full detail                                                                                                                                                                                                                              |

## 4. Boundary versioning

Boundaries change, and a count has to be attributable to the geography that applied then.

```text
ref.geo_dataset (id, source, licence, srid, release_label, received_on, checksum, status)
ref.geo_unit    (id, level, official_code, name, parent_id)
ref.geo_unit_version (unit_id, dataset_id, geom, valid_from, valid_to, status)
ref.geo_succession   (old_unit_id, new_unit_id, relation, effective_on)
```

- A new release is loaded as a new dataset in `STAGED` status, checked, diffed against the current one, reviewed by the Reference Data Steward, then activated with a `valid_from`.
- Records keep the stable unit id. Reports state the dataset and `reference_version` they used.
- Past results are not silently re-aggregated onto new boundaries. Restating history is a deliberate, labelled analysis.
- Rollback is a status change back to the previous dataset.

## 5. Facility verification

| State                | Meaning                                                                                         | Usable as referral destination |
| -------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------ |
| `IMPORTED`           | From the registry, not yet checked                                                              | No                             |
| `LOCATION_CHECKED`   | The point agrees with the registry and plausible against the ward                               | No                             |
| `CONFIRMED_BY_OWNER` | The facility or its authority confirmed name, location, type and that it receives NTD referrals | Yes                            |
| `SUSPENDED`          | Closed, moved, or not receiving referrals                                                       | No                             |
| `RETIRED`            | No longer exists                                                                                | No                             |

- Verification is done by a named steward with the facility's or LGA's confirmation. Remote desk checks are labelled as such. Field verification, where it happens, records the date and method.
- A CHW who finds a wrong facility details reports it in the app. This creates a correction proposal for the steward, not an edit.
- Referral destinations that are not `CONFIRMED_BY_OWNER` are not offered. Whether to allow an explicitly labelled exception is part of D-06.

## 6. Ownership and update process

| Element                     | Owner (proposed)                               | Updated by                              | Cadence                    |
| --------------------------- | ---------------------------------------------- | --------------------------------------- | -------------------------- |
| Official boundaries         | The official custodian (to be confirmed, D-05) | Reference Data Steward on a new release | On release                 |
| Community units             | The programme                                  | Programme officer with steward approval | As needed, with change log |
| Facility list               | Registry owner, with state authority           | Steward, from the registry              | Quarterly                  |
| Facility verification       | NTD-WATCH programme data steward               | Steward                                 | Continuous                 |
| Context layers (WASH etc.)  | Source organisation                            | Steward                                 | Per source release         |
| Map styles and layer config | Product team, reviewed by the GIS lead         | Release process                         | With releases              |

Update process: propose → import to staging → automated validation → diff and review → approval → activate with date → audit entry → notify dependents. The Reference Data Steward is a defined role (`PRODUCTION_RBAC.md`) and must not be a CHW or a facility user.

## 7. Layers

Each layer has an owner, a definition, a source, a reference date, an update cadence, a suppression rule, an audience, and a status. Layers appear in the app only when that card is complete.

| Layer                   | Source (kind)                                                      | Granularity                | Audience               | Privacy treatment                                                                    |
| ----------------------- | ------------------------------------------------------------------ | -------------------------- | ---------------------- | ------------------------------------------------------------------------------------ |
| Validated NTD signals   | NTD-WATCH, under an approved rule set                              | Ward, or community by D-19 | Scope-limited roles    | Small-number suppression; labelled as signals, not cases; shows the rule set version |
| Community vulnerability | Derived from approved indicators                                   | Ward or community          | Programme and managers | Index definition and thresholds approved (D-19); shows data age                      |
| WASH indicators         | External datasets (I-4)                                            | As published               | Programme and managers | Area aggregate only                                                                  |
| Health facilities       | Registry (I-3) plus verification                                   | Point                      | All authorised roles   | Organisational data                                                                  |
| Referral activity       | NTD-WATCH                                                          | Facility, ward             | Scope-limited roles    | Aggregate, suppressed; flows between areas coarser than between points               |
| Programme coverage      | Programme systems (I-2)                                            | Per programme              | Programme roles        | Aggregate                                                                            |
| Other approved context  | For example population, access or travel time, climate or flooding | As published               | Per layer approval     | Per layer approval; each requires its own source and licence check                   |

"Validated" in the first row means validated through `RULE_GOVERNANCE.md`. Until a rule set is approved, the layer is labelled demonstration.

## 8. Rendering and delivery

- **Vector tiles** generated from PostGIS (for example by a tile service or pre-built per release) at ward and above. The browser draws only tiles in view, which replaces sending all polygons as one GeoJSON file.
- **Scope applied on the server.** A tile or feature request is clipped to the caller's scope and already suppressed. The client never receives out-of-scope geometry or small counts and then hides them.
- **Basemap.** Decision D-20. Options: none (as the prototype), a licensed or open tile provider, or self-hosted tiles. A third-party tile request tells that provider the viewer's IP and the area viewed, which is a privacy and availability concern; self-hosting or no basemap avoids it. Licence and attribution terms must be checked before use.
- **Offline.** CHW maps are not required offline. If needed, a small pre-packaged area for the CHW's own scope is the limit, and it contains no case data.
- **Accessibility.** The table alternative remains. Colour is never the only carrier of information. The prototype has an axe check on the map page; production keeps it.
- **Performance.** Budget and measurement are a Tier 2 test item (`TESTING_ROADMAP.md`). The MapLibre chunk stays lazy-loaded.

## 9. Location privacy

- **No per-assessment GPS by default.** An assessment is tied to a community or ward, not to the household. Collecting coordinates of a person's location is a decision (D-21) with a legal and ethics review.
- Where any location finer than the community is stored, it is classed as personal data, encrypted, and excluded from every export and map.
- Maps never show a point for an individual, even approximately.
- Small areas with few records are suppressed or merged to the parent.
- Facility coordinates are public by nature, but a facility's referral volume is still subject to suppression.
- Re-identification risk from combining layers (a small ward, a rare signal, a date) is reviewed when a new layer is added.

## 10. Quality assurance

- Import checks in section 3, plus a count reconciliation with the source.
- A visual check by the GIS lead of each new boundary release against the source.
- Automated tests: point-in-polygon assignment, succession mapping, scope clipping, suppression at tile level, CRS declared.
- A published data dictionary and lineage for each layer.

## 11. What is demonstration-only

The synthetic geometry, the unprojected coordinates near (0, 0), the one-polygon-per-community model, the placeholder vulnerability bands, and the absence of a basemap. They show how a map could behave. They carry no geographic truth and should not be shown as if they do.

## 12. Dependencies and decisions

- D-09: pilot geography (not chosen here) fixes which boundaries, and which units, are needed first.
- D-05: boundary custodian and licence.
- D-19: community unit and vulnerability index.
- D-20: basemap approach.
- D-21: any location finer than community.
- D-06: facility directory ownership and use of unconfirmed facilities.
