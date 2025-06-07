// lib/trpc/server/context.ts
// This file defines the context for your tRPC procedures,
// including Supabase and authentication details.

import { initTRPC } from '@trpc/server';
import { getSession } from '@auth0/nextjs-auth0';
import { supabaseAdmin } from '../../supabaseClient';

export async function createContext({ req }: { req: any }) {
  const session = await getSession(req);
  const userId = session?.user?.sub ?? null;
  return {
    supabase: supabaseAdmin,
    userId,
  };
}
