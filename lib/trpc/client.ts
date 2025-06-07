// lib/trpc/client.ts
// This file sets up the tRPC client for use in React components.

import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '../server/routers/_app';

// Create a tRPC React client
export const trpc = createTRPCReact<AppRouter>();

// This is the actual tRPC client that will be used for API calls
// It's primarily used internally by the `trpc` object above when using hooks.
// You might expose this if you need to make calls outside React hooks.
export const trpcClient = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: '/api/trpc', // Our tRPC API route
    }),
  ],
});
