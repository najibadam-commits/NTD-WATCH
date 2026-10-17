import { setupServer } from 'msw/node';
import { handlers } from './handlers';

/** The same mock API for automated tests (Node). */
export const mockServer = setupServer(...handlers);
