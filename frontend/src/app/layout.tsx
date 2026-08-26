import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SOLAR SAVE — Solar Savings Estimator by Irradiance",
  description:
    "Estimate solar energy production, bill savings and payback for any property using FortyGuard solar irradiance (GHI) data.",
  openGraph: {
    title: "SOLAR SAVE — Solar Savings Estimator",
    description:
      "Map a property, pull its solar irradiance, and model 25 years of energy production, savings and payback.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbefef" },
    { media: "(prefers-color-scheme: dark)", color: "#151b18" },
  ],
};

/**
 * Applies the stored theme before first paint. Without this the page renders
 * light, then snaps to dark once React hydrates — the classic flash.
 * Deliberately tiny and dependency-free so it stays cheap to inline.
 */
const NO_FLASH = `(function(){try{var p=localStorage.getItem('solarsave-theme');var d=p==='dark'||((!p||p==='system')&&matchMedia('(prefers-color-scheme: dark)').matches);var e=document.documentElement;e.classList.toggle('dark',d);e.style.colorScheme=d?'dark':'light';}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH }} />
      </head>
      <body className="min-h-full">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
