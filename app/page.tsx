// app/page.tsx
// This is a Server Component to handle authentication and redirection.
import { getSession } from '@auth0/nextjs-auth0';
import { redirect } from 'next/navigation';
import LoginCard from '@/components/LoginCard'; // Import the new client component

export default async function HomePage() {
  // getSession() is a server-side function, correctly called in a Server Component.
  const session = await getSession();

  // If authenticated, redirect to the chat page (server-side redirect).
  if (session?.user) {
    redirect('/chat');
  }

  // If not authenticated, render a client component for the login UI.
  // The interactive parts of the login (like the button) will be handled client-side.
  return <LoginCard />;
}
