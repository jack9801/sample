// app/layout.tsx
// This is the root layout for your Next.js application.

import 'bootstrap/dist/css/bootstrap.min.css'; // Bootstrap CSS
import TRPCProvider from '../lib/trpc/TRPCProvider'; // TRPC Provider (assuming this path is correct relative to app/layout.tsx)
import '../styles/globals.css'; // Custom global styles (assuming this path is correct relative to app/layout.tsx)
import { UserProvider } from '@auth0/nextjs-auth0/client'; // Auth0 UserProvider

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
        {/* Viewport meta tag for responsive design */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        {/* Title for the browser tab */}
        <title>ChatGPT Mobile Clone</title>
        {/* Font Awesome CDN for icons */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
          xintegrity="sha512-SnH5WK+bZxgPHs44uWIX+LLJAJ9/2PkPKZ5QiAj6Ta86w+fsb2TkcmfRyVX3pBnMLcV7oQPJkl9QevSCWoR3W6A=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
        {/* You can also add a script tag for Tailwind CSS CDN here for quick prototyping,
            but typically Tailwind is built into Next.js using PostCSS setup. */}
        {/* <script src="https://cdn.tailwindcss.com"></script> */}
      </head>
      <body>
        {/* UserProvider from Auth0 for authentication context across the app */}
        <UserProvider>
          {/* TRPCProvider for tRPC client setup, enabling communication with tRPC API */}
          <TRPCProvider>
            {/* The `children` prop will be the content of the current page (e.g., app/page.tsx) */}
            {children}
          </TRPCProvider>
        </UserProvider>
      </body>
    </html>
  );
}


// app/page.tsx
// This file defines the root page (content for '/') of your Next.js application.
// It will be rendered within the `RootLayout` defined in app/layout.tsx.

import React from 'react';

// You might also want to import your global CSS if it contains Tailwind directives.
// import '../styles/globals.css'; // Already imported by layout.tsx, but good to note if this was standalone.

// The HomePage component is what users will see when they visit your application's root URL.
export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-10 rounded-xl shadow-2xl text-center max-w-lg w-full border-b-4 border-purple-600">
        <h1 className="text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
          Welcome to Your ChatGPT Clone!
        </h1>
        <p className="text-xl text-gray-700 mb-8">
          This is your main application page. It's successfully loaded, and you're ready to build out your chat interface.
        </p>
        <div className="flex justify-center space-x-4">
          <a
            href="/api/auth/login" // Example login route if using Auth0
            className="inline-flex items-center bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-full transition duration-300 ease-in-out transform hover:scale-105 shadow-lg"
          >
            <i className="fas fa-sign-in-alt mr-2"></i> Log In
          </a>
          <a
            href="https://nextjs.org/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-8 rounded-full transition duration-300 ease-in-out transform hover:scale-105 shadow-lg"
          >
            <i className="fas fa-book mr-2"></i> Next.js Docs
          </a>
        </div>
      </div>
    </div>
  );
}

// styles/globals.css (Conceptual content, as it's usually handled by PostCSS in Next.js)
/*
  @tailwind base;
  @tailwind components;
  @tailwind utilities;

  body {
    font-family: 'Inter', sans-serif;
  }
*/
