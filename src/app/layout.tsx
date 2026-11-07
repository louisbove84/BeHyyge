import type { Metadata, Viewport } from "next";
import { Fraunces, Outfit } from "next/font/google";
import { publicPath } from "@/lib/public-path";
import { getSite, siteOrigin } from "@/lib/site";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
});

const site = getSite();

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin()),
  title: {
    default: site.name,
    template: `%s · ${site.name}`,
  },
  description: site.preview
    ? `${site.motto} A non-commercial preview by ${site.photographer} in ${site.place}.`
    : `${site.motto} Private galleries for photographs by ${site.photographer} in ${site.place}.`,
  robots: site.preview ? { index: false, follow: false } : { index: true, follow: true },
  icons: { icon: publicPath("/brand/be-hygge-logo.jpg") },
};

export const viewport: Viewport = {
  themeColor: "#f6f3ee",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${outfit.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <a
          href="#main"
          className="absolute left-4 top-4 z-50 -translate-y-24 rounded-md bg-card px-3 py-2 focus:translate-y-0"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
