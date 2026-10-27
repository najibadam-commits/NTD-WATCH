import { DEMO_SCOPE_HEADER } from '@ntd-watch/api-contract';
import {
  DEMO_COMMUNITIES,
  DEMO_FACILITIES,
  DEMO_SCOPE_FOR_ROLE,
  communityName,
  facilityName,
} from '@ntd-watch/demo-data';
import { ALL_SCOPE, ROLES, parseScope, type DataScope, type Role } from '@ntd-watch/domain';
import {
  communityDetail,
  isValidDate,
  monitorReferrals,
  summarise,
  REPORT_KINDS,
  SYNTHETIC_NOTICE,
  isSeedKey,
  type FacilityInbox,
  type InboxItem,
  type ProgrammeFilters,
} from '@ntd-watch/programme';
import { DEMO_RULE_SET, isDemoOnly } from '@ntd-watch/rules-engine';
import {
  loadRecords,
  maxUnresolvedDays,
  mockNow,
  queryContext,
  resetProgrammeData,
  usersWithChanges,
  writeAudit,
} from './programmeStore';
import { json, problem, readJson, route, type Ctx } from './routing';
import { serverDb } from './serverDb';

/** What kind of scope each role may be given. A role can never ask for a wider kind. */
const ALLOWED_KINDS: Record<Role, DataScope['kind'][]> = {
  chw: [],
  facility: ['facility'],
  lga: ['lga'],
  state: ['state'],
  admin: ['all'],
};

function defaultScope(role: Role): DataScope {
  const raw = DEMO_SCOPE_FOR_ROLE[role];
  if (raw === 'all') return ALL_SCOPE;
  if (raw.startsWith('st-')) return { kind: 'state', id: raw };
  if (raw.startsWith('lga-')) return { kind: 'lga', id: raw };
  if (raw.startsWith('fac-')) return { kind: 'facility', id: raw };
  return ALL_SCOPE;
}

/** Reads the SIMULATED scope header. Returns a problem response when it is not allowed. */
function scopeOf(request: Request, role: Role): DataScope | Response {
  const header = request.headers.get(DEMO_SCOPE_HEADER);
  if (!header) return defaultScope(role);
  const scope = parseScope(header);
  if (!scope) return problem(400, 'BAD_SCOPE', 'The scope header could not be read.');
  if (!ALLOWED_KINDS[role].includes(scope.kind)) {
    return problem(
      403,
      'SCOPE_NOT_ALLOWED',
      `The simulated ${role} role may not use a ${scope.kind} scope.`,
    );
  }
  const known =
    scope.kind === 'all' ||
    (scope.kind === 'facility' && DEMO_FACILITIES.some((f) => f.id === scope.id)) ||
    (scope.kind === 'lga' && DEMO_COMMUNITIES.some((c) => c.lgaId === scope.id)) ||
    (scope.kind === 'state' && DEMO_COMMUNITIES.some((c) => c.stateId === scope.id));
  return known ? scope : problem(400, 'BAD_SCOPE', 'That scope does not exist.');
}

function filtersOf(request: Request): ProgrammeFilters | Response {
  const q = new URL(request.url).searchParams;
  const from = q.get('from');
  const to = q.get('to');
  if (!isValidDate(from) || !isValidDate(to)) {
    return problem(400, 'BAD_FILTER', 'from and to are required dates (YYYY-MM-DD).');
  }
  if (from > to) return problem(400, 'BAD_FILTER', 'The start date is after the end date.');
  const filters: ProgrammeFilters = { from, to };
  for (const key of ['stateId', 'lgaId', 'wardId', 'communityId'] as const) {
    const v = q.get(key);
    if (v) filters[key] = v;
  }
  return filters;
}

async function withQuery(
  { request }: Ctx,
  role: Role,
  run: (filters: ProgrammeFilters, scope: DataScope) => Promise<Response> | Response,
) {
  const scope = scopeOf(request, role);
  if (scope instanceof Response) return scope;
  const filters = filtersOf(request);
  if (filters instanceof Response) return filters;
  return run(filters, scope);
}

/**
 * Facility inbox: referrals sent to the caller's SIMULATED facility. Registered before the
 * generic referral lookup, because `/referrals/inbox` would otherwise match `/referrals/:id`.
 * The facility check is a simulated scope, not a security control.
 */
export const inboxHandler = route('referralInbox', async ({ request }, role) => {
  const scope = scopeOf(request, role);
  if (scope instanceof Response) return scope;
  if (scope.kind !== 'facility' || !scope.id) {
    return problem(400, 'BAD_SCOPE', 'The inbox needs a facility scope.');
  }
  const records = await loadRecords();
  const byKey = new Map(records.assessments.map((a) => [a.clientKey, a]));
  const items: InboxItem[] = records.referrals
    .filter((r) => r.facilityId === scope.id)
    .map((referral) => {
      const a = byKey.get(referral.assessmentKey);
      return {
        referral,
        source: isSeedKey(referral.assessmentKey) ? ('seed' as const) : ('live' as const),
        assessment: a
          ? {
              assessmentId: a.id,
              capturedAt: a.capturedAt,
              communityId: a.communityId,
              communityName: communityName(a.communityId),
              ageGroup: a.ageGroup,
              sex: a.sex,
              symptoms: a.symptoms,
              duration: a.duration,
              progression: a.progression,
              riskLevel: a.riskLevel,
              riskWhy: a.riskWhy,
              ruleSetId: a.ruleSetId,
              ruleSetVersion: a.ruleSetVersion,
            }
          : null,
      };
    })
    .sort((x, y) => y.referral.stageTimestamps[0]!.localeCompare(x.referral.stageTimestamps[0]!));
  const body: FacilityInbox = {
    demo: true,
    notice: SYNTHETIC_NOTICE,
    generatedAt: mockNow().toISOString(),
    facilityId: scope.id,
    facilityName: facilityName(scope.id),
    items,
  };
  return json(body);
});

