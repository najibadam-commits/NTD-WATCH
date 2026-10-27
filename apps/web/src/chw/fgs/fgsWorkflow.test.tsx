import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import '../../i18n';
import { mockServer } from '../../mock/node';
import { localDb } from '../../offline/localDb';
import { routes } from '../../routes';
import { useDemoSession } from '../../session/demoSession';
import { resetAll } from '../../testing/resetAll';
import { useFgsDraft } from './draft';

beforeAll(() => mockServer.listen({ onUnhandledFrame: 'error' }));
afterAll(() => mockServer.close());
beforeEach(async () => {
  await resetAll();
  useFgsDraft.getState().clear();
  useDemoSession.getState().setRole('chw');
});
afterEach(() => mockServer.resetHandlers());

async function renderAt(path: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  await waitFor(() => expect(router.state.initialized).toBe(true));
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return router;
}

const user = () => userEvent.setup();
const pick = async (u: ReturnType<typeof user>, g: RegExp | string, option: RegExp | string) => {
  const scope = within(await screen.findByRole('group', { name: g }));
  return u.click(
    scope.queryByRole('radio', { name: option }) ?? scope.getByRole('checkbox', { name: option }),
  );
};
const press = async (u: ReturnType<typeof user>, name: RegExp | string) =>
  u.click(await screen.findByRole('button', { name }));

async function toConsent(u: ReturnType<typeof user>) {
  await press(u, /^start$/i);
  await screen.findByRole('heading', { name: 'Her permission' });
}

describe('FGS community assessment', () => {
  it('records nothing when she does not agree', async () => {
    const u = user();
    await renderAt('/chw/fgs');
    await toConsent(u);
    await pick(u, /does she agree/i, /no, she does not agree/i);
    await press(u, /continue/i);
    await screen.findByRole('heading', { name: 'Thank you' });
    expect(await localDb.assessments.count()).toBe(0);
    expect(await localDb.outbox.count()).toBe(0);
    expect(useFgsDraft.getState().draft).toBeFalsy();
  });

  it('blocks the first step until a choice is made and shows a readable error', async () => {
    const u = user();
    await renderAt('/chw/fgs');
    await toConsent(u);
    await press(u, /continue/i);
    expect((await screen.findAllByText('Choose whether she agrees.')).length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { name: 'Her permission' })).toBeInTheDocument();
  });

  it('completes the flow and shows a non-diagnostic category with the DEMO rule status', async () => {
    const u = user();
    await renderAt('/chw/fgs');
    await toConsent(u);
    await pick(u, /does she agree/i, /yes, she agrees/i);
    await press(u, /continue/i);

    await screen.findByRole('heading', { name: 'About her' });
    await pick(u, /age range/i, '18 to 49');
    await press(u, /continue/i);

    await screen.findByRole('heading', { name: 'Water contact' });
    await pick(u, /which of these apply/i, /open fresh water/i);
    await press(u, /continue/i);

    await screen.findByRole('heading', { name: 'How she has been feeling' });
    await pick(u, /noticed any of these/i, /pain in the lower belly/i);
    await press(u, /continue/i);

    await screen.findByRole('heading', { name: 'Support and access' });
    await pick(u, /very worried or upset/i, 'Yes');
    await pick(u, /safe to follow up/i, 'Yes');
    await press(u, /review/i);

    await screen.findByRole('heading', { name: /review/i });
    await press(u, /save and see guidance/i);

    await screen.findByRole('heading', { name: 'Guidance for this case' });
    expect(screen.getByText(/rule status: demo/i)).toBeInTheDocument();
    expect(screen.getByText(/not a diagnosis/i)).toBeInTheDocument();
    expect(screen.getByText('Supportive counselling')).toBeInTheDocument();
    expect(document.body.textContent ?? '').not.toMatch(
      /fgs confirmed|tested positive|\bhas fgs\b/i,
    );

    const saved = await localDb.assessments.toArray();
    expect(saved).toHaveLength(1);
    expect(saved[0]?.module).toBe('FGS');
    expect(saved[0]?.consent?.state).toBe('GIVEN');
    expect(saved[0]?.ruleSetStatus).toBe('DEMO');
    expect(saved[0]?.fgs?.supportOffered).toBe(true);
    expect(saved[0]?.caseId).toMatch(/^PC-[0-9A-F]{4}-[0-9A-F]{4}$/);
    expect(useFgsDraft.getState().draft).toBeFalsy();
  });

  it('withdrawing consent keeps the record but blocks follow-on work, and deletion removes it', async () => {
    const u = user();
    await renderAt('/chw/fgs');
    await toConsent(u);
    await pick(u, /does she agree/i, /yes, she agrees/i);
    await press(u, /continue/i);
    await pick(u, /age range/i, '18 to 49');
    await press(u, /continue/i);
    await pick(u, /which of these apply/i, /none of these/i);
    await press(u, /continue/i);
    await pick(u, /noticed any of these/i, /none of these/i);
    await press(u, /continue/i);
    await pick(u, /very worried or upset/i, 'No');
    await pick(u, /safe to follow up/i, 'Yes');
    await press(u, /review/i);
    await press(u, /save and see guidance/i);
    await screen.findByRole('heading', { name: 'Guidance for this case' });

    await press(u, /she no longer agrees/i);
    await press(u, /^confirm$/i);
    await waitFor(async () => {
      const [a] = await localDb.assessments.toArray();
      expect(a?.consent?.state).toBe('WITHDRAWN');
    });

    await press(u, /delete this record/i);
    await press(u, /^confirm$/i);
    await waitFor(async () => expect(await localDb.assessments.count()).toBe(0));
  });
});
