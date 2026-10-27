/**
 * HONEST CAPABILITY REGISTER (Stage 7). Every capability the demo shows is labelled one of:
 *
 *   REAL      works in this prototype's code, on synthetic data, in the browser.
 *   SIMULATED looks like the real thing but is stood in for by a mock, a seed or a switch.
 *   FUTURE    not built. Would need a pilot, validation or a decision before it exists.
 *
 * The categories are never blended. REAL does not mean production-ready or clinically valid.
 */
export const CAPABILITY_STATES = ['REAL', 'SIMULATED', 'FUTURE'] as const;
export type CapabilityState = (typeof CAPABILITY_STATES)[number];

export interface Capability {
  id: string;
  name: string;
  state: CapabilityState;
  note: string;
}

export const CAPABILITIES: readonly Capability[] = [
  {
    id: 'chw-assessment',
    name: 'CHW assessment capture (symptoms, exposure, WASH)',
    state: 'REAL',
    note: 'Works in the browser with validation and local saving. Synthetic data only.',
  },
  {
    id: 'rules-engine',
    name: 'Explainable non-diagnostic risk signal',
    state: 'REAL',
    note: 'A real rules engine runs on every assessment. The rules themselves are demonstration placeholders and are not clinically validated.',
  },
  {
    id: 'referral-loop',
    name: 'Referral and facility status (Generated to Closed)',
    state: 'REAL',
    note: 'State changes are enforced one stage at a time and flow to every role. The facility worker is a simulated role.',
  },
  {
    id: 'offline-sync',
    name: 'Offline capture, queue and sync',
    state: 'REAL',
    note: 'Real device storage, retry and duplicate protection against a mock server. Connectivity loss is simulated with a switch.',
  },
  {
    id: 'aggregation',
    name: 'Shared programme aggregation, signals and priority matrix',
    state: 'REAL',
    note: 'One aggregation layer feeds every programme view. Bands and categories are demonstration settings.',
  },
  {
    id: 'gis',
    name: 'GIS signal and vulnerability layers',
    state: 'SIMULATED',
    note: 'NOT CONNECTED to any external geospatial source. The map code is real, but community points are fictional coordinates and there are no real boundaries.',
  },
  {
    id: 'server',
    name: 'Server and database',
    state: 'SIMULATED',
    note: 'A mock API runs inside the browser and stores data in browser storage. There is no backend.',
  },
  {
    id: 'auth',
    name: 'Login, roles and data scope',
    state: 'SIMULATED',
    note: 'A role selector and demonstration PIN. These are not security controls.',
  },
  {
    id: 'data',
    name: 'All people, places, facilities and counts',
    state: 'SIMULATED',
    note: 'Synthetic and generated from a fixed seed. Nothing describes a real person or place.',
  },
  {
    id: 'fgs-assessment',
    name: 'FGS community assessment and non-diagnostic referral guidance',
    state: 'REAL',
    note: 'Consent, age band, short signal catalogue and a signal category work in the browser on synthetic data. All FGS content and rules are DEMO placeholders with no clinical review.',
  },
  {
    id: 'fgs-consent',
    name: 'Consent, withdrawal and deletion (prototype)',
    state: 'REAL',
    note: 'Consent, withdrawal and deletion are recorded and enforced in the demonstration, with audit events. Not reviewed against any data-protection law.',
  },
  {
    id: 'facility-capability',
    name: 'Facility capability filtering for women and girls',
    state: 'SIMULATED',
    note: 'The ranking logic works, but every capability value is synthetic and describes no real facility, clinician or service.',
  },
  {
    id: 'fgs-clinical-validation',
    name: 'Clinical review and validation of FGS content and rules',
    state: 'FUTURE',
    note: 'Not performed. All FGS content stays DEMO until clinical and safeguarding review is documented.',
  },
  {
    id: 'dhis2',
    name: 'DHIS2 exchange',
    state: 'FUTURE',
    note: 'NOT CONNECTED. Not built. Whether NTD-WATCH should integrate with DHIS2, and how, is a validation question.',
  },
  {
    id: 'facility-directory',
    name: 'Facility directory',
    state: 'FUTURE',
    note: 'NOT CONNECTED. The demo uses a small fictional list. A real registry would be integrated, not copied.',
  },
  {
    id: 'wash-source',
    name: 'Authoritative WASH data source',
    state: 'FUTURE',
    note: 'NOT CONNECTED. Vulnerability comes from the CHW’s own WASH answers. An external WASH source is not connected.',
  },
  {
    id: 'notifications',
    name: 'SMS, push or email notifications',
    state: 'FUTURE',
    note: 'NOT CONNECTED. No message is ever sent. Referral alerts are shown on screen only.',
  },
  {
    id: 'identity',
    name: 'Real identity provider and audit',
    state: 'FUTURE',
    note: 'NOT CONNECTED. Needs the programme’s identity decision. The audit table in the demo is a synthetic example.',
  },
  {
    id: 'clinical-rules',
    name: 'Validated clinical and public-health rules',
    state: 'FUTURE',
    note: 'Requires expert review and a governed approval process before any real use.',
  },
  {
    id: 'outbreak-detection',
    name: 'Outbreak detection or declaration',
    state: 'FUTURE',
    note: 'Out of scope. Priority categories are prompts for a human decision, never an outbreak finding.',
  },
];
