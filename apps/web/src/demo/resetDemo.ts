import type { QueryClient } from '@tanstack/react-query';
import { useDraft } from '../chw/draft';
import { notifyDataChanged } from '../programme/dataChannel';
import { useProgrammeFilters } from '../programme/filters';
import { resetProgrammeData } from '../mock/programmeStore';
import { useMockControls } from '../mock/controls';
import { useConnectivity } from '../offline/connectivity';
import { resetLocalDb } from '../offline/localDb';

/**
 * ONE reset for the whole demo (Stage 7). It returns every part of the prototype to its starting
 * state so a presenter can run the story again: the mock server records (assessments, referrals,
 * follow-ups, users, audit, config), the CHW device database including the offline queue, the
 * assessment in progress, the simulation switches, the connection state, the dashboard filters
 * and cached views. The chosen demo role is kept so the presenter stays where they are.
 *
 * Synthetic seed data is regenerated deterministically on the next request, so counts and the
 * three demo scenarios return to the same shape each time.
 */
export async function resetDemoEnvironment(client?: QueryClient): Promise<void> {
  await resetProgrammeData();
  await resetLocalDb();
  useDraft.getState().clear();
  useMockControls.getState().reset();
  useConnectivity.setState({ simulatedOffline: false });
  useProgrammeFilters.getState().reset();
  if (client) {
    client.clear();
  }
  notifyDataChanged();
}
