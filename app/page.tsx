    import React from 'react';

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
                href="/api/auth/login"
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
    