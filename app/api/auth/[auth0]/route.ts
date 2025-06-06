// app/api/auth/[auth0]/route.ts

// Import the `handleAuth` function from the Auth0 Next.js SDK.
// This function is designed to create a set of API routes for
// authentication (login, logout, callback, etc.) based on your
// Auth0 configuration.
import { handleAuth } from '@auth0/nextjs-auth0';

// The `handleAuth` function returns a Next.js API route handler.
// By exporting it as `GET`, it will handle all GET requests to
// /api/auth/* routes. This includes:
// - /api/auth/login
// - /api/auth/logout
// - /api/auth/callback
//
// The Auth0 SDK automatically reads your Auth0 environment variables
// (AUTH0_SECRET, AUTH0_BASE_URL, AUTH0_ISSUER_BASE_URL, etc.)
// to configure these routes.
export const GET = handleAuth();

// You could also export POST if you had routes that expected POST requests,
// but for standard Auth0 authentication flows with handleAuth, GET is usually sufficient.
// export const POST = handleAuth();
