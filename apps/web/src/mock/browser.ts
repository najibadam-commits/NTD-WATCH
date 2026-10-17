import { handlers } from './handlers';

/**
 * Starts the MOCK API in the browser using a service worker. The whole "backend" is this
 * in-browser simulation. There is no production backend.
 */
export async function startMockApi(): Promise<void> {
  const { setupWorker } = await import('msw/browser');
  const worker = setupWorker(...handlers);
  await worker.start({
    onUnhandledFrame: 'bypass',
    quiet: true,
    serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
  });
}
