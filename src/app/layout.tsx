import type { Metadata } from "next";
import Script from "next/script";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.flowtech.co.jp";
const siteIcon = "/flow-link-mark.svg";
const siteImage = "/flow-link-og.png";
const siteImageUrl = new URL(siteImage, siteUrl).toString();
const googleAdsId = "AW-18241351815";
const googleAdsPageViewConversionId = `${googleAdsId}/P31JCJ3oisAcEIfhk_pD`;
const siteDescription =
  "FlowLinkは、フリーランスエンジニアの案件探しと企業の人材採用をつなぐマッチングプラットフォームです。案件検索・応募・スカウト・チャットまでワンストップで完結します。";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "FlowLink | フリーランスエンジニアと企業をつなぐマッチングプラットフォーム",
    template: "%s | FlowLink",
  },
  description: siteDescription,
  icons: {
    icon: siteIcon,
    shortcut: siteIcon,
    apple: siteIcon,
  },
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: siteUrl,
    siteName: "FlowLink",
    title: "FlowLink | フリーランスエンジニアと企業をつなぐマッチングプラットフォーム",
    description: siteDescription,
    images: [
      {
        url: siteImage,
        width: 512,
        height: 512,
        alt: "FlowLink",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "FlowLink | フリーランスエンジニアと企業をつなぐマッチングプラットフォーム",
    description: siteDescription,
    images: [siteImage],
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
            gtag('event', 'conversion', {
              send_to: '${googleAdsPageViewConversionId}',
            });
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
