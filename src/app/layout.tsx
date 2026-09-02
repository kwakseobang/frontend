import type { Metadata, Viewport } from "next";
import { Gowun_Batang, Noto_Sans_KR } from "next/font/google";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { QueryProvider } from "@/lib/query/QueryProvider";
import { ThemeProvider } from "@/lib/theme/ThemeContext";
import { ToastProvider } from "@/components/toast/ToastProvider";
import "@/styles/globals.css";

// Runs before hydration so the correct theme applies on first paint —
// avoids a dark->light (or vice versa) flash for users with a saved preference.
const NO_FLASH_THEME_SCRIPT = `
try {
  var t = localStorage.getItem("memento-theme");
  if (t === "light") document.documentElement.setAttribute("data-theme", "light");
} catch (e) {}
`;

const gowunBatang = Gowun_Batang({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-gowun-batang",
  display: "swap",
});

const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-noto-sans-kr",
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const SITE_DESCRIPTION = "당신의 순간을 기록하세요. 시간이 지나면, 추억이 됩니다.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Memento",
  description: SITE_DESCRIPTION,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Memento",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Memento",
    description: SITE_DESCRIPTION,
    siteName: "Memento",
    locale: "ko_KR",
    type: "website",
    images: ["/icon-512.png"],
  },
  twitter: {
    card: "summary",
    title: "Memento",
    description: SITE_DESCRIPTION,
    images: ["/icon-512.png"],
  },
};

export const viewport: Viewport = {
  // Metadata API needs a literal string (no CSS custom properties) — keep in sync with --color-bg in tokens.css.
  themeColor: "#0a0908",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${gowunBatang.variable} ${notoSansKr.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH_THEME_SCRIPT }} />
      </head>
      <body>
        <ThemeProvider>
          <QueryProvider>
            <AuthProvider>
              <ToastProvider>{children}</ToastProvider>
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
