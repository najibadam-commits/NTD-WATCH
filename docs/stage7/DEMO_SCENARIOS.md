# Demo scenarios

All data is synthetic and generated deterministically. Figures below are for the seeded period and are **computed by the app, not typed in**; the exact numbers shift slightly with the date range filter, but the category of each scenario community is fixed and covered by automated tests (`packages/programme/src/priority.test.ts`). The priority categories are demonstration settings, not epidemiological thresholds.

Matrix (brief, section on priority):

| Signal | Vulnerability | Category shown in the app                     |
| ------ | ------------- | --------------------------------------------- |
| High   | High          | Priority investigation or intervention        |
| High   | Low           | Investigate an unusual signal                 |
| Low    | High          | Prevention or active surveillance opportunity |
| Low    | Low           | Lower immediate priority                      |

"High" means the top band only. A moderate band counts as lower on either layer, and the screen says so. Signal is the share of assessments rated HIGH or URGENT by the demonstration rules (high at 15% or more). Vulnerability is the WASH-based index (high at 45 or more).

## Scenario A: elevated community signal with incomplete follow-up (main story)

**Community:** Demo Streamside (Arewa Demo State, South LGA). **Category:** Priority investigation or intervention.

- Signal band **high** (about one in five assessments rated HIGH or URGENT) and vulnerability **high**, with signals **rising** over the last 28 days.
- Open work remains: referrals unresolved past the allowed days and assessed referrals still waiting for a community follow-up.
- **Why it matters for the demo:** the priority view does not just show a hotspot. It shows that action is incomplete, which is the gap the project is testing in Stage 6.
- Where to see it: Priority communities (first row), Overview (rising direction, follow-ups due), GIS (both layers), Referrals (ageing).

The live demo CHW's own community, Demo Riverside, is also placed in this category, so a record you create during the demonstration appears in the same story.

## Scenario B: high signal, lower vulnerability

**Community:** Demo Marketfield (Arewa, North LGA). **Category:** Investigate an unusual signal.

- Signal **high**, vulnerability **lower**. Reported water and sanitation look better than the signal would suggest.
- **Talking point:** a high signal without matching vulnerability is a reason to look at the data and the context before acting, not to assume a cause.
- It is also the community of the facility the CHW refers to (Demo North Primary Health Centre).

## Scenario C: high vulnerability, low signal

**Community:** Demo Hillview (Arewa, North LGA). **Category:** Prevention or active surveillance opportunity.

- Vulnerability **high**, signal **low**.
- **Talking point:** no signal does not mean no risk. This is where a programme might consider prevention or watching more closely, a decision for people, not the tool.

## Communities without data

Five fictional communities have no CHW and therefore no assessments. They show "not enough data" and are never placed in the matrix. This demonstrates coverage gaps honestly rather than guessing.

## Scripted record created live

CHW Demo CHW 0142 (Demo Riverside) creates an assessment with limb swelling of one to three months and open-water contact. The demonstration rules rate it HIGH and give the reason "Limb swelling has lasted one month or longer." The CHW refers to Demo North Primary Health Centre. The same record then appears in the facility inbox, moves through the stages, and ends up in the programme views.
