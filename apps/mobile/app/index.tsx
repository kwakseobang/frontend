import { Redirect } from "expo-router";
import { useAuth } from "@/lib/auth/AuthContext";

/**
 * No landing page on mobile (the web's "/" markets the product; an installed app does
 * not need to). Boot goes straight to wherever the session says.
 *
 * Safe to read isAuthenticated here without checking isHydrated: SplashGate does not
 * render this tree until hydration has settled.
 */
export default function Index() {
  const { isAuthenticated } = useAuth();
  return <Redirect href={isAuthenticated ? "/home" : "/login"} />;
}
