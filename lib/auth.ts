// lib/auth.ts
// This file primarily configures Auth0.
// For Next.js App Router, Auth0 provides `handleAuth` which creates API routes for login/logout/callback.

import { initAuth0 } from '@auth0/nextjs-auth0';

// Initialize Auth0 with environment variables
export const auth0 = initAuth0({
  secret: process.env.AUTH0_SECRET,
  baseURL: process.env.AUTH0_BASE_URL,
  issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
  clientID: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
});

// You will create an API route to handle Auth0 authentication.
// This is done in app/api/auth/[auth0]/route.ts (or similar).
