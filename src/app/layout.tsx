import type { Metadata } from "next";
import Script from "next/script";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { googleAdsId } from "@/lib/google-ads";

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://flowlink.flowtech.co.jp";
const siteIcon = "/favicon.ico";
const siteAppleIcon = "/apple-touch-icon.png";
const siteIcon192 = "/flow-link-icon-192.png";
const siteIcon512 = "/flow-link-icon-512.png";
const siteImagePath = "/flow-link-og.png";
const siteImageUrl = new URL(`${siteImagePath}?v=20260621`, siteUrl).toString();
const siteDescription =
  "FlowLinkは、フリーランスエンジニアの案件探しと企業の人材採用をつなぐマッチングプラットフォームです。案件検索・応募・スカウト・チャットまでワンストップで完結します。";
const siteTitle = "FlowLink | フリーランスエンジニアと企業をつなぐマッチングプラットフォーム";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteTitle,
    template: "%s | FlowLink",
  },
  description: siteDescription,
  applicationName: "FlowLink",
  alternates: {
    canonical: siteUrl,
  },
  icons: {
    icon: [
      { url: siteIcon, sizes: "any" },
      { url: siteIcon192, type: "image/png", sizes: "192x192" },
      { url: siteIcon512, type: "image/png", sizes: "512x512" },
    ],
    shortcut: siteIcon,
    apple: [{ url: siteAppleIcon, type: "image/png", sizes: "180x180" }],
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: siteUrl,
    siteName: "FlowLink",
    title: siteTitle,
    description: siteDescription,
    images: [
      {
        url: siteImageUrl,
        width: 1200,
        height: 630,
        alt: "FlowLink",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: [{ url: siteImageUrl, alt: "FlowLink" }],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "FlowLink",
  url: siteUrl,
  image: siteImageUrl,
  publisher: {
    "@type": "Organization",
    name: "株式会社FlowTech",
    url: "https://www.flowtech.co.jp",
    logo: siteImageUrl,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${notoSansJP.variable} font-sans`}>
        <div className="flex min-h-screen flex-col">
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </div>
        <Analytics />
        <SpeedInsights />
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${googleAdsId}`}
          strategy="afterInteractive"
        />
        <Script id="google-ads-tag" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${googleAdsId}');
          `}
        </Script>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  );
}
