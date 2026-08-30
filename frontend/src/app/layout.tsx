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
  metadataBase: new URL("https://solarsave.app"),
  title: {
    default: "SolarSave — Learn how much solar energy and savings your home could unlock",
    template: "%s | SolarSave",
  },
  description:
    "SolarSave helps people understand clean energy by estimating solar generation, electricity savings, payback, and long-term value using location data, FortyGuard GHI, and transparent financial assumptions.",
  applicationName: "SolarSave",
  keywords: [
    "solar",
    "solar savings",
    "clean energy",
    "renewable energy",
    "GHI",
    "global horizontal irradiance",
    "solar payback",
    "solar ROI",
    "electricity savings",
    "FortyGuard",
  ],
  authors: [{ name: "SolarSave" }],
  creator: "SolarSave",
  publisher: "SolarSave",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }, { url: "/favicon.ico" }],
    shortcut: ["/icon.svg"],
    apple: [{ url: "/icon.svg" }],
  },
  openGraph: {
    type: "website",
    siteName: "SolarSave",
    title: "SolarSave — Clean energy education with solar savings estimates",
    description:
      "Explore how sunlight, household electricity use, and long-term cost come together. SolarSave estimates solar generation, payback, and savings with clear assumptions and readable math.",
    url: "/",
    images: [
      {
        url: "/hero-roofs.jpg",
        width: 1200,
        height: 630,
        alt: "SolarSave clean energy and rooftop solar illustration",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SolarSave — Clean energy education with solar savings estimates",
    description:
      "Estimate solar generation, understand GHI and peak sun hours, and see how much switching to solar could save over time.",
    images: ["/hero-roofs.jpg"],
  },
  category: "technology",
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
