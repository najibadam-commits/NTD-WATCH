import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { encodeScope, type Role } from '@ntd-watch/domain';
import { useDemoSession } from '../session/demoSession';
import {
  fetchCommunity,
  fetchConfig,
  fetchReferralMonitor,
  fetchSummary,
  fetchUsers,
  scopeForRole,
} from './api';
import { onDataChanged } from './dataChannel';
import { currentFilters, useProgrammeFilters } from './filters';

function useRole(): Role {
  const role = useDemoSession((s) => s.role);
  if (!role) throw new Error('A programme view needs a simulated role.');
  return role;
}

/** Re-fetches every programme query when another tab syncs new records. */
export function useLiveRefresh(): void {
  const client = useQueryClient();
  useEffect(
    () => onDataChanged(() => void client.invalidateQueries({ queryKey: ['programme'] })),
    [client],
  );
}

function useFilters() {
  const s = useProgrammeFilters();
  return currentFilters(s);
}

const live = { staleTime: 0, refetchOnMount: 'always', refetchOnWindowFocus: true } as const;

export function useSummary() {
  const role = useRole();
  const filters = useFilters();
  return useQuery({
    queryKey: ['programme', 'summary', role, encodeScope(scopeForRole(role)), filters],
    queryFn: () => fetchSummary(role, filters),
    ...live,
  });
}

export function useReferralMonitor() {
  const role = useRole();
  const filters = useFilters();
  return useQuery({
    queryKey: ['programme', 'referrals', role, encodeScope(scopeForRole(role)), filters],
    queryFn: () => fetchReferralMonitor(role, filters),
    ...live,
  });
}

export function useCommunityDetail(id: string | undefined) {
  const role = useRole();
  const filters = useFilters();
  return useQuery({
    queryKey: ['programme', 'community', role, id, filters.from, filters.to],
    queryFn: () => fetchCommunity(role, id!, filters),
    enabled: Boolean(id),
    ...live,
  });
}

export function useUsers() {
  const role = useRole();
  return useQuery({
    queryKey: ['programme', 'users', role],
    queryFn: () => fetchUsers(role),
    ...live,
  });
}

export function useConfig() {
  const role = useRole();
  return useQuery({
    queryKey: ['programme', 'config', role],
    queryFn: () => fetchConfig(role),
    ...live,
  });
}

export { useRole };
