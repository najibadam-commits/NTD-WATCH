import { HttpResponse, delay, http } from 'msw';
import {
  API_ROUTES,
  DEMO_ROLE_HEADER,
  IDEMPOTENCY_HEADER,
  type ApiRouteName,
} from '@ntd-watch/api-contract';
import {
  ROLES,
  assessmentSchema,
  can,
  followUpSchema,
  isValidTransition,
  nextStage,
  referralIdFor,
  referralSchema,
  referralStageSchema,
  type Role,
} from '@ntd-watch/domain';
import { useMockControls } from './controls';
import { serverDb } from './serverDb';

type Ctx = { request: Request; params: Record<string, string | readonly string[] | undefined> };
type Handler = (ctx: Ctx, role: Role) => Promise<Response> | Response;

const json = (body: unknown, status = 200) => HttpResponse.json(body as never, { status });
const problem = (status: number, code: string, message: string, extra?: object) =>
  json({ code, message, ...extra }, status);

function roleOf(request: Request): Role | null {
  const raw = request.headers.get(DEMO_ROLE_HEADER);
  return (ROLES as readonly string[]).includes(raw ?? '') ? (raw as Role) : null;
}

/**
 * Wraps every route with the simulated behaviours of a server: latency, outages, injected
 * failures, a SIMULATED role check, and lost responses. None of this is real security.
 */
function route(name: ApiRouteName, handler: Handler) {
  const spec = API_ROUTES[name];
  const method = spec.method.toLowerCase() as 'get' | 'post' | 'patch';
  const path = spec.path;
  return http[method](`*${path}`, async (ctx) => {
    const controls = useMockControls.getState();
    if (controls.latencyMs > 0) await delay(controls.latencyMs);
    if (controls.serverDown) return problem(503, 'SERVER_DOWN', 'Simulated server outage.');
    if (controls.failNext > 0) {
      controls.setFailNext(controls.failNext - 1);
      return problem(500, 'INJECTED_FAILURE', 'Simulated server error.');
    }
    const role = roleOf(ctx.request);
    if (!role) return problem(401, 'NO_DEMO_ROLE', 'No simulated role was supplied.');
    if (!spec.anyOf.some((p) => can(role, p))) {
      return problem(403, 'FORBIDDEN', `The simulated ${role} role may not call this route.`);
    }
    const response = await handler(ctx as unknown as Ctx, role);
    if (controls.dropResponseNext > 0) {
      controls.setDropResponseNext(controls.dropResponseNext - 1);
      return HttpResponse.error(); // stored on the "server", but the device never hears back
    }
    return response;
  });
}

function validationProblem(error: { issues: { path: PropertyKey[]; message: string }[] }) {
  return problem(422, 'VALIDATION', 'The record failed validation.', {
    issues: error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
  });
}

async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}

export const handlers = [
  route('submitAssessment', async ({ request }) => {
    const parsed = assessmentSchema.safeParse(await readJson(request));
    if (!parsed.success) return validationProblem(parsed.error);
    const key = request.headers.get(IDEMPOTENCY_HEADER);
    if (key !== parsed.data.clientKey) {
      return problem(400, 'IDEMPOTENCY_MISMATCH', 'Idempotency-Key must equal clientKey.');
    }
    const existing = await serverDb.assessments.get(key);
    if (existing) return json({ duplicate: true, assessment: existing }, 200);
    await serverDb.assessments.put(parsed.data);
    return json({ duplicate: false, assessment: parsed.data }, 201);
  }),

  route('createReferral', async ({ request }) => {
    const parsed = referralSchema.safeParse(await readJson(request));
    if (!parsed.success) return validationProblem(parsed.error);
    const referral = parsed.data;
    const year = Number(referral.id.slice(5, 9));
    if (referral.id !== referralIdFor(referral.assessmentKey, year)) {
      return problem(422, 'BAD_REFERRAL_ID', 'Referral id does not match its assessment.');
    }
    const existing = await serverDb.referrals.get(referral.id);
    if (existing) return json({ duplicate: true, referral: existing }, 200);
    if (!(await serverDb.assessments.get(referral.assessmentKey))) {
      return problem(409, 'PARENT_MISSING', 'The assessment has not reached the server yet.');
    }
    await serverDb.referrals.put(referral);
    return json({ duplicate: false, referral }, 201);
  }),

  route('getReferral', async ({ params }) => {
    const referral = await serverDb.referrals.get(String(params.id));
    return referral ? json({ referral }) : problem(404, 'NOT_FOUND', 'No such referral.');
  }),

  route('updateReferral', async ({ request, params }) => {
    const body = (await readJson(request)) as { stage?: unknown } | undefined;
    const stage = referralStageSchema.safeParse(body?.stage);
    if (!stage.success) return problem(422, 'VALIDATION', 'A valid stage is required.');
    const referral = await serverDb.referrals.get(String(params.id));
    if (!referral) return problem(404, 'NOT_FOUND', 'No such referral.');
    if (!isValidTransition(referral.stage, stage.data)) {
      return problem(409, 'INVALID_TRANSITION', 'Referral status can only move forward.');
    }
    if (nextStage(referral.stage) !== stage.data) {
      return problem(409, 'SKIPPED_STAGE', 'Referral status must move one stage at a time.');
    }
    const updated = {
      ...referral,
      stage: stage.data,
      stageTimestamps: [...referral.stageTimestamps, new Date().toISOString()],
    };
    await serverDb.referrals.put(updated);
    return json({ referral: updated });
  }),

  route('submitFollowUp', async ({ request }) => {
    const parsed = followUpSchema.safeParse(await readJson(request));
    if (!parsed.success) return validationProblem(parsed.error);
    const followUp = parsed.data;
    const existing = await serverDb.followUps.get(followUp.clientKey);
    if (existing) return json({ duplicate: true, followUp: existing }, 200);
    if (!(await serverDb.assessments.get(followUp.assessmentKey))) {
      return problem(409, 'PARENT_MISSING', 'The assessment has not reached the server yet.');
    }
    await serverDb.followUps.put(followUp);
    return json({ duplicate: false, followUp }, 201);
  }),
];
