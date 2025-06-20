// app/api/trpc/[...trpc]/route.ts
// This file sets up the Next.js App Router API route to handle all tRPC requests.
// **IMPORTANT**: Ensure this file is named `[...trpc]/route.ts` (with triple dots).

import { appRouter } from '../../../../lib/server/routers/_app';
import { createContext } from '../../../../lib/server/routers/context';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext,
  });

export { handler as GET, handler as POST };
