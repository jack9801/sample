// app/api/trpc/[...trpc]/route.ts
// This file sets up the Next.js App Router API route to handle all tRPC requests.
// **IMPORTANT**: Ensure this file is named `[...trpc]/route.ts` (with triple dots).

import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '../../../../lib/server/routers/_app';
import { createContext } from '../../../../lib/server/routers/context';
import type { TRPCError } from '@trpc/server';

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext,
    onError: ({ path, error }: { path?: string; error: TRPCError }) => {
      console.error(`❌ tRPC failed on ${path}:`, error);
    },
  });

export { handler as GET, handler as POST };
