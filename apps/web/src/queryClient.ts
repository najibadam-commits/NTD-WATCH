import { QueryClient } from '@tanstack/react-query';

/** Shared client for the mock API calls that arrive in Stage 2. */
export const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});
