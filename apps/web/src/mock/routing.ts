import { HttpResponse, delay, http } from 'msw';
import { API_ROUTES, DEMO_ROLE_HEADER, type ApiRouteName } from '@ntd-watch/api-contract';
import { ROLES, can, type Role } from '@ntd-watch/domain';
import { useMockControls } from './controls';

export type Ctx = {
  request: Request;
  params: Record<string, string | readonly string[] | undefined>;
};
export type Handler = (ctx: Ctx, role: Role) => Promise<Response> | Response;

export const json = (body: unknown, status = 200) => HttpResponse.json(body as never, { status });
export const problem = (status: number, code: string, message: string, extra?: object) =>
  json({ code, message, ...extra }, status);

export function roleOf(request: Request): Role | null {
  const raw = request.headers.get(DEMO_ROLE_HEADER);
  return (ROLES as readonly string[]).includes(raw ?? '') ? (raw as Role) : null;
}

/**
 * Wraps every route with the simulated behaviours of a server: latency, outages, injected
 * failures, a SIMULATED role check, and lost responses. None of this is real security.
 */
export function route(name: ApiRouteName, handler: Handler) {
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

export function validationProblem(error: { issues: { path: PropertyKey[]; message: string }[] }) {
  return problem(422, 'VALIDATION', 'The record failed validation.', {
    issues: error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
  });
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}
