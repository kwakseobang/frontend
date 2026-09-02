import { useEffect, useState } from "react";
import { AppState, type AppStateStatus, Platform } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { QueryClient, QueryClientProvider, focusManager, onlineManager } from "@tanstack/react-query";

// React Query's defaults are written for a browser: there is no window "online" event and
// no window focus in React Native, so both managers have to be fed from RN's own APIs.
// Without this, "is the device offline" is never true and refetch-on-focus never fires.
onlineManager.setEventListener((setOnline) =>
  NetInfo.addEventListener((state) => {
    setOnline(Boolean(state.isConnected));
  }),
);

function onAppStateChange(status: AppStateStatus) {
  // Not on web: there the browser's own focus events already drive this.
  if (Platform.OS !== "web") focusManager.setFocused(status === "active");
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            gcTime: 5 * 60_000,
            // Unlike the web, coming back to the app after a while is exactly when the
            // data is most likely stale, so this one is on here.
            refetchOnWindowFocus: true,
          },
        },
      }),
  );

  useEffect(() => {
    const subscription = AppState.addEventListener("change", onAppStateChange);
    return () => subscription.remove();
  }, []);

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
