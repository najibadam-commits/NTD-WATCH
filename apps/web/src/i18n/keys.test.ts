import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { REFERRAL_STAGES, ROLES } from '@ntd-watch/domain';
import en from './locales/en.json';
import {
  AGE_GROUPS,
  CONDITIONS,
  DURATIONS,
  PROGRESSIONS,
  SANITATION,
  SEXES,
  SYMPTOMS,
  TRI,
  WATER_SOURCES,
} from '../chw/options';
import { CHW_BOTTOM_NAV, CHW_SCREENS, PROGRAMME_SCREENS } from '../nav/navigation';

function lookup(key: string): unknown {
  return key
    .split('.')
    .reduce<unknown>((o, k) => (o as Record<string, unknown> | undefined)?.[k], en);
}

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return name === 'testing' ? [] : sourceFiles(full);
    return /\.(ts|tsx)$/.test(name) && !/\.test\./.test(name) ? [full] : [];
  });
}

describe('locale file', () => {
  it('contains every statically referenced translation key', () => {
    const root = join(__dirname, '..');
    const missing: string[] = [];
    for (const file of sourceFiles(root)) {
      const text = readFileSync(file, 'utf8');
      for (const m of text.matchAll(/\bt\(\s*'([a-zA-Z0-9_.]+)'/g)) {
        if (typeof lookup(m[1]!) !== 'string') missing.push(`${file.replace(root, '')}: ${m[1]}`);
      }
      for (const m of text.matchAll(/i18n\.t\(\s*'([a-zA-Z0-9_.]+)'/g)) {
        if (typeof lookup(m[1]!) !== 'string') missing.push(`${file.replace(root, '')}: ${m[1]}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('has a label for every option shown in the forms', () => {
    const groups: Record<string, readonly string[]> = {
      ageGroup: AGE_GROUPS,
      sex: SEXES,
      symptoms: [...SYMPTOMS, 'none'],
      duration: DURATIONS,
      progression: PROGRESSIONS,
      tri: TRI,
      waterSource: WATER_SOURCES,
      sanitation: SANITATION,
      condition: CONDITIONS,
      urgency: ['LOW', 'MODERATE', 'HIGH', 'URGENT'],
    };
    for (const [group, values] of Object.entries(groups)) {
      for (const v of values)
        expect(lookup(`options.${group}.${v}`), `${group}.${v}`).toBeTypeOf('string');
    }
  });

  it('has a title for every screen, role and navigation entry', () => {
    for (const s of [...CHW_SCREENS, ...PROGRAMME_SCREENS])
      expect(lookup(s.titleKey)).toBeTypeOf('string');
    for (const n of CHW_BOTTOM_NAV) expect(lookup(n.labelKey)).toBeTypeOf('string');
    for (const r of ROLES) expect(lookup(`roles.${r}`)).toBeTypeOf('string');
    expect(REFERRAL_STAGES.length).toBeGreaterThan(0);
  });

  it('has validation messages for every required field', () => {
    for (const f of [
      'ageGroup',
      'sex',
      'community',
      'symptoms',
      'duration',
      'progression',
      'waterContact',
      'animalContact',
      'insectBites',
      'householdSimilar',
      'waterSource',
      'sanitation',
      'handwashing',
      'standingWater',
      'facility',
      'personReached',
      'attendedFacility',
      'condition',
      'needsFurtherReferral',
      'pin',
    ]) {
      expect(lookup(`validation.${f}`), f).toBeTypeOf('string');
    }
  });
});
