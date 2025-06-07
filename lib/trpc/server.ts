// lib/trpc/server.ts
// This file initializes tRPC for your server-side procedures.

import { initTRPC } from '@trpc/server';
import { createContext } from '../server/routers/context'; // Correct path

/**
 * Initialization of tRPC backend
 * Should be done only once per backend!
 */
const t = initTRPC.context<typeof createContext>().create();

/**
 * Export reusable router and procedure helpers
 * that can be used throughout the router
 */
export const router = t.router;
export const publicProcedure = t.procedure;
