import type { DemoFacility } from './reference';

/**
 * SYNTHETIC facility capability fields for the women-and-girls referral demonstration.
 *
 * Every value below is invented to exercise filtering and ranking. None of it describes a real
 * facility, worker, clinician or service. A real deployment would need a verified facility
 * registry (see the capability register: facility directory is FUTURE).
 */
export const CAPACITY_LEVELS = ['AVAILABLE', 'LIMITED', 'NONE'] as const;
export type CapacityLevel = (typeof CAPACITY_LEVELS)[number];

export interface FacilityCapability {
  /** Synthetic marker so the data can never be mistaken for a service directory. */
  synthetic: true;
  /** Offers the relevant service line (synthetic). */
  relevantService: boolean;
  /** A worker trained for this service is on the (synthetic) roster. */
  trainedWorker: boolean;
  /** A female clinician is on the (synthetic) roster. */
  femaleClinician: boolean;
  /** Examination capability (synthetic). */
  examination: boolean;
  /** Capacity to take referrals (synthetic). */
  referralCapacity: CapacityLevel;
}

const cap = (
  relevantService: boolean,
  trainedWorker: boolean,
  femaleClinician: boolean,
  examination: boolean,
  referralCapacity: CapacityLevel,
): FacilityCapability => ({
  synthetic: true,
  relevantService,
  trainedWorker,
  femaleClinician,
  examination,
  referralCapacity,
});

export const FACILITY_CAPABILITIES: Readonly<Record<string, FacilityCapability>> = {
  'fac-n1': cap(true, true, true, true, 'AVAILABLE'),
  'fac-n2': cap(false, false, true, false, 'LIMITED'),
  'fac-c1': cap(true, true, false, true, 'LIMITED'),
  'fac-c2': cap(true, false, true, true, 'AVAILABLE'),
  'fac-s1': cap(true, true, true, false, 'AVAILABLE'),
  'fac-s2': cap(false, false, false, false, 'NONE'),
  'fac-e1': cap(true, false, false, true, 'AVAILABLE'),
  'fac-w1': cap(false, true, true, false, 'LIMITED'),
  'fac-w2': cap(true, true, false, true, 'NONE'),
};

export function facilityCapability(id: string): FacilityCapability | undefined {
  return FACILITY_CAPABILITIES[id];
}

export interface FacilityNeeds {
  /** The person asked to be seen by a woman. */
  femaleClinician: boolean;
}

export interface RankedFacility {
  facility: DemoFacility;
  capability: FacilityCapability | undefined;
  /** Higher is a better synthetic fit. Used for ordering only. */
  score: number;
  /** Capability fields that are missing for this facility, for display. */
  gaps: (
    'relevantService' | 'trainedWorker' | 'femaleClinician' | 'examination' | 'referralCapacity'
  )[];
}

/**
 * Orders facilities by synthetic fit. Nothing is hidden: a facility that cannot take referrals is
 * ranked last and flagged, so the CHW can still choose it and sees why it is ranked low.
 */
export function rankFacilities(
  facilities: readonly DemoFacility[],
  needs: FacilityNeeds,
): RankedFacility[] {
  return facilities
    .map((facility) => {
      const capability = facilityCapability(facility.id);
      const gaps: RankedFacility['gaps'] = [];
      let score = 0;
      if (capability) {
        if (capability.relevantService) score += 4;
        else gaps.push('relevantService');
        if (capability.examination) score += 3;
        else gaps.push('examination');
        if (capability.trainedWorker) score += 2;
        else gaps.push('trainedWorker');
        if (capability.femaleClinician) score += needs.femaleClinician ? 3 : 1;
        else if (needs.femaleClinician) gaps.push('femaleClinician');
        if (capability.referralCapacity === 'AVAILABLE') score += 2;
        else if (capability.referralCapacity === 'LIMITED') score += 1;
        else {
          score -= 10;
          gaps.push('referralCapacity');
        }
      }
      return { facility, capability, score, gaps };
    })
    .sort((a, b) => b.score - a.score || a.facility.name.localeCompare(b.facility.name));
}

/** Facilities that fit every stated requirement. Used for filtering, not for hiding. */
export function matchesNeeds(r: RankedFacility, needs: FacilityNeeds): boolean {
  const c = r.capability;
  if (!c) return false;
  return (
    c.relevantService &&
    c.examination &&
    c.referralCapacity !== 'NONE' &&
    (!needs.femaleClinician || c.femaleClinician)
  );
}
