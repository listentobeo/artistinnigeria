import type { Metadata } from "next";
import { DM_Serif_Display, Outfit } from "next/font/google";
import Script from "next/script";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import "./globals.css";

const serif = DM_Serif_Display({ subsets: ["latin"], weight: "400", variable: "--font-serif" });
const sans = Outfit({ subsets: ["latin"], variable: "--font-sans" });
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://artistinnigeria.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Artist in Nigeria | Find & Hire Nigerian Artists", template: "%s | Artist in Nigeria" },
  description: "Discover verified Nigerian artists for portraits, murals, live painting and original art.",
  openGraph: { siteName: "Artist in Nigeria", type: "website", locale: "en_NG" },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${serif.variable} ${sans.variable}`}><Header /><main>{children}</main><Footer /><Script id="microsoft-clarity" strategy="afterInteractive">{`
    (function(c,l,a,r,i,t,y){
      c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
      t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
      y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "xpe9fjlywc");
  `}</Script></body></html>;
}
