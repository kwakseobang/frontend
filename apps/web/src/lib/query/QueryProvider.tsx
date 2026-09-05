"use client";

import { isRetryableError } from "@/lib/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

/**
 * React Query's default is "retry any failure 3 times", which on a phone meant a 404 or
 * a validation error was hammered three times before the screen admitted anything was
 * wrong. Only transport failures and 5xx are worth repeating (see isRetryableError).
 */
const MAX_RETRIES = 2;

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            gcTime: 5 * 60_000,
            refetchOnWindowFocus: false,
            // A PWA resumed from the background often comes back before the radio does.
            // Refetching on reconnect turns "the screen that failed while you were away"
            // back into live data without the user having to reload the app.
            refetchOnReconnect: true,
            retry: (failureCount, error) => failureCount < MAX_RETRIES && isRetryableError(error),
            // Capped: on top of the 8s request timeout, an uncapped exponential backoff
            // would put the third attempt a minute out — long past when the user gave up.
            retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
          },
          mutations: {
            // A write is not safe to replay blindly (a retried createMemory can post the
            // same entry twice), so mutations keep React Query's no-retry default.
            retry: false,
          },
        },
      }),
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
