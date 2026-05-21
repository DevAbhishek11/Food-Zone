"use client";

import { Toaster } from "@/components/ui/Toaster";
import { ApiError } from "@/lib/api";
import { QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error) => {
            // Token expired mid-session — bounce to login.
            if (error instanceof ApiError && error.status === 401 && typeof window !== "undefined") {
              if (!window.location.pathname.startsWith("/login")) {
                window.location.href = "/login";
              }
            }
          },
        }),
        defaultOptions: {
          queries: {
            retry: 1,
            staleTime: 30_000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={client}>
      {children}
      <Toaster />
    </QueryClientProvider>
  );
}
