/**
 * Starts the MOCK API in the browser using a service worker. The whole "backend" is this
 * in-browser simulation. There is no production backend.
 */
export async function startMockApi(): Promise<void> {
  // Loaded together and on demand: the mock server (and the synthetic data generator it uses) is
  // its own chunk, not part of the first-paint code.
  const [{ setupWorker }, { handlers }] = await Promise.all([
    import('msw/browser'),
    import('./handlers'),
  ]);
  const worker = setupWorker(...handlers);
  await worker.start({
    onUnhandledFrame: 'bypass',
    quiet: true,
    serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
  });
}
