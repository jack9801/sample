// app/api/trpc/[trpc]/route.ts
// This is the tRPC API route handler for Next.js App Router.

import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter, createContext } from '@/lib/trpc/server'; // Import our tRPC router and context creator

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc', // The endpoint for our tRPC API
    req,
    router: appRouter,
    createContext: () => createContext(), // ✅ No arguments
    onError: ({ path, error }) => {
      console.error(`❌ tRPC failed on ${path ?? '<no-path>'}: ${error.message}`);
    },
  });

export { handler as GET, handler as POST };
