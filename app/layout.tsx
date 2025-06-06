    import 'bootstrap/dist/css/bootstrap.min.css'; // Bootstrap CSS
    import TRPCProvider from '../lib/trpc/TRPCProvider'; // TRPC Provider
    import '../styles/globals.css'; // Custom global styles (ensure this path is correct relative to app/layout.tsx)
    import { UserProvider } from '@auth0/nextjs-auth0/client'; // Auth0 UserProvider

    export const metadata = {
      title: 'ChatGPT Mobile Clone',
      description: 'An AI Chatbot powered by Next.js, Auth0, Supabase, and Google Gemini',
    };

    export default function RootLayout({
      children,
    }: {
      children: React.ReactNode;
    }) {
      return (
        <html lang="en">
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>ChatGPT Mobile Clone</title>
            <link
              rel="stylesheet"
              href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
              xintegrity="sha512-SnH5WK+bZxgPHs44uWIX+LLJAJ9/2PkPKZ5QiAj6Ta86w+fsb2TkcmfRyVX3pBnMLcV7oQPJkl9QevSCWoR3W6A=="
              crossOrigin="anonymous"
              referrerPolicy="no-referrer"
            />
          </head>
          <body>
            <UserProvider>
              <TRPCProvider>
                {children}
              </TRPCProvider>
            </UserProvider>
          </body>
        </html>
      );
    }
    