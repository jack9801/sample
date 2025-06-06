// This file defines the root page (content for '/') of your Next.js application.
// It will be rendered within the `RootLayout` defined in app/layout.tsx.

import React from 'react';
import { useUser } from '@auth0/nextjs-auth0/client'; // Import useUser hook from Auth0

export default function HomePage() {
  const { user, error, isLoading } = useUser(); // Get user authentication state

  if (isLoading) {
    // Show a loading state while Auth0 is checking the user's session
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white p-10 rounded-xl shadow-2xl text-center max-w-lg w-full border-b-4 border-purple-600">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Loading...</h1>
          <p className="text-gray-600">Checking your authentication status.</p>
        </div>
      </div>
    );
  }

  if (error) {
    // Handle authentication errors
    console.error("Auth0 error:", error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white p-10 rounded-xl shadow-2xl text-center max-w-lg w-full border-b-4 border-red-600">
          <h1 className="text-4xl font-extrabold text-red-700 mb-4">Authentication Error</h1>
          <p className="text-gray-600">An error occurred during authentication: {error.message}</p>
          <a
            href="/api/auth/login" // Link to re-attempt login
            className="mt-6 inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full transition duration-300 ease-in-out transform hover:scale-105 shadow-lg"
          >
            <i className="fas fa-sign-in-alt mr-2"></i> Try Logging In Again
          </a>
        </div>
      </div>
    );
  }

  if (!user) {
    // If no user is logged in, show the login page content
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white p-10 rounded-xl shadow-2xl text-center max-w-lg w-full border-b-4 border-blue-600">
          <h1 className="text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
            Please Log In to Continue
          </h1>
          <p className="text-xl text-gray-700 mb-8">
            Access the ChatGPT Clone by logging in with your account.
          </p>
          <a
            href="/api/auth/login" // This link initiates the Auth0 login process
            className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full transition duration-300 ease-in-out transform hover:scale-105 shadow-lg"
          >
            <i className="fas fa-sign-in-alt mr-2"></i> Log In
          </a>
        </div>
      </div>
    );
  }

  // If user is logged in, show the main welcome content
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-10 rounded-xl shadow-2xl text-center max-w-lg w-full border-b-4 border-purple-600">
        <h1 className="text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
          Welcome, {user.name || 'User'}!
        </h1>
        <p className="text-xl text-gray-700 mb-8">
          You are successfully logged in. This is your main application page, ready to build out your chat interface.
        </p>
        <div className="flex justify-center space-x-4">
          <a
            href="/api/auth/logout" // Example logout route
            className="inline-flex items-center bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-full transition duration-300 ease-in-out transform hover:scale-105 shadow-lg"
          >
            <i className="fas fa-sign-out-alt mr-2"></i> Log Out
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
