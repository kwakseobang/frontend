import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
// Per-weight subpaths, not the package root. Importing the root pulls in every weight's
// module, and each Korean TTF is ~6MB — it put 69MB of fonts in the bundle for the three
// weights actually used.
import { GowunBatang_400Regular } from "@expo-google-fonts/gowun-batang/400Regular";
import { NotoSansKR_400Regular } from "@expo-google-fonts/noto-sans-kr/400Regular";
import { NotoSansKR_700Bold } from "@expo-google-fonts/noto-sans-kr/700Bold";
import { AuthProvider, useAuth } from "@/lib/auth/AuthContext";
import { QueryProvider } from "@/lib/query/QueryProvider";
import { colors } from "@/theme/tokens";

SplashScreen.preventAutoHideAsync();

/**
 * Holds the splash screen until both the fonts and the stored session are ready. The
 * session read is the reason this has to be inside AuthProvider: SecureStore is async,
 * so there is a real window where "logged in or not" is still unknown, and showing the
 * login screen during it would flash it at users who are in fact signed in.
 */
function SplashGate({ children }: { children: React.ReactNode }) {
  const { isHydrated } = useAuth();
  const [fontsLoaded, fontError] = useFonts({
    GowunBatang_400Regular,
    NotoSansKR_400Regular,
    NotoSansKR_700Bold,
  });
  // A font that fails to load must not hold the app hostage behind a splash screen —
  // the system font is a far better outcome than never starting.
  const ready = isHydrated && (fontsLoaded || Boolean(fontError));

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  return ready ? <>{children}</> : null;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryProvider>
        <AuthProvider>
          <SplashGate>
            <StatusBar style="light" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.bg },
                // The darkroom look breaks if the OS paints a white card behind pushes.
                animation: "fade",
              }}
            />
          </SplashGate>
        </AuthProvider>
      </QueryProvider>
    </SafeAreaProvider>
  );
}
