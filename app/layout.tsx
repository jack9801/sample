// This is the root layout for your Next.js application.
// It wraps all pages and defines shared UI, metadata, and global styles/providers.

import 'bootstrap/dist/css/bootstrap.min.css'; // Bootstrap CSS
import TRPCProvider from '../lib/trpc/TRPCProvider'; // TRPC Provider
import '../styles/globals.css'; // Custom global styles (ensure this path is correct relative to app/layout.tsx)
import { UserProvider } from '@auth0/nextjs-auth0/client'; // Auth0 UserProvider - CORRECTED: '=' changed to 'from'

// Metadata for the application, used for SEO and browser tabs
export const metadata = {
  title: 'ChatGPT Mobile Clone',
  description: 'An AI Chatbot powered by Next.js, Auth0, Supabase, and Google Gemini',
};

// RootLayout component wraps all pages and provides global structure and context
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Viewport meta tag for responsive design, essential for mobile */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        {/* Title for the browser tab */}
        <title>ChatGPT Mobile Clone</title>
        {/* Font Awesome CDN for icons - 'xintegrity' was corrected in previous step to 'integrity' */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
          xintegrity="sha512-SnH5WK+bZxgPHs44uWIX+LLJAJ9/2PkPKZ5QiAj6Ta86w+fsb2TkcmfRyVX3pBnMLcV7oQPJkl9QevSCWoR3W6A=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
        {/* If using Tailwind CDN directly for quick testing, uncomment this.
            In a typical Next.js setup, Tailwind is built via PostCSS. */}
        {/* <script src="https://cdn.tailwindcss.com"></script> */}
      </head>
      <body>
        {/* UserProvider from Auth0 for authentication context across the app */}
        <UserProvider>
          {/* TRPCProvider for tRPC client setup, enabling communication with tRPC API */}
          <TRPCProvider>
            {/* The `children` prop will render the content of the current page (e.g., app/page.tsx) */}
            {children}
          </TRPCProvider>
        </UserProvider>
      </body>
    </html>
  );
}