export const programmeHandlers = [
  route('programmeSummary', (ctx, role) =>
    withQuery(ctx, role, async (filters, scope) => {
      const summary = summarise(await loadRecords(), filters, scope, await queryContext());
      return json(summary);
    }),
  ),

  route('communityDetail', (ctx, role) =>
    withQuery(ctx, role, async (filters, scope) => {
      const id = String(ctx.params.id);
      if (!DEMO_COMMUNITIES.some((c) => c.id === id)) {
        return problem(404, 'NOT_FOUND', 'No such community.');
      }
      const detail = communityDetail(await loadRecords(), id, filters, scope, await queryContext());
      return detail
        ? json(detail)
        : problem(403, 'OUT_OF_SCOPE', 'That community is outside your simulated data scope.');
    }),
  ),

  route('referralMonitor', (ctx, role) =>
    withQuery(ctx, role, async (filters, scope) =>
      json(monitorReferrals(await loadRecords(), filters, scope, await queryContext())),
    ),
  ),

  route('recordReport', async ({ request }, role) => {
    const body = (await readJson(request)) as { kind?: string } | undefined;
    if (!body?.kind || !(REPORT_KINDS as readonly string[]).includes(body.kind)) {
      return problem(422, 'VALIDATION', 'A valid report kind is required.');
    }
    await writeAudit({
      actor: role,
      action: 'report.generated',
      target: body.kind,
      detail: 'Synthetic demonstration report generated.',
    });
    return json({ ok: true }, 201);
  }),

  route('listUsers', async () => {
    const [users, audit] = await Promise.all([
      usersWithChanges(),
      serverDb.audit.orderBy('id').reverse().limit(25).toArray(),
    ]);
    return json({ demo: true, users, audit });
  }),

  route('updateUser', async ({ request, params }, role) => {
    const id = String(params.id);
    const users = await usersWithChanges();
    const user = users.find((u) => u.id === id);
    if (!user) return problem(404, 'NOT_FOUND', 'No such synthetic user.');
    const body = (await readJson(request)) as
      { active?: unknown; role?: unknown; scopeId?: unknown } | undefined;
    if (!body || typeof body !== 'object') return problem(422, 'VALIDATION', 'A body is required.');
    const next = { ...user };
    if (body.active !== undefined) {
      if (typeof body.active !== 'boolean')
        return problem(422, 'VALIDATION', 'active must be true or false.');
      next.active = body.active;
    }
    if (body.role !== undefined) {
      if (typeof body.role !== 'string' || !(ROLES as readonly string[]).includes(body.role)) {
        return problem(422, 'VALIDATION', 'Unknown role.');
      }
      next.role = body.role as Role;
    }
    if (body.scopeId !== undefined) {
      if (typeof body.scopeId !== 'string')
        return problem(422, 'VALIDATION', 'scopeId must be text.');
      next.scopeId = body.scopeId;
    }
    if (user.role === 'admin' && (next.role !== 'admin' || !next.active)) {
      return problem(
        409,
        'PROTECTED',
        'The Super Administrator account cannot be demoted or disabled.',
      );
    }
    const prefix: Record<Role, RegExp> = {
      chw: /^com-\d+$/,
      facility: /^fac-/,
      lga: /^lga-/,
      state: /^st-/,
      admin: /^all$/,
    };
    if (!prefix[next.role].test(next.scopeId)) {
      return problem(
        422,
        'VALIDATION',
        `A ${next.role} needs a matching scope, for example ${defaultScope(next.role).id ?? 'all'}.`,
      );
    }
    await serverDb.users.put({ id, role: next.role, scopeId: next.scopeId, active: next.active });
    const changes = [
      next.active !== user.active ? (next.active ? 'enabled' : 'disabled') : null,
      next.role !== user.role ? `role ${user.role} to ${next.role}` : null,
      next.scopeId !== user.scopeId ? `scope ${user.scopeId} to ${next.scopeId}` : null,
    ].filter(Boolean);
    await writeAudit({
      actor: role,
      action: 'user.updated',
      target: id,
      detail: changes.length > 0 ? changes.join('; ') : 'No change.',
    });
    return json({ user: next });
  }),

  route('getConfig', async () => {
    return json({
      demo: true,
      maxUnresolvedDays: await maxUnresolvedDays(),
      ruleSet: {
        id: DEMO_RULE_SET.id,
        version: DEMO_RULE_SET.version,
        status: DEMO_RULE_SET.status,
        demoOnly: isDemoOnly(DEMO_RULE_SET),
        ruleCount: DEMO_RULE_SET.rules.length,
        description: DEMO_RULE_SET.description,
      },
      seedAnchor: (await serverDb.meta.get('seedAnchor'))?.value ?? null,
      now: mockNow().toISOString(),
    });
  }),

  route('updateConfig', async ({ request }, role) => {
    const body = (await readJson(request)) as { maxUnresolvedDays?: unknown } | undefined;
    const days = body?.maxUnresolvedDays;
    if (typeof days !== 'number' || !Number.isInteger(days) || days < 1 || days > 30) {
      return problem(422, 'VALIDATION', 'maxUnresolvedDays must be a whole number from 1 to 30.');
    }
    await serverDb.meta.put({ key: 'maxUnresolvedDays', value: String(days) });
    await writeAudit({
      actor: role,
      action: 'config.updated',
      target: 'maxUnresolvedDays',
      detail: `Set to ${days}.`,
    });
    return json({ maxUnresolvedDays: days });
  }),

  route('resetDemo', async () => {
    await resetProgrammeData();
    return json({ ok: true });
  }),
];
