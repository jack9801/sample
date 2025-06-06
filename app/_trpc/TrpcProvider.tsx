// app/_trpc/TrpcProvider.tsx
// This file sets up the tRPC client context for your React application.

"use client"; // This component needs client-side rendering.

import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { trpc } from "@/lib/trpc/client"; // Ensure this path is correct for your trpc client instance

interface TrpcProviderProps {
  children: React.ReactNode;
}

export const TrpcProvider: React.FC<TrpcProviderProps> = ({ children }) => {
  // Initialize tRPC client on first render
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // Data considered stale after 5 minutes
        refetchOnWindowFocus: false, // Don't refetch on window focus
        refetchOnMount: false, // Don't refetch on component mount
        refetchOnReconnect: false, // Don't refetch on network reconnect
      },
    },
  }));
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          // URL where your tRPC API is exposed.
          // In Next.js API routes, it's typically /api/trpc
          url: "/api/trpc",
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
};
