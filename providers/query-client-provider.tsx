// app/providers/QueryProvider.tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  // Initialize the client inside useState to ensure it's created once per session
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // A sensible default: data stays fresh for 1 minute before refetching in the background
            staleTime: 60 * 1000, 
            refetchOnWindowFocus: false, // Prevents aggressive refetching when you tab back in
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}