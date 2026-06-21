import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://flowlink.flowtech.co.jp";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FlowLink",
    short_name: "FlowLink",
    description:
      "フリーランスエンジニアの案件探しと企業の人材採用をつなぐマッチングプラットフォームです。",
    start_url: siteUrl,
    scope: siteUrl,
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0e5bea",
    icons: [
      {
        src: "/flow-link-icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/flow-link-icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
