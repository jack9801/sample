// lib/trpc/TRPCProvider.tsx
// This component provides the tRPC client and React Query client to the application.

"use client"; // This component must be a client component

import React, { useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { trpc, trpcClient, queryClient } from './client'; // Import from our client setup

export default function TRPCProvider({ children }: { children: React.ReactNode }) {
  // We use a state for queryClient to ensure it's not created on every render
  // This is good practice for React Query in Next.js
  const [client] = useState(() => queryClient);

  return (
    <trpc.Provider client={trpcClient} queryClient={client}>
      <QueryClientProvider client={client}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
