import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/ui/nav";

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
  themeColor: "#fbefef",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full background-rad-1 ">
        <Nav />
        {children}
      </body>
    </html>
  );
}
