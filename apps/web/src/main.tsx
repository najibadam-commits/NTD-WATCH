import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import '@fontsource-variable/bricolage-grotesque';
import '@fontsource-variable/public-sans';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/600.css';
import '@ntd-watch/design-system/styles.css';
import './i18n';
import { queryClient } from './queryClient';
import { routes } from './routes';

const router = createBrowserRouter(routes);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
